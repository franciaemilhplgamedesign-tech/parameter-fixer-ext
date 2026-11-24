const assert=require('node:assert/strict');
const {updatePreviewUrl}=require('../parameter-extension/url-tools');
for(const base of ['file:///C:/creative.html?other=1#view','http://localhost:8000/creative.html?other=1#view']){
 const result=new URL(updatePreviewUrl(base,'2026-11-27','de','tiktok').url);
 assert.equal(result.searchParams.get('channel'),'tiktok');
 assert.equal(result.searchParams.get('date'),'2026-11-27');
 assert.equal(result.searchParams.get('language'),'de');
 assert.equal(result.searchParams.get('other'),'1');assert.equal(result.hash,'#view');
 assert.equal(new URL(updatePreviewUrl(result.href,'','','').url).searchParams.has('channel'),false);
}
const base='https://playable.applovindemo.com/Preview/?h='+encodeURIComponent('a.html?channel=old')+'&h2=b.html&channel=old';
const result=new URL(updatePreviewUrl(base,'2026-11-27','en','tiktok').url);
assert.deepEqual(result.searchParams.getAll('channel'),['tiktok']);
assert.equal(result.searchParams.get('h'),'a.html');
assert.equal(result.searchParams.get('h2'),'b.html');
assert.equal(new URL(updatePreviewUrl(result.href,'','').url).searchParams.get('channel'),'tiktok');
assert.equal(new URL(updatePreviewUrl(result.href,'','','').url).searchParams.has('channel'),false);
assert.equal(new URL(updatePreviewUrl('file:///C:/a.html','','','paid social&video').url).searchParams.get('channel'),'paid social&video');
console.log('Passed manual channel URLs, AppLovin deduplication, clearing, backward compatibility and URL encoding.');

const vm=require('node:vm'),fs=require('node:fs');
class Element{setAttribute(name,value){this[name]=value}}
class Frame extends Element{
 get src(){return this.value||''}
 set src(value){this.value=value}
}
const location={hostname:'playable.applovindemo.com',pathname:'/Preview/',origin:'https://playable.applovindemo.com',href:'https://playable.applovindemo.com/Preview/?channel=tiktok',search:'?channel=tiktok'};
const context={URL,URLSearchParams,location,window:{},Element,HTMLIFrameElement:Frame,document:{querySelectorAll:()=>[]},MutationObserver:class{observe(){}}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(__dirname+'/../parameter-extension/applovin-frame-bridge.js','utf8'),context);
const frame=new Frame;frame.src='/phaser/test.html';
assert.equal(new URL(frame.src).searchParams.get('channel'),'tiktok');
frame.setAttribute('src','/phaser/other.html');
assert.equal(new URL(frame.src).searchParams.get('channel'),'tiktok');
