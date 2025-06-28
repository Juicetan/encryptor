<script>
import ChatMessage from '../models/chat-message';
import ChatConnection from '../utils/chatConnection';
import ChatBubble from '../components/ChatBubble.vue';

export default {
  components: {
    ChatBubble
  },
  beforeRouteEnter: function(to, from, next){
    next(vm => {

    })
  },
  data: function(){
    return {
      connection: null,
      messages: [],
      msgStr: '',
    }
  },
  computed: {
    reversedMsgs: function(){
      return this.messages.slice().reverse();
    }
  },
  methods: {
    createRoom: async function(){
      this.connection = new ChatConnection();
      this.connection.createRoom('testroom8');
      await this.connection.ready;
      console.log('> fully encrypted')
      this.connection.evt.on(ChatConnection.events.MESSAGE, (chatMsg) => {
        this.messages.push(chatMsg);
      });
    },
    connect: async function(){
      this.connection = new ChatConnection();
      this.connection.connect('testroom8');
      await this.connection.ready;
      console.log('> fully encrypted');
      this.connection.evt.on(ChatConnection.events.MESSAGE, (chatMsg) => {
        this.messages.push(chatMsg);
      });
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
    sendTest: function(){
      this.connection.send(`test: ${new Date().toISOString()}`);
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
    <div class="init-modal">
      <div class="inner-content">
        <div class="modal-window">
          <div class="modal-title">Initialize Secure Chat</div>
          <div class="modal-con">
            <div class="con-btn">Create Chat</div>
            <div class="con-btn">Join Chat</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
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
  }
  .body{
    @include miniscroll(0);
    flex: 1 0 auto;
    max-width: 500px;
    width: 500px;
    box-sizing: border-box;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 40px 15px 10px 15px;
    margin: 0 auto;
    display: flex;
    flex-direction: column-reverse;
  }
  .chat-input{
    flex: 0 0 auto;
    margin: 0 auto;
    max-width: 500px;
    width: 500px;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    padding: 10px 0 20px 0;
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
      margin: 0 15px;
      border-radius: 10px;
      text-align: center;
      padding: 20px 0;
      .modal-title{
        margin-bottom: 20px;
        font-size: 20px;
      }
      .modal-con{
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        .con-btn{
          @include clickable;
          background-color: $color-brightblue;
          min-width: 150px;
          padding: 5px 0;
          color: white;
          border-radius: 10px;
          &:hover{
            background-color: darken($color-brightblue, 5%);
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
