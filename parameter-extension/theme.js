(function(){
 const root=document.documentElement;
 function applyTheme(mode){
  root.dataset.theme=mode;
  const button=document.getElementById('theme-toggle');
  if(button){
   const label='Switch to '+(mode==='dark'?'light':'dark')+' mode';
   const shape=mode==='dark'?'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>':'<path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/>';
   button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+shape+'</svg>';
   button.setAttribute('aria-label',label);button.title=label;
  }
 }
 applyTheme(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
 async function initialize(){
  try{const saved=await chrome.storage.local.get('checkerTheme');if(['light','dark'].includes(saved.checkerTheme))applyTheme(saved.checkerTheme);}catch(_){}
  applyTheme(root.dataset.theme);
  document.getElementById('theme-toggle')?.addEventListener('click',async()=>{
   const mode=root.dataset.theme==='dark'?'light':'dark';applyTheme(mode);
   try{await chrome.storage.local.set({checkerTheme:mode});}catch(_){}
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize);else initialize();
 if(typeof chrome!=='undefined')chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&['light','dark'].includes(changes.checkerTheme?.newValue))applyTheme(changes.checkerTheme.newValue);});
})();
