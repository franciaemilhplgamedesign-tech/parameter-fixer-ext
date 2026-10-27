const assert=require('assert'),fs=require('fs');
const {checkMraidHtml,creativeSizeProfile,formatCreativeSize}=require('../parameter-extension/mraid-checks');
assert.equal(creativeSizeProfile('','','mip').limitBytes,5242880);
assert.equal(creativeSizeProfile('','','sip').limitBytes,3565158);
assert.equal(formatCreativeSize(5015979),'4.78 MB');
for(const type of ['mip','sip']){const limit=creativeSizeProfile('','',type).limitBytes;for(const offset of [-1,0,1]){const r=checkMraidHtml('x'.repeat(limit+offset),'file:///sample.html',type);assert.equal(r.bytes,limit+offset);assert.equal(r.findings.find(f=>f.id==='size').status,offset>0?'error':'pass');}}
const supplied='C:/Users/WorkProfile/Downloads/index (2).html';if(fs.existsSync(supplied)){const b=fs.readFileSync(supplied),r=checkMraidHtml(b.toString('utf8'),supplied,'mip');assert.equal(r.bytes,b.length);assert.equal(r.findings.find(f=>f.id==='size').status,'pass');console.log('Supplied file: '+formatCreativeSize(r.bytes)+' ('+r.bytes+' bytes), PASS.');}
console.log('Passed Windows-style MIP/SIP size formatting and exact boundary checks.');
