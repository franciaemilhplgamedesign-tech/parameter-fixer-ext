'use strict';
const byId=id=>document.getElementById(id),hash=new URLSearchParams(location.hash.slice(1));
const extension=hash.get('extension'),session=hash.get('session');let connected=false,local=false,checkSequence=0;
function enable(value){connected=value;document.querySelectorAll('[data-connected]').forEach(b=>b.disabled=!value);}
async function command(name,values={}){
 if(!/^[a-p]{32}$/.test(extension||'')||!/^[-a-f0-9]{36}$/.test(session||''))throw new Error('Open the extension on your preview, then choose Open hosted dashboard to connect.');
 if(!globalThis.chrome?.runtime?.sendMessage)throw new Error('Install/update EC-FIX-IT v2.0.0 or later, then choose Open hosted dashboard inside its popup.');
 const result=await chrome.runtime.sendMessage(extension,{channel:'ec-fix-it-v1',session,command:name,...values});
 if(!result?.ok)throw new Error(result?.error||'Extension did not respond. Reload it and reopen using Open hosted dashboard in the extension.');return result;
}
function panel(name){document.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==name);document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===name)));}
async function check(){const sequence=++checkSequence;byId('check-status').textContent='Checking original source…';try{
 const {report}=await command('check',{creativeType:byId('creative-type').value});if(sequence!==checkSequence)return;
 byId('check-status').textContent=report.errors+' errors · '+report.warnings+' warnings · '+report.bytes.toLocaleString()+' bytes · '+report.profile.label;
 byId('badge').textContent=report.issues?'('+report.issues+')':'';byId('results').replaceChildren();
 for(const f of report.findings){const article=document.createElement('article'),title=document.createElement('strong'),text=document.createElement('p');article.className=f.status;title.textContent=f.status.toUpperCase()+' · '+f.title;text.textContent=f.description;article.append(title,text);byId('results').append(article);}
 }catch(error){if(sequence===checkSequence)byId('check-status').textContent=error.message;}}
async function apply(real=false){try{const result=await command('parameters',{date:real?'':byId('date').value,language:byId('language').value==='custom'?byId('custom').value.trim():byId('language').value});byId('parameter-status').textContent=result.message;if(local)setTimeout(check,1000);}catch(error){byId('parameter-status').textContent=error.message;}}
byId('apply').addEventListener('click',()=>apply());byId('real').addEventListener('click',()=>apply(true));
byId('language').addEventListener('change',()=>{byId('custom').hidden=byId('custom-label').hidden=byId('language').value!=='custom';});
byId('recheck').addEventListener('click',check);byId('creative-type').addEventListener('change',()=>{if(connected&&local)check();});
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>panel(b.dataset.tab)));
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',async()=>{try{const result=await command('open-tool',{tool:b.dataset.open});byId('action-status').textContent=result.message;}catch(error){byId('action-status').textContent=error.message;}}));
try{document.documentElement.dataset.theme=localStorage.getItem('ec-theme')||'dark';}catch(_){}
byId('theme').addEventListener('click',()=>{const mode=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=mode;try{localStorage.setItem('ec-theme',mode);}catch(_){}});
const today=new Date();byId('date').value=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
enable(false);
(async()=>{try{
 // The extension binds the created dashboard tab before accepting commands.
 let state;for(let attempt=0;attempt<5;attempt++){try{state=await command('status');break;}catch(error){if(attempt===4)throw error;await new Promise(resolve=>setTimeout(resolve,400));}}
 local=state.local;byId('date').value=state.date||'';
 if(state.language){if(![...byId('language').options].some(o=>o.value===state.language)){byId('language').value='custom';byId('custom').value=state.language;byId('custom').hidden=byId('custom-label').hidden=false;}else byId('language').value=state.language;}
 enable(true);byId('connection').textContent='Connected · extension v'+state.version+' · '+state.preview;
 if(local)await check();else byId('check-status').textContent='Automatic Checker applies to local HTML and localhost previews. Parameters and companion tools are available for AppLovin.';
 }catch(error){enable(false);byId('connection').textContent=error.message;}})();
