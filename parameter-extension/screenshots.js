function screenshotGeometry(imageWidth,imageHeight,viewport,rect,size) {
  const sx=imageWidth/viewport.width,sy=imageHeight/viewport.height;
  if(rect.x<0 || rect.y<0 || rect.x+rect.width>viewport.width+1 || rect.y+rect.height>viewport.height+1)throw new Error('The preview is partly off screen. Fit it inside the browser window before capturing.');
  const crop={x:Math.max(0,Math.round(rect.x*sx)),y:Math.max(0,Math.round(rect.y*sy)),width:Math.round(rect.width*sx),height:Math.round(rect.height*sy)};
  if(crop.width<1 || crop.height<1)throw new Error('Preview has no visible size.');
  const width=size?.width||crop.width,height=size?.height||crop.height;
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>8192||height>8192)throw new Error('Output dimensions must be between 1 and 8192 pixels.');
  const scale=Math.min(width/crop.width,height/crop.height),w=crop.width*scale,h=crop.height*scale;
  return {crop,width,height,dest:{x:(width-w)/2,y:(height-h)/2,width:w,height:h}};
}
if(typeof module!=='undefined')module.exports={screenshotGeometry};
if(typeof document!=='undefined'){
 const sizeSelect=document.getElementById('shot-size');
 sizeSelect.addEventListener('change',()=>{document.getElementById('shot-custom').hidden=sizeSelect.value!=='custom';});
 document.getElementById('capture').addEventListener('click',async()=>{
  const button=document.getElementById('capture'),output=document.getElementById('shot-status');button.disabled=true;
  try{
   if(!currentTab)throw new Error('Open a preview tab first.');
   const tab=await chrome.tabs.get(currentTab.id);
   if(!tab.active)throw new Error('Select the linked preview tab in its browser window before capturing.');
   if(tab.status==='loading')throw new Error('Wait for the preview to finish loading.');
   const mode='viewport';
   const [measurement]=await chrome.scripting.executeScript({target:{tabId:tab.id},args:[mode],func:mode=>{
    const viewport={width:window.innerWidth,height:window.innerHeight};
    if(mode==='viewport')return {viewport,rect:{x:0,y:0,...viewport},label:'viewport'};
    const candidates=[...document.querySelectorAll('#window, #video-container, .pa-endscene-iframe, video, canvas, iframe')];
    const visible=candidates.map(el=>({el,rect:el.getBoundingClientRect(),style:getComputedStyle(el)})).filter(({rect,style})=>rect.width>20&&rect.height>20&&style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0);
    const preferred=visible.find(({el})=>el.id==='window')||visible.find(({el})=>el.id==='video-container')||visible.sort((a,b)=>b.rect.width*b.rect.height-a.rect.width*a.rect.height)[0];
    if(!preferred)throw new Error('No visible creative frame, video, or canvas found. Select Full visible page instead.');
    const r=preferred.rect;return {viewport,rect:{x:r.x,y:r.y,width:r.width,height:r.height},label:'creative'};
   }});
   const data=await chrome.tabs.captureVisibleTab(tab.windowId,{format:'png'});
   const image=new Image();image.src=data;await image.decode();
   let size;
   if(sizeSelect.value==='custom')size={width:Number(document.getElementById('shot-width').value),height:Number(document.getElementById('shot-height').value)};
   else if(sizeSelect.value!=='original'){const [width,height]=sizeSelect.value.split('x').map(Number);size={width,height};}
   const g=screenshotGeometry(image.naturalWidth,image.naturalHeight,measurement.result.viewport,measurement.result.rect,size);
   const canvas=document.createElement('canvas');canvas.width=g.width;canvas.height=g.height;
   const ctx=canvas.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,g.width,g.height);
   ctx.drawImage(image,g.crop.x,g.crop.y,g.crop.width,g.crop.height,g.dest.x,g.dest.y,g.dest.width,g.dest.height);
   const png=canvas.toDataURL('image/png');
   const preview=document.getElementById('shot-preview');preview.src=png;preview.hidden=false;
   const link=document.getElementById('shot-download');link.href=png;link.download='creative-'+(document.getElementById('date').value||'real-date')+'-'+g.width+'x'+g.height+'-'+Date.now()+'.png';link.hidden=false;
   output.textContent='Captured '+g.width+' × '+g.height+' px. Click Download PNG to save.';
  }catch(error){output.textContent=error.message+' If browser access was lost, reopen the extension from the preview tab. Local captures require Allow access to file URLs.';}finally{button.disabled=false;}
 });
}
