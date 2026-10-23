function inspectCreativeHtml(html) {
  const ranges=[],seen=new Set();
  // Read literal data only; never evaluate uploaded JavaScript.
  // Image-based promos store large base64 assets in the same object as dates.
  // Strip only data-URL payloads from the inspection copy; keep the source intact.
  const inspectionSource=html.replace(/data:[\w.+/-]+(?:;[\w=.+-]+)*;base64,[A-Za-z0-9+/=\r\n]+/g,'data:asset;base64,');
  for(const match of inspectionSource.matchAll(/\{[^{}]*\}/g)){
    const item=match[0],get=key=>{const m=item.match(new RegExp('["\']?'+key+'["\']?\\s*:\\s*(["\'])(.*?)\\1'));return m?.[2];};
    const start=get('startDate')||get('start'),end=get('endDate')||get('end');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(start||'')||!/^\d{4}-\d{2}-\d{2}$/.test(end||''))continue;
    const label=get('text')||get('name')||get('promo')||get('label')||get('id')||'Holiday';
    const key=[start,end,label].join('|');if(!seen.has(key)){seen.add(key);ranges.push({start,end,label});}
  }
  // Positional schedule rows: [start ISO date, end ISO date, promo label].
  // Match literal values only; never evaluate a creative's JavaScript.
  for(const match of inspectionSource.matchAll(/\[\s*(["'])(\d{4}-\d{2}-\d{2})\1\s*,\s*(["'])(\d{4}-\d{2}-\d{2})\3\s*,\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')\s*,?\s*\]/g)){
    const start=match[2],end=match[4];
    const valid=value=>{const date=new Date(value+'T12:00:00Z');return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;};
    if(!valid(start)||!valid(end)||start>end)continue;
    let label;try{label=match[5][0]==='"'?JSON.parse(match[5]):match[5].slice(1,-1).replace(/\\(?:u[0-9a-f]{4}|x[0-9a-f]{2}|[\\'"nrtbfv])/gi,escape=>{
      const value=escape.slice(1);return value[0]==='u'||value[0]==='x'?String.fromCharCode(parseInt(value.slice(1),16)):({'n':'\n','r':'\r','t':'\t','b':'\b','f':'\f','v':'\v'}[value]??value);
    });}catch(_){continue;}
    const key=[start,end,label].join('|');if(!seen.has(key)){seen.add(key);ranges.push({start,end,label});}
  }
  ranges.sort((a,b)=>a.start.localeCompare(b.start));
  ranges.push(...inspectCalendarBranches(inspectionSource));
  ranges.sort((a,b)=>a.start.localeCompare(b.start));
  const overlaps=[];
  for(let i=0;i<ranges.length;i++)for(let j=i+1;j<ranges.length;j++){
    const a=ranges[i],b=ranges[j];
    if(a.start===b.start && a.end===b.end)continue;
    if(a.start<=b.end && b.start<=a.end)overlaps.push(a.start+' → '+a.end+' overlaps '+b.start+' → '+b.end);
  }
  const dateSupport=/\.get\(\s*["']date["']\s*\)|sip-preview-date-override-v1|creative-mip-date-override-v1/.test(html);
  const languageSupport=/\.get\(\s*["']language["']\s*\)/.test(html);
  return {ranges,overlaps,dateSupport,languageSupport,message:[
    'Date parameter: '+(dateSupport?'reader detected':'no reader detected in inspected HTML'),
    'Language parameter (?language=en): '+(languageSupport?'reader detected; translations require runtime verification':'no reader detected; adding the parameter will not translate this creative'),
    'Holiday ranges detected: '+ranges.length,
    ...ranges.map(r=>r.start+' → '+r.end+' | '+r.label),
    ...overlaps.map(text=>'Warning: '+text+'. Creative-specific precedence determines the displayed promo.'),
    'Static inspection only. Compressed, encoded, externally loaded, or computed content may not be visible.'
  ].join('\n')};
}
if(typeof module!=='undefined')module.exports={inspectCreativeHtml};

function inspectCalendarBranches(source){
 const ranges=[];
 // A constrained static parser: never execute uploaded expressions or functions.
 for(const match of source.matchAll(/function\s+[\w$]+\([^)]*\)\{[^{}]{0,5000}\}/g)){
  const fn=match[0];if(!fn.includes('getMonth()')||!fn.includes('getDate()'))continue;
  const year=fn.match(/getFullYear\(\)\s*!==\s*(\d{4})/);
  const month=fn.match(/([\w$]+)\s*=\s*[\w$]+\.getMonth\(\)\s*\+\s*1/);
  const day=fn.match(/([\w$]+)\s*=\s*[\w$]+\.getDate\(\)/);
  const iso=fn.match(/(?:const|let|var)\s+([\w$]+)\s*=\s*\[[\s\S]*?\.join\(["']-["']\)/);
  for(const branch of fn.slice(fn.lastIndexOf('return')+6).matchAll(/([^?:]+)\?\s*(\[[^\]]+\])/g)){
   let labels;try{labels=JSON.parse(branch[2]);}catch(_){continue;}
   if(!Array.isArray(labels)||labels.some(x=>typeof x!=='string'))continue;
   let rest=branch[1];const tests=[];
   for(const test of branch[1].matchAll(/([\w$]+)\s*(===|>=|<=|>|<)\s*(?:["'](\d{4}-\d{2}-\d{2})["']|(\d+))/g)){
    const [,variable,op,date,num]=test;
    const field=date&&variable===iso?.[1]?'iso':!date&&variable===month?.[1]?'month':!date&&variable===day?.[1]?'day':null;
    if(!field)break;
    tests.push({field,op,value:date||Number(num)});rest=rest.replace(test[0],'');
   }
   if(!tests.length||rest.replace(/\s|&&/g,''))continue;
   const years=new Set(tests.filter(t=>t.field==='iso').map(t=>Number(t.value.slice(0,4))));if(year)years.add(Number(year[1]));
   const hits=[];
   for(const y of years){if(y<1900||y>2200)continue;
    for(let d=new Date(y,0,1,12);d.getFullYear()===y;d.setDate(d.getDate()+1)){
     const key=[y,String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
     if(tests.every(t=>{const a=t.field==='iso'?key:t.field==='month'?d.getMonth()+1:d.getDate(),b=t.value;return t.op==='==='?a===b:t.op==='>='?a>=b:t.op==='<='?a<=b:t.op==='>'?a>b:a<b;}))hits.push(key);
    }
   }
   if(hits.length)ranges.push({start:hits[0],end:hits.at(-1),label:labels.join(' + '),computed:true});
  }
 }
 return ranges;
}
