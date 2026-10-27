const dateInput=document.getElementById('date'),statusEl=document.getElementById('status');
const languageInput=document.getElementById('language');
const customLanguage=document.getElementById('custom-language'),autoRefresh=document.getElementById('auto-refresh');
const languages={en:'English',it:'Italian',br:'Brazilian Portuguese (creative code)',es:'Spanish',fr:'French',de:'German',pt:'Portuguese','pt-BR':'Portuguese (Brazil)',nl:'Dutch',pl:'Polish',ru:'Russian',uk:'Ukrainian',sv:'Swedish',da:'Danish',no:'Norwegian',fi:'Finnish',cs:'Czech',sk:'Slovak',hu:'Hungarian',ro:'Romanian',el:'Greek',tr:'Turkish',ar:'Arabic',he:'Hebrew',hi:'Hindi',bn:'Bengali',ur:'Urdu',zh:'Chinese','zh-CN':'Chinese (Simplified)','zh-TW':'Chinese (Traditional)',ja:'Japanese',ko:'Korean',id:'Indonesian',ms:'Malay',th:'Thai',vi:'Vietnamese',tl:'Filipino',sw:'Swahili',af:'Afrikaans',fa:'Persian',ta:'Tamil',te:'Telugu',mr:'Marathi'};
for(const [code,label] of Object.entries(languages)){const option=document.createElement('option');option.value=code;option.textContent=label+' ('+code+')';languageInput.appendChild(option);}
const customOption=document.createElement('option');customOption.value='custom';customOption.textContent='Other / custom code…';languageInput.appendChild(customOption);
function showCustom(){const custom=languageInput.value==='custom';customLanguage.hidden=!custom;document.getElementById('custom-label').hidden=!custom;}
function selectedLanguage(){return languageInput.value==='custom'?customLanguage.value.trim():languageInput.value;}
let autoTimer,ready=false;
function onPreviewChange(){
 clearTimeout(autoTimer);
 if(!ready || !autoRefresh.checked)return;
 autoTimer=setTimeout(()=>apply(dateInput.value),350);
}
const buttons=[document.getElementById('apply'),document.getElementById('clear')];
let currentTab,holidayPreviewYear,holidayScanId=0;
const holidaySelect=document.getElementById('holiday');
connectRangePicker(holidaySelect,dateInput,onPreviewChange);
connectRangeNavigation(holidaySelect,document.getElementById('holiday-prev'),document.getElementById('holiday-next'),dateInput);
(async()=>{
  try{
    const targetId=new URLSearchParams(window.location.search).get('targetTab');
    if(targetId && /^\d+$/.test(targetId))currentTab=await chrome.tabs.get(Number(targetId));
    else [currentTab]=await chrome.tabs.query({active:true,currentWindow:true});
    document.getElementById('detach').hidden=!!targetId;
    if(!currentTab?.url)throw new Error('Open a supported preview tab first.');
    const saved=await chrome.storage.local.get(['previewDate','autoRefresh']);
    const url=new URL(currentTab.url), first=[...url.searchParams].find(([k])=>/^h(?:[1-9]\d*)?$/.test(k));
    const iterationParams=new URLSearchParams(first?.[1].split('?')[1]?.split('#')[0]||'');
    const existing=url.searchParams.has('date')?url.searchParams.getAll('date').at(-1):iterationParams.get('date');
    const existingLanguage=(url.searchParams.has('language')?url.searchParams.getAll('language').at(-1):iterationParams.get('language'))||'';
    languageInput.value=existingLanguage && !languages[existingLanguage]?'custom':existingLanguage;
    customLanguage.value=languageInput.value==='custom'?existingLanguage:'';showCustom();
    autoRefresh.checked=!!saved.autoRefresh;buttons[0].hidden=autoRefresh.checked;
    const today=new Date();
    dateInput.value=validDate(existing||'')?existing:(saved.previewDate||[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-'));
    statusEl.textContent=updatePreviewUrl(currentTab.url,'').label+' detected.';
    ready=true;
    window.dispatchEvent(new Event('preview-target-ready'));
    await scanHolidays();
  }catch(error){statusEl.textContent=error.message;buttons.forEach(b=>b.disabled=true);}
})();
async function apply(date){
 buttons.forEach(b=>b.disabled=true);
 try{
  if(date!=='' && !validDate(date))throw new Error('Choose a valid date.');
  const latest=await chrome.tabs.get(currentTab.id);
  const result=updatePreviewUrl(latest.url,date,selectedLanguage());
  if(date)await chrome.storage.local.set({previewDate:date});
  if(result.url!==latest.url)await chrome.tabs.update(currentTab.id,{url:result.url});
  statusEl.textContent=(date?'Applied '+date+' to ':'Removed date override from ')+result.label+'.';
 }catch(error){statusEl.textContent=error.message;}finally{buttons.forEach(b=>b.disabled=false);}
}
buttons[0].addEventListener('click',()=>{if(!dateInput.value){statusEl.textContent='Choose a date first.';return;}apply(dateInput.value);});
buttons[1].addEventListener('click',()=>{clearTimeout(autoTimer);dateInput.value='';apply('');});
dateInput.addEventListener('change',onPreviewChange);
dateInput.addEventListener('change',()=>{if(validDate(dateInput.value)&&Number(dateInput.value.slice(0,4))!==holidayPreviewYear)scanHolidays();});
languageInput.addEventListener('change',()=>{showCustom();if(languageInput.value!=='custom')onPreviewChange();});
customLanguage.addEventListener('change',onPreviewChange);
autoRefresh.addEventListener('change',async()=>{
 clearTimeout(autoTimer);buttons[0].hidden=autoRefresh.checked;
 await chrome.storage.local.set({autoRefresh:autoRefresh.checked});
});
async function scanHolidays(){
 const scanId=++holidayScanId;
 const refreshButton=document.getElementById('inspect');refreshButton.disabled=true;refreshButton.textContent='Detecting holidays…';
 try{
  const ranges=[],readErrors=[];
  const year=validDate(dateInput.value)?Number(dateInput.value.slice(0,4)):new Date().getFullYear();holidayPreviewYear=year;
  const latest=await chrome.tabs.get(currentTab.id);currentTab=latest;
  const originalUrl=new URL(currentTab.url);
  if(originalUrl.protocol==='file:'||['localhost','127.0.0.1','[::1]'].includes(originalUrl.hostname)||originalUrl.hostname.endsWith('.localhost')){
    try{
      if(originalUrl.protocol==='file:'){originalUrl.search='';originalUrl.hash='';}
      const response=await fetch(originalUrl.href,{cache:'no-store',signal:AbortSignal.timeout(12000)});
      if(!response.ok&&response.status!==0)throw new Error('Could not read source HTML: '+response.status);
      ranges.push(...inspectCreativeHtml(await response.text(),0,year).ranges);
    }catch(error){readErrors.push(error.message);}
  }
  try{
    const frames=await chrome.scripting.executeScript({target:{tabId:currentTab.id,allFrames:true},func:()=>({url:location.href,html:document.documentElement.outerHTML})});
    ranges.push(...frames.flatMap(f=>inspectCreativeHtml(f.result?.html||'',0,year).ranges));
  }catch(error){readErrors.push(error.message);}
  if(!ranges.length&&readErrors.length===2)throw new Error(readErrors.join(' '));
  // AppLovin keeps other iterations unloaded: inspect their same-origin HTML too.
  const tabUrl=new URL(currentTab.url);
  if(tabUrl.hostname==='playable.applovindemo.com'){
    const refs=[...tabUrl.searchParams].filter(([key])=>/^h(?:[1-9]\d*)?$/.test(key));
    await Promise.all(refs.map(async([key,ref])=>{
      try{const url=new URL(ref,'https://playable.applovindemo.com/phaser/');if(url.origin!==tabUrl.origin)return;
        const response=await fetch(url.href,{signal:AbortSignal.timeout(12000)});if(!response.ok)return;
        ranges.push(...inspectCreativeHtml(await response.text(),0,year).ranges.map(r=>({...r,source:key})));
      }catch(_){}
    }));
  }
  if(scanId!==holidayScanId)return;
  populateRangeDropdown(holidaySelect,ranges.sort((a,b)=>a.start.localeCompare(b.start)));
 }catch(error){if(scanId!==holidayScanId)return;populateRangeDropdown(holidaySelect,[]);statusEl.textContent='Could not detect holidays: '+error.message+' For local files, enable Allow access to file URLs in extension settings.';}
 finally{if(scanId===holidayScanId){refreshButton.disabled=false;refreshButton.textContent='Refresh detected holidays';}}
}
document.getElementById('inspect').addEventListener('click',scanHolidays);
document.getElementById('detach').addEventListener('click',async()=>{
 try{
  if(!currentTab)throw new Error('Open a preview tab first.');
  await chrome.windows.create({url:chrome.runtime.getURL('popup.html')+'?targetTab='+currentTab.id,type:'popup',width:430,height:900});
  window.close();
 }catch(error){statusEl.textContent=error.message;}
});
