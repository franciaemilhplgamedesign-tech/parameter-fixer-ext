// This observer checks only the current top-level local creative, never rewrites it.
(function(){
 let timer;
 function check(){clearTimeout(timer);timer=setTimeout(()=>chrome.runtime.sendMessage({type:'local-preview-viewed',url:location.href}).catch(()=>{}),500);}
 check();window.addEventListener('pageshow',check);window.addEventListener('popstate',check);
})();
