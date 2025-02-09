import CryptoUtil from "../utils/cryptoutil";
class Cryptor{
  constructor(){
    this.symKey = null;
  }
  async encrypt(str){
    // initialization vector
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedPlaintext = new TextEncoder().encode(str);
    const cipherTextBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.symKey.getCryptoKey(),
      encodedPlaintext
    );

    return CryptoUtil.base64Encode(JSON.stringify({
      iv: iv,
      cipherText: CryptoUtil.bufferToBase64(cipherTextBuffer)
    }));
  }
  async decrypt(str){
    const inputObj = JSON.parse(CryptoUtil.base64Decode(str));
    const iv = inputObj.iv;
    const cipherTextBuffer = CryptoUtil.base64ToBuffer(inputObj.cipherText);
    const plainTextBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.symKey.getCryptoKey(),
      cipherTextBuffer
    )

    return new TextDecoder().decode(plainTextBuffer);
  }
}

export default Cryptor;