// Shared by fixed HTML and the extension's early, same-origin frame adapter.
function installPreviewUrlScope(allowed){
 var keys=allowed.filter(function(key){return key==='date'||key==='language';});
 var previous=window.__ecPreviewParameter;
 function resolve(name){
  var current=window,result=null,found=false;
  for(var depth=0;current&&depth<20;depth++){
   try{var query=new URLSearchParams(current.location.search||'');if(query.has(name)){var values=query.getAll(name);result=values[values.length-1];found=true;}}catch(_){}
   try{if(!current.parent||current.parent===current)break;current=current.parent;}catch(_){break;}
  }
  return {found:found,value:result};
 }
 window.__ecPreviewParameter=function(name){
  if(keys.indexOf(name)<0)return typeof previous==='function'?previous(name):new URLSearchParams(window.location.search||'').get(name);
  return resolve(name).value;
 };
 // Existing native parameter readers continue to read location.search unchanged.
 // Updating only this frame's query lets them inherit the outer preview values.
 try{
  if(!window.location.href||!window.history||typeof window.history.replaceState!=='function')return;
  var url=new URL(window.location.href),changed=false;
  if(!/^(?:https?:|file:)$/.test(url.protocol))return;
  keys.forEach(function(key){var inherited=resolve(key);if(!inherited.found)return;
   var old=url.searchParams.getAll(key);if(old.length!==1||old[0]!==inherited.value){url.searchParams.delete(key);url.searchParams.set(key,inherited.value);changed=true;}
  });
  if(changed)window.history.replaceState(window.history.state,'',url.href);
 }catch(_){/* Sandboxed/srcdoc frames can still use __ecPreviewParameter. */}
}
if(typeof module!=='undefined'&&typeof window==='undefined')module.exports={installPreviewUrlScope};
