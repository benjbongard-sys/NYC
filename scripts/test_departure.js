/* Public synthetic regression: secure persistence, independently tracked travellers,
   on-the-fly shopping items and source-level data-leak controls. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const {TextEncoder,TextDecoder}=require('node:util');
const source=fs.readFileSync('departure-kit.js','utf8');
new vm.Script(source,{filename:'departure-kit.js'});
assert(!/private\.vault\.json|NOUX_PASSPHRASE|132 W 47th|Sanctuary Hotel|AF007/.test(source),'No private vault details or flight number published');
assert(source.includes('AES-GCM')&&source.includes('additionalData:AAD'),'Saved state uses authenticated encryption');
assert(!source.includes('nav.append(tab)'),'Departure controls must not modify React-managed navigation');
assert(source.includes('document.body.append(LAUNCHER)'),'Standalone tab must mount outside the React app root');
assert(source.includes('Export encrypted backup')&&source.includes('Import from another device'),'Portable encrypted backup available');
const saved={};const storage={getItem:k=>Object.prototype.hasOwnProperty.call(saved,k)?saved[k]:null,setItem:(k,v)=>{saved[k]=v}};
class FakeNode{
 constructor(tag){this.tagName=tag;this.className='';this.id='';this.children=[];this.listeners={};this.attrs={};this.classList={add(){},remove(){}};this.style={};this.value='';this.textContent='';this.checked=false;this.hidden=false}
 append(...nodes){for(const x of nodes){if(x!==null&&x!==undefined)this.children.push(x)}}
 appendChild(x){this.append(x);return x}
 replaceChildren(...nodes){this.children=[];this.append(...nodes)}
 setAttribute(k,v){this.attrs[k]=v}
 getAttribute(k){return this.attrs[k]}
 addEventListener(k,f){this.listeners[k]=f}
 remove(){}
 focus(){}
 click(){if(this.listeners.click)this.listeners.click()}
 querySelector(sel){return nodes(this).find(x=>sel[0]==='.'?x.className&&x.className.split(' ').includes(sel.slice(1)):sel[0]==='#'?x.id===sel.slice(1):x.tagName===sel)||null}
 get selectedOptions(){return this.children.filter(x=>x.selected)}
}
const nodes=root=>[root,...root.children.flatMap(nodes)];
const makeDocument=()=>{
 const body=new FakeNode('body'),nav=new FakeNode('nav'),root=new FakeNode('div');root.id='root';
 return {body,root,nav,createElement:t=>new FakeNode(t),getElementById:id=>nodes(body).find(n=>n.id===id)||(id==='root'?root:null),querySelector:q=>q==='.topbar .mainnav'?nav:null,addEventListener(){}};
};
const encode=b=>Buffer.from(b,'binary').toString('base64');
const decode=s=>new Uint8Array(Buffer.from(s,'base64'));
const keyPromise=webcrypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
async function instance(key){
 const document=makeDocument(),window={NYC_DATA:{},NYC_PLAN:{},openedLinks:[],open(url){this.openedLinks.push(url);return {closed:false}}};
 const ctx={window,document,localStorage:storage,crypto:webcrypto,TextEncoder,TextDecoder,btoa:encode,atob:s=>Buffer.from(s,'base64').toString('binary'),Uint8Array,Array,Object,JSON,Math,Date,Number,String,Set,Promise,Blob,URL,setTimeout,requestAnimationFrame:fn=>fn()};
 vm.runInNewContext(source,ctx,{filename:'departure-kit.js'});
 assert(await window.NOUX_DEPARTURE.install({key}),'Checklist installs only with valid AES key');
 return {window,document};
}
async function plaintext(key){
 const box=JSON.parse(saved.noux_departure_checklists_aes_v1);
 const bytes=await webcrypto.subtle.decrypt({name:'AES-GCM',iv:decode(box.iv),additionalData:new TextEncoder().encode('NOUX-DEPARTURE-CHECKLIST-V1')},key,decode(box.ct));
 return JSON.parse(new TextDecoder().decode(bytes));
}
async function main(){
 const key=await keyPromise;
 let a=await instance(key);
 let raw=saved.noux_departure_checklists_aes_v1;
 assert(raw&&raw.includes('"ct"')&&!raw.includes('Passport, ESTA'),'Checklists not stored in clear text');
 let start=await plaintext(key);
 assert(start.items.length>=10,'Curated suggestions available');
 assert(start.items.some(x=>x.id==='nypltote'&&/EARLY CLOSURE/.test(x.note)),'NYPL early closure explicitly flagged');
 assert(start.items.some(x=>x.id==='levainfresh'&&x.day==='fri'),'Friday nearby Levain option exists');
 a.document.body.children.find(n=>n.className==='noux-departure-launcher').click();
 const lyna=nodes(a.document.body).find(n=>n.tagName==='input'&&n.attrs['aria-label']==='Lyna · Passport, ESTA and entry papers');
 const ben=nodes(a.document.body).find(n=>n.tagName==='input'&&n.attrs['aria-label']==='Benjamin · Passport, ESTA and entry papers');
 assert(lyna&&ben,'Separate labelled traveller tickboxes exist');
 ben.checked=true;ben.listeners.change();
 await a.window.NOUX_DEPARTURE.whenSaved();
 let updated=await plaintext(key);
 assert.equal(updated.check['Benjamin:documents'],true,'Benjamin completion persists');
 assert.equal(Boolean(updated.check['Lyna:documents']),false,'Lyna remains independent');
 const gifts=nodes(a.document.body).find(n=>n.tagName==='button'&&n.textContent==='Bring home from NYC');assert(gifts);
 gifts.click();
 const form=nodes(a.document.body).find(n=>n.tagName==='form');assert(form,'On-the-fly add form exists');
 const discovery=nodes(form).find(n=>n.tagName==='button'&&n.textContent==='Suggest best day');
 const finder=nodes(form).find(n=>n.tagName==='button'&&n.textContent==='Find shops live');
 assert(discovery&&finder,'New item supports both route-based day recommendation and live shop search');
 const inp=nodes(form).find(n=>n.tagName==='input'&&n.required);assert(inp);
 inp.value='Unique New York souvenir';
 discovery.click();
 const assignedDay=nodes(form).find(n=>n.tagName==='select');
 assert.equal(assignedDay.value,'fri','Midtown souvenir defaults to final shopping day');
 finder.click();
 assert(a.window.openedLinks.some(x=>x.startsWith('https://www.google.com/maps/search/?api=1&query=')&&x.includes('Unique%20New%20York%20souvenir')),'Shop search opens a live Google Maps query');
 form.listeners.submit({preventDefault(){}});
 await a.window.NOUX_DEPARTURE.whenSaved();
 updated=await plaintext(key);
 assert(updated.items.some(x=>x.name==='Unique New York souvenir'&&x.custom),'New gift added and saved encrypted');
 assert(!saved.noux_departure_checklists_aes_v1.includes('Unique New York souvenir'),'Custom gift text encrypted');
 a=await instance(key);
 a.document.body.children.find(n=>n.className==='noux-departure-launcher').click();
 assert(nodes(a.document.body).some(x=>x.attrs&&x.attrs['aria-label']==='Benjamin · Passport, ESTA and entry papers'&&x.checked),'Reload restores Benjamin checkbox state');
 assert((await plaintext(key)).check['Benjamin:documents'],'Reopening after reload preserves tick');
 console.log('Departure kit PASS: AES-GCM local state, independent travellers, custom gift, holiday caveats and persisted reload.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
