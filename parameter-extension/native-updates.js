const NATIVE_UPDATER_HOST='com.ecfixit.updater';
let nativeUpdateTask=null;
async function nativeUpdaterStatus(){
 try{
  const result=await chrome.runtime.sendNativeMessage(NATIVE_UPDATER_HOST,{command:'status'});
  if(!result?.ok)throw new Error(result?.error||'Updater did not respond.');
  const state={connected:true,...result,checkedAt:Date.now()};await chrome.storage.local.set({nativeUpdater:state});return state;
 }catch(error){const state={connected:false,error:error.message,checkedAt:Date.now()};await chrome.storage.local.set({nativeUpdater:state});return state;}
}
async function applyNativeUpdate(){
 if(nativeUpdateTask)return nativeUpdateTask;
 nativeUpdateTask=(async()=>{
  await chrome.storage.local.set({nativeUpdateProgress:'Downloading and verifying the latest release…'});
  try{
   const result=await chrome.runtime.sendNativeMessage(NATIVE_UPDATER_HOST,{command:'update'});
   if(!result?.ok)throw new Error(result?.error||'Updater did not confirm completion.');
   const reload=compareExtensionVersions(result.version,chrome.runtime.getManifest().version)>0;
   await chrome.storage.local.set({nativeUpdateProgress:reload?'Files updated to v'+result.version+'. Reloading EC-FIX-IT…':'No newer published release is available.',lastNativeUpdate:{...result,checkedAt:Date.now()}});
   return {...result,reload};
  }catch(error){await chrome.storage.local.set({nativeUpdateProgress:'Automatic update stopped: '+error.message});throw error;}
 })();try{return await nativeUpdateTask;}finally{nativeUpdateTask=null;}
}
async function automaticNativeUpdate(){
 try{
  const saved=await chrome.storage.local.get(['nativeAutoUpdate','extensionUpdate','nativeReloadPending']);
  if(!saved.nativeReloadPending&&(saved.nativeAutoUpdate===false||!saved.extensionUpdate?.available))return;
  if(typeof chrome.runtime.getContexts!=='function')return;
  const contexts=await chrome.runtime.getContexts({contextTypes:['POPUP','TAB','SIDE_PANEL']});
  if(contexts.length){await chrome.storage.local.set({nativeUpdateProgress:'Update available. It will install automatically after EC-FIX-IT tools close.'});await chrome.alarms.create('native-update-retry',{delayInMinutes:1});return;}
  if(saved.nativeReloadPending){await chrome.storage.local.set({nativeReloadPending:false});chrome.runtime.reload();return;}
  const status=await nativeUpdaterStatus();if(!status.connected)return;
  const result=await applyNativeUpdate();if(result.reload){
   const active=await chrome.runtime.getContexts({contextTypes:['POPUP','TAB','SIDE_PANEL']});
   if(active.length){await chrome.storage.local.set({nativeReloadPending:true,nativeUpdateProgress:'Files updated. EC-FIX-IT will reload after its tools close.'});await chrome.alarms.create('native-update-retry',{delayInMinutes:1});}
   else chrome.runtime.reload();
  }
 }catch(_){/* Error is persisted for the next popup; installed files are not reloaded on failure. */}
}
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
 if(!['native-updater-status','native-install-update'].includes(message?.type))return;
 const trusted=sender.id===chrome.runtime.id&&sender.url?.split('?')[0]===chrome.runtime.getURL('popup.html');
 if(!trusted){respond({error:'Updater requests are restricted to the extension popup.'});return;}
 (async()=>{
  const result=message.type==='native-updater-status'?await nativeUpdaterStatus():await applyNativeUpdate();respond(result);
  if(result.reload)setTimeout(()=>chrome.runtime.reload(),1200);
 })().catch(error=>respond({error:error.message}));return true;
});
