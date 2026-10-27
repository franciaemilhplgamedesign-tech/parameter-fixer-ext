const fs=require('fs'),vm=require('vm'),assert=require('assert');let handler,stored={},requests=0;
const html='<html><head></head><body><script>window.open("https://example.com")</script></body></html>';
const c={URL,TextEncoder,Date,Map,Promise,AbortSignal,importScripts:()=>{},fetch:async()=>{requests++;return {ok:true,text:async()=>html};},chrome:{runtime:{id:'ext',onInstalled:{addListener:()=>{}},onStartup:{addListener:()=>{}},onMessage:{addListener:fn=>{handler=fn;}}},alarms:{onAlarm:{addListener:()=>{}}},tabs:{get:async()=>({id:9,url:'file:///C:/test.html?date=2026-10-23'})},extension:{isAllowedFileSchemeAccess:async()=>true},storage:{local:{get:async()=>({}),set:async()=>{}},session:{set:async value=>Object.assign(stored,value)}}}};
vm.createContext(c);vm.runInContext(fs.readFileSync('parameter-extension/mraid-checks.js','utf8'),c);vm.runInContext(fs.readFileSync('parameter-extension/background.js','utf8'),c);
(async()=>{
 const automatic=c.checkLocalPreview(9);
 const mip=c.checkLocalPreview(9,'mip');
 const sip=c.checkLocalPreview(9,'sip');
 const reports=await Promise.all([automatic,mip,sip]);
 assert.equal(reports[1].profile.limitBytes,5242880);
 assert.equal(reports[2].profile.limitBytes,3565158);
 assert.equal(stored['mraid:9'].profile.mode,'sip');
 const source='<html><head></head><body>'+ 'x'.repeat(4440000)+'</body></html>';
 const m=c.checkMraidHtml(source,'file:///C:/test.html','mip');
 const s=c.checkMraidHtml(source,'file:///C:/test.html','sip');
 assert.equal(m.findings.find(f=>f.id==='size').status,'pass');
 assert.equal(s.findings.find(f=>f.id==='size').status,'error');
 console.log('Passed concurrent automatic/MIP/SIP selections, final selected profile, and 4.44 MB pass/fail limits.');
})();