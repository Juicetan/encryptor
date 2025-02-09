<script>
import ObjUtil from '../utils/obj';

export default {
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
    },
    setDefault: {
      type: Boolean,
      default: false
    }
  },
  data: function(){
    return {
      proxy: this.modelValue
    }
  },
  computed: {
    compID: function(){
      return ObjUtil.guid(1);
    }
  },
  watch: {
    modelValue: function(newVal){
      this.proxy = newVal;
    }
  },
  methods: {
    toggle(){
      this.proxy = !this.proxy;
      this.$emit('update:modelValue', this.proxy);
    }
  },
  mounted: function(){
    if(this.setDefault && (this.modelValue === undefined || this.modelValue === null)){
      setTimeout(() => this.$emit('update:modelValue', this.proxy),100);
    }
  }
}
</script>

<template>
  <div class="toggle-switch" @click.stop.prevent="toggle()" tabindex="0">
    <div class="toggle-label" v-if="label">{{label}}</div>
    <input class="switch-input" type="checkbox" :id="'switch-'+compID" :checked="proxy"/>
    <label class="switch-label" :for="'switch-'+compID">Toggle</label>
  </div>
</template>

<style lang="scss">
@use "../assets/css/_variables" as *;
@use "../assets/css/_mixins" as *;
.toggle-switch{
  @include clickable;
  display: inline-block;
  .toggle-label{
    display: inline-block;
    font-weight: bold;
    margin: 5px 10px 5px 0;
    vertical-align: middle;
  }
  .switch-input[type=checkbox]{
    position: absolute;
    height: 0;
    width: 0;
    min-width: auto;
    margin: 0;
    padding: 0;
    visibility: hidden;
    &:checked + label {
      background: $color-brightblue;
      &:after {
        left: calc(100% - 2px);
        transform: translateX(-100%);
      }
    }
  }

  .switch-label {
    $dimWidth: 35px;
    $dimHeight: 20px;
    $dimKnob: $dimHeight - 4;
    cursor: pointer;
    text-indent: -9999px;
    width: $dimWidth;
    height: $dimHeight;
    background: grey;
    display: block;
    border-radius: $dimHeight;
    position: relative;
    &:after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: $dimKnob;
      height: $dimKnob;
      background: #fff;
      border-radius: $dimKnob;
      transition: 0.3s;
    }
    &:active:after {
      width: $dimKnob + 5;
    }
  }
}
</style>