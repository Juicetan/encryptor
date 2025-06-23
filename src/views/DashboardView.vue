<script>
import SymmetricKey from '../models/symmetric-key';
import Cryptor from '../models/cryptor';

import LoadingBar from '../components/LoadingBar.vue';
import CopyInput from '../components/CopyInput.vue';
import ToggleSwitch from '../components/ToggleSwitch.vue';

export default {
  components: {
    LoadingBar,
    CopyInput,
    ToggleSwitch
  },
  beforeRouteEnter: function(to, from, next){
    next(vm => {
      vm.init();
    })
  },
  data(){
    return {
      useKeyExchange: false,
      editSymKey: null,
      cryptor: null,
      encryptedStr: '',
      decryptedStr: '',
    }
  },
  computed: {
    canCrypt: function(){
      return this.cryptor?.symKey?.key;
    },
    canDerive: function(){
      return this.editSymKey?.keyPair?.private && this.editSymKey?.keyPair?.extPublic;
    }
  },
  watch: {
    'editSymKey.key': function(newVal, oldVal){
      if(newVal !== oldVal){
        this.editSymKey.updateKeyHash();
      }
    }
  },
  methods: {
    init: function(){
      this.editSymKey = new SymmetricKey();
      this.cryptor = new Cryptor();
    },
    generateKeyPair: async function(){
      await this.editSymKey.generateNewKeyPair();
      App.toast('Generated new key pair')
    },
    deriveSecretKey: async function(){
      if(!this.canDerive){
        return;
      }

      await this.editSymKey.deriveSymKey();
      App.toast('Derived Secret Key');
    },
    useKey: function(){
      this.cryptor.symKey = this.editSymKey;
    },
    editKey: function(){
      this.editSymKey = this.cryptor.symKey;
      this.cryptor.symKey = null;
    },
    encrypt: async function(){
      if(!this.decryptedStr){
        return;
      }
      this.encryptedStr = await this.cryptor.encrypt(this.decryptedStr);
    },
    decrypt: async function(){
      if(!this.encryptedStr){
        return;
      }
      this.decryptedStr = await this.cryptor.decrypt(this.encryptedStr);
    },
    gotoChat: function(){
      this.$router.push({
        name: 'chatView'
      })
    }
  },
}
</script>

<template>
  <div class="dashboard-page">
    <a href="https://github.com/juicetan/encryptor" class="github-corner" target="_blank" aria-label="View source on Github"><svg width="80" height="80" viewBox="0 0 250 250" style="fill:#3258E9; color:#fff; position: absolute; top: 0; border: 0; right: 0;" aria-hidden="true"><path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path><path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path><path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" class="octo-body"></path></svg></a>
    <div class="header">
      <div class="goto-btn" @click="gotoChat">Back to chat</div>
      <img src="@/assets/images/appicon.png" alt="" class="icon">
      <div class="key-display" @click="editKey" v-if="canCrypt">
        <i class="fa fa-key"></i>
        <span>{{ this.cryptor.symKey.keyHash }}</span>
      </div>
    </div>
    <div class="encryption-wrap" v-if="canCrypt">
      <div class="unencrypted crypt-blk">
        <div class="title">
          <span>Unencrypted</span>
          <div class="encrypt crypt-btn" @click="encrypt">Encrypt</div>
        </div>
        <CopyInput mode="area" label="Unencrypted text" v-model="decryptedStr"/>
      </div>
      <div class="encrypted crypt-blk">
        <div class="title">
          <span>Encrypted</span>
          <div class="decrypt crypt-btn" @click="decrypt">Decrypt</div>
        </div>
        <CopyInput mode="area" label="Encrypted text" v-model="encryptedStr"/>
      </div>
    </div>
    <div class="key-setup" v-else>
      <div class="key-exchange-toggle form-group">
        <div class="form-label">Key Exchange</div>
        <ToggleSwitch v-model="useKeyExchange"/>
      </div>
      <div class="key-exchange" v-if="useKeyExchange && editSymKey">
        <div class="newkeypair">
          <div class="use-btn newkeypair" @click="generateKeyPair">Create New Key Pair</div>
        </div>
        <div class="private form-group">
          <div class="form-label">Private Key</div>
          <CopyInput v-model="editSymKey.keyPair.private" :copyable="false" label="Private Key"/>
        </div>
        <div class="public form-group">
          <div class="form-label">Public Key</div>
          <CopyInput v-model="editSymKey.keyPair.public" label="Public Key"/>
        </div>
      </div>
      <div class="extpublic form-group" v-if="useKeyExchange && editSymKey">
        <div class="form-label">External Public Key</div>
        <CopyInput v-model="editSymKey.keyPair.extPublic" label="3rd Party Public Key"/>
        <div class="use-btn" :class="[canDerive?'':'disabled']" @click="deriveSecretKey">Derive Symmetric Key</div>
      </div>
      <div class="key form-group" v-if="editSymKey">
        <div class="form-label">Secret Key</div>
        <CopyInput v-model="editSymKey.key" label="Secret Key"/>
      </div>
      <div class="keyhash form-group" v-if="editSymKey">
        <div class="form-label">Secret Key Hash</div>
        <CopyInput v-model="editSymKey.keyHash" label="Secret Key hash" :isEditable="false"/>
      </div>
      <div class="use-btn" :class="[editSymKey?.key?'':'disabled']" @click="useKey">Use Key</div>
    </div>
  </div>
</template>

<style lang="scss">
@use "sass:color";
@use "../assets/css/_mixins" as *;
@use "../assets/css/_variables" as *;
  .dashboard-page{
    position: relative;
    height: 100%;
    box-sizing: border-box;
    overflow: auto;
    .github-corner{
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
      text-align: center;
      margin-top: 40px;
      .goto-btn{
        @include clickable;
        position: absolute;
        top: 20px;
        left: 20px;
        background-color: $color-brightblue;
        color: white;
        padding: 7px 10px;
        border-radius: 10px;
        &:hover{
          background-color: darken($color-brightblue, 5%);
        }
      }
      .icon,span{
        vertical-align: middle;
      }
      .icon{
        width: 150px;
        border-radius: 10px;
        @media (max-width: 760px){
          width: 100px;
        }
      }
      .key-display{
        @include clickable;
        font-size: 10px;
        max-width: 200px;
        margin-left: auto;
        margin-right: auto;
        word-break: break-word;
        i,span{
          display: inline;
          vertical-align: middle;
        }
        i{
          margin-right: 4px;
          font-size: 16px;
        }
        &:hover{
          background-color: whitesmoke;
        }
      } 
    }
    .copy-input{
      display: inline-block;
    }
    .encryption-wrap{
      display: flex;
      justify-content: center;
      align-items: center;
      max-width: 1000px;
      margin-left: auto;
      margin-right: auto;
      margin-top: 40px;
      padding: 0 10px;
      .crypt-blk{
        width: 50%;
        .title{
          font-weight: bold;
          line-height: 24px;
          .crypt-btn{
            @include clickable;
            float: right;
            color: white;
            background-color: $color-brightblue;
            border-radius: 5px;
            padding: 5px 7px;
            margin-bottom: 10px;
            margin-top: -5px;
            &:hover{
              background-color: color.adjust($color-brightblue, $lightness: -3%);
            }
            &:active{
              background-color: color.adjust($color-brightblue, $lightness: -5%);
            }
          }
        }
        .copy-input{
          width: 100%;
          textarea{
            width: 100%;
            min-width: 100%;
            max-width: 100%;
            min-height: 400px;
            padding: 10px;
          }
        }
        &:first-of-type{
          margin-right: 20px;
        }
      }
      @media (max-width: 760px){
        flex-direction: column;
        .crypt-blk{
          width: 80%;
          &:first-of-type{
            margin-right: 0;
            margin-bottom: 40px;
          }
        }
      }
      @media (max-width: 520px){
        .crypt-blk{
          width: 100%;
          .copy-input{
            textarea{
              min-height: 250px;
            } 
          }
          &:first-of-type{
            margin-bottom: 20px;
          }
        }
      }
    }
    .key-setup{
      @include formGroup;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
      margin-top: 40px;
      padding: 0 10px;
      .form-group{
        margin-bottom: 15px;
        .form-label{
          margin-bottom: 5px;
        }
      }
      .copy-input{
        width: 100%;
        input{
          line-height: 28px;
        }
        span{
          line-height: 30px;
        }
      }
      .key-exchange{
        background-color: whitesmoke;
        border: 1px solid lightgray;
        padding: 10px;
        margin-bottom: 15px;
        .form-group:last-of-type{
          margin-bottom: 0;
        }
        .private,.public{
          .copy-input{
            input{
              background-color: whitesmoke;
            }
          }
        }
      }
      .use-btn{
        @include clickable;
        display: inline-block;
        color: white;
        background-color: $color-brightblue;
        padding: 7px 10px;
        border-radius: 5px;
        margin-top: 15px;
        &.disabled{
          color: gray;
          background-color: lightgray;
        }
      }
      .newkeypair{
        text-align: right;
        .use-btn{
          margin-bottom: 15px;
          margin-top: 0;
        }
      }
      .keyhash{
        margin-top: -22px;
        margin-bottom: 0;
        border: 1px solid lightgray;
        padding: 10px;
        background-color: whitesmoke;
        .form-label{
          font-weight: normal;
        }
        input{
          background-color: whitesmoke;
          outline: none;
        }
      }
    }
  }
</style>