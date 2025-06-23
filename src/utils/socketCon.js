import { io } from 'socket.io-client'

import Deferred from '../models/deferred';

const SIGNALSERVERURL = 'http://localhost:3000';
const ICECONFIG = {
  iceServers: [{ 
    urls: 'stun:stun.l.google.com:19302' 
  }]
}

export default class SocketConnection{
  constructor(){
    this._deferredConnection = new Deferred();
    this.connectionReady = this._deferredConnection.promise;
    this._deferredChatRoomReady = new Deferred();
    this.chatRoomReady = this._deferredChatRoomReady.promise;
    
    this.dataChannel = null;
    this.socket = io(SIGNALSERVERURL);
    if(this.socket.connected){
      this._deferredConnection.resolve();
    } else{
      this.socket.on('connect', () => {
        this._deferredConnection.resolve();
      });
    }

    this.socket.on('ready', () => {
      this._deferredChatRoomReady.resolve();
    });
  }

  get status(){
    return this.dataChannel?.readyState;
  }
  
  connect(roomID){
    this.roomID = roomID;
    this.connectionReady.then(() => {
      this.chatRoomReady.then(() => {
        let peerConnection = this.createPeerConnection();
        this.socket.on('offer', async (offer) => {
          await peerConnection.setRemoteDescription(offer);
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          this.socket.emit('answer', { 
            room: roomID, 
            answer: answer
          });
        });
  
        this.socket.on('ice-candidate', (candidate) => {
          peerConnection.addIceCandidate(candidate);
        });
      });

      this.socket.emit('join', roomID);
    });
  }

  createRoom(roomID){
    this.roomID = roomID;
    this.connectionReady.then(() => {
      this.socket.emit('join', roomID);
    });
    this.chatRoomReady.then(() => {
      this.createOffer();
    })
  }

  async createOffer(){
    let peerConnection = this.createPeerConnection();
    this.dataChannel = peerConnection.createDataChannel('chat');
    this.setupDataChannel(this.dataChannel);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    this.socket.emit('offer', { 
      room: this.roomID, 
      offer: offer
    });

    this.socket.on('ice-candidate', (candidate) => {
      peerConnection.addIceCandidate(candidate);
    });

    this.socket.on('answer', (answer) => {
      peerConnection.setRemoteDescription(answer);
    });
  }

  createPeerConnection(){
    const peer = new RTCPeerConnection(ICECONFIG);
    peer.onicecandidate = ({ candidate }) => {
      if(candidate){
        this.socket.emit('ice-candidate', {
          room: this.roomID,
          candidate: candidate
        });
      }
    }

    peer.ondatachannel = (e) => {
      this.setupDataChannel(e.channel);
    }

    return peer;
  }

  setupDataChannel(dataChannel){
    this.dataChannel = dataChannel;
    this.dataChannel.onopen = () => {
      console.log('> data channel open');
    }
    this.dataChannel.onmessage = (e) => {
      console.log('> received msg', e.data);
    };
  }

  send(msg){
    if(this.status === 'open'){
      this.dataChannel?.send(msg);
    }else{
      console.log('> connection not ready');
    }
  }

}