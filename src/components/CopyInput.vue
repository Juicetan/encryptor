<script>
import ClipboardJS from 'clipboard'

export default {
  props: {
    modelValue: {
      type: String,
    },
    label: {
      type: String
    },
    mode: {
      type: String,
      default: 'field' // field,area
    },
    overrideUi: {
      type: Boolean,
      default: false
    },
    isEditable: {
      type: Boolean,
      default: true
    },
    copyable: {
      type: Boolean,
      default: true
    }
  },
  data: function(){
    return {
      clip: null,
    };
  },
  computed: {
    isSingle: function(){
      return this.mode === 'field';
    }
  },
  watch: {
    modelValue: function(newVal){
      if(newVal){
        this.initClipboard();
      }
    }
  },
  methods: {
    initClipboard: function(){
      var view = this;
      if(this.clip){
        this.clip.destroy();
      }
      this.clip = new ClipboardJS(this.$refs.modifier,{
        target: function(){
          return view.$refs.value;
        }
      });
      this.clip.on('success', function(){
        App.toast('Copied '+ (view.label || view.modelValue));
      });
    },
    updateVal: function(evt){
      this.$emit('update:modelValue', evt.target.value);
    }
  },
  mounted: function(){
    if(!this.clip){
      this.initClipboard();
    }
  }
}
</script>

<template>
  <div class="copy-input" :class="[overrideUi?'custom-ui':'',mode,copyable?'':'no-copy']">
    <input type="text" :value="modelValue" @input="updateVal" :readonly="!isEditable" ref="value" v-if="isSingle">
    <textarea v-bind:value="modelValue" @input="updateVal" ref="value" :readonly="!isEditable" v-else></textarea>
    <span class="modifier" ref="modifier" @click.stop="">
      <slot>
        <i class="fa fa-copy"></i>
      </slot>
    </span>
  </div>
</template>

<style lang="scss">
@use "sass:color";
@use "../assets/css/_mixins" as *;
@use "../assets/css/_variables" as *;
.copy-input{
  position: relative;
  overflow: hidden;
  input{
    float: left;
    width: 80%;
    line-height: 24px;
    border: 1px solid lightgray;
    border-radius: 5px 0 0 5px;
    padding: 0 10px;
  }
  textarea{
    min-width: 300px;
    min-height: 100px;
  }
  .modifier{
    @include clickable;
    float: left;
    width: 20%;
    line-height: 26px;
    text-align: center;
    background-color: $color-brightblue;
    color: white;
    border-radius: 0 5px 5px 0;
    &:hover{
      background-color: color.adjust($color-brightblue, $lightness: 5%);
    }
  }
  &.no-copy{
    input{
      width: 100%;
      border-radius: 5px;
    }
    .modifier{
      visibility: hidden;
      width: 1px;
      height: 1px;
      position: absolute;
    }
  }
  &.area{
    .modifier{
      position: absolute;
      top: 10px;
      right: 10px;
      border-radius: 5px;
      width: 40px;
      line-height: 30px;
    }
  }
  &.custom-ui{
    display: inline-block;
    line-height: 14px;
    font-size: 14px;
    font-weight: normal;
    vertical-align: middle;
    input,textarea{
      position: absolute;
      bottom: 20px;
      right: 100px;
      width: 23px;
      height: 5px;
      opacity: 0;
    }
    .modifier{
      background-color: transparent;
      color: black;
      width: auto;
    }
  }
}
</style>