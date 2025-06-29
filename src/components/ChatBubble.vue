<script>
import ChatMessage from '../models/chat-message';

export default {
  props: {
    message: ChatMessage
  },
  data: function(){
    return {

    }
  },
  computed: {
    msgStr: function(){
      return this.message?.payload?.msg || '';
    },
    timestamp: function(){
      if(this.message?.timestamp){
        const datetime = new Date(this.message.timestamp);
        return datetime.toLocaleTimeString("en-US");
      }

      return '';
    },
    isPeer: function(){
      return this.message?.role === ChatMessage.roles.PEER;
    }
  },
  methods: {
  },
}
</script>

<template>
  <div class="chat-bubble" :class="[isPeer?'peer':'user']">
    <div class="icon" v-if="isPeer"></div>
    <div class="msg-contents">
      <div class="response-canvas">{{ msgStr }}</div>
      <div class="timestamp">{{ timestamp }}</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../assets/css/_variables' as *;
@use '../assets/css/_mixins' as *;
.chat-bubble{
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: 40px 1fr;
  .response-canvas{
    word-break: break-word;
    strong{
      color: $color-brightblue;
    }
    p{
      margin: 0;
      word-break: break-word;
    }
  }
  .timestamp{
    font-size: 11px;
    color: gray;
    margin-top: 5px;
  }
  .icon{
    margin-top: 15px;
    margin-left: 10px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background-color: $color-brightblue;
    filter: blur(7px);
    box-shadow: 0 0 0px 10px $color-brightblue;
  }
  &.user{
    display: block;
    color: black;
    text-align: right;
    .response-canvas{
      display: inline-block;
      background-color: rgba(lighten($color-lightblue, 30%), 0.3);
      text-align: left;
      padding: 7px 10px;
      border-radius: 8px;
    }
  }
}
</style>