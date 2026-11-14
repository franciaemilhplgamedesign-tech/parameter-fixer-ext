const assert=require('node:assert/strict');
const {inspectCreativeHtml}=require('../parameter-extension/inspect');
const wrap=code=>'<script>'+code+'</script>';
const source=`const bf=()=>{
 if(typeof window<"u"){
  const q=new URLSearchParams(window.location.search);
  if(q.get("bf")==="true")return !0;
  if(q.get("bf")==="false")return !1;
 }
 const date=new Date,month=date.getMonth(),day=date.getDate();
 return month===10&&day>=27&&day<=29;
};
const cm=()=>{const date=new Date,month=date.getMonth(),day=date.getDate();return month===10&&day===30};`;
for(const year of [2026,2027])assert.deepEqual(inspectCreativeHtml(wrap(source),0,year).ranges.map(r=>[r.start,r.end]),[
 [year+'-11-27',year+'-11-29'],[year+'-11-30',year+'-11-30']
]);
assert.equal(inspectCreativeHtml(wrap(source.replaceAll('day=date.getDate()','day=other.getDate()')),0,2026).ranges.length,0);
assert.equal(inspectCreativeHtml(wrap(source.replaceAll('month===10','month===12')),0,2026).ranges.length,0);
assert.equal(inspectCreativeHtml(wrap(source.replace('day>=27','runtime(day)')),0,2026).ranges.length,1);
console.log('Passed boolean annual calendars, preview-year mapping, month validation and unresolved predicate rejection.');
