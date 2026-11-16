/* Synthetic two-browser NOUX client regression, Node 22 Web Crypto. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const {TextEncoder,TextDecoder}=require('node:util');
const syncCode=fs.readFileSync('sync.js','utf8'),coreCode=fs.readFileSync('sync-core.js','utf8');
new vm.Script(syncCode,{filename:'sync.js'});
new vm.Script(coreCode,{filename:'sync-core.js'});
class Node {
 constructor(tag){this.tagName=tag;this.className='';this.id='';this.textContent='';this.value='';this.listeners={};this.children=[];this.attrs={};this.hidden=false;this.style={};this.type='';this.rows=0}
 append(...x){this.children.push(...x)}
 replaceChildren(...x){this.children=[];this.append(...x)}
 setAttribute(a,b){this.attrs[a]=b}
 addEventListener(k,fn){this.listeners[k]=fn}
 focus(){}
 click(){this.listeners.click?.()}
 querySelector(s){return search(this).find(x=>s.startsWith('.')?x.className.split(' ').includes(s.slice(1)):x.id===s.slice(1))||null}
}
const search=n=>[n,...n.children.flatMap(search)];
const makeStorage=initial=>{
 const data={...initial};
 return new Proxy({getItem:k=>data[k]??null,setItem:(k,v)=>{data[k]=v},removeItem:k=>{delete data[k]}},{
  ownKeys:()=>Reflect.ownKeys(data),
  getOwnPropertyDescriptor:(_t,k)=>Object.hasOwn(data,k)?{value:data[k],enumerable:true,configurable:true,writable:true}:undefined,
  get:(t,k)=>k in t?t[k]:data[k],
  set:(_t,k,v)=>{data[k]=v;return true}
 });
};
const rooms=new Map();
const api=async (url,request)=>{
 const r=/\/v1\/rooms\/([A-Za-z0-9_-]{22})/.exec(url),id=r?.[1];
 if(!id)return {status:404,json:async()=>({})};
 const token=request.headers.Authorization;
 const existing=rooms.get(id);
 if(request.method==='GET')return {status:existing?(existing.token===token?200:403):404,json:async()=>existing?{revision:existing.revision,encrypted:existing.encrypted}:{exists:false,revision:0}};
 if(request.method==='PUT'){
  const body=JSON.parse(request.body);
  if(existing&&existing.token!==token)return {status:403,json:async()=>({})};
  if(body.baseRevision!==(existing?.revision||0))return {status:409,json:async()=>({revision:existing.revision})};
  const next={token,revision:(existing?.revision||0)+1,encrypted:body.encrypted};
  rooms.set(id,next);
  return {status:200,json:async()=>({revision:next.revision})};
 }
 return {status:405,json:async()=>({})};
};
function browser(label,key){
 const storage=makeStorage({nyc_lyna_trip_v6:JSON.stringify({choices:{c6:'butterflies',c9:'manhattan'},customStops:[]})});
 const body=new Node('body');
 const doc={body,hidden:false,createElement:t=>new Node(t),getElementById:id=>search(body).find(x=>x.id===id)||null,querySelector:selector=>search(body).find(x=>selector.startsWith('.')&&x.className.split(' ').includes(selector.slice(1)))||null,addEventListener(){}};
 let checklist={check:{'Benjamin:phone':false,'Lyna:phone':false},items:[{id:'cookies',name:'Cookies',bought:false,packed:false}]};
 const departure={whenSaved:async()=>{},getSharedSnapshot:async()=>JSON.parse(JSON.stringify(checklist)),applySharedSnapshot:async v=>{checklist=JSON.parse(JSON.stringify(v))}};
 const window={NOUX_DEPARTURE:departure,addEventListener(){},dispatchEvent(){}};
 const nav={onLine:true,clipboard:{writeText:async()=>{}}};
 const classSet={add(){},remove(){}};
 body.classList=classSet;
 const ctx={window,document:doc,localStorage:storage,crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,Array,Object,JSON,Date,Math,Number,String,Set,Promise,URL,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail}},navigator:nav,location:{reload(){}},
  btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),
  fetch:api,setTimeout,clearTimeout,setInterval:()=>1,clearInterval(){}};
 vm.runInNewContext(coreCode,ctx,{filename:'sync-core.js'});
 vm.runInNewContext(syncCode,ctx,{filename:'sync.js'});
 return {label,storage,window,doc,checklist:()=>checklist,key};
}
function find(b,text,tag='button'){
 return search(b.doc.body).find(n=>n.tagName===tag&&(n.textContent||'')===text);
}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,label){
 const started=Date.now();
 while(Date.now()-started<3500){
  const value=await fn();if(value)return value;
  await delay(25);
 }
 throw Error('Timed out waiting for '+label);
}
async function run(){
 const key=await webcrypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 const b=browser('Ben',key),l=browser('Lyna',key);
 assert(await b.window.NOUX_SYNC.install({key}));
 assert(await l.window.NOUX_SYNC.install({key}));
 find(b,'Set up shared sync').click();
 find(b,'Create our shared trip').click();
 let code=await until(()=>search(b.doc.body).find(x=>x.tagName==='textarea')?.value,'first-device pairing code');
 assert.match(code,/^NOUX1\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}$/,'Pairing code has high entropy');
 await until(()=>rooms.size===1,'encrypted shared room upload');
 assert(rooms.size===1,'First phone creates encrypted server room');
 assert(!search(b.doc.body).some(x=>x.id==='noux-sync-notice'), 'Initial self-upload must not freeze the first phone');
 const localPair=b.storage.getItem('noux_sync_pair_aes_v1');
 assert(localPair&&!localPair.includes(code),'Pairing secret encrypted in local browser');
 find(l,'Set up shared sync').click();
 const select=search(l.doc.body).find(x=>x.tagName==='select');select.value='Lyna';
 const entry=search(l.doc.body).find(x=>x.tagName==='input');entry.value=code;
 const join=search(l.doc.body).find(x=>x.tagName==='form');
 await join.listeners.submit({preventDefault(){}});
 await until(()=>l.storage.getItem('noux_sync_pair_aes_v1'),'second-device pairing');
 await until(()=>l.storage.getItem('noux_sync_cache_aes_v1'),'second-device first sync');
 // Lyna adds a stop; Benjamin ticks separately.
 const le=JSON.parse(l.storage.getItem('nyc_lyna_trip_v6'));
 le.customStops.push({id:'lyna-art',title:'Local gallery'});
 l.storage.setItem('nyc_lyna_trip_v6',JSON.stringify(le));
 let bp=b.checklist();bp.check['Benjamin:phone']=true; // synthetic mutable UI state
 // Update Ben's closure through the documented shared-state API.
 await b.window.NOUX_DEPARTURE.applySharedSnapshot(bp);
 await until(async()=>{
  await l.window.NOUX_SYNC.refresh();
  await b.window.NOUX_SYNC.refresh();
  return JSON.parse(b.storage.getItem('nyc_lyna_trip_v6')).customStops.some(x=>x.id==='lyna-art')&&l.checklist().check['Benjamin:phone'];
 },'two-device bidirectional changes');
 assert(JSON.parse(b.storage.getItem('nyc_lyna_trip_v6')).customStops.some(x=>x.id==='lyna-art'),'Lyna custom stop reaches Ben');
 assert(search(b.doc.body).some(x=>x.id==='noux-sync-notice'), 'Remote stop updates must request a controlled reload');
 assert(l.checklist().check['Benjamin:phone'],'Benjamin checked item reaches Lyna');
 const srv=[...rooms.values()][0].encrypted;
 assert(!JSON.stringify(srv).includes('lyna-art'),'Worker only stores encrypted payload');
 assert(!JSON.stringify(srv).includes('cookies'),'Gift content encrypted');
 assert.equal(b.window.NOUX_SYNC.serviceUrl(),'https://noux-sync.benjbongard.workers.dev','No attacker-controlled sync host');
 console.log('NO UX cross-device client PASS: private pairing, persistent secret encryption, custom-stop and person-specific checklist convergence.');
}
run().catch(e=>{console.error(e);process.exitCode=1});
