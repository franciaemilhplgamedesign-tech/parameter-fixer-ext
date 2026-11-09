const assert=require('node:assert/strict');
const {inspectCreativeHtml}=require('../parameter-extension/inspect');
const html=`<script>
function getHolidayMode(){
 const now=new Date();
 const params=new URLSearchParams(location.search);
 if(params.has('holiday')) return 'CM';
 const month=now.getMonth()+1;
 const day=now.getDate();
 if(month===11 && day>=25 && day<=29) return 'BF';
 if(month===11 && day===30) return 'CM';
 return null;
}
</script>`;
assert.deepEqual(inspectCreativeHtml(html,0,2027).ranges,[
 {start:'2027-11-25',end:'2027-11-29',label:'BLACK FRIDAY',recurring:true},
 {start:'2027-11-30',end:'2027-11-30',label:'CYBER MONDAY',recurring:true}
]);
assert.deepEqual(inspectCreativeHtml(html.replace('now.getDate()', 'other.getDate()'),0,2027).ranges,[]);
console.log('Passed annual holiday modes and exclusion of URL overrides from detected ranges.');
