const updateStatus=document.getElementById('update-status'),updateDownload=document.getElementById('update-download');
function renderUpdate(state){
 const installed=chrome.runtime.getManifest().version;
 updateStatus.textContent=state?.error?'Installed v'+installed+'. Update check failed: '+state.error:state?.available?'Update available: v'+state.latest+' (installed v'+installed+').':'Installed v'+installed+(state?.checkedAt?' · up to date':' · checks GitHub every 6 hours');
 updateDownload.hidden=!state?.available;
}
chrome.storage.local.get('extensionUpdate').then(saved=>renderUpdate(saved.extensionUpdate));
document.getElementById('check-update').addEventListener('click',async()=>{
 const button=document.getElementById('check-update');button.disabled=true;updateStatus.textContent='Checking GitHub…';
 try{renderUpdate(await chrome.runtime.sendMessage({type:'check-extension-update'}));}catch(error){updateStatus.textContent=error.message;}finally{button.disabled=false;}
});
updateDownload.addEventListener('click',()=>chrome.tabs.create({url:'https://github.com/franciaemilhplgamedesign-tech/parameter-fixer-ext/archive/refs/heads/main.zip'}));
