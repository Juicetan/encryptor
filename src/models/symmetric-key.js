import CryptoUtil from "../utils/cryptoutil";

class SymmetricKey{
  constructor(){
    this.keyPair = {
      private: '',
      public: '',
      extPublic: ''
    };
    this.key = '';
    this.keyHash = '';
  }
  async getCryptoKey(){
    if(!this.key){
      return;
    }

    return window.crypto.subtle.importKey(
      'raw',
      CryptoUtil.base64ToBuffer(this.key),
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
  async generateNewKeyPair(){
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDH', // Elliptic Curve Diffie-Hellman
        namedCurve: 'P-256'
      }, 
      true, 
      ['deriveKey']
    );
    this.keyPair.public = CryptoUtil.bufferToBase64(
      await window.crypto.subtle.exportKey('spki', keyPair.publicKey)
    );
    this.keyPair.private = CryptoUtil.bufferToBase64(
      await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
    );

    if(this.keyPair?.extPublic){
      this.deriveSymKey();
    }
  }
  async deriveSymKey(){
    if(!this.keyPair.private || !this.keyPair.extPublic){
      console.warn('> Missing key pair');
      return;
    }

    let extPubCryptoKey = await window.crypto.subtle.importKey(
      'spki',
      CryptoUtil.base64ToBuffer(this.keyPair.extPublic),
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      []
    );

    let pvtCryptoKey = await window.crypto.subtle.importKey(
      'pkcs8',
      CryptoUtil.base64ToBuffer(this.keyPair.private),
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      ['deriveKey']
    );
    let secretKey = await window.crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: extPubCryptoKey
      }, 
      pvtCryptoKey, 
      {
        name: 'AES-GCM',
        length: 256
      }, 
      true,
      ['encrypt', 'decrypt']
    );

    this.key = CryptoUtil.bufferToBase64(
      await window.crypto.subtle.exportKey('raw', secretKey)
    );
    await this.updateKeyHash();
  }
  async updateKeyHash(){
    this.keyHash = await CryptoUtil.generateKeyHash(this.key);
  }
}

export default SymmetricKey;