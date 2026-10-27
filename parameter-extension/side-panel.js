// A global panel survives clicks on the preview. Rebind when its browser tab changes.
(function(){
 if(!new URLSearchParams(window.location.search).has('panel'))return;
 let panelWindowId=null;
 chrome.windows.getCurrent().then(win=>{panelWindowId=win.id;}).catch(()=>{});
 chrome.tabs.onActivated.addListener(info=>{
  if(info.windowId===panelWindowId&&info.tabId!==currentTab?.id)window.location.reload();
 });
 chrome.tabs.onUpdated.addListener((tabId,change)=>{
  if(tabId!==currentTab?.id||!change.url)return;
  try{
   const before=new URL(currentTab.url),after=new URL(change.url);
   if(before.origin!==after.origin||before.pathname!==after.pathname)window.location.reload();
  }catch(_){}
 });
})();
