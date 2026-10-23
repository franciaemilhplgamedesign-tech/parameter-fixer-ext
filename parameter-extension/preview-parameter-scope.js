function patchPreviewUrlScope(html,{date=true,language=true}={}){
 const requested=[...(date?['date']:[]),...(language?['language']:[])];
 if(!requested.length)return {html,changed:false,message:'No parameter scope selected.'};
 const marker=/<script\b(?=[^>]*\bid=["']ec-preview-url-scope-v1["'])[^>]*>[\s\S]*?<\/script\s*>/i;
 const existing=html.match(marker)?.[0],prior=existing?.match(/data-parameters=["']([^"']*)["']/)?.[1].split(',')||[];
 const headMatch=html.match(/<head\b[^>]*>/i);
 if(existing&&requested.every(key=>prior.includes(key))&&headMatch&&html.slice(headMatch.index+headMatch[0].length).trimStart().startsWith(existing))return {html,changed:false,message:'Outer preview URL parameter inheritance already present.'};
 const keys=[...new Set([...prior,...requested])].filter(key=>['date','language'].includes(key));
 const installer=typeof installPreviewUrlScope==='function'?installPreviewUrlScope:typeof require==='function'?require('./preview-parameter-runtime').installPreviewUrlScope:null;
 if(!installer)throw new Error('Preview URL scope engine is unavailable.');
 const code='('+installer.toString()+')('+JSON.stringify(keys)+');';
 const script='<script id="ec-preview-url-scope-v1" data-parameters="'+keys.join(',')+'">'+code.replace(/<\/script/gi,'<\\/script')+'</script>';
 if(existing)html=html.replace(marker,'');
 if(!/<head\b[^>]*>/i.test(html))throw new Error('Missing HTML head.');
 return {html:html.replace(/<head\b[^>]*>/i,head=>head+'\n'+script),changed:true,message:'Added outer preview URL inheritance for '+keys.join(' and ')+'. Same-origin parent parameters override per-file values; cross-origin hosts must forward them.'};
}
if(typeof module!=='undefined')module.exports={patchPreviewUrlScope};
