const suiteSource={html:null,name:'creative.html',url:null};
function suiteDownload(blob,name){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function suiteTab(name){
 for(const button of document.querySelectorAll('[data-suite-tab]')){const active=button.dataset.suiteTab===name;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;}
 for(const panel of document.querySelectorAll('[data-suite-panel]'))panel.hidden=panel.dataset.suitePanel!==name;
}
for(const button of document.querySelectorAll('[data-suite-tab]')){
 button.addEventListener('click',()=>suiteTab(button.dataset.suiteTab));
 button.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const tabs=[...document.querySelectorAll('[data-suite-tab]')],offset=event.key==='ArrowRight'?1:-1,target=tabs[(tabs.indexOf(button)+offset+tabs.length)%tabs.length];suiteTab(target.dataset.suiteTab);target.focus();}});
}
const requestedSuiteTool=typeof window.location==='object'?new URLSearchParams(window.location.search).get('tool'):null;
suiteTab(['parameter','datefix','mraid','review'].includes(requestedSuiteTool)?requestedSuiteTool:'parameter');
let pendingCreativeType=null,typeRequest=0,lastMraidReport=null,selectedCreativeType=null;
function renderMraid(report){
 const mode=selectedCreativeType??pendingCreativeType;
 if(mode&&typeof creativeSizeProfile==='function'){
  let profile=mode==='auto'&&report.profile?.mode==='auto'?report.profile:creativeSizeProfile('',report.sourceUrl,mode);
  profile={...profile,limitBytes:creativeSizeProfile('',report.sourceUrl,profile.type==='mip'?'mip':'sip').limitBytes};
  const findings=report.findings.filter(f=>f.id!=='size'&&!/^HTML size\b/i.test(f.title));
  findings.push({id:'size',title:'HTML size ('+profile.label+')',status:report.bytes>profile.limitBytes?'error':'pass',description:formatCreativeSize(report.bytes)+' / '+formatCreativeSize(profile.limitBytes)+' ('+report.bytes.toLocaleString('en-US')+' / '+profile.limitBytes.toLocaleString('en-US')+' bytes). Windows sizing; limit follows the selected creative type.'});
  const errors=findings.filter(f=>f.status==='error').length,warnings=findings.filter(f=>f.status==='warning').length;
  report={...report,profile,findings,errors,warnings,issues:errors+warnings};
 }
 lastMraidReport=report;
 const count=document.getElementById('mraid-issues');count.textContent=report.issues;count.hidden=!report.issues;
 document.getElementById('mraid-summary').textContent=report.errors+' errors · '+report.warnings+' warnings · '+formatCreativeSize(report.bytes)+' ('+report.bytes.toLocaleString()+' bytes)';
 if(report.profile){document.getElementById('creative-type').value=report.profile.mode;document.getElementById('creative-limit').textContent=report.profile.label+' · '+report.profile.reason;}
 const list=document.getElementById('mraid-results');list.replaceChildren();
 for(const finding of report.findings){
  const card=document.createElement('article');card.className='check-result check-'+finding.status;
  const title=document.createElement('strong');title.textContent=finding.status.toUpperCase()+' · '+finding.title;
  const text=document.createElement('p');text.textContent=finding.description;
  card.append(title,text);
  if(finding.evidence){const code=document.createElement('code');code.textContent=(finding.line?'Line '+finding.line+': ':'')+finding.evidence;card.appendChild(code);}
  list.appendChild(card);
 }
 document.getElementById('mraid-scope').textContent=report.scope;
}
async function refreshMraid(event){
 const status=document.getElementById('mraid-status');
 try{if(typeof currentTab==='undefined'||!currentTab)return;status.textContent='Checking original HTML…';
  const mode=event?.type==='click'?document.getElementById('creative-type').value:selectedCreativeType;
  if(mode)selectedCreativeType=mode;
  const response=await chrome.runtime.sendMessage({type:'run-mraid-check',tabId:currentTab.id,...(mode?{creativeType:mode}:{})});
  if(response.error)throw new Error(response.error);renderMraid(response.report);status.textContent='Checked automatically. Source files are unchanged.';
 }catch(error){status.textContent=error.message;}
}
window.addEventListener('preview-target-ready',refreshMraid);
if(typeof currentTab!=='undefined'&&currentTab)refreshMraid();
chrome.storage.onChanged.addListener((changes,area)=>{const report=typeof currentTab!=='undefined'&&currentTab?changes['mraid:'+currentTab.id]?.newValue:null;if(area==='session'&&report)renderMraid(report);});
document.getElementById('mraid-refresh').addEventListener('click',refreshMraid);
document.getElementById('creative-type').addEventListener('change',async event=>{
 const request=++typeRequest,mode=event.target.value;pendingCreativeType=mode;selectedCreativeType=mode;
 if(lastMraidReport)renderMraid(lastMraidReport);
 document.getElementById('mraid-status').textContent='Updating creative type and size limit…';
 try{const response=await chrome.runtime.sendMessage({type:'run-mraid-check',tabId:currentTab.id,creativeType:mode});if(request!==typeRequest)return;if(response.error)throw new Error(response.error);renderMraid(response.report);document.getElementById('mraid-status').textContent='Size check updated for the selected creative type.';}catch(error){if(request===typeRequest)document.getElementById('mraid-status').textContent=error.message;}finally{if(request===typeRequest)pendingCreativeType=null;}
});
async function readSuiteSource(){
 if(typeof currentTab==='undefined'||!currentTab)throw new Error('No linked preview tab.');
 const tab=await chrome.tabs.get(currentTab.id);if(!isLocalCreativeUrl(tab.url))throw new Error('Open a local HTML or localhost preview first.');
 const url=new URL(tab.url);if(url.protocol==='file:'){url.search='';url.hash='';if(!await chrome.extension.isAllowedFileSchemeAccess())throw new Error('Enable Allow access to file URLs first.');}
 const response=await fetch(url.href,{cache:'no-store'});if(!response.ok&&response.status!==0)throw new Error('Could not read HTML: '+response.status);
 suiteSource.html=await response.text();suiteSource.name=decodeURIComponent(url.pathname.split('/').pop()||'creative.html');if(!/\.html?$/i.test(suiteSource.name))suiteSource.name+='.html';suiteSource.url=tab.url;return suiteSource;
}
document.getElementById('fix-all').addEventListener('click',async()=>{
 const button=document.getElementById('fix-all'),status=document.getElementById('mraid-status');button.disabled=true;
 try{
  const source=await readSuiteSource();
  const result=await fixCreativePipeline(source.html,source.url,{creativeType:document.getElementById('creative-type').value,webgl:document.getElementById('fix-webgl').checked,network:document.getElementById('fix-network').checked,images:document.getElementById('compress-images').checked,quality:Number(document.getElementById('compress-quality').value)/100,maxEdge:Number(document.getElementById('compress-edge').value)},text=>{status.textContent=text;});
  renderMraid(result.report);
  if(result.report.errors||result.unresolved.length)throw new Error('Download blocked: '+result.report.errors+' checker error(s) and '+result.unresolved.length+' unresolved fix(es) remain after fixes and compression. Review the results below. '+result.unresolved.join(' '));
  suiteDownload(new Blob([result.html],{type:'text/html'}),source.name.replace(/\.html?$/i,'')+'_fixed.html');
  status.textContent='Fixed and compressed copy downloaded. '+formatCreativeSize(result.beforeBytes)+' → '+formatCreativeSize(result.afterBytes)+'. '+result.report.warnings+' warnings remain. '+result.unresolved.join(' ')+' Test the downloaded creative before upload.';
 }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
});
function addDateFix(html,name){
 const dateEnabled=document.getElementById('fix-enable-date').checked,languageEnabled=document.getElementById('fix-enable-language').checked;
 if(!dateEnabled&&!languageEnabled)throw new Error('Select date and/or language support first.');
 let patched=html;const messages=[];
 if(dateEnabled){const result=fixSipHtml(patched);patched=result.html;messages.push(result.message);}
 if(languageEnabled){const result=fixLanguageHtml(patched);patched=result.html;messages.push(result.message);}
 const scope=patchPreviewUrlScope(patched,{date:dateEnabled,language:languageEnabled});patched=scope.html;messages.push(scope.message);
 return {name:name.replace(/\.html?$/i,'')+'_parameter_preview.html',text:patched,message:messages.join('\n')};
}
document.getElementById('date-fix-current').addEventListener('click',async()=>{
 const status=document.getElementById('date-fix-status');try{const source=await readSuiteSource(),output=addDateFix(source.html,source.name);status.textContent=output.message;suiteDownload(new Blob([output.text],{type:'text/html'}),output.name);}catch(error){status.textContent=error.message;}
});
document.getElementById('date-fix-files').addEventListener('change',async event=>{
 const status=document.getElementById('date-fix-status'),files=[...event.target.files],entries=[],report=[];
 for(const file of files){try{const output=addDateFix(await file.text(),file.name);let name=output.name,n=2;while(entries.some(e=>e.name===name))name=n+++'_'+output.name;entries.push({...output,name});report.push(file.name+': '+output.message);}catch(error){report.push(file.name+': '+error.message);}}
 status.textContent=report.join('\n');if(entries.length){if(files.length===1)suiteDownload(new Blob([entries[0].text],{type:'text/html'}),entries[0].name);else suiteDownload(makeZip([...entries,{name:'report.txt',text:report.join('\n')}]),'parameter-fixed-creatives.zip');}event.target.value='';
});

