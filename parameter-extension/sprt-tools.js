// Read SPRT's literal attribute data; never evaluate the creative runtime.
var SprtTools=(()=>{
 const supported=html=>/<meta\b[^>]*name=["']sprt-build["']/i.test(html)&&html.includes('data-dyn-holiday-map')&&html.includes('window.HolidayLens');
 function entities(text){return text.replace(/&(#x[0-9a-f]+|#\d+|quot|apos|amp|lt|gt);/gi,(all,key)=>{if(key[0]==='#'){const n=key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):Number(key.slice(1));return n>0&&n<=1114111?String.fromCodePoint(n):all;}return ({quot:'"',apos:"'",amp:'&',lt:'<',gt:'>'})[key.toLowerCase()];});}
 function ranges(html,year){
  if(!supported(html))return [];
  const source=entities(html),result=[],seen=new Set(),iso=d=>d.toISOString().slice(0,10),day=(y,m,d)=>new Date(Date.UTC(y,m,d));
  const add=(s,e,label,recurring)=>{if(!s||!e||s>e||e.getUTCFullYear()<year||s.getUTCFullYear()>year)return;const start=iso(s),end=iso(e),key=start+'|'+end;if(!seen.has(key)){seen.add(key);result.push({start,end,label,recurring});}};
  const valid=(y,m,d)=>Number.isInteger(y)&&Number.isInteger(m)&&Number.isInteger(d)&&m>=0&&m<=11&&d>=1&&day(y,m,d).getUTCMonth()===m;
  for(const match of source.matchAll(/data-dyn-holiday-map\s*=\s*(["'])(.*?)\1/gi)){
   let map;try{map=JSON.parse(decodeURIComponent(entities(match[2])));}catch(_){continue;}
   if(!map||Array.isArray(map)||typeof map!=='object')continue;
   for(const [id,row] of Object.entries(map)){
    if(!row||typeof row!=='object'||typeof row.t!=='string'||!row.t.trim())continue;
    if(/^custom-/.test(id)){
     const y=row.sy??year;if(!valid(y,row.sm,row.sd))continue;const endYear=y+(row.em<row.sm||row.em===row.sm&&row.ed<row.sd?1:0);if(!valid(endYear,row.em,row.ed))continue;
     add(day(y,row.sm,row.sd),day(endYear,row.em,row.ed),row.label||row.t,row.sy==null);continue;
    }
    // These explicit per-map offsets are relative to the export's key dates.
    // Thanksgiving/Black Friday/Cyber Monday share Thanksgiving as their key.
    if(!Number.isInteger(row.from)||!Number.isInteger(row.to)||row.from>row.to||Math.abs(row.from)>366||Math.abs(row.to)>366)continue;
    for(const y of [year,year+1]){
     let key;if(id==='newyear')key=day(y,0,1);else if(id==='christmas')key=day(y,11,25);else if(['thanksgiving','blackfriday','cybermonday'].includes(id)){const first=day(y,10,1);key=day(y,10,1+(4-first.getUTCDay()+7)%7+21);}else continue;
     add(new Date(+key+row.from*86400000),new Date(+key+row.to*86400000),row.t,true);
    }
   }
  }
  return result;
 }
 function fixDate(html){
  if(!supported(html))return null;
  if(html.includes('sprt-date-preview-v1'))return {html,changed:false,message:'SPRT date preview already enabled.'};
  const clock=/var PAGE_LOAD = Date\.now\(\);/,now=/function nowMs\(\) \{ return NOW \|\| Date\.now\(\); \}/,tick=/NOW = Date\.now\(\);/;
  if(!clock.test(html)||!now.test(html)||!tick.test(html))throw Error('SPRT dynamic clock version is unsupported; no file was changed.');
  function install(){
   window.__sprtDatePreview='sprt-date-preview-v1';
   var realNow=Date.now,started=realNow(),preview=null,search=window.location.search;
   try{if(window.parent!==window)search=window.parent.location.search||search;}catch(_){}
   var value=typeof window.__ecPreviewParameter==='function'?window.__ecPreviewParameter('date'):new URLSearchParams(search).get('date');
   if(value&&/^\d{4}-\d{2}-\d{2}$/.test(value)){
    var p=value.split('-').map(Number),d=new Date(0);d.setFullYear(p[0],p[1]-1,p[2]);d.setHours(12,0,0,0);
    if(d.getFullYear()===p[0]&&d.getMonth()===p[1]-1&&d.getDate()===p[2])preview=d.getTime();
   }
   window.__sipPreviewNow=function(){return new Date(preview===null?realNow():preview+realNow()-started);};
  }
  const injection='('+install.toString()+')();\n';
  html=html.replace(clock,injection+'var PAGE_LOAD = window.__sipPreviewNow().getTime();').replace(now,'function nowMs() { return NOW || window.__sipPreviewNow().getTime(); }').replace(tick,'NOW = window.__sipPreviewNow().getTime();');
  return {html,changed:true,message:'Enabled ?date=YYYY-MM-DD for SPRT dynamic holiday, date and countdown text in all shared surfaces. Animation clocks and click handling are preserved.'};
 }
 return {supported,entities,ranges,fixDate};
})();
if(typeof module!=='undefined')module.exports=SprtTools;
