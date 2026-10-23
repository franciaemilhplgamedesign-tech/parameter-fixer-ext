/* Only the installed, explicit preview session can issue these fixed commands. */
const HOSTED_DASHBOARD='https://franciaemilhplgamedesign-tech.github.io/parameter-fixer-ext/';
function isHostedDashboard(url){try{const u=new URL(url);return u.origin===new URL(HOSTED_DASHBOARD).origin&&[new URL(HOSTED_DASHBOARD).pathname,new URL(HOSTED_DASHBOARD).pathname+'index.html'].includes(u.pathname);}catch(_){return false;}}
function supportedHostedTarget(url){try{const u=new URL(url);return isLocalCreativeUrl(url)||(u.protocol==='https:'&&u.hostname==='playable.applovindemo.com'&&/^\/Preview(?:\/|$)/i.test(u.pathname));}catch(_){return false;}}
async function openHostedDashboard(tab){
 if(!tab?.id||!supportedHostedTarget(tab.url))throw new Error('Open an AppLovin, local HTML or localhost preview first.');
 const session=crypto.randomUUID(),key='hosted-session:'+session;
 await chrome.storage.session.set({[key]:{targetTab:tab.id,createdAt:Date.now()}});
 try{
  const dashboard=await chrome.tabs.create({url:HOSTED_DASHBOARD+'#extension='+chrome.runtime.id+'&session='+session});
  await chrome.storage.session.set({[key]:{targetTab:tab.id,dashboardTab:dashboard.id,createdAt:Date.now()}});
 }catch(error){await chrome.storage.session.remove(key);throw error;}
}
async function hostedCommand(message,sender){
 if(!isHostedDashboard(sender.url)||!sender.tab||sender.frameId!==0)throw new Error('Untrusted dashboard.');
 if(!message||message.channel!=='ec-fix-it-v1'||typeof message.session!=='string'||!/^[-a-f0-9]{36}$/.test(message.session))throw new Error('Invalid dashboard session.');
 const key='hosted-session:'+message.session,binding=(await chrome.storage.session.get(key))[key];
 if(!binding||binding.dashboardTab!==sender.tab.id||Date.now()-binding.createdAt>86400000)throw new Error('Session expired. Open EC-FIX-IT from your preview again.');
 const tab=await chrome.tabs.get(binding.targetTab);if(!supportedHostedTarget(tab.url))throw new Error('Linked tab is no longer a supported preview.');
 switch(message.command){
 case 'status':{
  const u=new URL(tab.url),first=[...u.searchParams].find(([k])=>/^h(?:[1-9]\d*)?$/.test(k));
  const params=first?new URLSearchParams(first[1].split('?')[1]?.split('#')[0]||''):u.searchParams;
  return {version:chrome.runtime.getManifest().version,preview:tab.title||'Linked preview',local:isLocalCreativeUrl(tab.url),date:params.get('date')||'',language:params.get('language')||''};
 }
 case 'parameters':{
  if(typeof message.date!=='string'||message.date.length>10||typeof message.language!=='string'||message.language.length>32)throw new Error('Invalid parameter values.');
  const result=updatePreviewUrl(tab.url,message.date,message.language);
  if(result.url!==tab.url)await chrome.tabs.update(tab.id,{url:result.url});
  return {message:'Parameters applied to '+result.label+'.'};
 }
 case 'check':{
  if(!['auto','mip','sip'].includes(message.creativeType))throw new Error('Invalid creative type.');
  const report=await checkLocalPreview(tab.id,message.creativeType);
  // No raw creative source, local path or snippets are shared with the hosted UI.
  return {report:{bytes:report.bytes,profile:report.profile,errors:report.errors,warnings:report.warnings,issues:report.issues,findings:report.findings.map(({id,title,status,description})=>({id,title,status,description}))}};
 }
 case 'open-tool':{
  if(!['parameter','datefix','mraid','review'].includes(message.tool))throw new Error('Unsupported tool.');
  await chrome.windows.create({url:chrome.runtime.getURL('popup.html')+'?targetTab='+tab.id+'&tool='+message.tool,type:'popup',width:860,height:920});
  return {message:'Opened the installed companion. Keep your preview tab active for screenshots.'};
 }
 default:throw new Error('Unsupported dashboard command.');
 }
}
chrome.runtime.onMessageExternal.addListener((message,sender,respond)=>{
 hostedCommand(message,sender).then(result=>respond({ok:true,...result})).catch(error=>respond({ok:false,error:error.message}));return true;
});
chrome.action.onClicked.addListener(tab=>{
 openHostedDashboard(tab).catch(async error=>{
  await chrome.windows.create({url:chrome.runtime.getURL('popup.html')+(tab?.id?'?targetTab='+tab.id:''),type:'popup',width:860,height:920});
 });
});
chrome.tabs.onRemoved.addListener(async tabId=>{
 const saved=await chrome.storage.session.get(null),keys=Object.entries(saved).filter(([k,v])=>k.startsWith('hosted-session:')&&(v.dashboardTab===tabId||v.targetTab===tabId)).map(([k])=>k);
 if(keys.length)await chrome.storage.session.remove(keys);
});
