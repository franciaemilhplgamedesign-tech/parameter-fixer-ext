/* Static JavaScript inspection. Creative code is parsed, never executed. */
var CreativeSource=(()=>{
 const parser=typeof acorn!=='undefined'?acorn:typeof require==='function'?require('./vendor/acorn.js'):null;
 function analyze(html){
  const nodes=[],scopes=new WeakMap(),documents=new Set(),failures=[],dataBlocks=new Map();
  function scope(parent){return {parent,values:new Map()};}
  function bind(s,name,node){if(!s.values.has(name))s.values.set(name,node);else s.values.set(name,null);}
  function visit(node,s,parent=null){
   if(!node||typeof node.type!=='string')return;
   if(/Function/.test(node.type)||node.type==='ArrowFunctionExpression'){
    s=scope(s);for(const p of node.params||[])if(p.type==='Identifier')bind(s,p.name,null);
   }else if(node.type==='BlockStatement')s=scope(s);
   scopes.set(node,s);nodes.push(node);
   if(node.type==='VariableDeclarator'&&node.id.type==='Identifier')bind(s,node.id.name,node.init);
   if(node.type==='AssignmentExpression'&&node.operator==='='&&node.left.type==='MemberExpression'&&node.left.object.name==='window'&&!node.left.computed)bind(s,'window.'+node.left.property.name,node.right);
   for(const [key,value] of Object.entries(node)){
    if(key==='start'||key==='end')continue;
    if(Array.isArray(value)){for(const child of value)if(child?.type)visit(child,s,node);}
    else if(value?.type)visit(value,s,node);
   }
  }
  const root=scope(null);
  for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
   const type=m[1].match(/\btype\s*=\s*["']([^"']*)["']/i)?.[1]||'';
   if(type&&!/^(?:module|(?:text|application)\/(?:java|ecma)script)$/i.test(type)){
    const id=m[1].match(/\bid\s*=\s*["']([^"']+)["']/i)?.[1];if(id)dataBlocks.set(id,{textContent:m[2]});continue;
   }
   try{visit(parser.parse(m[2],{ecmaVersion:'latest',sourceType:'module',allowReturnOutsideFunction:true}),root);}catch(error){failures.push(error.message);}
  }
  // Reassigned identifiers are not statically constant.
  for(const n of nodes)if((n.type==='AssignmentExpression'&&n.left.type==='Identifier')||(n.type==='UpdateExpression'&&n.argument.type==='Identifier')){
   const name=(n.left||n.argument).name;for(let s=scopes.get(n);s;s=s.parent)if(s.values.has(name)){s.values.set(name,null);break;}
  }
  function lookup(node,name){for(let s=scopes.get(node);s;s=s.parent)if(s.values.has(name))return s.values.get(name);return null;}
  function property(n){return n?.computed?n.property.value:n?.property?.name;}
  function resolve(n,depth=0,seen=new Set()){
   if(!n||depth>18||seen.has(n))return null;
   seen=new Set(seen);seen.add(n);
   const next=x=>resolve(x,depth+1,seen);
   if(n.type==='Literal')return {value:n.value,packaged:false};
   if(n.type==='Identifier')return next(lookup(n,n.name));
   if(n.type==='TemplateLiteral'){
    let value='';for(let i=0;i<n.quasis.length;i++){value+=n.quasis[i].value.cooked||'';if(i<n.expressions.length){const v=next(n.expressions[i]);if(!v||!['string','number'].includes(typeof v.value))return null;value+=v.value;}}return {value,packaged:false};
   }
   if(n.type==='BinaryExpression'&&n.operator==='+'){const a=next(n.left),b=next(n.right);return a&&b?{value:a.value+b.value,packaged:false}:null;}
   if(n.type==='MemberExpression'){
    if(n.object.name==='window'&&!n.computed)return next(lookup(n,'window.'+property(n)));
    const o=next(n.object),p=n.computed?next(n.property)?.value:property(n);
    return o&&o.value!=null&&Object.hasOwn(Object(o.value),p)?{value:o.value[p],packaged:o.packaged}:null;
   }
   if(n.type==='ArrayExpression'){const values=n.elements.map(next);return values.every(Boolean)?{value:values.map(v=>v.value),packaged:false}:null;}
   if(n.type==='ObjectExpression'){
    const value=Object.create(null);for(const p of n.properties){if(p.type!=='Property'||p.computed||p.method)return null;const v=next(p.value);if(!v)return null;value[p.key.name??p.key.value]=v.value;}return {value,packaged:false};
   }
   if(n.type==='CallExpression'){
    const c=n.callee,key=property(c);
    if(c.type==='MemberExpression'&&c.object.name==='document'&&key==='getElementById'){
     const id=next(n.arguments[0])?.value;return dataBlocks.has(id)?{value:dataBlocks.get(id),packaged:false}:null;
    }
    if(c.type==='MemberExpression'&&key==='trim'&&!n.arguments.length){const v=next(c.object);if(typeof v?.value==='string')return {value:v.value.trim(),packaged:v.packaged};}
    if(c.type==='MemberExpression'&&key==='split'){
     const value=next(c.object),separator=next(n.arguments[0]);if(typeof value?.value==='string'&&typeof separator?.value==='string')return {value:value.value.split(separator.value),packaged:value.packaged};
    }
    if(c.type==='MemberExpression'&&key==='replace'){
     const v=next(c.object),a=next(n.arguments[0]),b=next(n.arguments[1]);if(typeof v?.value==='string'&&typeof a?.value==='string'&&typeof b?.value==='string')return {value:v.value.replace(a.value,b.value),packaged:v.packaged};
    }
    // Recognize the exact UTF-8 Base64 decoder shape, without invoking callbacks.
    if(c.type==='MemberExpression'&&key==='decode'&&c.object.type==='NewExpression'&&c.object.callee.name==='TextDecoder'){
     const from=n.arguments[0],atobCall=from?.arguments?.[0],mapper=from?.arguments?.[1];
     const body=mapper?.type==='ArrowFunctionExpression'?mapper.body:null;
     const byteMapper=body?.type==='CallExpression'&&property(body.callee)==='charCodeAt'&&body.callee.object.name===mapper.params[0]?.name&&body.arguments.length===1&&body.arguments[0].value===0;
     const utf8=!c.object.arguments.length||/^utf-?8$/i.test(next(c.object.arguments[0])?.value||'');
     if(utf8&&byteMapper&&from?.callee?.object?.name==='Uint8Array'&&property(from.callee)==='from'&&atobCall?.callee?.name==='atob'){
      const encoded=next(atobCall.arguments[0]);if(typeof encoded?.value==='string'&&/^[A-Za-z0-9+/]*={0,2}$/.test(encoded.value)&&encoded.value.length%4===0){
       try{const raw=atob(encoded.value);return {value:new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(raw,c=>c.charCodeAt(0))),packaged:true};}catch(_){}
      }
     }
    }
    if(c.name==='atob'){
     const encoded=next(n.arguments[0]);if(typeof encoded?.value==='string'&&/^[A-Za-z0-9+/]*={0,2}$/.test(encoded.value)&&encoded.value.length%4===0)try{return {value:atob(encoded.value),packaged:true};}catch(_){}
    }
    if(['escape','decodeURIComponent'].includes(c.name)){
     const v=next(n.arguments[0]);if(typeof v?.value==='string')try{return {value:c.name==='escape'?escape(v.value):decodeURIComponent(v.value),packaged:v.packaged};}catch(_){}
    }
   }
   return null;
  }
  // Trace packaging through text-only patches without claiming patched output
  // was resolved. Runtime strings or callbacks are never executed.
  function origin(n,depth=0){
   if(!n||depth>18)return null;
   const result=resolve(n);if(result)return result;
   if(n.type==='Identifier')return origin(lookup(n,n.name),depth+1);
   if(n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&['replace','replaceAll'].includes(property(n.callee)))return origin(n.callee.object,depth+1);
   return null;
  }
  function origins(n,depth=0){
   if(!n||depth>18)return [null];
   const direct=origin(n);if(direct)return [direct];
   if(n.type==='Identifier')return origins(lookup(n,n.name),depth+1);
   if(n.type==='ConditionalExpression')return [...origins(n.consequent,depth+1),...origins(n.alternate,depth+1)];
   if(n.type==='MemberExpression'){
    let object=n.object;if(object.type==='Identifier')object=lookup(object,object.name);
    if(object?.type==='ObjectExpression'){
     const key=n.computed?resolve(n.property)?.value:property(n);
     const props=object.properties.filter(p=>p.type==='Property'&&(key===undefined||(p.key.name??p.key.value)===key));
     if(props.length&&props.length<=8)return props.flatMap(p=>origins(p.value,depth+1));
    }
   }
   return [null];
  }
  for(const n of nodes)if(n.type==='Literal'||n.type==='TemplateLiteral'||(n.type==='CallExpression'&&property(n.callee)==='decode')){
   let v=resolve(n)?.value;
   if(typeof v==='string'&&/^data:text\/html(?:;charset=[^;,]+)?;base64,/i.test(v))try{v=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(v.slice(v.indexOf(',')+1)),c=>c.charCodeAt(0)));}catch(_){v=null;}
   if(typeof v==='string'&&v.length<12000000&&/<(?:!doctype|html|body|head)\b/i.test(v))documents.add(v);
  }
  return {nodes,resolve,origin,origins,property,documents:[...documents],failures};
 }
 return {analyze};
})();
if(typeof module!=='undefined')module.exports=CreativeSource;
