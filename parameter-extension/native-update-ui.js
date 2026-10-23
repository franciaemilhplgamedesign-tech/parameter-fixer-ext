const nativeStatus=document.getElementById('native-status'),nativeApply=document.getElementById('native-update'),nativeAuto=document.getElementById('native-auto');
document.getElementById('extension-id').value=chrome.runtime.id;
async function refreshNativeStatus(){
 nativeStatus.textContent='Checking Windows updater…';
 try{const result=await chrome.runtime.sendMessage({type:'native-updater-status'});if(!result?.connected)throw new Error(result?.error||'Windows helper not installed.');nativeStatus.textContent='Windows updater connected · automatic file replacement is ready.';nativeApply.disabled=false;}
 catch(error){nativeStatus.textContent='One-time Windows setup required. Download the updater, select your installed extension folder, and paste the ID below. '+error.message;nativeApply.disabled=true;}
}
chrome.storage.local.get(['nativeAutoUpdate','nativeUpdateProgress']).then(saved=>{nativeAuto.checked=saved.nativeAutoUpdate!==false;if(saved.nativeUpdateProgress)nativeStatus.textContent=saved.nativeUpdateProgress;});
nativeAuto.addEventListener('change',()=>chrome.storage.local.set({nativeAutoUpdate:nativeAuto.checked}));
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.nativeUpdateProgress)nativeStatus.textContent=changes.nativeUpdateProgress.newValue;});
nativeApply.addEventListener('click',async()=>{
 nativeApply.disabled=true;nativeStatus.textContent='Installing the latest published release into the existing folder…';
 try{const result=await chrome.runtime.sendMessage({type:'native-install-update'});if(result?.error)throw new Error(result.error);nativeStatus.textContent=result.reload?'Updated to v'+result.version+'. Reloading…':'Already at the latest published release.';}
 catch(error){nativeStatus.textContent=error.message;}finally{nativeApply.disabled=false;}
});
document.getElementById('native-setup').addEventListener('click',()=>chrome.tabs.create({url:'https://github.com/franciaemilhplgamedesign-tech/parameter-fixer-ext/releases/latest/download/EC-FIX-IT-Windows-Updater.zip'}));
document.getElementById('native-recheck').addEventListener('click',refreshNativeStatus);
refreshNativeStatus();
