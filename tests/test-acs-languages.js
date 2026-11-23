const assert=require('node:assert/strict');
const {checkMraidHtml}=require('../parameter-extension/mraid-checks');
const fixture=(codes,script='',extra='')=>'<html><head>'+(
 codes===null?'':'<meta name="acs-languages" content="'+codes+'">')+extra+'</head><body><script>'+script+'</script></body></html>';
const finding=html=>checkMraidHtml(html).findings.find(item=>item.id==='acs-languages');
assert.equal(finding(fixture(null)).status,'error');
assert.equal(finding(fixture('en')).status,'pass');
for(const codes of ['EN','en, fr','fr','en,en','en,','en;fr','en,fr'])assert.equal(finding(fixture(codes)).status,'error');
assert.equal(finding(fixture('en','','<meta name="acs-languages" content="en">')).status,'error');
const source='const copy={en:{cta:"Buy"},fr:{cta:"Acheter"}};const language=new URLSearchParams(location.search).get("language")||navigator.language.split("-")[0];document.body.textContent=copy[language].cta;';
assert.equal(finding(fixture('en,fr',source)).status,'pass');
assert.equal(finding(fixture('en',source)).status,'error');
assert.equal(finding(fixture('en,fr,de',source)).status,'error');
assert.equal(finding(fixture('en','const language=navigator.language;loadTranslations(language);')).status,'warning');
assert.equal(finding(fixture('en','','<script src="translations.js"></script>')).status,'warning');
assert.equal(finding(fixture('en','const unused={en:"Buy",fr:"Acheter"};')).status,'pass');
console.log('Passed ACS metadata presence, lowercase/format/English requirements, exact dictionary codes and unresolved support warnings.');
