const assert=require('node:assert/strict');
const {inspectCreativeHtml}=require('../parameter-extension/inspect');
const source=`<script>
function getPromo(now){
 const params=new URLSearchParams(location.search);
 if(params.has('holiday'))return {id:'override',name:'Forced'};
 if(now.getMonth()===10){
  const day=now.getDate();
  if(day>=27&&day<=29)return {id:'black-friday',name:'Black Friday'};
  if(day===30)return {id:'cyber-monday',name:'Cyber Monday'};
 }
 return {id:'default',name:'',isDefault:true};
}
</script>`;
assert.deepEqual(inspectCreativeHtml(source,0,2027).ranges,[
 {start:'2027-11-27',end:'2027-11-29',label:'Black Friday',recurring:true},
 {start:'2027-11-30',end:'2027-11-30',label:'Cyber Monday',recurring:true}
]);
for(const invalid of [
 source.replace('now.getDate()', 'other.getDate()'),
 source.replace('day>=27', 'runtimeCheck(day)'),
 source.replace('isDefault:true', 'isDefault:false')
])assert.deepEqual(inspectCreativeHtml(invalid,0,2027).ranges,[]);
console.log('Passed annual object promos, URL override exclusion and default-offer handling.');
