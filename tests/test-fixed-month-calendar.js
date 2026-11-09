const assert=require('node:assert/strict');
const {inspectCreativeHtml}=require('../parameter-extension/inspect');
const selector=`<script>
function promo(date){
 if(date.getFullYear()!==2026 || date.getMonth()!==10) return null;
 const day=date.getDate();
 if(day>=27 && day<=29) return {id:'first',name:'Black Friday'};
 if(day===30) return {id:'second',name:'Cyber Monday'};
 return null;
}
</script>`;
const ranges=html=>inspectCreativeHtml(html,0,2027).ranges;
assert.deepEqual(ranges(selector),[
 {start:'2026-11-27',end:'2026-11-29',label:'Black Friday'},
 {start:'2026-11-30',end:'2026-11-30',label:'Cyber Monday'}
]);
assert.deepEqual(ranges(selector.replace('date.getDate()', 'other.getDate()')),[]);
assert.deepEqual(ranges(selector.replace('day>=27', 'someRuntimeCheck(day)')),[]);
assert.equal(ranges(selector.replace('day<=29', 'day<=30')).length,1);
console.log('Passed fixed promo dates, receiver checks and first-match precedence.');
