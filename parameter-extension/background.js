importScripts('updates.js');
importScripts('send-checker.js');
importScripts('mraid-checks.js');
async function scheduleUpdateChecks(){
 await chrome.alarms.create('github-update-check',{periodInMinutes:360});
 await checkExtensionUpdate();
}
chrome.runtime.onInstalled.addListener(scheduleUpdateChecks);
chrome.runtime.onStartup.addListener(scheduleUpdateChecks);
chrome.alarms.onAlarm.addListener(alarm=>{if(alarm.name==='github-update-check')checkExtensionUpdate();});
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
 if(sender.id===chrome.runtime.id && ['local-preview-viewed','run-mraid-check'].includes(message?.type)){
  const tabId=message.type==='local-preview-viewed'?sender.tab?.id:message.tabId;
  checkLocalPreview(tabId,message.type==='run-mraid-check'?message.creativeType:undefined).then(report=>respond({report})).catch(error=>respond({error:error.message}));return true;
 }
 if(sender.id===chrome.runtime.id && message?.type==='send-ecomm-review'){
  if(typeof message.jobId!=='string'||!message.jobId.startsWith('pending-send:')){respond({error:'Invalid review job.'});return;}
  chrome.windows.create({url:chrome.runtime.getURL('send-runner.html')+'?job='+encodeURIComponent(message.jobId),type:'popup',width:480,height:420})
   .then(()=>respond({runnerOpened:true})).catch(error=>respond({error:error.message}));return true;
 }
 if(sender.id===chrome.runtime.id && sender.tab?.url?.startsWith('https://chatgpt.com/') && message?.type==='review-progress'){
  chrome.storage.local.set({reviewSendStatus:String(message.text).slice(0,1000)});return;
 }
 if(sender.id!==chrome.runtime.id || message?.type!=='check-extension-update')return;
 checkExtensionUpdate().then(respond).catch(error=>respond({error:error.message}));return true;
});
const mraidTasks=new Map();
async function checkLocalPreview(tabId,requestedType){
 if(!Number.isInteger(tabId))throw new Error('No preview tab selected.');
 if(mraidTasks.has(tabId)){
  if(!['auto','mip','sip'].includes(requestedType))return mraidTasks.get(tabId);
  try{await mraidTasks.get(tabId);}catch(_){}
  return checkLocalPreview(tabId,requestedType);
 }
 const task=(async()=>{
  const tab=await chrome.tabs.get(tabId);if(!isLocalCreativeUrl(tab.url))throw new Error('Automatic MRAID checks apply to local HTML and localhost previews.');
  const url=new URL(tab.url);if(url.protocol==='file:'){url.search='';url.hash='';if(!await chrome.extension.isAllowedFileSchemeAccess())throw new Error('Enable Allow access to file URLs in extension settings.');}
  const profileUrl=new URL(url.href);profileUrl.search='';profileUrl.hash='';const key='creative-type:'+profileUrl.href;
  let mode=(await chrome.storage.local.get(key))[key]||'auto';
  if(['auto','mip','sip'].includes(requestedType)){mode=requestedType;await chrome.storage.local.set({[key]:mode});}
  const response=await fetch(url.href,{cache:'no-store',signal:AbortSignal.timeout(20000)});
  if(!response.ok && response.status!==0)throw new Error('Could not read HTML: '+response.status);
  const report=checkMraidHtml(await response.text(),tab.url,mode);
  await chrome.storage.session.set({['mraid:'+tabId]:report});return report;
 })();mraidTasks.set(tabId,task);
 try{return await task;}finally{mraidTasks.delete(tabId);}
}

importScripts('url-tools.js');
importScripts('hosted-bridge.js');
