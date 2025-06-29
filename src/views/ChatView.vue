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
    },
    gotoDash: function(){
      this.$router.push({
        name: 'dashboard'
      })
    }
  },
}
</script>

<template>
  <div class="chat-view">
    <a href="https://github.com/juicetan/encryptor" class="github-corner" target="_blank" aria-label="View source on Github"><svg width="80" height="80" viewBox="0 0 250 250" style="fill:#3258E9; color:#fff; position: absolute; top: 0; border: 0; right: 0;" aria-hidden="true"><path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path><path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path><path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" class="octo-body"></path></svg></a>
    <div class="header">
      <div class="icon-wrap">
        <img src="@/assets/images/appicon.png" alt="" class="icon">
        <div class="menu-dropdown">
          <div class="menu-opt" @click="reset">New Chat</div>
          <div class="menu-opt" @click="gotoDash">Payload Encryptor</div>
        </div>
      </div>
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
          <ToggleSwitch class="relay setting" label="Allow relay" v-model="allowRelay" v-if="!mode || mode === 'join'"/>
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
  .github-corner{
    position: fixed;
    top: 0;
    right: 0;
    z-index: 2;
    @keyframes octocat-wave{
      0%,
      100%{
        transform:rotate(0)
      } 
      20%,
      60%{
        transform:rotate(-25deg)
      }
      40%,
      80%{
        transform:rotate(10deg)
      }
    }
    &:hover{
      .octo-arm{
        animation: octocat-wave 560ms ease-in-out    
      }
    }
    @media (max-width:500px){
      &:hover{
        .octo-arm{
          animation: none;    
        }
      }
      .octo-arm{
        animation: octocat-wave 560ms ease-in-out;
      }
    }
  }
  .header{
    position: relative;
    flex: 0 0 auto;
    white-space: nowrap;
    background-color: white;
    .icon-wrap,.title{
      display: inline-block;
      vertical-align: middle;
    }
    .icon-wrap{
      @include clickable;
      height: 60px;
      margin-right: 10px;
      position: relative;
      z-index: 1;
      .menu-dropdown{
        @include card;
        position: absolute;
        bottom: 0;
        left: 0;
        transform: translate3d(0, 95%, 0);
        display: flex;
        flex-direction: column;
        width: 150px;
        border-top: none;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.1s linear, visibility 0s linear 0.2s, transform 0.2s ease;
        .menu-opt{
          padding: 5px 10px;
          &:hover{
            background-color: whitesmoke;
          }
        }
      }
      .icon{
        height: 100%;
      }
      &:hover{
        .menu-dropdown{
          opacity: 1;
          visibility: visible;
          transform: translate3d(0, 100%, 0);
          transition: opacity 0.1s linear, visibility 0s linear 0s, transform 0.2s ease;
        }
      }
    }
    .title{
      font-size: 20px;
      line-height: 22px;
      white-space: initial;
      .fine-print{
        font-size: 10px;
        line-height: 14px;
      }
      @media (max-width: 422px){
        .fine-print{
          display: none;
        }
      }
    }
    .connection-stats{
      @include card;
      position: absolute;
      right: 20px;
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
    top: 60px;
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
      top: 60px;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: rgba(black, 0.5);
      z-index: 1;
    }
  }
}
</style>
