function addRuntimeSafeguards(html,{network=false,webgl=true}={}){
 let output=html;const changes=[];
 function inject(id,fn){if(new RegExp('id=["\']'+id+'["\']').test(output))return;const script='<script id="'+id+'">('+fn.toString()+')();</script>';if(!/<head\b[^>]*>/i.test(output))throw new Error('Missing HTML head.');output=output.replace(/<head\b[^>]*>/i,head=>head+'\n'+script);changes.push(id);}
 if(network)inject('ec-offline-network-guard-v1',function(){
  function remote(value){const input=value&&typeof value==='object'&&'url'in value?value.url:String(value);try{return /^(?:https?|wss?):$/.test(new URL(input,location.href).protocol);}catch(_){return true;}}
  function blocked(){return new DOMException('Remote networking is disabled by the creative offline guard.','SecurityError');}
  if(typeof window.fetch==='function'){const original=window.fetch;window.fetch=function(input,options){return remote(input)?Promise.reject(blocked()):original.call(this,input,options);};}
  if(window.XMLHttpRequest){const original=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(method,url){if(remote(url))throw blocked();return original.apply(this,arguments);};}
  for(const name of ['WebSocket','EventSource']){const Original=window[name];if(typeof Original==='function')window[name]=new Proxy(Original,{construct(target,args,newTarget){if(remote(args[0]))throw blocked();return Reflect.construct(target,args,newTarget);}});}
  if(typeof navigator.sendBeacon==='function'){const original=navigator.sendBeacon.bind(navigator);try{navigator.sendBeacon=function(url,data){return remote(url)?false:original(url,data);};}catch(_){} }
 });
 if(webgl && /getContext\s*\(\s*["'](?:webgl2?|experimental-webgl)["']|WebGL(?:2)?RenderingContext|WebGLRenderer|OffscreenCanvas/.test(html))inject('ec-webgl-fallback-v1',function(){
  const pending=new WeakMap();let panel=null;
  function visible(canvas){if(!canvas?.isConnected)return false;const r=canvas.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(canvas).visibility!=='hidden'&&getComputedStyle(canvas).display!=='none';}
  function show(canvas){if(!visible(canvas)||panel)return;
   panel=document.createElement('div');panel.setAttribute('role','alert');panel.style.cssText='position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;text-align:center;background:#161616;color:#fff;font:16px/1.5 system-ui,sans-serif';
   const text=document.createElement('p');text.textContent='The interactive content is unavailable on this device.';panel.appendChild(text);
   const target=window.clickTag||window.clickTag1||window.clickthrough||window.clickThrough;
   if(target&&window.mraid&&typeof window.mraid.open==='function'){
    const button=document.createElement('button');button.textContent='Learn more';button.style.cssText='padding:12px 24px;border:0;border-radius:8px;background:#fff;color:#161616;font:inherit;cursor:pointer';
    button.addEventListener('click',()=>{try{if(typeof mraid.getState!=='function'||mraid.getState()!=='loading')mraid.open(target);}catch(_){} });panel.appendChild(button);
   }
   (document.body||document.documentElement).appendChild(panel);
  }
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type){
   if(!/^(?:webgl2?|experimental-webgl)$/.test(String(type)))return original.apply(this,arguments);
   let context;try{context=original.apply(this,arguments);}catch(error){pending.set(this,setTimeout(()=>show(this),350));throw error;}
   if(context){clearTimeout(pending.get(this));pending.delete(this);}else{clearTimeout(pending.get(this));pending.set(this,setTimeout(()=>show(this),350));}
   return context;
  };
  document.addEventListener('webglcontextlost',event=>{event.preventDefault();show(event.target);},true);
  // Keep the fallback visible after restoration: engine recovery cannot be assumed.
 });
 return {html:output,changes};
}
if(typeof module!=='undefined')module.exports={addRuntimeSafeguards};
