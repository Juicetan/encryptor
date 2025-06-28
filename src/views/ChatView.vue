<script>
import ChatConnection from '../utils/chatConnection';

export default {
  components: {
  },
  beforeRouteEnter: function(to, from, next){
    next(vm => {
      // vm.connect();
    })
  },
  data: function(){
    return {
      connection: null,
      messages: []
    }
  },
  computed: {
    reversedMsgs: function(){
      return this.messages.slice().reverse();
    }
  },
  methods: {
    createRoom: function(){
      this.connection = new ChatConnection();
      this.connection.createRoom('testroom8');
      this.connection.ready.then(() => {
        console.log('> fully encrypted')
      })
    },
    connect: function(){
      this.connection = new ChatConnection();
      this.connection.connect('testroom8');
      this.connection.ready.then(() => {
        console.log('> fully encrypted')
      })
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
        <div>Encrypted Client-to-Client Chat</div>
        <div class="fine-print"> (Signaling server used only to establish initial connection between clients)</div>
      </div>
    </div>
    <div class="body">
      <div class="connect-btn" @click="createRoom">createRoom</div>
      <div class="connect-btn" @click="connect">connect</div>
      <div class="send-btn" @click="sendTest">Send Test</div>
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
  .header{
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
}
</style>
