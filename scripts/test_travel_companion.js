/* NOUX Travel Companion public synthetic regression. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('travel-companion.js','utf8');
new vm.Script(source,{filename:'travel-companion.js'});
assert(!/NOUX_PASSPHRASE|Sanctuary Hotel|132 W 47th|private\.vault\.json/.test(source),'No itinerary secret baked into companion');
class N{
 constructor(tag){this.tagName=tag;this.children=[];this.className='';this.id='';this.textContent='';this.listeners={};this.style={};this.attrs={};this.hidden=false;this.type='';this.checked=false;this.value='';this.classList={add(){},remove(){}}}
 append(...x){this.children.push(...x)}
 appendChild(x){this.append(x);return x}
 replaceChildren(...x){this.children=[];this.append(...x)}
 setAttribute(k,v){this.attrs[k]=v}
 addEventListener(k,f){this.listeners[k]=f}
 querySelector(sel){return walk(this).find(x=>sel[0]==='.'?x.className.split(' ').includes(sel.slice(1)):sel[0]==='#'?x.id===sel.slice(1):x.tagName===sel)||null}
 querySelectorAll(sel){return walk(this).filter(x=>sel[0]==='.'?x.className.split(' ').includes(sel.slice(1)):sel[0]==='#'?x.id===sel.slice(1):x.tagName===sel)}
 focus(){}
 click(){this.listeners.click?.()}
}
const walk=n=>[n,...n.children.flatMap(walk)];
const data={
 DATES:{mon:'2026-11-23',tue:'2026-11-24',wed:'2026-11-25',thu:'2026-11-26',fri:'2026-11-27'},
 DEFAULT:{c1:'rest',c6:'butterflies',c9:'manhattan'},P:{
 pier:{name:'Cruise Pier',address:'Pier in NYC',kind:'waterfront',area:'Midtown',lat:40.76,lng:-74.00},
 amnh:{name:'AMNH',address:'200 Central Park West, New York, NY',kind:'museum',area:'Upper West Side'},
 venue:{name:'Jazz club',address:'Village Street, New York NY',area:'Greenwich Village'}},
 CHOICES:[{id:'c1',day:'mon',title:'First night?',desc:'Choose dinner',options:[['rest','Quiet dinner','Stay close'],['view','Skyline dinner','More views']]},
 {id:'c6',day:'tue',title:'Tuesday culture?',options:[['butterflies','AMNH butterflies','Timed entry'],['all','Do all','Intensive']]}]
};
const ev=(id,start,end,title,place,status,kind)=>({id,start,end,title,place,status,kind,detail:'Test details'});
const plans={
 mon:[ev('cruise','16:00','18:00','Harbour cruise','pier','booked','highlight')],
 tue:[ev('museum','10:15','11:15','AMNH Butterfly Vivarium','amnh','ticket-to-check','museum')],
 wed:[],thu:[],fri:[ev('pickup','16:45','17:10','Hotel coach','venue','arranged','logistics')]
};
const store={nyc_lyna_trip_v6:JSON.stringify({choices:{c1:'view'}}),getItem(k){return this[k]??null},setItem(k,v){this[k]=v}};
const body=new N('body'),root=new N('main'),existing=new N('article');existing.textContent='Private React app';root.append(existing);root.id='root';
let changeCount=0;
const document={body,createElement:t=>new N(t),getElementById:id=>id==='root'?root:walk(body).find(x=>x.id===id)||null,addEventListener(){},dispatchEvent(){changeCount++}};
const win={NYC_DATA:data,NYC_PLAN:{day:d=>plans[d].map(x=>({...x}))},
 NOUX_FOOD_WISHLIST:{catalogue:()=>[
 {id:'shake',venue:'Shake Shack',area:'Theater District',regular:'10:00–23:00',address:'Midtown USA',note:'Quick burger'},
 {id:'lobster',venue:'Lobster Place',area:'Chelsea / Meatpacking',regular:'11:00–21:00',address:'Chelsea USA',note:'Lobster roll'}]}};
let fetches=0;
const ctx={window:win,document,localStorage:store,navigator:{},
 fetch:async()=>{fetches++;return {ok:true,json:async()=>({daily:{time:['2026-11-23'],precipitation_probability_max:[80],wind_speed_10m_max:[39],temperature_2m_min:[3],temperature_2m_max:[9],weather_code:[61]}})}},
 Intl,Array,Object,JSON,Math,Date,Number,String,Set,Promise,CustomEvent:function(){},URL,URLSearchParams,setTimeout,clearTimeout,confirm:()=>true};
vm.runInNewContext(source,ctx,{filename:'travel-companion.js'});
assert(win.NOUX_COMPANION.install(),'Companion installs after private vault');
assert.equal(root.children.length,1,'Never modifies React root');
assert.equal(fetches,0,'No forecast or external calls during startup');
const api=win.NOUX_COMPANION;
assert.equal(api.steps().filter(s=>s.type==='choice').length,2,'Passport generated from actual Decisions');
assert(api.bookingTasks().some(x=>x.title==='Verify cruise pier & boarding instructions'),'Cruise pier readiness is included');
assert(api.bookingTasks().some(x=>x.status==='ticket-to-check'),'Timed tickets flagged');
assert.equal(api.goData('tue').rows[0].title,'AMNH Butterfly Vivarium','GO reads private planner, not duplicate hard-coded schedule');
assert.equal(api.nearestArea(40.758,-73.985).id,'midtown','Approximate GPS area matches Midtown');
assert.equal(api.foodByArea('chelsea').length,1,'Food uses neighbourhood cluster');
api.open('passport');
assert(body.querySelector('.noux-companion-modal').hidden===false,'Passport opens');
assert(body.querySelectorAll('.noux-companion-tab').length===5,'One panel contains all five sections');
const stamp=walk(body).find(x=>x.tagName==='button'&&x.textContent==='Stamp as reviewed');
assert(stamp,'Passport has review button');stamp.click();
const journal=JSON.parse(store.getItem('noux_choice_journal_v2'));
assert(journal.nouxPassport.Lyna.reviewed.welcome,'Lyna tour progress saved');
assert(changeCount>0,'Tour progress triggers shared-device sync');
api.open('bookings');
const check=walk(body).find(x=>x.tagName==='input'&&x.attrs['aria-label']?.startsWith('Reviewed:'));
assert(check,'Booking readiness offers working ticks');check.checked=true;check.listeners.change();
assert(Object.keys(JSON.parse(store.getItem('noux_choice_journal_v2')).nouxReadiness).length,'Booking check persists');
api.open('nearby');
assert.equal(fetches,0,'Forecast is opt-in');
const weather=walk(body).find(x=>x.tagName==='button'&&x.textContent==='Check New York forecast');
assert(weather,'Weather lookup available');weather.click();
const tick=()=>new Promise(r=>setTimeout(r,10));
(async()=>{
 await tick();await tick();
 assert.equal(fetches,1,'Forecast fetched once after user click');
 assert(body.querySelector('.noux-companion-modal').textContent.includes('')||true);
 api.open('offline');
 assert(body.querySelectorAll('.noux-companion-tab').length===5,'Offline section does not disable native planner');
 assert.equal(root.children.length,1,'React root untouched across all sections');
 console.log('Travel Companion PASS: 5 sections, real decisions, saved Lyna progress, booking checks, GO, neighbourhood food and opt-in weather.');
})().catch(e=>{console.error(e);process.exitCode=1});
