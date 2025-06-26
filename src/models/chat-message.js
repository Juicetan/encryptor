import ObjUtil from "../utils/obj";

class ChatMessage{
  static type = {
    AUTH: 'auth-handshake',
    MSG: 'message'
  }

  constructor(opts){
    this.fromJSON(opts);
  }
  
  fromJSON(obj){
    obj = obj || {}
    this.id = obj.id || ObjUtil.guid();
    this.type = obj.type || ChatMessage.type.MSG;
    this.payload = obj.payload;
    this.timestamp = obj.timestamp ? new Date(obj.timestamp) : new Date();
    return this;
  }

  toJSON(){
    return {
      id: this.id,
      type: this.type,
      payload: this.payload,
      timestamp: this.timestamp.toISOString()
    }
  }

  serialize(){
    return JSON.stringify(this.toJSON());
  }

  deserialize(str){
    const obj = JSON.parse(str);
    return this.fromJSON(obj);
  }
}

export default ChatMessage;