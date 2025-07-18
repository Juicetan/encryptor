import CryptoUtil from "../utils/cryptoutil";
class Cryptor{
  constructor(opts){
    opts = opts || {};
    this.symKey = opts.symKey;
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
      await this.symKey.getCryptoKey(),
      encodedPlaintext
    );

    return CryptoUtil.base64Encode(JSON.stringify({
      iv: CryptoUtil.bufferToBase64(iv),
      cipherText: CryptoUtil.bufferToBase64(cipherTextBuffer)
    }));
  }
  async decrypt(str){
    const inputObj = JSON.parse(CryptoUtil.base64Decode(str));
    const iv = CryptoUtil.base64ToBuffer(inputObj.iv);
    const cipherTextBuffer = CryptoUtil.base64ToBuffer(inputObj.cipherText);
    const plainTextBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      await this.symKey.getCryptoKey(),
      cipherTextBuffer
    )

    return new TextDecoder().decode(plainTextBuffer);
  }
}

export default Cryptor;