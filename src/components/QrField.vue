<script>
import QRCode from 'qrcode'

export default {
  props: {
    dataStr: String
  },
  watch: {
    dataStr: function(newVal, oldVal){

    }
  },
  methods: {
    generate: function(){
      QRCode.toCanvas(this.$refs.canvas, this.dataStr, (e) => {
        if(e){
          console.error('> failed to generate QR code', e);
        }
      })
    }
  },
  mounted: function(){
    if(this.dataStr){
      this.generate();
    }
  }
}
</script>

<template>
  <div class="qr-field" >
    <canvas ref="canvas"></canvas>
  </div>
</template>

<style scoped lang="scss">
@use '../assets/css/_variables' as *;
@use '../assets/css/_mixins' as *;
.qr-field{
}
</style>