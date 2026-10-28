function embeddedImageIsAnimated(bytes,type){
 const text=(start,length)=>String.fromCharCode(...bytes.subarray(start,start+length));
 if(type==='image/gif')return true;
 if(type==='image/webp')for(let at=12;at+8<=bytes.length;){const name=text(at,4),size=new DataView(bytes.buffer,bytes.byteOffset+at+4,4).getUint32(0,true);if(name==='ANIM'||name==='ANMF')return true;at+=8+size+(size%2);}
 if(type==='image/png')for(let at=8;at+12<=bytes.length;){const size=new DataView(bytes.buffer,bytes.byteOffset+at,4).getUint32(0,false);if(text(at+4,4)==='acTL')return true;at+=12+size;}
 return false;
}
async function optimizeEmbeddedImages(html,quality,maxEdge,progress=()=>{}){
 const urls=[...new Set([...html.matchAll(/data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}/gi)].map(m=>m[0]))];
 let optimized=0,skipped=0,saved=0;
 for(let index=0;index<urls.length;index++){
  const url=urls[index];progress('Optimizing embedded image '+(index+1)+' / '+urls.length+'…');
  try{
   const type=url.slice(5,url.indexOf(';')).toLowerCase(),raw=atob(url.slice(url.indexOf(',')+1)),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
   if(embeddedImageIsAnimated(bytes,type)){skipped++;continue;}
   const bitmap=await createImageBitmap(new Blob([bytes],{type}));
   const ratio=maxEdge?Math.min(1,maxEdge/Math.max(bitmap.width,bitmap.height)):1;
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
   canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
   const next=canvas.toDataURL('image/webp',quality);
   if(next.startsWith('data:image/webp;base64,')&&next.length<url.length){const occurrences=html.split(url).length-1;html=html.split(url).join(next);saved+=(url.length-next.length)*occurrences;optimized++;}else skipped++;
  }catch(_){skipped++;}
 }
 return {html,optimized,skipped,saved};
}
async function compressCreativeHtml(html,options={},progress=()=>{}){
 const beforeBytes=new TextEncoder().encode(html).length;let candidate=html,images={optimized:0,skipped:0,saved:0};
 if(options.images){images=await optimizeEmbeddedImages(candidate,options.quality??.82,options.maxEdge||0,progress);candidate=images.html;}
 progress('Minifying markup and inline JavaScript…');
 candidate=await HTMLMinifier.minify(candidate,{
  collapseWhitespace:false,removeComments:true,removeOptionalTags:false,removeAttributeQuotes:false,
  removeEmptyAttributes:false,minifyCSS:false,sortAttributes:false,sortClassName:false,
  minifyJS:{mangle:false,compress:false,format:{comments:'some'}}
 });
 const candidateBytes=new TextEncoder().encode(candidate).length;
 const output=candidateBytes<beforeBytes?candidate:html;
 return {html:output,beforeBytes,afterBytes:Math.min(candidateBytes,beforeBytes),savedBytes:Math.max(0,beforeBytes-candidateBytes),images};
}
if(typeof module!=='undefined')module.exports={compressCreativeHtml,embeddedImageIsAnimated};
if(typeof document!=='undefined'){
 document.getElementById('compress-images').addEventListener('change',event=>{document.getElementById('compress-image-options').hidden=!event.target.checked;});
}
