const UPDATE_REPOSITORY='franciaemilhplgamedesign-tech/parameter-fixer-ext';
const UPDATE_MANIFEST='https://raw.githubusercontent.com/'+UPDATE_REPOSITORY+'/main/parameter-extension/manifest.json';
const UPDATE_DOWNLOAD='https://github.com/'+UPDATE_REPOSITORY+'/archive/refs/heads/main.zip';
function compareExtensionVersions(a,b){
 const left=a.split('.').map(Number),right=b.split('.').map(Number);
 for(let i=0;i<Math.max(left.length,right.length);i++){const delta=(left[i]||0)-(right[i]||0);if(delta)return Math.sign(delta);}return 0;
}
async function checkExtensionUpdate(){
 const installed=chrome.runtime.getManifest().version;
 try{
  const response=await fetch(UPDATE_MANIFEST,{cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('GitHub returned '+response.status);
  const manifest=await response.json();
  if(!/^\d+(?:\.\d+){0,3}$/.test(manifest.version||''))throw new Error('Invalid repository version.');
  const state={installed,latest:manifest.version,available:compareExtensionVersions(manifest.version,installed)>0,checkedAt:Date.now(),download:UPDATE_DOWNLOAD};
  await chrome.storage.local.set({extensionUpdate:state});
  await chrome.action.setBadgeText({text:state.available?'NEW':''});
  if(state.available)await chrome.action.setBadgeBackgroundColor({color:'#17685f'});
  return state;
 }catch(error){
  const saved=(await chrome.storage.local.get('extensionUpdate')).extensionUpdate;
  const state={...saved,installed,error:error.message};
  await chrome.storage.local.set({extensionUpdate:state});return state;
 }
}
if(typeof module!=='undefined')module.exports={compareExtensionVersions};
