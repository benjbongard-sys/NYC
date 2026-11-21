/* NOUX cross-device merge: synthetic data only. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('sync-core.js','utf8');
assert(!/private\.vault\.json|NOUX_PASSPHRASE|132 W 47th|Sanctuary Hotel/.test(source));
const w={};vm.runInNewContext(source,{window:w});
const sync=w.NOUX_SYNC_CORE;
const storage=data=>{
 const state={...data};
 return {getItem:k=>state[k]??null,setItem:(k,v)=>{state[k]=v},removeItem:k=>{delete state[k]},...Object.fromEntries(Object.entries(state))};
};
// A Storage-like object must support enumeration and re-enumeration.
function db(entries){
 const x={...entries};
 x.getItem=function(k){return Object.hasOwn(this,k)&&typeof this[k]==='string'?this[k]:null};
 x.setItem=function(k,v){this[k]=v};
 x.removeItem=function(k){delete this[k]};
 return x;
}
const ben=db({
 nyc_lyna_trip_v6:JSON.stringify({choices:{c6:'butterflies',c9:'manhattan'},customStops:[{id:'stop-a',title:'Ben custom stop'}]}),
 noux_choice_journal_v2:JSON.stringify({pinned:{guggenheim:true}})
});
const lyna=db({
 nyc_lyna_trip_v6:JSON.stringify({choices:{c6:'butterflies',c9:'manhattan'},customStops:[{id:'stop-b',title:'Lyna custom stop'}]})
});
const items=[{id:'cookies',name:'Cookies',bought:false,packed:false,recipient:''}];
const bcheck={check:{'Benjamin:phone':false,'Lyna:phone':false},items};
const lcheck=JSON.parse(JSON.stringify(bcheck));
const f1=sync.scan(ben,bcheck),f2=sync.scan(lyna,lcheck);
const largePhoto=db({nyc_lyna_trip_v6:JSON.stringify({customStops:[{id:'large-art',title:'Gallery with picture',photo:'data:image/jpeg;base64,'+'A'.repeat(210000)}]})});
const photoFields=sync.scan(largePhoto,{check:{},items:[]});
assert(Object.keys(photoFields).some(k=>k.includes('large-art')&&k.includes('title')),
 'Large picture does not suppress the custom stop metadata');
assert(!Object.keys(photoFields).some(k=>k.includes('large-art')&&k.includes('photo')),
 'Large photo remains local rather than breaking all cloud syncing');
const freshDevice=db({nyc_lyna_trip_v6:JSON.stringify({choices:{},customStops:[]})});
const empty=sync.scan(freshDevice,{check:{},items:[]});
assert(!Object.keys(empty).some(k=>k.includes('customStops')||k.includes('choices')),
 'An empty new-device list cannot overwrite another phone’s nonempty stops and preferences');
const freshMerged=sync.merge(sync.diff({},f1,{},'ben',()=>100),
 sync.diff({},empty,{},'lyna',()=>101));
sync.apply(freshDevice,{check:{},items:[]},freshMerged);
assert(JSON.parse(freshDevice.getItem('nyc_lyna_trip_v6')).customStops.some(x=>x.id==='stop-a'),
 'Existing custom stops survive pairing with a fresh phone');
assert(Object.keys(f1).some(k=>k.includes('stop-a')),'Custom stops split by stable id');
const doc1=sync.diff({},f1,{},'ben',()=>100);
const doc2=sync.diff({},f2,{},'lyna',()=>101);
const merged=sync.merge(doc1,doc2);
let state=sync.apply(ben,bcheck,merged);
assert.deepEqual(JSON.parse(ben.getItem('nyc_lyna_trip_v6')).customStops.map(x=>x.id).sort(),['stop-a','stop-b'],'Independent custom stops merge');
const both=sync.scan(ben,state.checklist);
const editedBen={...both,[JSON.stringify(['@noux-departure','items','#cookies','bought'])]:true,[JSON.stringify(['@noux-departure','check','Benjamin:phone'])]:true};
const editedLyna={...both,[JSON.stringify(['@noux-departure','items','#cookies','packed'])]:true,[JSON.stringify(['@noux-departure','check','Lyna:phone'])]:true};
const nextBen=sync.diff(both,editedBen,merged,'ben',()=>200);
const nextLyna=sync.diff(both,editedLyna,merged,'lyna',()=>210);
const all=sync.merge(nextBen,nextLyna);
state=sync.apply(ben,state.checklist,all);
assert.equal(state.checklist.check['Benjamin:phone'],true);
assert.equal(state.checklist.check['Lyna:phone'],true);
assert(state.checklist.items[0].bought&&state.checklist.items[0].packed,'Bought and Packed from different devices must both survive');
const updated=sync.scan(ben,state.checklist);
const remove=JSON.parse(ben.getItem('nyc_lyna_trip_v6'));remove.customStops=remove.customStops.filter(x=>x.id!=='stop-a');
ben.setItem('nyc_lyna_trip_v6',JSON.stringify(remove));
const deletion=sync.diff(updated,sync.scan(ben,state.checklist),all,'ben',()=>300);
sync.apply(lyna,lcheck,deletion);
const remaining=JSON.parse(lyna.getItem('nyc_lyna_trip_v6')).customStops;
assert(!remaining.some(x=>x.id==='stop-a'),'Deleted custom stop should have a tombstone');
assert(remaining.some(x=>x.id==='stop-b'),'Unrelated Lyna custom stop preserved');
ben.setItem('noux_sync_auth_v1','sensitive');
ben.setItem('noux_custom_api_token','private-token');
assert(!Object.keys(sync.scan(ben,state.checklist)).some(k=>k.includes('sync_auth')||k.includes('api_token')),'Never capture pairing credentials');
const selectionKey=JSON.stringify(['nyc_lyna_trip_v6','choices','c9']);
const sameField=sync.merge({[selectionKey]:{value:'manhattan',t:400,device:'ben'}},{[selectionKey]:{value:'williamsburg',t:401,device:'lyna'}});
assert.equal(sameField[selectionKey].value,'williamsburg','Same selection uses last edit');
// The interactive travel Passport and booking-readiness flags share the existing
// choice journal. Progress for each traveller must remain independent.
const reviewA=db({noux_choice_journal_v2:JSON.stringify({nouxPassport:{Lyna:{reviewed:{'choice:c1':123},deferred:{'choice:c6':124}}},nouxReadiness:{'mon:cruise':{handled:true,at:125}}})});
const reviewB=db({noux_choice_journal_v2:JSON.stringify({nouxPassport:{Benjamin:{reviewed:{'choice:c2':126},deferred:{}}},nouxReadiness:{'tue:museum':{handled:true,at:127}}})});
const jA=sync.diff({},sync.scan(reviewA,{check:{},items:[]}),{},'lyna',()=>400);
const jB=sync.diff({},sync.scan(reviewB,{check:{},items:[]}),{},'ben',()=>401);
const together=sync.merge(jA,jB);
sync.apply(reviewA,{check:{},items:[]},together);
const journal=JSON.parse(reviewA.getItem('noux_choice_journal_v2'));
assert(journal.nouxPassport.Lyna.reviewed['choice:c1']===123,'Lyna Passport stamp retained');
assert(journal.nouxPassport.Benjamin.reviewed['choice:c2']===126,'Benjamin Passport stamp retained');
assert(journal.nouxPassport.Lyna.deferred['choice:c6']===124,'Deferred decisions retained');
assert(journal.nouxReadiness['mon:cruise'].handled&&journal.nouxReadiness['tue:museum'].handled,
 'Ticket-readiness reviews merge without overwriting each other');
console.log('NO UX sync-core PASS: separate choices, per-person ticks, bought/packed, custom-stop add/delete, credential exclusion.');
