import { io } from 'socket.io-client'

import Deferred from '../models/deferred';
import SymmetricKey from '../models/symmetric-key';
import Cryptor from '../models/cryptor';
import ChatMessage from '../models/chat-message';
import EventBus from './evt';
import APIUtil from './api';

const SIGNALSERVERURL = import.meta.env.VITE_SIGNALSERVERURL;
const DEFAULTICECONFIG = {
  iceServers: [{ 
    urls: 'stun:stun.l.google.com:19302' 
  }]
}

export default class ChatConnection{
  static events = {
    MESSAGE: 'message',
    AUTHMESSAGE: 'auth_message',
    AUTHDONE: 'auth_complete',
    INVALIDJOIN: 'room_invalid',
    RESOLVEFAILED: 'failed_ice',
    GENERALERROR: 'general_error'
  }

  constructor(opts){
    opts = opts || {};
    this.allowRelay = opts.allowRelay || false;
    this._resolvedIceConfig = JSON.parse(JSON.stringify(DEFAULTICECONFIG));

    this._deferredConnection = new Deferred();
    this.connectionReady = this._deferredConnection.promise;
    this._deferredChatRoomReady = new Deferred();
    this.chatRoomReady = this._deferredChatRoomReady.promise;
    this._deferredReady = new Deferred();

    this.stats = {
      local: '',
      remote: ''
    }

    this.ready = this._deferredReady.promise;

    this.evt = new EventBus();

    this.symKey = new SymmetricKey();
    this.symKey.generateNewKeyPair();

    this.cryptor = new Cryptor({
      symKey: this.symKey
    })

    this.peerConnection = null;
    this.dataChannel = null;
    this.socket = io(SIGNALSERVERURL);
    if(this.socket.connected){
      this._deferredConnection.resolve();
    } else{
      this.socket.on('connect', () => {
        console.log('> connected to signaling server');
        this._deferredConnection.resolve();
      });
    }

    this.socket.on('ready', () => {
      console.log('> signaling server room ready');
      this._deferredChatRoomReady.resolve();
    });

    this.socket.on('room-full', () => {
      console.log('> room full')
      this.evt.emit(ChatConnection.events.INVALIDJOIN, this.roomID);
    });

    this.ready.then(() => {
      this.socket.disconnect()
      this.socket = null;
      this.resolveCandidates();
    });
  }

  get isConnected(){
    return this.channelStatus === 'open';
  }

  get channelStatus(){
    return this.dataChannel?.readyState;
  }

  get isSecured(){
    return !!this.symKey.key;
  }

  async resolveCandidates(){
    const stats = await this.peerConnection?.getStats();
    if(stats){
      stats.forEach((report) => {
        if(report.type === 'candidate-pair' && report.state === 'succeeded' && report.nominated){
          const localCandidate = stats.get(report.localCandidateId);
          const remoteCandidate = stats.get(report.remoteCandidateId);
          this.stats.local = localCandidate.candidateType;
          this.stats.remote = remoteCandidate.candidateType;
          console.log('> stats set', this.stats);
        }
      })
    }
  }
  
  connect(roomID){
    this.roomID = roomID;
    this.connectionReady.then(() => {
      this.chatRoomReady.then(async () => {
        console.log('> creating peer connection')
        this.peerConnection = await this.createPeerConnection();
        this.socket.on('offer', async (offer) => {
          await this.peerConnection.setRemoteDescription(offer);
          const answer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(answer);
          this.socket.emit('answer', { 
            room: roomID, 
            answer: answer
          });
        });
  
        this.socket.on('ice-candidate', (candidate) => {
          this.peerConnection.addIceCandidate(candidate);
        });
      });

      this.socket.emit('join', roomID);
    });
  }

  disconnect(){
    this.dataChannel?.close();
    this.dataChannel = null;

    setTimeout(() => {
      this.peerConnection?.close();
      this.peerConnection = null;
    }, 100);

    this.socket?.disconnect();
    this.socket = null
  }

  createRoom(roomID){
    this.roomID = roomID;
    this.connectionReady.then(() => {
      console.log('> emit join');
      this.socket.emit('join', roomID);
    });
    this.chatRoomReady.then(() => {
      this.createOffer();
    })
  }

  async createOffer(){
    this.peerConnection = await this.createPeerConnection();
    this.dataChannel = this.peerConnection.createDataChannel('chat');
    console.log('> created data channel', this.dataChannel);
    this.setupDataChannel(this.dataChannel);

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    console.log('> emit offer');
    this.socket.emit('offer', { 
      room: this.roomID, 
      offer: offer
    });

    this.socket.on('ice-candidate', (candidate) => {
      console.log('> received ice candidate', candidate);
      this.peerConnection.addIceCandidate(candidate);
    });

    this.socket.on('answer', (answer) => {
      console.log('> received answer');
      this.peerConnection.setRemoteDescription(answer);
    });
  }

  async createPeerConnection(){
    if(this.allowRelay){
      try{
        var response = await APIUtil.fetch(import.meta.env.VITE_TURNSERVERURL);
        response = response.filter((obj) => {
          return !obj?.urls?.includes('stun:');
        });
        this._resolvedIceConfig = {
          iceServers: [
            ...this._resolvedIceConfig.iceServers,
            ...response
          ]
        };

        console.log('> ice config updated', this._resolvedIceConfig);
      } catch(e){
        console.error('> failed to init TURN server', e);
        this.evt.emit(ChatConnection.events.GENERALERROR, e);
      }
    }

    const peer = new RTCPeerConnection(this._resolvedIceConfig);
    peer.onicecandidate = ({ candidate }) => {
      if(candidate){
        console.log('> emit ice candidate', candidate);
        this.socket.emit('ice-candidate', {
          room: this.roomID,
          candidate: candidate
        });
      }
    }

    peer.oniceconnectionstatechange = () => {
      const state = peer.iceConnectionState;
      console.log(`ICE connection state changed to: ${state}`);
      if(state === 'disconnected'){
        this.evt.emit(ChatConnection.events.RESOLVEFAILED, state);
      }
    }

    peer.ondatachannel = (e) => {
      console.log('> ondatachannel', e);
      this.setupDataChannel(e.channel);
    }

    return peer;
  }

  async resolveMsg(str){
    try{
      const json = JSON.parse(str);
      const incomingMsg = new ChatMessage(json);
      incomingMsg.role = ChatMessage.roles.PEER;
      return incomingMsg;
    } catch(e){
      const plainText = await this.cryptor.decrypt(str);
      const json = JSON.parse(plainText);
      const incomingMsg = new ChatMessage(json);
      incomingMsg.role = ChatMessage.roles.PEER; 
      return incomingMsg;
    }
  }

  setupDataChannel(dataChannel){
    this.dataChannel = dataChannel;
    this.dataChannel.onopen = async () => {
      console.log('> data channel open');
      await this.authHandshake();
      this._deferredReady.resolve();
    }
    this.dataChannel.onmessage = async (e) => {
      console.log('> received msg', e.data);
      const incomingMsg = await this.resolveMsg(e.data);
      if(incomingMsg.type === ChatMessage.types.AUTH){
        this.evt.emit(ChatConnection.events.AUTHMESSAGE, incomingMsg);
      } else if(incomingMsg.type === ChatMessage.types.AUTHDONE){
        this.evt.emit(ChatConnection.events.AUTHDONE, incomingMsg);
      } else{
        this.evt.emit(ChatConnection.events.MESSAGE, incomingMsg);
      }
    };

    this.dataChannel.onclose = async (e) => {
      console.log('> channel closed');
    }
  }

  authHandshake(){
    console.log('> auth handshake begin');
    const def = new Deferred();
    const extPubKeyDef = new Deferred();
    const partnerAuthDef = new Deferred();

    this.evt.once(ChatConnection.events.AUTHMESSAGE, async (msg) => {
      this.symKey.keyPair.extPublic = msg.payload.public;
      this._sendAuthDone();
      await this.symKey.deriveSymKey();
      extPubKeyDef.resolve();
    });
    this.evt.once(ChatConnection.events.AUTHDONE, (msg) => {
      clearInterval(resend);
      partnerAuthDef.resolve();
    });

    this._sendAuth();
    const resend = setInterval(() => {
      this._sendAuth();
    }, 500);

    Promise.allSettled([
      extPubKeyDef.promise,
      partnerAuthDef.promise
    ]).then(() => {
      def.resolve();
    })
    
    return def.promise;
  }

  _sendAuth(){
    console.log('> sending auth', this.symKey.keyPair.public);
    this.dataChannel.send(new ChatMessage({
      type: ChatMessage.types.AUTH,
      role: ChatMessage.roles.PEER,
      payload: {
        public: this.symKey.keyPair.public
      }
    }).toJSONStr());
  }

  _sendAuthDone(){
    console.log('> sending auth done');
    this.dataChannel.send(new ChatMessage({
      type: ChatMessage.types.AUTHDONE,
      role: ChatMessage.roles.PEER,
      payload: {
        done: true
      }
    }).toJSONStr());
  }

  async send(msg){
    if(!(msg instanceof ChatMessage)){
      throw new Error('type mismatch: msg must be an instance of ChatMessage');
    }

    if(this.isConnected && this.isSecured){
      const plainText = msg.toJSONStr();
      const cipherText = await this.cryptor.encrypt(plainText);
      this.dataChannel?.send(cipherText);
    } else{
      console.error('> connection not ready');
    }
  }

}