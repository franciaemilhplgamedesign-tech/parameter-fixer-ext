// Preview-only wall clock and locale overrides. Animation/performance clocks stay native.
function installPreviewOverrides(){
 const KEY='ecfixit-preview-override-v1';let config=null;
 try{
  const root=window.top;config=JSON.parse(root.sessionStorage.getItem(KEY)||'null');
  if(!config||config.scope!==root.location.origin+root.location.pathname||!config.enabled) return;
 }catch(_){return;}
 if(window.__ecPreviewOverrideInstalled)return;
 window.__ecPreviewOverrideInstalled=true;
 const NativeDate=window.Date,realNow=NativeDate.now.bind(NativeDate),started=realNow();let timestamp=null;
 if(typeof config.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(config.date)){
  const p=config.date.split('-').map(Number),date=new NativeDate(0);date.setFullYear(p[0],p[1]-1,p[2]);date.setHours(12,0,0,0);
  if(date.getFullYear()===p[0]&&date.getMonth()===p[1]-1&&date.getDate()===p[2])timestamp=date.getTime();
 }
 const now=()=>timestamp===null?realNow():timestamp+realNow()-started;
 if(timestamp!==null){
  window.Date=new Proxy(NativeDate,{
   construct(target,args,newTarget){return Reflect.construct(target,args.length?args:[now()],newTarget);},
   apply(){return new NativeDate(now()).toString();},
   get(target,key,receiver){return key==='now'?now:Reflect.get(target,key,receiver);}
  });
 }
 let locale=config.language==='br'?'pt-BR':config.language;
 try{if(locale){new Intl.DateTimeFormat(locale);}}catch(_){locale='';}
 if(locale){
  for(const [key,value] of [['language',locale],['languages',Object.freeze([locale])]])try{Object.defineProperty(window.navigator,key,{configurable:true,get:()=>value});}catch(_){}
  for(const key of ['DateTimeFormat','NumberFormat','Collator','PluralRules','RelativeTimeFormat','ListFormat','DisplayNames','Segmenter']){
   const Original=window.Intl[key];if(typeof Original!=='function')continue;
   window.Intl[key]=new Proxy(Original,{construct(target,args,newTarget){return Reflect.construct(target,[locale,...args.slice(1)],newTarget);},apply(target,receiver,args){return Reflect.apply(target,receiver,[locale,...args.slice(1)]);}});
  }
  for(const key of ['toLocaleString','toLocaleDateString','toLocaleTimeString']){
   const original=NativeDate.prototype[key];NativeDate.prototype[key]=function(_locales,options){return original.call(this,locale,options);};
  }
  const setLang=()=>{if(document.documentElement)document.documentElement.lang=locale;};setLang();document.addEventListener('DOMContentLoaded',setLang,{once:true});
 }
 const nativeReader=window.__ecPreviewParameter;
 window.__ecPreviewParameter=function(key){if(key==='date'&&timestamp!==null)return config.date;if(key==='language'&&locale)return config.language;return typeof nativeReader==='function'?nativeReader(key):new URLSearchParams(window.location.search).get(key);};
 window.__ecPreviewOverrideState={date:timestamp===null?'':config.date,language:locale||''};
}
if(typeof window!=='undefined')installPreviewOverrides();
if(typeof module!=='undefined')module.exports={installPreviewOverrides};
