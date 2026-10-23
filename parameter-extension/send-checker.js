// Runs in the requested ChatGPT tab. No credentials or third-party API are used.
async function attachAndSendInChecker(files,prompt){
 try{
 function progress(text){try{chrome.runtime.sendMessage({type:'review-progress',text}).catch(()=>{});}catch(_){} }
 progress('Waiting for the ChatGPT composer. Sign in if requested…');
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 async function waitFor(read,timeout=30000,stage='control'){
  const end=Date.now()+timeout;while(Date.now()<end){const result=read();if(result)return result;await sleep(300);}throw new Error('Timed out waiting for '+stage+'. Page: '+document.title+' ('+location.pathname+'). If this is a login, unavailable conversation, or browser verification page, resolve it in the checker tab and retry.');
 }
 const composer=await waitFor(()=>[...document.querySelectorAll('#prompt-textarea,[contenteditable="true"][role="textbox"],.ProseMirror[contenteditable="true"],[contenteditable="true"][data-lexical-editor],textarea[placeholder],div[contenteditable="true"][data-placeholder]')].find(el=>el.getClientRects().length&&!el.disabled&&el.getAttribute('aria-hidden')!=='true'),60000,'visible message composer');
 const region=()=>composer.closest('form,[data-type="unified-composer"],[data-testid="composer"]')||composer.parentElement?.parentElement?.parentElement;
 if((composer.innerText||composer.value||'').trim())throw new Error('The checker already has an unsent draft. Clear or send that draft before retrying.');
 function uploadInput(){return [...document.querySelectorAll('input[type="file"]')].filter(el=>!el.disabled).sort((a,b)=>Number(!!b.multiple)-Number(!!a.multiple)).find(el=>!el.accept||/html|application|text|\*\/\*/i.test(el.accept));}
 progress('Locating file upload controls…');
 let input=uploadInput();
 if(!input){
  const add=document.querySelector('[data-testid="composer-plus-btn"],#upload-file-btn,button[aria-label="Add photos & files"],button[aria-label="Add files"],button[aria-label="Add files and more"],button[aria-label="Attach files"]');
  if(add)add.click();
  try{input=await waitFor(uploadInput,3000,'file upload input');}catch(_){input=null;}
 }
 const transfer=new DataTransfer();
 for(const file of files){const raw=atob(file.base64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);transfer.items.add(new File([bytes],file.name,{type:file.type}));}
 const beforeImages=new Set([...region().querySelectorAll('img')].map(img=>img.src));
 if(input && (input.multiple||files.length===1)){
  input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true,composed:true}));
 }else{
  progress('No compatible file input found. Attaching through ChatGPT’s paste handler…');
  composer.focus();composer.dispatchEvent(new ClipboardEvent('paste',{clipboardData:transfer,bubbles:true,cancelable:true,composed:true}));
 }
 progress('Files handed to ChatGPT. Waiting for '+files.length+' attachments to appear…');
 function attachmentSeen(file){
  const root=region();if(!root)return false;
  const text=root.innerText||'';
  if(text.includes(file.name))return true;
  if([...root.querySelectorAll('[title],[aria-label],img[alt]')].some(el=>[el.getAttribute('title'),el.getAttribute('aria-label'),el.getAttribute('alt')].some(value=>value?.includes(file.name))))return true;
  // ChatGPT often shows image thumbnails without exposing PNG filenames.
  if(file.type.startsWith('image/'))return [...root.querySelectorAll('img')].filter(img=>!beforeImages.has(img.src)&&img.complete&&img.naturalWidth>0).length>=files.filter(f=>f.type.startsWith('image/')).length;
  return false;
 }
 // Never submit until every selected filename is represented in the composer.
 try{await waitFor(()=>files.every(attachmentSeen),90000);}catch(_){throw new Error('Could not verify every attachment in the checker. Files may be staged, but no message was sent. Do not retry until you clear the staged attachments.');}
 progress('Attachments found. Waiting for uploads to finish…');
 await waitFor(()=>!region()?.querySelector('[role="progressbar"],[aria-busy="true"]'),90000);
 if(composer.tagName==='TEXTAREA'){
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(composer,prompt);
  composer.dispatchEvent(new Event('input',{bubbles:true}));
 }else{
  composer.focus();document.execCommand('insertText',false,prompt);
  composer.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:prompt}));
 }
 if((composer.innerText||composer.value||'').trim()!==prompt)throw new Error('Could not set the review prompt. No message was sent.');
 const send=await waitFor(()=>{
  const button=document.querySelector('[data-testid="send-button"],button[aria-label="Send prompt"],button[aria-label="Send message"]');
  return button&&!button.disabled&&button.getAttribute('aria-disabled')!=='true'?button:null;
 },90000);
 progress('Uploads ready. Preparing to send the review prompt…');
 await sleep(1500);
 if(!files.every(attachmentSeen)||region()?.querySelector('[role="progressbar"],[aria-busy="true"]')||send.disabled)throw new Error('Attachments are still changing or uploading. No message was sent.');
 send.click();
 // Confirm the composer was cleared instead of claiming a successful send early.
 try{await waitFor(()=>!(composer.innerText||composer.value||'').trim(),15000);}catch(_){throw new Error('Send was clicked but submission could not be confirmed. Check the checker conversation before retrying.');}
 return {sent:true,count:files.length};
 }catch(error){return {sent:false,error:error.message};}
}
async function sendSelectedReview(){
 const items=(await reviewStore('readonly',store=>store.getAll())).filter(item=>item.selected);
 if(!items.some(i=>i.kind==='html')||!items.some(i=>i.kind==='image'))throw new Error('Select at least one screenshot and its collected HTML.');
 const files=[];
 for(const item of items){
  const bytes=new Uint8Array(await item.blob.arrayBuffer());let raw='';
  for(let offset=0;offset<bytes.length;offset+=32768)raw+=String.fromCharCode(...bytes.subarray(offset,offset+32768));
  files.push({name:item.name,type:item.kind==='html'?'text/html':'image/png',base64:btoa(raw)});
 }
 const jobId='pending-send:'+crypto.randomUUID();
 // Save before opening another tab, which closes the toolbar popup.
 await reviewStore('readwrite',store=>store.put({id:jobId,kind:'send-job',files,prompt:REVIEW_PROMPT,url:REVIEW_URL,created:Date.now(),selected:false}));
 const response=await chrome.runtime.sendMessage({type:'send-ecomm-review',jobId});
 if(!response?.runnerOpened)throw new Error(response?.error||'Transfer window did not start. Reload the extension, close old detached windows, and retry.');
 return jobId;
}
