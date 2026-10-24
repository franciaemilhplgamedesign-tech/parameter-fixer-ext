const REVIEW_MAX_FILES=20;
const REVIEW_PROMPT='check grammar and filename';
function buildReviewPrompt(taskName='',additionalNotes=''){
 const name=String(taskName).trim();if(name.length>500)throw new Error('Task name must be 500 characters or fewer.');
 const notes=String(additionalNotes).trim();if(notes.length>4000)throw new Error('Additional notes must be 4000 characters or fewer.');
 return REVIEW_PROMPT+(name?' for task '+name:'')+(notes?'\nadditional notes: '+notes:'');
}
function getReviewPrompt(){return buildReviewPrompt(typeof document==='undefined'?'':document.getElementById('review-task-name')?.value||'',typeof document==='undefined'?'':document.getElementById('review-additional-notes')?.value||'');}

const REVIEW_URL='https://chatgpt.com/g/g-p-6aba53db995c819187554fe66297a936-emil-francia-ecomm-checker/c/6aba5459-e97c-83ec-9e60-8c167d76c1ab';
let reviewDbPromise,reviewUrls=[];
function reviewDb(){
 return reviewDbPromise??=new Promise((resolve,reject)=>{
  const request=indexedDB.open('parameter-checker-review',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('items',{keyPath:'id'});
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });
}
async function reviewStore(mode,operation){
 const db=await reviewDb();return new Promise((resolve,reject)=>{
  const tx=db.transaction('items',mode),request=operation(tx.objectStore('items'));let result;
  if(request)request.onsuccess=()=>{result=request.result;};
  tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Storage operation cancelled.'));
 });
}
// Count and insert in one transaction so simultaneous popup windows share the cap.
async function reviewPutFile(item){
 const db=await reviewDb();return new Promise((resolve,reject)=>{
  const tx=db.transaction('items','readwrite'),store=tx.objectStore('items'),request=store.getAll();let capacityError;
  request.onsuccess=()=>{
   const files=request.result.filter(i=>i.kind==='html'||i.kind==='image');
   if(!files.some(i=>i.id===item.id)&&files.length>=REVIEW_MAX_FILES){capacityError=new Error('Review is limited to 20 files total (HTML + images). Delete files before adding more.');tx.abort();return;}
   store.put(item);
  };
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(capacityError||tx.error);tx.onabort=()=>reject(capacityError||tx.error||new Error('Review save cancelled.'));
 });
}
async function saveScreenshot(blob,name,metadata){
 try{await collectLocalHtml(metadata.sourceUrl);}catch(error){document.getElementById('review-status').textContent=error.message;}
 await reviewPutFile({id:crypto.randomUUID(),kind:'image',name,blob,metadata,selected:true,created:Date.now()});
 await renderReview();
}
function localHtmlSource(input){
 const url=new URL(input);
 if(url.protocol!=='file:' || !/\.html?$/i.test(url.pathname))return null;
 url.search='';url.hash='';
 return {url:url.href,name:decodeURIComponent(url.pathname.split('/').pop())};
}
async function collectLocalHtml(input){
 const source=localHtmlSource(input);if(!source)return false;
 const allowed=await chrome.extension.isAllowedFileSchemeAccess();
 if(!allowed)throw new Error('Enable Allow access to file URLs in this extension’s settings, then reopen the checker to collect the original local HTML.');
 let response;
 try{response=await fetch(source.url);}catch(_){throw new Error('Could not read the original local HTML. Enable Allow access to file URLs, reload the extension, and check that the file still exists.');}
 if(!response.ok && response.status!==0)throw new Error('Could not read local HTML: '+response.status);
 const blob=await response.blob(),id='html:'+source.url;
 const previous=await reviewStore('readonly',store=>store.get(id));
 await reviewPutFile({id,kind:'html',name:source.name,blob,selected:previous?previous.selected:true,created:previous?.created||Date.now(),metadata:{sourceUrl:source.url,previewUrl:input}});
 await renderReview();
 document.getElementById('review-source').textContent='Original HTML collected automatically.';
 return true;
}
async function collectCurrentLocalHtml(){
 try{if(typeof currentTab==='undefined'||!currentTab)return;const tab=await chrome.tabs.get(currentTab.id);await collectLocalHtml(tab.url);}catch(error){document.getElementById('review-status').textContent=error.message;}
}
async function renderReview(){
 const items=(await reviewStore('readonly',store=>store.getAll())).filter(i=>i.kind==='html'||i.kind==='image').sort((a,b)=>a.created-b.created);
 const gallery=document.getElementById('review-gallery');gallery.replaceChildren();reviewUrls.forEach(URL.revokeObjectURL);reviewUrls=[];
 const fileList=document.createElement('div');fileList.className='review-files';
 const imageGrid=document.createElement('div');imageGrid.className='review-images';
 gallery.append(fileList,imageGrid);
 for(const item of items){
  const row=document.createElement('div');row.className=item.kind==='image'?'review-tile':'review-file';row.dataset.selected=String(!!item.selected);
  const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=item.selected;checkbox.setAttribute('aria-label','Select '+item.name);
  checkbox.addEventListener('change',async()=>{item.selected=checkbox.checked;row.dataset.selected=String(item.selected);await reviewStore('readwrite',store=>store.put(item));});
  row.appendChild(checkbox);
  if(item.kind==='image'){
   const thumb=document.createElement('button');thumb.className='review-thumbnail';thumb.type='button';thumb.setAttribute('aria-label','Enlarge screenshot');thumb.title='View screenshot';
   const img=document.createElement('img');img.src=URL.createObjectURL(item.blob);reviewUrls.push(img.src);img.alt='Review screenshot';thumb.appendChild(img);
   thumb.addEventListener('click',()=>openReviewImage(item.blob,thumb));row.appendChild(thumb);
  }else{
   const icon=document.createElement('span');icon.className='file-code-icon';icon.textContent='</>';icon.setAttribute('aria-hidden','true');row.appendChild(icon);
   const details=document.createElement('div');details.className='file-details';
   const name=document.createElement('strong');name.textContent=item.name;name.title=item.name;
   const kind=document.createElement('small');kind.textContent='HTML';details.append(name,kind);row.appendChild(details);
  }
  const remove=document.createElement('button');remove.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>';remove.title='Delete '+(item.kind==='image'?'screenshot':'HTML file');remove.setAttribute('aria-label',remove.title);remove.className='review-remove icon-button';remove.addEventListener('click',async()=>{await reviewStore('readwrite',store=>store.delete(item.id));await renderReview();});row.appendChild(remove);
  (item.kind==='image'?imageGrid:fileList).appendChild(row);
 }
 document.getElementById('review-count').textContent=items.length+' / '+REVIEW_MAX_FILES+' files · '+items.filter(i=>i.kind==='image').length+' screenshots · '+items.filter(i=>i.kind==='html').length+' HTML files saved locally';
}
async function removeReviewItems(all){
 if(all)await reviewStore('readwrite',store=>store.clear());
 else{const items=await reviewStore('readonly',store=>store.getAll());for(const item of items.filter(i=>i.selected))await reviewStore('readwrite',store=>store.delete(item.id));}
 await renderReview();
}
async function createReviewPackage(prompt=getReviewPrompt()){
 const items=(await reviewStore('readonly',store=>store.getAll())).filter(i=>i.selected&&(i.kind==='html'||i.kind==='image'));
 if(items.length>REVIEW_MAX_FILES)throw new Error('Select no more than 20 files total (HTML + images).');
 if(!items.some(i=>i.kind==='html')||!items.some(i=>i.kind==='image'))throw new Error('Select at least one screenshot and add/select its original HTML file.');
 const entries=[],names=new Set();
 for(const item of items){
  let name=item.name.replace(/[\\/]/g,'_'),base=name,index=2;
  while(names.has(name.toLowerCase()))name=index+++'_'+base;
  names.add(name.toLowerCase());entries.push({name,data:new Uint8Array(await item.blob.arrayBuffer())});
 }
 entries.push({name:'review-prompt.txt',text:prompt});
 entries.push({name:'capture-details.json',text:JSON.stringify(items.map(({name,kind,metadata,created})=>({name,kind,metadata,created})),null,2)});
 return makeZip(entries);
}
function downloadReview(blob){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='ecomm-checker-review-'+Date.now()+'.zip';link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
const reviewStatus=document.getElementById('review-status');
const reviewTaskName=document.getElementById('review-task-name');let taskNameEdited=false;
function updateReviewPromptPreview(){document.getElementById('review-prompt-preview').textContent='Prompt: '+getReviewPrompt();}
reviewTaskName.addEventListener('input',()=>{
 taskNameEdited=true;updateReviewPromptPreview();chrome.storage.local.set({reviewTaskName:reviewTaskName.value}).catch(error=>{reviewStatus.textContent='Could not save task name: '+error.message;});
});
chrome.storage.local.get('reviewTaskName').then(saved=>{if(!taskNameEdited&&typeof saved.reviewTaskName==='string')reviewTaskName.value=saved.reviewTaskName.slice(0,500);updateReviewPromptPreview();}).catch(()=>updateReviewPromptPreview());
const reviewAdditionalNotes=document.getElementById('review-additional-notes');let additionalNotesEdited=false;
reviewAdditionalNotes.addEventListener('input',()=>{
 additionalNotesEdited=true;updateReviewPromptPreview();chrome.storage.local.set({reviewAdditionalNotes:reviewAdditionalNotes.value}).catch(error=>{reviewStatus.textContent='Could not save additional notes: '+error.message;});
});
chrome.storage.local.get('reviewAdditionalNotes').then(saved=>{if(!additionalNotesEdited&&typeof saved.reviewAdditionalNotes==='string')reviewAdditionalNotes.value=saved.reviewAdditionalNotes.slice(0,4000);updateReviewPromptPreview();}).catch(()=>updateReviewPromptPreview());
updateReviewPromptPreview();
chrome.storage.local.get('reviewSendStatus').then(saved=>{if(saved.reviewSendStatus)reviewStatus.textContent=saved.reviewSendStatus;});
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.reviewSendStatus)reviewStatus.textContent=changes.reviewSendStatus.newValue;});
window.addEventListener('preview-target-ready',collectCurrentLocalHtml);
collectCurrentLocalHtml();
for(const [id,action] of [['review-delete',()=>removeReviewItems(false)],['review-clear',()=>removeReviewItems(true)],['review-select',async()=>{const items=await reviewStore('readonly',store=>store.getAll());for(const item of items){item.selected=true;await reviewStore('readwrite',store=>store.put(item));}await renderReview();}],['review-none',async()=>{const items=await reviewStore('readonly',store=>store.getAll());for(const item of items){item.selected=false;await reviewStore('readwrite',store=>store.put(item));}await renderReview();}]]){
 document.getElementById(id).addEventListener('click',()=>action().catch(error=>{reviewStatus.textContent=error.message;}));
}
async function exportReview(openChecker){
 try{
  const prompt=getReviewPrompt(),blob=await createReviewPackage(prompt);downloadReview(blob);
  let copied=false;try{await navigator.clipboard.writeText(prompt);copied=true;}catch(_){}
  reviewStatus.textContent='Package downloaded. Extract the ZIP, attach the HTML and PNG files in the checker, '+(copied?'paste the copied prompt':'type: '+prompt)+', then send. Files have not been uploaded automatically.';
  if(openChecker)await chrome.tabs.create({url:REVIEW_URL});
 }catch(error){reviewStatus.textContent=error.message;}
}
document.getElementById('review-export').addEventListener('click',()=>exportReview(false));
document.getElementById('review-checker').addEventListener('click',async()=>{
 const button=document.getElementById('review-checker');button.disabled=true;
 try{reviewStatus.textContent='Attaching files and preparing the review draft…';await sendSelectedReview();}
 catch(error){reviewStatus.textContent=error.message;}finally{button.disabled=false;}
});
renderReview().catch(error=>{reviewStatus.textContent='Could not open local gallery: '+error.message;});
