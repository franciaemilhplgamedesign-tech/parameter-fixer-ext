let viewerUrl,viewerTrigger;
function openReviewImage(blob,trigger){
 const dialog=document.getElementById('image-viewer');
 if(viewerUrl)URL.revokeObjectURL(viewerUrl);
 viewerUrl=URL.createObjectURL(blob);viewerTrigger=trigger;
 document.getElementById('viewer-image').src=viewerUrl;
 if(!dialog.open)dialog.showModal();
 document.getElementById('viewer-close').focus();
}
const imageViewer=document.getElementById('image-viewer');
document.getElementById('viewer-close').addEventListener('click',()=>imageViewer.close());
imageViewer.addEventListener('click',event=>{if(event.target===imageViewer)imageViewer.close();});
imageViewer.addEventListener('close',()=>{
 document.getElementById('viewer-image').removeAttribute('src');
 if(viewerUrl)URL.revokeObjectURL(viewerUrl);viewerUrl=null;
 if(viewerTrigger?.isConnected)viewerTrigger.focus();viewerTrigger=null;
});
