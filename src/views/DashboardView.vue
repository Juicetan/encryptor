<script>
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
      // Do some initialization
    })
  },
  data(){
    return {
    }
  },
  computed: {
    symkey: function(){
      return null;
    }
  },
  methods: {
  },
}
</script>

<template>
  <div class="dashboard-page">
    <div class="header">
      <img src="@/assets/images/appicon.png" alt="" class="icon">
    </div>
    <div class="encryption-wrap" v-if="symkey">
      <div class="unencrypted crypt-blk">
        <div class="title">
          <span>Unencrypted</span>
          <div class="encrypt crypt-btn">Encrypt</div>
        </div>
        <CopyInput mode="area"/>
      </div>
      <div class="encrypted crypt-blk">
        <div class="title">
          <span>Encrypted</span>
          <div class="decrypt crypt-btn">Decrypt</div>
        </div>
        <CopyInput mode="area"/>
      </div>
    </div>
    <div class="key-setup" v-else>
      <div class="key-exchange-toggle form-group">
        <div class="form-label">Key Exchange</div>
        <ToggleSwitch/>
      </div>
      <div class="key-exchange">
        <div class="newkeypair">
          <div class="use-btn newkeypair">Create New Key Pair</div>
        </div>
        <div class="private form-group">
          <div class="form-label">Private Key Pair</div>
          <CopyInput/>
        </div>
        <div class="public form-group">
          <div class="form-label">Public Key Pair</div>
          <CopyInput/>
          <div class="use-btn disabled">Resolve Symmetric Key</div>
        </div>
      </div>
      <div class="key form-group">
        <div class="form-label">Symmetric Key</div>
        <CopyInput/>
        <div class="use-btn disabled">Use Key</div>
      </div>
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
    .header{
      text-align: center;
      margin-top: 40px;
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
      span{
        padding: 0 10px;
        font-size: 24px;
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
      }
      .use-btn{
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
    }
  }
</style>