function fixLanguageHtml(html){
 if(/id=["']ec-language-preview-v1["']/.test(html))return {html,changed:false,message:'Language locale helper already present.'};
 if(/\.get\(\s*["']language["']\s*\)/.test(html))return {html,changed:false,message:'Native language parameter preserved.'};
 if(/\bsrcDoc\s*:|window\.__eccFrameDocument|\.srcdoc\s*=/.test(html))return {html,changed:false,message:'Embedded document language patching is not supported by this formatter patch. Add native language handling inside each end card. Date support is handled separately.'};
 let count=0;
 let patched=html.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script\s*>)/gi,(whole,open,code,close)=>{
  if(/\bsrc\s*=|application\/json/i.test(open))return whole;
  code=code.replace(/((?:const|let|var)\s+dateLocale\s*=\s*)(["'][^"']+["'])/g,(_,prefix,locale)=>{count++;return prefix+'window.__ecPreviewLocale('+locale+')';});
  code=code.replace(/(new\s+Intl\.DateTimeFormat\(\s*|\.toLocaleDateString\(\s*)(["'][a-z]{2,3}(?:-[a-zA-Z0-9]+)*["'])/g,(_,prefix,locale)=>{count++;return prefix+'window.__ecPreviewLocale('+locale+')';});
  return open+code+close;
 });
 if(!count)return {html,changed:false,message:'No supported locale formatter or native language reader found. Translations cannot be invented automatically.'};
 const helper='<script id="ec-language-preview-v1">('+function(){
  let search=window.location.search;try{if(!search&&window.parent!==window)search=window.parent.location.search;}catch(_){}
  let raw=typeof window.__ecPreviewParameter==='function'?window.__ecPreviewParameter('language'):new URLSearchParams(search).get('language');
  try{if(typeof window.__ecPreviewParameter!=='function'&&window.parent!==window&&typeof window.parent.__ecPreviewParameter==='function')raw=window.parent.__ecPreviewParameter('language');}catch(_){}
  window.__ecPreviewLocale=function(fallback){
   if(!raw)return fallback;const locale=raw.toLowerCase()==='br'?'pt-BR':raw;
   try{if(!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(locale))return fallback;new Intl.DateTimeFormat(locale).format(new Date());return locale;}catch(_){return fallback;}
  };
  if(raw)document.documentElement.lang=window.__ecPreviewLocale(document.documentElement.lang||'en');
 }.toString()+')();</script>';
 if(!/<head\b[^>]*>/i.test(patched))throw new Error('Missing HTML head.');
 patched=patched.replace(/<head\b[^>]*>/i,head=>head+'\n'+helper);
 return {html:patched,changed:true,message:'Added ?language= locale support to '+count+' date formatter(s). Static marketing text is unchanged; multilingual text needs existing translations.'};
}
if(typeof module!=='undefined')module.exports={fixLanguageHtml};
