let checkerTabId;
const transferStatus=document.getElementById('transfer-status');
async function transferState(text){transferStatus.textContent=text;await chrome.storage.local.set({reviewSendStatus:text});}
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.reviewSendStatus)transferStatus.textContent=changes.reviewSendStatus.newValue;});
async function runnerJob(id,remove=false){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open('parameter-checker-review',1);req.onerror=()=>reject(req.error);
  req.onsuccess=()=>{const db=req.result;try{const tx=db.transaction('items',remove?'readwrite':'readonly'),store=tx.objectStore('items'),r=remove?store.delete(id):store.get(id);let value;r.onsuccess=()=>{value=r.result;};tx.oncomplete=()=>{db.close();resolve(value);};tx.onerror=()=>{db.close();reject(tx.error);};}catch(error){db.close();reject(error);}};
 });
}
document.getElementById('open-checker').addEventListener('click',async()=>{const tab=await chrome.tabs.update(checkerTabId,{active:true});await chrome.windows.update(tab.windowId,{focused:true});});
(async()=>{
 const id=new URLSearchParams(location.search).get('job');
 try{
  if(!id?.startsWith('pending-send:'))throw new Error('Invalid transfer job.');
  await transferState('Reading selected review files…');
  const job=await runnerJob(id);if(!job)throw new Error('Review files were not found. Select your files and start a new transfer.');
  if(!Array.isArray(job.files)||job.files.length>20)throw new Error('Review is limited to 20 files total (HTML + images).');
  await transferState('Opening the ecomm checker…');
  const existing=(await chrome.tabs.query({url:'https://chatgpt.com/*'})).find(tab=>{try{return new URL(tab.url).pathname===new URL(job.url).pathname;}catch(_){return false;}});
  const tab=existing?await chrome.tabs.update(existing.id,{active:true}):await chrome.tabs.create({url:job.url,active:true});checkerTabId=tab.id;document.getElementById('open-checker').hidden=false;
  const deadline=Date.now()+60000;
  while((await chrome.tabs.get(tab.id)).status!=='complete'){if(Date.now()>deadline)throw new Error('ChatGPT page did not finish loading within 60 seconds. No message was sent.');await new Promise(resolve=>setTimeout(resolve,500));}
  await transferState('ChatGPT loaded. Locating composer and upload controls…');
  const timeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error('Transfer timed out. Check the ChatGPT tab before retrying; the current submission state is unknown.')),240000));
  const result=await Promise.race([chrome.scripting.executeScript({target:{tabId:tab.id},func:attachAndSendInChecker,args:[job.files,job.prompt]}),timeout]);
  if(!result?.[0]?.result?.sent)throw new Error(result?.[0]?.result?.error||'The page did not confirm submission. Check the conversation before retrying.');
  await transferState('Sent '+result[0].result.count+' files with:\n'+job.prompt);
 }catch(error){await transferState('Transfer stopped: '+error.message+'\nIf ChatGPT access is denied, reload the extension and allow access to chatgpt.com.');}
 finally{if(id)await runnerJob(id,true).catch(()=>{});}
})();
