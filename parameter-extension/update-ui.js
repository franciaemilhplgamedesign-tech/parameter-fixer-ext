const updateStatus=document.getElementById('update-status'),updateDownload=document.getElementById('update-download');
function renderUpdate(state){
 const installed=chrome.runtime.getManifest().version;
 const available=state?.latest && compareExtensionVersions(state.latest,installed)>0;
 updateStatus.textContent=state?.error?'Installed v'+installed+'. Could not check GitHub. Check your connection and reload the extension if you just replaced its files.':available?'Update available: v'+state.latest+' (installed v'+installed+').':'Installed v'+installed+(state?.checkedAt?' · up to date':' · checks GitHub every 6 hours');
 updateDownload.hidden=!available;
}
chrome.storage.local.get('extensionUpdate').then(async saved=>{
 renderUpdate(saved.extensionUpdate);
 if(!saved.extensionUpdate?.checkedAt || Date.now()-saved.extensionUpdate.checkedAt>21600000 || saved.extensionUpdate.error){
  renderUpdate(await checkExtensionUpdate());
 }
}).catch(()=>{updateStatus.textContent='Reload the extension and reopen this checker window.';});
document.getElementById('check-update').addEventListener('click',async()=>{
 const button=document.getElementById('check-update');button.disabled=true;updateStatus.textContent='Checking GitHub…';
 // Manual checks do not depend on a service-worker message receiver.
 try{renderUpdate(await checkExtensionUpdate());}catch(error){updateStatus.textContent='Please reload the extension and reopen this checker window.';}finally{button.disabled=false;}
});
updateDownload.addEventListener('click',()=>chrome.tabs.create({url:'https://github.com/franciaemilhplgamedesign-tech/parameter-fixer-ext/archive/refs/heads/main.zip'}));
