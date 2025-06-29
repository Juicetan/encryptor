<script>
import ChatMessage from '../models/chat-message';
import ChatConnection from '../utils/chatConnection';
import ChatBubble from '../components/ChatBubble.vue';
import CopyInput from '../components/CopyInput.vue';
import ObjUtil from '../utils/obj';
import QrField from '../components/QrField.vue';
import ToggleSwitch from '../components/ToggleSwitch.vue';

export default {
  components: {
    ChatBubble,
    CopyInput,
    QrField,
    ToggleSwitch
  },
  beforeRouteEnter: function(to, from, next){
    next(vm => {
      if(vm.$route?.params?.roomID){
        vm.joinKey = vm.$route.params.roomID;
        vm.mode = 'join';
      }
    })
  },
  data: function(){
    return {
      connection: null,
      messages: [],
      msgStr: '',
      modalStatus: '',
      joinKey: null,
      mode: null, //create, joinm
      allowRelay: false
    }
  },
  computed: {
    reversedMsgs: function(){
      return this.messages.slice().reverse();
    },
    joinURL: function(){
      return this.joinKey ? import.meta.env.VITE_APPURL + '/#/chat/join/' + this.joinKey : '';
    },
    showInitModal: function(){
      return !this.connection || !this.connection.isSecured;
    },
  },
  methods: {
    createRoom: async function(){
      this.mode = 'create';
      this.joinKey = ObjUtil.guid();
      this.connection = new ChatConnection({
        allowRelay: this.allowRelay
      });
      this.connection.evt.on(ChatConnection.events.RESOLVEFAILED, () => {
        App.toast('Failed to resolve connection', 'error');
      })
      this.connection.evt.on(ChatConnection.events.GENERALERROR, (e) => {
        App.toast(JSON.stringify(e), 'error');
      });

      this.connection.createRoom(this.joinKey);
      await this.connection.ready;
      console.log('> fully encrypted', this.connection.isSecured);
      this.mode = null;
      this.connection.evt.on(ChatConnection.events.MESSAGE, (chatMsg) => {
        this.messages.push(chatMsg);
      });
    },
    connect: async function(){
      if(!this.joinKey){
        return;
      }
      this.connection = new ChatConnection({
        allowRelay: this.allowRelay
      });
      this.connection.evt.on(ChatConnection.events.INVALIDJOIN, (roomID) => {
        App.toast(`Cannot join chat: invalid/expired room ID [${roomID}]`, 'error');
      });
      this.connection.evt.on(ChatConnection.events.RESOLVEFAILED, () => {
        App.toast('Failed to resolve connection', 'error');
      });
      this.connection.evt.on(ChatConnection.events.GENERALERROR, (e) => {
        App.toast(JSON.stringify(e), 'error');
      });

      this.connection.connect(this.joinKey);
      this.modalStatus = 'Attempting to resolve connection...';
      await this.connection.ready;
      console.log('> fully encrypted', this.connection.isSecured);
      this.mode = null;
      this.connection.evt.on(ChatConnection.events.MESSAGE, (chatMsg) => {
        this.messages.push(chatMsg);
      });
    },
    reset: function(){
      this.connection?.disconnect();
      this.connection = null;
      this.mode = null;
      this.joinKey = null;
      this.messages = [];
      this.msgStr = '';
      this.modalStatus = '';
    },
    send: function(){
      const outgoingMsg = new ChatMessage({
        type: ChatMessage.types.MSG,
        role: ChatMessage.roles.USER,
        payload: {
          msg: this.msgStr
        }
      });
      this.messages.push(outgoingMsg);
      this.msgStr = '';
      this.connection.send(outgoingMsg);
    },
    statusColor: function(value){
      switch(value){
        case 'host':
        case 'srflx':
        case 'prflx':
          return '#267F00';
        case 'relay':
          return '#FF6A00';
      }
    }
  },
}
</script>

<template>
  <div class="chat-view">
    <div class="header">
      <img src="@/assets/images/appicon.png" alt="" class="icon">
      <div class="title">
        <div>Encrypted Peer-to-Peer Chat</div>
        <div class="fine-print"> (Signaling server used only to establish initial connection between clients)</div>
      </div>
      <div class="connection-stats" v-if="!showInitModal">
        <div class="local peer">
          <div class="label">Local</div>
          <div class="value" :style="{backgroundColor:statusColor(connection.stats.local)}">{{ connection.stats.local }}</div>
        </div>  
        <div class="remote peer">
          <div class="label">Remote</div>  
          <div class="value" :style="{backgroundColor:statusColor(connection.stats.remote)}">{{ connection.stats.remote }}</div>
        </div>
      </div>
    </div>
    <div class="body chat-log">
      <ChatBubble v-for="m in reversedMsgs" :key="m.id" :message="m"/>
    </div>
    <div class="chat-input">
      <div class="inner-input">
        <input type="text" class="text-input" placeholder="Enter message" @keyup.enter="send()" ref="chatinput" v-model="msgStr">
        <div class="send-icon">
          <i class="fa fa-paper-plane" @click="send()"></i>
        </div>
      </div>
    </div>
    <div class="init-modal" v-if="showInitModal">
      <div class="inner-content">
        <div class="modal-window">
          <div class="modal-title">Initialize Secure Chat</div>
          <div class="mode create modal-con" v-if="mode === 'create'">
            <div class="label">Room ID</div>
            <CopyInput v-model="joinKey"/>
            <div class="label">Join URL</div>
            <CopyInput class="join-url-copy" v-model="joinURL"/>
            <QrField :data-str="joinURL" />
            <div class="modal-status">Awaiting peer to join...</div>
            <div class="back-btn con-btn secondary" @click="reset">&lt; Back</div>
          </div>
          <div class="mode join modal-con" v-else-if="mode === 'join'">
            <div class="label">Room ID</div>
            <input class="modal-input" type="text" placeholder="Enter Room ID" v-model="joinKey"/>
            <div class="modal-status">{{ modalStatus }}</div>
            <div class="join con-btn" :class="[joinKey?'':'disabled']" @click="connect">Join</div>
            <div class="back-btn con-btn secondary" @click="reset">&lt; Back</div>
          </div>
          <div class="modal-con" v-else>
            <div class="con-btn" @click="createRoom">Create Chat</div>
            <div class="con-btn" @click="mode = 'join'">Join Chat</div>
          </div>
          <ToggleSwitch class="relay setting" label="Allow relay" v-model="allowRelay" v-if="!mode"/>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use '../assets/css/_variables' as *;
@use '../assets/css/_mixins' as *;
.chat-view{
  position: relative;
  height: 100%;
  background-color: $color-background;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  .header{
    position: relative;
    flex: 0 0 auto;
    background-color: white;
    .icon,.title{
      display: inline-block;
      vertical-align: middle;
    }
    .icon{
      height: 60px;
      margin-right: 10px;
    }
    .title{
      font-size: 20px;
      line-height: 22px;
      .fine-print{
        font-size: 10px;
        line-height: 14px;
      }
    }
    .connection-stats{
      @include card;
      position: absolute;
      right: 0;
      bottom: 0;
      display: flex;
      border-top: none;
      border-radius: 0 0 10px 10px;
      padding-left: 10px;
      transform: translate3d(0,100%,0);
      overflow: hidden;
      .peer{
        position: relative;
        display: flex;
        .label,.value{
          padding: 5px;
        }
        .value{
          color: white;
        }
      }
    }
  }
  .body{
    @include miniscroll(0);
    flex: 1 1 auto;
    max-width: 500px;
    width: 500px;
    box-sizing: border-box;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 40px 15px 10px 15px;
    margin: 0 auto;
    display: flex;
    flex-direction: column-reverse;
    @media (max-width: 500px){
      width: 100%;
    }
  }
  .chat-input{
    flex: 0 0 auto;
    margin: 0 auto;
    max-width: 500px;
    width: 100%;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    padding: 10px 15px 20px 15px;
    .inner-input{
      position: relative;
      display: grid;
      grid-template-columns: 1fr 30px;
      box-sizing: border-box;
    }
    .text-input{
      border: none;
      outline: none;
      font-size: 14px;
      line-height: 40px;
      padding: 0 15px;
      background-color: transparent;
      color: black;
      background-color: lightgray;
      width: 100%;
      border-radius: 8px;
    }
    .send-icon{
      @include clickable;
      display: flex;
      justify-content: center;
      align-items: center;
      color: gray;
      font-size: 20px;
    }
  }
  .init-modal{
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    overflow-y: auto;
    overflow-x: hidden;
    .inner-content{
      position: relative;
      min-height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2;
    }
    .modal-window{
      display: inline-block;
      position: relative;
      background-color: white;
      width: 400px;
      box-sizing: border-box;
      margin: 15px;
      border-radius: 10px;
      text-align: center;
      padding: 20px;
      .modal-title{
        margin-bottom: 20px;
        font-size: 20px;
      }
      .modal-con{
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        .modal-input{
          width: 100%;
          line-height: 25px;
          padding: 5px 10px;
          margin-bottom: 20px;
          border-radius: 10px;
          border: 1px solid lightgray;
          outline: none;
        }
        .copy-input{
          width: 100%;
          height: 35px;
          margin-bottom: 20px;
          input, .modifier{
            display: inline-block;
            height: 100%;
          }
          .modifier{
            display: flex;
            justify-content: center;
            align-items: center;
          }
          &.join-url-copy{
            margin-bottom: 0;
          }
        }
        .con-btn{
          @include clickable;
          background-color: $color-brightblue;
          min-width: 150px;
          padding: 5px 0;
          color: white;
          border-radius: 10px;
          &.secondary{
            background-color: lightgray;
            color: black;
            &:hover{
              background-color: darken(lightgray, 5%);
            }
          }
          &.disabled{
            background-color: whitesmoke;
            color: lightgray;
            &:hover{
              background-color: whitesmoke;
            }
          }
          &:hover{
            background-color: darken($color-brightblue, 5%);
          }
        }
      }
      .setting{
        &.relay{
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 40px;
          .toggle-label{
            font-weight: normal;
          }
          &:after{
            @include card;
            content: 'Relay server used for complex networking situations preventing direct connection (eg. mobile networks)';
            position: absolute;
            display: none;
            bottom: 0;
            left: -50%;
            width: 300px;
            transform: translate3d(100%, 110%, 0);
          }
          &:hover{
            &:after{
              display: block;
            }
          }
        }
      }
    }
    &:before{
      content: '';
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: rgba(black, 0.5);
      z-index: 1;
    }
  }
}
</style>
