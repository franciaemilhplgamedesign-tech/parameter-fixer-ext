// Explicit, user-triggered fixes. Never execute creative JavaScript.
async function fixCreativePipeline(input,sourceUrl,options={},progress=()=>{}){
 const analyzer=typeof CreativeSource!=='undefined'?CreativeSource:require('./creative-source');
 const changes=[],unresolved=[];
 function edits(code,list){for(const edit of [...new Map(list.map(e=>[e.start+':'+e.end,e])).values()].sort((a,b)=>b.start-a.start))code=code.slice(0,edit.start)+edit.text+code.slice(edit.end);return code;}
 async function scripts(html,transform){
  let out='',at=0;for(const m of html.matchAll(/(<script\b[^>]*>)([\s\S]*?)(<\/script\s*>)/gi)){
   out+=html.slice(at,m.index);const type=m[1].match(/\btype=["']([^"']+)["']/i)?.[1];
   out+=/\bsrc\s*=/.test(m[1])||(type&&!/^(?:module|(?:text|application)\/(?:java|ecma)script)$/i.test(type))?m[0]:m[1]+await transform(m[2])+m[3];at=m.index+m[0].length;
  }return out+html.slice(at);
 }
 function rename(code,names=new Map(),reservedSource=code,documentWindowTarget=false){
  const a=analyzer.analyze('<script>'+code+'</script>');if(a.failures.length){unresolved.push('A script could not be parsed for click-name fixes.');return code;}
  const localWindowTarget=documentWindowTarget||a.nodes.some(n=>n.type==='AssignmentExpression'&&n.left.type==='MemberExpression'&&n.left.object.name==='window'&&a.property(n.left)==='clickTag');
  const list=[];
  function replacement(name){if(!names.has(name)){let candidate='ecCreative_'+name;while(reservedSource.includes(candidate))candidate+='_';names.set(name,candidate);}return names.get(name);}
  for(const n of a.nodes){const p=a.parents.get(n);let name=null;
   if(n.type==='Identifier'){
    if(['clickTag1','clickthrough','clickThrough','openClickThrough'].includes(n.name))name=n.name;
    if(n.name==='clickTag'&&(localWindowTarget||!(p?.type==='MemberExpression'&&p.object.name==='window'&&p.property===n&&!p.computed)))name=n.name;
   }else if(n.type==='Literal'&&typeof n.value==='string'&&((p?.type==='MemberExpression'&&p.property===n)||(p?.type==='Property'&&p.key===n))){
    if(['clickTag1','clickthrough','clickThrough','openClickThrough'].includes(n.value)||(localWindowTarget&&n.value==='clickTag'))name=n.value;
   }
   if(name)list.push({start:n.start,end:n.end,text:n.type==='Literal'?JSON.stringify(replacement(name)):replacement(name)});
  }
  if(list.length)changes.push('Renamed '+names.size+' reserved click name(s).');return edits(code,list);
 }
 function base64(value){const bytes=new TextEncoder().encode(value);let raw='';for(let i=0;i<bytes.length;i+=32768)raw+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(raw);}
 function decode(value){const raw=atob(value);return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(raw,c=>c.charCodeAt(0)));}
 async function inlineAssets(html,base,assetDepth=0){
  if(assetDepth>3){unresolved.push('Nested asset depth exceeded.');return html;}
  const refs=[];
  for(const m of html.matchAll(/<(img|audio|video|source|script|link)\b[^>]*?\b(src|poster|href)\s*=\s*(["'])([^"']+)\3[^>]*>/gi)){
   const value=m[4];if(/^(?:blob:|#)/i.test(value)||(/^data:/i.test(value)&&/;base64,/i.test(value))||/(?:^|\/)mraid(?:\.min)?\.js$/i.test(value))continue;
   if(m[1].toLowerCase()==='link'&&!/\brel=["']stylesheet["']/i.test(m[0]))continue;
   refs.push({value,tag:m[1].toLowerCase()});
  }
  for(const m of html.matchAll(/url\(\s*(["']?)([^\s)'"\n]+)\1\s*\)/gi))if(!/^(?:data:|blob:|#)/i.test(m[2])&&!m[2].includes('${'))refs.push({value:m[2],tag:'asset'});
  for(const ref of [...new Map(refs.map(r=>[r.value,r])).values()]){
   try{
    const url=new URL(ref.value,base);if(!['file:','http:','https:','data:'].includes(url.protocol))throw Error('unsupported URL');
    const response=await fetch(url.href,{signal:AbortSignal.timeout(20000)});if(!response.ok&&response.status!==0)throw Error('HTTP '+response.status);
    let blob=await response.blob();
    if(ref.tag==='link'||/\.css(?:$|[?#])/i.test(url.pathname)){const css=await blob.text();if(/@import/i.test(css))unresolved.push('CSS imports require manual bundling.');blob=new Blob([await inlineAssets(css,url.href,assetDepth+1)],{type:'text/css'});}
    let raw='';const bytes=new Uint8Array(await blob.arrayBuffer());for(let i=0;i<bytes.length;i+=32768)raw+=String.fromCharCode(...bytes.subarray(i,i+32768));
    const extension=url.pathname.split('.').pop().toLowerCase(),types={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',svg:'image/svg+xml',mp4:'video/mp4',mp3:'audio/mpeg',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',css:'text/css',js:'text/javascript'};
    const type=blob.type&&blob.type!=='application/octet-stream'?blob.type:types[extension]||blob.type||'application/octet-stream',data='data:'+type+';base64,'+btoa(raw);
    html=html.replace(/(<(?:img|audio|video|source|script|link)\b[^>]*?\b(?:src|poster|href)\s*=\s*)(["'])([^"']+)\2/gi,(match,prefix,quote,value)=>value===ref.value?prefix+quote+data+quote:match);
    html=html.replace(/url\(\s*(["']?)([^\s)'"\n]+)\1\s*\)/gi,(match,quote,value)=>value===ref.value?'url('+quote+data+quote+')':match);changes.push('Inlined '+ref.tag+' dependency.');
   }catch(error){unresolved.push('Could not inline '+ref.value.slice(0,100)+': '+error.message);}
  }
  return html;
 }
 async function prepare(html,depth=0){
  if(depth>2){unresolved.push('Nested document depth exceeded.');return html;}
  const reservedSource=html,names=new Map(),documentAnalysis=analyzer.analyze(html);
  const windowTarget=documentAnalysis.nodes.some(n=>n.type==='AssignmentExpression'&&n.left.type==='MemberExpression'&&n.left.object.name==='window'&&documentAnalysis.property(n.left)==='clickTag');
  html=await scripts(html,async code=>{
   code=rename(code,names,reservedSource,windowTarget);const a=analyzer.analyze('<script>'+code+'</script>'),list=[];
   for(const n of a.nodes){let value=n.type==='Literal'&&typeof n.value==='string'?n.value:n.type==='TemplateLiteral'&&!n.expressions.length?n.quasis[0].value.cooked:null;
    if(!value)continue;
    const data=value.match(/^(data:text\/html(?:;charset=[\w-]+)?;base64,)([A-Za-z0-9+/]+={0,2})$/i);
    const naked=!data&&value.length>100&&/^[A-Za-z0-9+/]+={0,2}$/.test(value);
    if(data||naked){
     let htmlPayload=false;
     try{const decoded=decode(data?data[2]:value);if(/^\s*(?:<!doctype\s+html|<html\b)/i.test(decoded)){htmlPayload=true;const fixed=await prepare(decoded,depth+1);if(fixed!==decoded){list.push({start:n.start,end:n.end,text:JSON.stringify((data?data[1]:'')+base64(fixed))});changes.push('Fixed a Base64-encoded HTML document.');}}}catch(error){if(htmlPayload)unresolved.push('Could not fix an encoded HTML document: '+error.message);}
     continue;
    }
    if(!/^\s*(?:<!doctype\s+html|<html\b)/i.test(value)){
     if(/url\(/i.test(value)){const fixed=await inlineAssets(value,sourceUrl);if(fixed!==value)list.push({start:n.start,end:n.end,text:JSON.stringify(fixed)});}
     continue;
    }
    if(value.includes('ecc-compressed-end-card')){
     const payload=value.match(/atob\("([A-Za-z0-9+/=]+)"\)/);
     if(payload)try{const bytes=Uint8Array.from(atob(payload[1]),c=>c.charCodeAt(0));const decoded=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();const fixed=await prepare(decoded,depth+1);if(fixed!==decoded){const packed=new Uint8Array(await new Response(new Blob([fixed]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());let raw='';for(let i=0;i<packed.length;i+=32768)raw+=String.fromCharCode(...packed.subarray(i,i+32768));list.push({start:n.start,end:n.end,text:JSON.stringify(value.replace(payload[1],btoa(raw)))});changes.push('Fixed a Base64-gzip end scene.');}}catch(error){unresolved.push('Could not process compressed end scene: '+error.message);}
     continue;
    }
    value=await prepare(value,depth+1);changes.push('Packaged an embedded HTML document as UTF-8 Base64.');
    list.push({start:n.start,end:n.end,text:'new TextDecoder().decode(Uint8Array.from(atob('+JSON.stringify(base64(value))+'),c=>c.charCodeAt(0)))'});
   }
   for(const n of a.nodes)if(n.type==='Property'&&['src','poster','lineImage','videoSrc','fontSrc'].includes(n.key.name??n.key.value)&&n.value.type==='Literal'&&typeof n.value.value==='string'&&n.value.value&&!/^(?:data:|blob:|#)/i.test(n.value.value)&&!n.value.value.includes('"')){
    const original='<img src="'+n.value.value+'">',fixed=await inlineAssets(original,sourceUrl),data=fixed.match(/src="(data:[^"]+)"/)?.[1];if(data)list.push({start:n.value.start,end:n.value.end,text:JSON.stringify(data)});
   }
   return edits(code,list);
  });
  // Inspect markup/CSS only here; JavaScript URLs must not be replaced by text.
  const held=[];html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,script=>{if(/^<script\b[^>]*\bsrc\s*=/i.test(script))return script;const key='<!--ec-held-script-'+held.length+'-->';held.push(script);return key;});
  html=html.replace(/\b(on[\w]+)\s*=\s*(["'])(.*?)\2/gi,(match,key,quote,code)=>{
   if(!/\b(?:clickTag|clickTag1|clickthrough|clickThrough|openClickThrough)\b/.test(code))return match;
   const decoded=code.replace(/&(?:quot|amp|lt|gt|#39);/g,s=>({'&quot;':'"','&amp;':'&','&lt;':'<','&gt;':'>','&#39;':"'"}[s]));
   const fixed=rename(decoded,names,reservedSource,windowTarget).replace(/&/g,'&amp;').replace(new RegExp(quote,'g'),quote==='"'?'&quot;':'&#39;');return key+'='+quote+fixed+quote;
  });
  html=await inlineAssets(html,sourceUrl);
  html=html.replace(/<!--ec-held-script-(\d+)-->/g,(_,index)=>held[Number(index)]);
  if(depth>0){const inner={origHTML:html,extCallViolations:[],nonB64B122Violations:[],blockingViolations:[]};runFix(inner);html=addRuntimeSafeguards(inner.fixedHTML,{network:!!options.network,webgl:options.webgl!==false}).html;}
  return html;
 }
 progress('Fixing reserved click names and packaging embedded documents…');
 let html=await prepare(input);
 const entry={origHTML:html,extCallViolations:[],nonB64B122Violations:[],blockingViolations:[]};
 progress('Applying MRAID fixes…');runFix(entry);html=entry.fixedHTML;
 html=addRuntimeSafeguards(html,{network:!!options.network,webgl:options.webgl!==false}).html;
 progress('Compressing the fixed HTML…');const compressed=await compressCreativeHtml(html,{images:!!options.images,quality:options.quality??.82,maxEdge:options.maxEdge||0},progress);html=compressed.html;
 const report=checkMraidHtml(html,sourceUrl,options.creativeType||'auto');
 return {html,report,changes:[...changes,...(entry.diffs||[])],unresolved,beforeBytes:new TextEncoder().encode(input).length,afterBytes:report.bytes};
}
if(typeof module!=='undefined')module.exports={fixCreativePipeline};
