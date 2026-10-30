function inspectCreativeHtml(html,depth=0,previewYear=new Date().getFullYear()) {
  if(!Number.isInteger(previewYear)||previewYear<1900||previewYear>9998)previewYear=new Date().getFullYear();
  const ranges=[],seen=new Set();
  // Read literal data only; never evaluate uploaded JavaScript.
  // Image-based promos store large base64 assets in the same object as dates.
  // Strip only data-URL payloads from the inspection copy; keep the source intact.
  const inspectionSource=html.replace(/data:[\w.+/-]+(?:;[\w=.+-]+)*;base64,[A-Za-z0-9+/=\r\n]+/g,'data:asset;base64,');
  for(const match of inspectionSource.matchAll(/\{[^{}]*\}/g)){
    const item=match[0],get=key=>{const m=item.match(new RegExp('["\']?'+key+'["\']?\\s*:\\s*(["\'])(.*?)\\1'));return m?.[2];};
    const start=get('startDate')||get('start'),end=get('endDate')||get('end');
    const label=get('text')||get('name')||get('promo')||get('label')||get('id')||'Holiday';
    const recurring=/^\d{2}-\d{2}$/.test(start||'')&&/^\d{2}-\d{2}$/.test(end||'');
    if(!recurring&&(!/^\d{4}-\d{2}-\d{2}$/.test(start||'')||!/^\d{4}-\d{2}-\d{2}$/.test(end||'')))continue;
    for(const year of recurring?[previewYear,previewYear+1]:[null]){
     const first=recurring?year+'-'+start:start,last=recurring?year+'-'+end:end;
     const valid=s=>{const d=new Date(s+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===s;};
     // Do not invent a New Year wrap: these creatives compare bounds directly.
     if(!valid(first)||!valid(last)||first>last)continue;
     const key=[first,last,label].join('|');if(!seen.has(key)){seen.add(key);ranges.push({start:first,end:last,label,...(recurring?{recurring:true}:{})});}
    }
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
  for(const range of inspectBannerCalendars(inspectionSource)){
    const key=[range.start,range.end,range.label].join('|');
    if(!seen.has(key)){seen.add(key);ranges.push(range);}
  }
  // Date keys calculated as YYYYMMDD (including calendars inside end cards).
  if(/getFullYear\(\)/.test(inspectionSource)&&/getMonth\(\)/.test(inspectionSource)&&/getDate\(\)/.test(inspectionSource)){
   for(const m of inspectionSource.matchAll(/\b([\w$]+)\s*>=\s*(\d{8})\s*&&\s*\1\s*<=\s*(\d{8})/g)){
    const iso=s=>s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6),start=iso(m[2]),end=iso(m[3]);
    const valid=s=>{const d=new Date(s+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===s;};
    if(valid(start)&&valid(end)&&start<=end)ranges.push({start,end,label:'Calendar promo'});
   }
  }
  if(depth<2){
   const analyzer=typeof CreativeSource!=='undefined'?CreativeSource:typeof require==='function'?require('./creative-source'):null;
   if(analyzer){
    const analysis=analyzer.analyze(html);
    ranges.push(...inspectNestedAnnualCalendar(analysis,previewYear));
    for(const node of analysis.nodes){
     const text=node.type==='Literal'&&typeof node.value==='string'?node.value:node.type==='TemplateLiteral'&&!node.expressions.length?node.quasis[0].value.cooked:null;
     if(text&&/^Year,Start Date,End Date,Promo(?:,|\r?$)/m.test(text))ranges.push(...inspectCsvCalendar(text));
    }
    let budget=16000000;for(const doc of analysis.documents){if(doc===html||doc.length>budget)continue;budget-=doc.length;ranges.push(...inspectCreativeHtml(doc,depth+1,previewYear).ranges);}
   }
  }
  // Direct annual month/day windows. JavaScript getMonth() is zero-based.
  for(const m of inspectionSource.matchAll(/\b([\w$]+)\.getMonth\(\)\s*===\s*(\d{1,2})\s*&&\s*\1\.getDate\(\)\s*>=\s*(\d{1,2})\s*&&\s*\1\.getDate\(\)\s*<=\s*(\d{1,2})/g)){
   const month=Number(m[2])+1,start=Number(m[3]),end=Number(m[4]);if(month<1||month>12||start<1||start>end)continue;
   for(const year of [previewYear,previewYear+1]){
    const iso=day=>year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
    const last=new Date(Date.UTC(year,month,0)).getUTCDate();if(end<=last)ranges.push({start:iso(start),end:iso(end),label:'Annual promo',recurring:true});
   }
  }
  const unique=new Map();for(const r of ranges)unique.set(r.start+'|'+r.end,r);ranges.splice(0,ranges.length,...unique.values());
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

function inspectCsvCalendar(text){
 const rows=[];let fields=[],field='',quoted=false;
 for(let i=0;i<=text.length;i++){
  const ch=text[i]??'\n';
  if(ch==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
  else if(!quoted&&(ch===','||ch==='\n')){fields.push(field.replace(/\r$/,''));field='';if(ch==='\n'){rows.push(fields);fields=[];}}
  else field+=ch;
 }
 if(quoted||rows[0]?.slice(0,4).join(',')!=='Year,Start Date,End Date,Promo')return [];
 const valid=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false;const d=new Date(s+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===s;};
 return rows.slice(1).filter(([year,start,end,label])=>valid(start)&&valid(end)&&start<=end&&start.slice(0,4)===year&&end.slice(0,4)===year&&label).map(([,start,end,label])=>({start,end,label}));
}

function inspectBannerCalendars(source){
 const ranges=[];
 const valid=value=>{const date=new Date(value+'T12:00:00Z');return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;};
 const add=(start,end,label)=>{if(valid(start)&&valid(end)&&start<=end)ranges.push({start,end,label});};
 // Literal ISO schedule rows whose third column is an artwork ID, not copy.
 for(const row of source.matchAll(/\[\s*(["'`])(\d{4}-\d{2}-\d{2})\1\s*,\s*(["'`])(\d{4}-\d{2}-\d{2})\3\s*,\s*(\d+)\s*,?\s*\]/g)){
  add(row[2],row[4],'Banner '+row[5]);
 }
 // Bundled calendars: {2026:[[1026,1031,`art-key`,`Offer`],...]}.
 // Require the complete year value to consist of literal four-column rows.
 // No eval, function calls, interpolated templates, or computed expressions.
 const literal='(?:"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'|`(?:\\\\.|[^`\\\\])*`)';
 const rowPattern='\\[\\s*(\\d{3,4})\\s*,\\s*(\\d{3,4})\\s*,\\s*('+literal+')\\s*,\\s*('+literal+')\\s*,?\\s*\\]';
 const tables=new RegExp('(?:[,{])\\s*["\'`]?(\\d{4})["\'`]?\\s*:\\s*\\[\\s*((?:'+rowPattern+'\\s*,?\\s*)+)\\]','g');
 for(const table of source.matchAll(tables)){
  const year=Number(table[1]);if(year<1900||year>2200)continue;
  for(const row of table[2].matchAll(new RegExp(rowPattern,'g'))){
   if(row[3].includes('${')||row[4].includes('${'))continue;
   const iso=n=>year+'-'+String(Math.floor(Number(n)/100)).padStart(2,'0')+'-'+String(Number(n)%100).padStart(2,'0');
   const label=row[4].slice(1,-1).replace(/\\([\\'"`])/g,'$1');
   add(iso(row[1]),iso(row[2]),label);
  }
 }
 return ranges;
}

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

// Recognize literal month/day branches without running creative code.
function inspectNestedAnnualCalendar(analysis,previewYear){
 const ranges=[];
 for(const fn of analysis.nodes){
  if(!['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(fn.type)||fn.body?.type!=='BlockStatement')continue;
  const fields=new Map();let receiver=null,invalid=false;
  for(const statement of fn.body.body){
   if(statement.type!=='VariableDeclaration')continue;
   for(const declaration of statement.declarations){
    const call=declaration.init,member=call?.callee;
    if(declaration.id.type!=='Identifier'||call?.type!=='CallExpression'||call.arguments.length||member?.type!=='MemberExpression'||member.computed||member.object.type!=='Identifier')continue;
    const field=member.property.name==='getMonth'?'month':member.property.name==='getDate'?'day':null;
    if(!field)continue;
    if(receiver&&receiver!==member.object.name)invalid=true;
    receiver=member.object.name;fields.set(declaration.id.name,field);
   }
  }
  if(invalid||!Array.from(fields.values()).includes('month')||!Array.from(fields.values()).includes('day'))continue;
  const condition=node=>{
   if(node.type==='LogicalExpression'&&node.operator==='&&'){const a=condition(node.left),b=condition(node.right);return a&&b?value=>a(value)&&b(value):null;}
   if(node.type!=='BinaryExpression'||!['===','==','>=','<=','>','<'].includes(node.operator)||node.left.type!=='Identifier'||!fields.has(node.left.name)||node.right.type!=='Literal'||!Number.isInteger(node.right.value))return null;
   const field=fields.get(node.left.name),b=node.right.value,op=node.operator;
   return value=>{const a=value[field];return op==='==='||op==='=='?a===b:op==='>='?a>=b:op==='<='?a<=b:op==='>'?a>b:a<b;};
  };
  const branches=[];
  function visit(statements,tests=[]){
   for(const statement of statements){
    if(statement.type==='VariableDeclaration'){if(tests.length)invalid=true;continue;}
    if(statement.type==='ReturnStatement'){
     const result=statement.argument;
     if(result?.type==='Identifier'||result?.type==='Literal'&&typeof result.value==='string')branches.push({tests,label:result.name||result.value});
     else if(result?.type!=='Literal'||result.value!==null)invalid=true;
     return;
    }
    if(statement.type!=='IfStatement'){invalid=true;continue;}
    const test=condition(statement.test);if(!test){invalid=true;continue;}
    const list=node=>node.type==='BlockStatement'?node.body:[node];
    visit(list(statement.consequent),[...tests,test]);
    if(statement.alternate)visit(list(statement.alternate),[...tests,value=>!test(value)]);
   }
  }
  visit(fn.body.body);if(invalid||!branches.length)continue;
  for(const year of [previewYear,previewYear+1]){
   let active=null;
   for(let date=new Date(Date.UTC(year,0,1));date.getUTCFullYear()===year;date.setUTCDate(date.getUTCDate()+1)){
    const value={month:date.getUTCMonth(),day:date.getUTCDate()},branch=branches.find(b=>b.tests.every(test=>test(value))),iso=date.toISOString().slice(0,10);
    if(branch&&branch.tests.length){
     if(active?.branch===branch)active.range.end=iso;
     else{const range={start:iso,end:iso,label:'Annual promo',recurring:true};ranges.push(range);active={branch,range};}
    }else active=null;
   }
  }
 }
 return ranges;
}
