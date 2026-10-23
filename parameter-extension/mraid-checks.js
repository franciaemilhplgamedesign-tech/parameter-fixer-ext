function isLocalCreativeUrl(input){
 try{const u=new URL(input);return u.protocol==='file:'?/\.html?$/i.test(u.pathname):['http:','https:'].includes(u.protocol)&&(['localhost','127.0.0.1','[::1]'].includes(u.hostname)||u.hostname.endsWith('.localhost'));}catch(_){return false;}
}
function creativeSizeProfile(html,sourceUrl='',mode='auto'){
 let type=mode==='mip'||mode==='sip'?mode:null,reason=type?'manual selection':'';
 let filename=sourceUrl;try{filename=decodeURIComponent(new URL(sourceUrl).pathname);}catch(_){}
 if(!type&&/(?:^|[_/.-])mip(?:[_/.-]|$)/i.test(filename)){type='mip';reason='filename';}
 if(!type&&/(?:^|[_/.-])sip(?:[_/.-]|$)/i.test(filename)){type='sip';reason='filename';}
 if(!type&&/title\s*:\s*["']End Scene["']|kind["']?\s*:\s*["'](?:endscene|game|scratch|spinwheel|quiz)["']|__eccFrameDocument\(\w+,/i.test(html)){type='mip';reason='interactive/end-scene structure';}
 return {type:type||'unknown',mode,reason:reason||'type not resolved; conservative SIP cap',limitBytes:type==='mip'?5000000:3400000,label:type==='mip'?'MIP · 5 MB':type==='sip'?'SIP · 3.4 MB':'Unknown type · conservative 3.4 MB'};
}
function checkMraidHtml(html,sourceUrl='',creativeType='auto'){
 const findings=[];
 function add(id,title,status,description,evidence=''){
  const index=evidence?html.indexOf(evidence):-1;
  findings.push({id,title,status,description,evidence:evidence.slice(0,220),line:index>=0?html.slice(0,index).split('\n').length:null});
 }
 const bytes=new TextEncoder().encode(html).length;
 const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
 const code=scripts.filter(m=>!(/\btype\s*=\s*["']application\/(?:json|ld\+json)["']/i.test(m[1]))).map(m=>m[2]).join('\n').replace(/data:[\w.+/-]+(?:;[\w=.+-]+)*;base64,[A-Za-z0-9+/=]+/g,'data:asset;base64,');
 const bridge=scripts.filter(m=>/\bsrc\s*=\s*["'][^"']*\bmraid(?:\.min)?\.js(?:[?#][^"']*)?["']/i.test(m[1]));
 const head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1]||'';
 const validBridge=bridge.length===1&&/\bsrc\s*=\s*["']mraid\.js["']/i.test(bridge[0][1])&&head.includes(bridge[0][0]);
 add('bridge','MRAID bridge',validBridge?'pass':'error',validBridge?'One relative mraid.js declaration in head.':'Declare exactly one <script src="mraid.js"></script> in head.',bridge[0]?.[0]||'');
 const state=/(?:\bgetState\s*\(\s*\)\s*={2,3}\s*["']loading["']|["']loading["']\s*={2,3}\s*[\w.]+\.getState\s*\(\s*\))/.test(code);
 const ready=/addEventListener\s*\(\s*["']ready["']/.test(code);
 add('ready','Bridge readiness gate',state&&ready?'pass':'warning',state&&ready?'Loading-state comparison and ready listener detected. Initialization order still needs runtime QA.':'Loading-state comparison and/or ready listener missing. Ensure initialization waits for the bridge.');
 const opens=/\.open\s*\(/.test(code)&&/\bmraid\b/.test(code);
 add('click','MRAID clickthrough',/\bmraid\.open\s*\(/.test(code)?'pass':opens?'warning':'error',/\bmraid\.open\s*\(/.test(code)?'Direct mraid.open call detected; exercise the CTA in a real container.':opens?'Possible aliased bridge.open call. Verify the alias and CTA wiring manually.':'No identifiable MRAID clickthrough found.');
 const windowOpen=code.match(/\bwindow\.open\s*\([^\n;]{0,150}/);
 add('window-open','Browser window.open fallback',windowOpen?'warning':'pass',windowOpen?'Browser fallback found. Verify it cannot run instead of mraid.open inside the ad container.':'No direct window.open call found.',windowOpen?.[0]||'');
 const redirect=code.match(/(?:\b(?:window\.)?location\.(?:href\s*=|assign\s*\(|replace\s*\())[^\n;]{0,140}/);
 add('navigation','Direct page redirects',redirect?'warning':'pass',redirect?'Potential direct navigation found; inspect whether this is a CTA redirect or legitimate internal state handling.':'No direct location navigation detected.',redirect?.[0]||'');
 const media=/<(?:video|audio)\b|new\s+(?:Audio|AudioContext)|createElement\s*\(\s*["'](?:video|audio)["']|data:(?:video|audio)\//i.test(html);
 const visibility=/isViewable\s*\(/.test(code)&&/["']viewableChange["']/.test(code);
 add('viewability','Media viewability',!media||visibility?'pass':'warning',!media?'No media detected.':visibility?'Viewability signals detected; verify media pauses/resumes correctly.':'Media found without both isViewable() and viewableChange.');
 const tags=['clickTag','clickTag1','clickthrough','clickThrough'].filter(key=>code.includes(key));
 add('clicktag','Click target fallback (project guideline)',tags.length===4?'pass':'warning',tags.length===4?'All four click target aliases detected.':'Verify the target expected by your ad network. Missing aliases are a project-guideline warning, not a universal MRAID failure.');
 const touch=/["']touchend["']/.test(code)&&/["'](?:click|pointerup)["']/.test(code);
 add('tap','Touch/click duplication',touch&&!/(?:lastTap|debounc|preventDefault|timeStamp)/i.test(code)?'warning':'pass',touch?'Multiple input types detected; verify one CTA per tap.':'No overlapping touchend/click handling detected.');
 const remotes=[];
 for(const m of html.matchAll(/<(?:script|link|img|video|audio|source)\b[^>]*?\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi)){
  if(/(?:^|\/)mraid(?:\.min)?\.js(?:[?#].*)?$/i.test(m[1]))continue;
  if(!/^(?:data:|blob:|#)/i.test(m[1]))remotes.push(m[1]);
 }
 for(const m of html.matchAll(/url\(\s*["']?([^\s)'"\n]+)["']?\s*\)/gi))if(!/^(?:data:|blob:|#)/i.test(m[1]))remotes.push(m[1]);
 add('assets','Self-contained assets',remotes.length?'error':'pass',remotes.length?remotes.length+' external or unbundled asset references found (excluding mraid.js). Inline creative dependencies.':'No external/local asset references found in supported HTML/CSS patterns.',remotes[0]||'');
 const apiPatterns={fetch:/\bfetch\s*\(/,XMLHttpRequest:/\bXMLHttpRequest\b/,WebSocket:/\bWebSocket\b/,EventSource:/\bEventSource\b/,sendBeacon:/\bsendBeacon\b/};
 const apis=Object.keys(apiPatterns).filter(name=>apiPatterns[name].test(code));
 const remote=code.match(/(?:\bfetch|new\s+(?:window\.)?(?:WebSocket|EventSource))\s*\(\s*["'](?:https?:|wss?:|\/\/)[^"']+["']/);
 const blocked=/id=["']ec-offline-network-guard-v1["']/.test(html);
 add('network','No external network calls',remote&&!blocked?'error':apis.length?'warning':'pass',apis.length?'Networking API(s) present ('+apis.join(', ')+'). '+(blocked?'A runtime remote-network blocker is installed. Source-level API presence remains; verify offline behavior.':remote?'A remote endpoint is visible. Remove the dependency or explicitly apply an offline blocker and verify functionality.':'Verify none target a remote host. API presence alone does not prove a connection is made.'):'No supported networking API patterns detected.',remote?.[0]||'');
 const usesWebgl=/getContext\s*\(\s*["'](?:webgl2?|experimental-webgl)["']|\bWebGL(?:2)?RenderingContext\b|\bWebGLRenderer\b|\bOffscreenCanvas\b/.test(code);
 const loss=/["']webglcontextlost["']/.test(code),guarded=/id=["']ec-webgl-fallback-v1["']/.test(html);
 const nativeFallback=loss&&/webgl[^\n]{0,100}(?:not supported|unavailable|failed)|(?:show|display|render)[\w$]*Fallback/i.test(code)&&/if\s*\(\s*![\w$]+\s*\)/.test(code);
 add('webgl','WebGL fallback (if WebGL used)',!usesWebgl||(guarded&&!/\bOffscreenCanvas\b/.test(code))||nativeFallback?'pass':'warning',!usesWebgl?'No supported WebGL usage patterns detected.':guarded&&/\bOffscreenCanvas\b/.test(code)?'HTML canvas safeguard installed; OffscreenCanvas/worker fallback still requires manual source handling.':guarded?'Visible initialization-failure/context-loss safeguard installed for HTML canvas WebGL. Test it in the target container.':nativeFallback?'Context-loss handling and fallback signals detected; manually verify init-failure and visible fallback behavior.':loss?'WebGL context-loss listener detected, but visible fallback/init-failure handling could not be verified.':'WebGL used with no context-loss handling. Add a visible fallback for initialization failure and context loss.');
 const profile=creativeSizeProfile(html,sourceUrl,creativeType);
 add('size','HTML size ('+profile.label+')',bytes>profile.limitBytes?'error':'pass',bytes.toLocaleString('en-US')+' / '+profile.limitBytes.toLocaleString('en-US')+' bytes. Decimal MB; detected by '+profile.reason+'.');
 if(profile.type==='unknown')add('creative-type','Creative type','warning','Could not determine MIP or SIP confidently. Select the correct type in Checker; until then the stricter 3.4 MB cap is used.');
 const encoded=/data:text\/html|DecompressionStream|srcDoc\s*:|\.srcdoc\s*=/i.test(html);
 add('embedded','Embedded document coverage',encoded?'warning':'pass',encoded?'Embedded/encoded HTML detected. This report covers the outer source; inspect each decoded end card separately.':'No supported embedded-document patterns detected.');
 const endScene=checkMipEndScenes(html,sourceUrl);
 if(endScene)add('end-scene', 'MIP end-scene Base64 packaging (project policy)',endScene.status,endScene.description,endScene.evidence);
 const errors=findings.filter(f=>f.status==='error').length,warnings=findings.filter(f=>f.status==='warning').length;
 return {sourceUrl,bytes,profile,checkedAt:Date.now(),findings,errors,warnings,issues:errors+warnings,scope:'Static source inspection, not MRAID certification. Minified aliases, comments and dynamically constructed code require manual review.'};
}
if(typeof module!=='undefined')module.exports={isLocalCreativeUrl,checkMraidHtml,creativeSizeProfile};

function checkMipEndScenes(html,sourceUrl=''){
 const explicitEnd=/title\s*:\s*["']End Scene["']|class(?:Name)?\s*[:=]\s*["'][^"']*(?:endscene|end-scene|endcard|end-card)|kind["']?\s*:\s*["']endscene["']|\b(?:endscene|endScene|endCard)["']?\s*:\s*\{|__eccFrameDocument\(\w+,/i.test(html);
 const isMip=/_mip_/i.test(sourceUrl)||explicitEnd;
 if(!isMip)return null;
 const candidates=[];
 function literalAt(index){
  const quote=html[index];if(!['"',"'",'`'].includes(quote))return null;
  let end=index+1;for(;end<html.length;end++){if(html[end]==='\\'){end++;continue;}if(html[end]===quote)break;}
  return {value:html.slice(index+1,end),index};
 }
 function resolve(name){
  const safe=name.replace(/[$]/g,'\\$');
  const match=new RegExp('(?:\\b(?:const|let|var)\\s+|[,;])\\s*'+safe+'\\s*=\\s*(["\x27\x60])').exec(html);
  return match?literalAt(match.index+match[0].length-1):null;
 }
 function take(expression,index,label){
  const first=expression.trim()[0];
  let item=['"',"'",'`'].includes(first)?literalAt(index+expression.indexOf(first)):null;
  if(!item){const identifier=/^\s*([\w$]+)\s*(?=[,;})]|$)/.exec(expression);if(identifier)item=resolve(identifier[1]);}
  if(!item){const wrapped=/^\s*window\.__creativePatchEndcard\(\s*([\w$]+)\s*\)/.exec(expression);if(wrapped)item=resolve(wrapped[1]);}
  candidates.push({label,index,...item,value:item?.value||null});
 }
 for(const m of html.matchAll(/\bsrcDoc\s*:\s*/g)){
  // Restrict React srcDoc to end-scene renderers, not arbitrary game iframes.
  const tail=html.slice(m.index,m.index+700);
  if(!/title\s*:\s*["']End Scene["']|end[- ]?(?:scene|card)/i.test(tail))continue;
  take(html.slice(m.index+m[0].length,m.index+m[0].length+400),m.index+m[0].length,'end-scene srcDoc');
 }
 for(const m of html.matchAll(/\bsrcdoc\s*=\s*(["'])/gi)){
  // DOM attributes inside an end-scene container or a known MIP export.
  if(!explicitEnd)continue;
  const item=literalAt(m.index+m[0].length-1);candidates.push({label:'end-scene srcdoc attribute',...item});
 }
 if(explicitEnd)for(const m of html.matchAll(/\.srcdoc\s*=\s*/g))take(html.slice(m.index+m[0].length,m.index+m[0].length+400),m.index+m[0].length,'end-scene srcdoc assignment');
 for(const block of html.matchAll(/(?:endscene|endScene|endCard)["']?\s*:\s*\{[^{}]*\}/g)){
  for(const field of block[0].matchAll(/\b(?:html|src|url|htmlSrc|videoSrc)["']?\s*:\s*/g)){
   const index=block.index+field.index+field[0].length;take(html.slice(index,index+400),index,'configured end-scene source');
  }
 }
 for(const m of html.matchAll(/srcPortrait\s*:\s*([\w$]+)\s*,\s*srcLandscape\s*:\s*([\w$]+)/g)){
  if(!/["']end["']|end[- ]?(?:scene|card)/i.test(html.slice(Math.max(0,m.index-120),m.index+1500)))continue;
  for(const name of [m[1],m[2]])candidates.push({label:'end-scene media '+name,index:m.index,...resolve(name)});
 }
 // Explicit end-scene video/image tags with literal sources.
 for(const block of html.matchAll(/<(?:div|section)[^>]*(?:id|class)=["'][^"']*end(?:[-_ ]?(?:scene|card))[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/gi)){
  for(const asset of block[1].matchAll(/<(?:video|source|img)\b[^>]*\bsrc=["']([^"']+)["']/gi))candidates.push({label:'end-scene media',value:asset[1],index:block.index});
 }
 if(!candidates.length){
  if(!explicitEnd)return null;
  return {status:'warning',description:'MIP end-scene loader detected, but its source cannot be resolved statically. Verify the end-scene file is Base64 packaged; a decoder/helper name alone is not proof.',evidence:''};
 }
 const problems=[],unknown=[],passed=[];
 const uniqueCandidates=[...new Map(candidates.map(item=>[item.index+'|'+(item.value?.slice(0,100)||item.label),item])).values()];
 for(const item of uniqueCandidates){
  const value=item.value;
  if(!value){unknown.push(item);continue;}
  if(/^data:(?:text\/html|video\/[\w.+-]+|image\/[\w.+-]+|audio\/[\w.+-]+)(?:;charset=[\w-]+)?;base64,[A-Za-z0-9+/]+={0,2}$/i.test(value)&&value.slice(value.indexOf(',')+1).length%4===0){passed.push(item);continue;}
  if(/<\s*(?:!doctype\s+html|html|head|body|script|div|video|iframe)\b/i.test(value))problems.push({...item,reason:'raw HTML source'});
  else if(/^data:/i.test(value))problems.push({...item,reason:'not a valid Base64 media/HTML data URL'});
  else if(/^blob:/i.test(value))unknown.push(item);
  else problems.push({...item,reason:'external/local or unencoded source'});
 }
 if(problems.length)return {status:'error',description:problems.length+' MIP end-scene source(s) violate the Base64-only project policy: '+problems.map(p=>p.label+' ('+p.reason+')').join('; ')+'. Encode the end-scene file as Base64; Base64 assets inside raw HTML do not make the HTML container compliant.',evidence:html.slice(problems[0].index,problems[0].index+180)};
 if(unknown.length)return {status:'warning',description:passed.length+' Base64 source(s) verified; '+unknown.length+' dynamic/blob source(s) cannot be verified. Resolve their payloads before approval.',evidence:''};
 return {status:'pass',description:passed.length+' MIP end-scene media/HTML data URL(s) verified as Base64 packaged. Decoded content still requires its own runtime/MRAID checks.',evidence:''};
}
