function validDate(value) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const [y,m,d]=value.split('-').map(Number),date=new Date(0);
  date.setFullYear(y,m-1,d);date.setHours(12,0,0,0);
  return date.getFullYear()===y && date.getMonth()===m-1 && date.getDate()===d;
}
function updateCreativeReference(reference,date,language) {
  const hashAt=reference.indexOf('#'),hash=hashAt<0?'':reference.slice(hashAt);
  const body=hashAt<0?reference:reference.slice(0,hashAt),queryAt=body.indexOf('?');
  const path=queryAt<0?body:body.slice(0,queryAt);
  const query=new URLSearchParams(queryAt<0?'':body.slice(queryAt+1));
  query.delete('date');if(date)query.set('date',date);
  if(language!==undefined){query.delete('language');if(language)query.set('language',language);}
  return path+(query.size?'?'+query.toString():'')+hash;
}
function updatePreviewUrl(input,date,language) {
  if(date && !validDate(date))throw new Error('Choose a valid date.');
  if(language && !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(language))throw new Error('Use a language code such as en or en-US.');
  const url=new URL(input);
  const isAppLovin=url.hostname==='playable.applovindemo.com' && /^\/Preview(?:\/|$)/i.test(url.pathname);
  if(isAppLovin){
    const entries=[...url.searchParams.entries()];let count=0;
    const query=new URLSearchParams();
    for(const [key,value] of entries){
      if(/^h(?:[1-9]\d*)?$/.test(key) && value){query.append(key,updateCreativeReference(value,date,language));count++;}
      else query.append(key,value);
    }
    if(!count)throw new Error('No HTML iteration entries found in this AppLovin URL.');
    url.search=query.toString();
    return {url:url.href,count,label:count+' AppLovin iteration'+(count===1?'':'s')};
  }
  const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname)||url.hostname.endsWith('.localhost');
  if(!['file:','http:','https:'].includes(url.protocol) || (!local && !/\.html?$/i.test(url.pathname))){
    throw new Error('Open an AppLovin Preview URL or a direct HTML preview file first.');
  }
  url.searchParams.delete('date');if(date)url.searchParams.set('date',date);
  if(language!==undefined){url.searchParams.delete('language');if(language)url.searchParams.set('language',language);}
  return {url:url.href,count:1,label:local?'Localhost preview':url.protocol==='file:'?'Local HTML file':'Direct HTML preview'};
}
if(typeof module!=='undefined')module.exports={validDate,updateCreativeReference,updatePreviewUrl};
