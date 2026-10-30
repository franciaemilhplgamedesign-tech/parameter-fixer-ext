const assert=require('assert'),fs=require('fs'),vm=require('vm');
const {inspectCreativeHtml}=require('../parameter-extension/inspect');
const calendar=fs.readFileSync(__dirname+'/fixtures/rhoback-calendar.js','utf8');
const html='<script>'+calendar+'</script>';
const ranges=inspectCreativeHtml(html,0,2026).ranges;
assert.deepStrictEqual(ranges.map(r=>[r.start,r.end]),[2026,2027].flatMap(y=>[[y+'-11-11',y+'-11-26'],[y+'-11-27',y+'-11-29'],[y+'-11-30',y+'-11-30']]));
assert(ranges.every(r=>r.recurring));
const context={ut:()=>new Date(),Lt:'early',Ct:'bf',Kt:'cm'};vm.createContext(context);vm.runInContext(calendar,context);
for(let day=1;day<=31;day++){
 const date=new Date(2026,10,day,12),iso=date.toISOString().slice(0,10);
 assert.equal(Boolean(context.aS(date)),ranges.some(r=>r.start<=iso&&r.end>=iso));
}
assert.equal(inspectCreativeHtml(html.replace('N===10','N===12'),0,2026).ranges.length,0);
assert.equal(inspectCreativeHtml(html.replace('N===10','externalCheck()'),0,2026).ranges.length,0);
assert.equal(inspectCreativeHtml(html.replace('Z.getDate()','other.getDate()'),0,2026).ranges.length,0);
const nested='<script>const card='+JSON.stringify('<html>'+html+'</html>').replace(/<\/script/gi,'<\\/script')+'</script>';
assert.equal(inspectCreativeHtml(nested,0,2026).ranges.length,6);
console.log('Passed Rhoback nested annual ranges, day boundaries, invalid/unknown predicates, receiver isolation and embedded HTML.');

