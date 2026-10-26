const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const {inspectCreativeHtml}=require('../parameter-extension/inspect');
const fixture=require('./fixtures/codeway-calendars.json');
for(const [name,calendar] of Object.entries(fixture.calendars)){
 const r=inspectCreativeHtml('<script>const calendar='+calendar+';</script>');
 assert.deepStrictEqual(r.ranges.map(({start,end})=>[start,end]),fixture.expected,name);
 assert.equal(r.overlaps.length,0,name);
}
assert.equal(inspectCreativeHtml('[["2026-12-21","2026-12-25",3],["2026-12-21","2026-12-25",3]]').ranges.length,1);
assert.equal(inspectCreativeHtml('[["2026-02-30","2026-03-01",1],["2026-12-25","2026-12-21",2],["2026-12-21","2026-12-25",run()]]').ranges.length,0);
assert.equal(inspectCreativeHtml('{2027:[[229,301,`art`,`invalid`],[1225,1221,`art`,`reversed`]]}').ranges.length,0);
assert.equal(inspectCreativeHtml('{2028:[[229,301,`art`,`leap`]]}').ranges.length,1);
assert.equal(inspectCreativeHtml('{2027:[[101,103,`art`,`${run()}`]]}').ranges.length,0);
assert.equal(inspectCreativeHtml('{2027:[[101,103,`art`,run()]]}').ranges.length,0);
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../parameter-extension/range-ui.js'),'utf8'),c);
c.document={createElement:()=>({})};const select={value:'',options:[],replaceChildren(){this.options=[]},appendChild(x){this.options.push(x)}};
c.populateRangeDropdown(select,Object.values(fixture.calendars).flatMap(s=>inspectCreativeHtml(s).ranges));assert.equal(select.options.length,33,'AppLovin duplicates merge into 32 date options');
console.log('Passed five calendar fixtures, date validation/leap years, computed rejection, duplicates and merged AppLovin dropdown.');
