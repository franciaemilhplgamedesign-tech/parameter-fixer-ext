// AppLovin's host recreates iteration frames without forwarding outer params.
// Attach only date/language to same-origin creative frames before navigation.
(function(){
 if(location.hostname!=='playable.applovindemo.com'||!/^\/Preview(?:\/|$)/i.test(location.pathname)||window.__ecAppLovinFrameBridge)return;
 window.__ecAppLovinFrameBridge=true;
 function forward(value){
  try{
   const url=new URL(value,location.href),query=new URLSearchParams(location.search);
   if(url.origin!==location.origin||!/^\/phaser\//i.test(url.pathname))return value;
   for(const key of ['date','language'])if(query.has(key)){const all=query.getAll(key);url.searchParams.delete(key);url.searchParams.set(key,all[all.length-1]);}
   return url.href;
  }catch(_){return value;}
 }
 const descriptor=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,'src');
 if(descriptor?.set&&descriptor.configurable)Object.defineProperty(HTMLIFrameElement.prototype,'src',{...descriptor,set(value){descriptor.set.call(this,forward(value));}});
 const setAttribute=Element.prototype.setAttribute;
 Element.prototype.setAttribute=function(name,value){return setAttribute.call(this,name,this instanceof HTMLIFrameElement&&String(name).toLowerCase()==='src'?forward(value):value);};
 function sync(){for(const frame of document.querySelectorAll('iframe[src]')){const value=frame.getAttribute('src'),next=forward(value);if(next!==frame.src)frame.src=next;}}
 new MutationObserver(sync).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
 sync();
})();
