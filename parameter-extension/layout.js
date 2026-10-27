(function(){
 const detached=new URLSearchParams(window.location.search).has('targetTab')||window.location.pathname.endsWith('/send-runner.html');
 document.documentElement.dataset.view=new URLSearchParams(window.location.search).has('panel')?'panel':detached?'detached':'popup';
})();
