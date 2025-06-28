import Validation from '../models/validation';
import ObjUtil from './obj';

export default class EventBus{
  constructor(){
    this.handlerMap = {};
  }

  /**
   * 
   * @param {string} evtName
   * @param {Function} handlerFn
   */
  on(evtName, handlerFn){
    const mainEvtName = evtName ? evtName.split('.')[0] : null;
    if(!mainEvtName){
      throw new Validation().addError('Missing argument','Must provide event name to subscribe to.',{
        code: Validation.type.MISSINGARG,
        context: 'evtName'
      });
    }

    if(!handlerFn){
      throw new Validation().addError('Missing argument', 'Must provide event handler function.',{
        code: Validation.type.MISSINGARG,
        context: 'handlerFn'
      });
    }

    if(!this.handlerMap[evtName]){
      this.handlerMap[evtName] = [];
    }

    if(this.handlerMap[evtName].indexOf(handlerFn) < 0){
      this.handlerMap[evtName].push(handlerFn);
    } else{
      console.warn('> handler already registered', evtName, handlerFn);
    }
    return this;
  }

  off(evtName, handlerFn){
    const mainEvtName = evtName ? evtName.split('.')[0]: null;
    const evtModifier = evtName ? evtName.split('.')[1]: null;

    if(!mainEvtName){
      throw new Validation().addError('Missing argument', 'Must provide event name to unsubscribe to.',{
        code: Validation.type.MISSINGARG,
        context: 'evtName'
      });
    }

    if(mainEvtName && evtModifier){
      if(this.handlerMap[evtName]){
        if(handler){
          ObjUtil.removeObject(this.handlerMap[evtName], handlerFn);
        } else{
          this.handlerMap[evtName] = [];
        }
      } else{
        console.warn('> Event name not found', evtName);
      }
    } else if(mainEvtName && !evtModifier){
      const evtKeys = Object.keys(this.handlerMap).filter((key) => {
        return key && key.split('.')[0] === mainEvtName;
      });

      if(evtKeys.length){
        if(handlerFn){
          evtKeys.forEach((key) => {
            ObjUtil.removeObject(this.handlerMap[key], handlerFn);
          })
        } else{
          evtKeys.forEach((key) => {
            this.handlerMap[key] = [];
          })
        }
      } else{
        console.warn('> Event name not found', mainEvtName);
      }
    }

    return this;
  }

  once(evtName, handlerFn){
    const proxyHandler = (obj) => {
      handlerFn(obj);
      this.off(evtName, proxyHandler);
    }
    this.on(evtName, proxyHandler);
  }

  emit(evtName, payload){
    const mainEvtName = evtName ? evtName.split('.')[0]: null;
    const evtModifier = evtName ? evtName.split('.')[1]: null;
    
    if(!mainEvtName){
      throw new Validation().addError('Missing argument', 'Must provide event name to emit event.',{
        code: Validation.type.MISSINGARG,
        context: 'evtName'
      });
    }

    const registeredKeys = Object.keys(this.handlerMap);
    registeredKeys.forEach((key) => {
      if((evtModifier && key === evtName) || 
        (!evtModifier && key.indexOf(mainEvtName+'.') > -1) ||
        (!evtModifier && key === mainEvtName)){
        this.handlerMap[key].forEach(function(callbackFn){
          callbackFn(payload);
        })
      }
    })
  }
}