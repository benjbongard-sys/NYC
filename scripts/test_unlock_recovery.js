/* Synthetic browser boot test: no real itinerary, key or passphrase. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('unlock.js','utf8');
const {TextEncoder,TextDecoder}=require('node:util');
new vm.Script(source,{filename:'unlock.js'});
class Element {
 constructor(tag,id=''){this.tagName=tag;this.id=id;this.nodes=[];this.listeners={};this.text='';this.style={setProperty(){},width:'',display:''};this.dataset={};this.hidden=id==='root';this.disabled=false;this.value='';this.type='password';this.attrs={};this.classList={add(){},remove(){}}}
 set textContent(v){this.text=String(v)}
 get textContent(){return this.text+this.nodes.map(n=>n.textContent||'').join('')}
 get childElementCount(){return this.nodes.length}
 append(...items){this.nodes.push(...items)}
 appendChild(n){this.nodes.push(n);return n}
 addEventListener(k,cb){this.listeners[k]=cb}
 setAttribute(k,v){this.attrs[k]=v}
 focus(){}
}
async function boot({renders,basic=false}){
 const nodes=Object.fromEntries(['lock-screen','unlock-form','unlock-pass','unlock-submit','unlock-message','unlock-bar','lock-stars','toggle-visibility','root'].map(x=>[x,new Element('div',x)]));
 const scripts={
  'data.js':'window.NYC_DATA={P:{times:{lat:40.75,lng:-73.98}},DEFAULT:{},CHOICES:[]};',
  'itinerary.js':'window.NYC_PLAN={day:function(){return []}};',
  'mta.js':'/* schedule fixture */',
  'routeplanner.js':'/* router fixture */',
  'photo-sources.js':'/* photo fixture */',
  'custom-stops.js':'/* stops fixture */',
  'app.js':renders?'document.getElementById("root").appendChild(Object.assign(document.createElement("section"),{textContent:"Our unlocked NYC planner is successfully rendering the daily itinerary."}));':'/* simulate failed React root render */'
 };
 const decrypted=new TextEncoder().encode(JSON.stringify(scripts));
 const snapshot={};
 const sessionStorage={getItem(k){return snapshot[k]||null},setItem(k,v){snapshot[k]=v}};
 let context,installCount=0,installTiming=[];
 const win={addEventListener(){},removeEventListener(){},NOUX_EXPLORER:{install(){}},NOUX_VENUES:{install(){}},NOUX_CHOICES:{install(){installCount++;installTiming.push(nodes.root.childElementCount)}},NOUX_DAY_AUDIT:{install(){}},NOUX_SUBWAY:{install(){}},NOUX_DEPARTURE:{install:async()=>true}};
 const document={
  body:new Element('body'),head:new Element('head'),
  getElementById:id=>nodes[id]||this.body?.nodes.find(n=>n.id===id)||null,
  createElement:t=>new Element(t),
  dispatchEvent(){}
 };
 document.getElementById=id=>nodes[id]||document.body.nodes.find(n=>n.id===id)||null;
 document.head.appendChild=node=>{if(node.tagName==='script')vm.runInContext(node.textContent,context);return node};
 const location={href:'https://example.org/no-private-data/',protocol:'https:',search:basic?'?basic=1':'',assign(url){this.assigned=url}};
 const crypto={subtle:{importKey:async()=>({}),deriveKey:async()=>({}),decrypt:async()=>decrypted}};
 const fetch=async()=>({ok:true,json:async()=>({salt:'',iv:'',ct:'',iterations:10000})});
 const ctx={window:win,document,location,crypto,fetch,sessionStorage,URL,URLSearchParams,TextEncoder,TextDecoder,Uint8Array,
  atob:x=>Buffer.from(x,'base64').toString('binary'),setTimeout:fn=>{Promise.resolve().then(fn);return 1},CustomEvent:function(){},Promise,Object,Array,Math,Date,JSON};
 context=vm.createContext(ctx);
 vm.runInContext(source,context,{filename:'unlock.js'});
 nodes['unlock-pass'].value='dummy-test-secret-only';
 await nodes['unlock-form'].listeners.submit({preventDefault(){}});
 await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));
 return {document,window:win,nodes,location,sessionStorage,installCount,installTiming};
}
async function run(){
 const ok=await boot({renders:true});
 assert(ok.nodes.root.childElementCount>0,'Working private app populates root');
 assert(!ok.document.getElementById('noux-recovery'),'No false recovery overlay');
 assert(ok.installCount===1&&ok.installTiming[0]>0,'New choice logic is installed only after React first paint');
 const failed=await boot({renders:false});
 const banner=failed.document.getElementById('noux-recovery');
 assert(banner,'Blank root shows recovery overlay');
 const recoveryButton=banner.nodes[0].nodes.find(n=>n.tagName==='button');
 assert(recoveryButton,'Recovery overlay contains a usable basic-mode action');
 recoveryButton.onclick();
 assert(failed.location.assigned.includes('basic=1'),'Basic-mode URL works');
 assert.equal(failed.sessionStorage.getItem('noux_basic_mode'),'1','Basic mode preference saved for this tab only');
 const basicOk=await boot({renders:true,basic:true});
 assert(basicOk.nodes.root.childElementCount>0,'Basic mode renders decrypted app');
 assert.equal(basicOk.installCount,0,'Basic mode does not install optional choice extensions');
 console.log('Unlock recovery PASS: main paint before enhancement, blank-screen recovery, and independent basic mode.');
}
run().catch(e=>{console.error(e);process.exitCode=1});
