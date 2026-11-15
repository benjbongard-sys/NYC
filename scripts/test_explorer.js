/* Public regression tests. Uses synthetic data: no private itinerary or passphrase. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('explorer.js','utf8');
assert(!/2026-11-23|132 W 47th|Sanctuary Hotel/.test(source),'No personal itinerary details in public explorer');
const state={};
const localStorage={getItem:key=>state[key]||null,setItem:(key,v)=>{state[key]=v}};
const P={
  pier:{name:'Test Pier',area:'Midtown',lat:40.7604,lng:-74.0047,kind:'cruise'},
  venue:{name:'Test Venue',area:'Midtown',lat:40.7600,lng:-73.9800,kind:'culture'},
  books:{name:'Test Library',area:'Midtown',lat:40.7500,lng:-73.9800,kind:'culture'},
  domino:{name:'Test Waterfront',area:'Williamsburg',lat:40.715,lng:-73.968,kind:'park'},
  chocolate:{name:'Test Club',area:'Brooklyn',lat:40.7087,lng:-73.9229,kind:'club'},
  centennial_parade:{name:"100th Macy's Thanksgiving Day Parade",area:'Midtown',lat:40.76,lng:-73.98,kind:'event'}
};
const original={
 mon:[{id:'flight',start:'10:55',end:'12:30',title:'Airport arrival',place:'venue',kind:'logistics',status:'arranged'},
      {id:'cruise',start:'16:00',end:'18:00',title:'Harbour cruise',place:'pier',kind:'highlight',status:'booked'},
      {id:'reset',start:'18:00',end:'20:00',title:'Back to hotel and rest',place:'venue',kind:'recovery',status:'proposed'}],
 tue:[{id:'museum',start:'10:30',end:'12:05',title:'Museum',place:'venue',kind:'museum',status:'proposed'},
      {id:'lunch',start:'12:15',end:'13:10',title:'Lunch',place:'venue',kind:'food',status:'proposed'},
      {id:'books',start:'14:30',end:'15:40',title:'Bookshop',place:'books',kind:'culture',status:'proposed'},
      {id:'reset',start:'16:10',end:'18:15',title:'Rest',place:'venue',kind:'recovery',status:'proposed'},
      {id:'music',start:'19:05',end:'21:45',title:'Concert',place:'venue',kind:'music',status:'ticket-to-check'}],
 wed:[{id:'library',start:'10:15',end:'11:30',title:'Library',place:'books',kind:'culture',status:'proposed'},
      {id:'waterfront',start:'16:20',end:'17:10',title:'Waterfront',place:'domino',kind:'walk',status:'proposed'},
      {id:'hotel',start:'18:05',end:'21:10',title:'Hotel dinner rest',place:'venue',kind:'recovery',status:'proposed'},
      {id:'night',start:'22:00',end:'02:00',title:'Dance night',place:'chocolate',kind:'club',status:'ticket-to-check'}],
 thu:[{id:'parade',start:'06:35',end:'11:20',title:"100th Macy's Thanksgiving Day Parade",place:'centennial_parade',kind:'highlight',status:'public-event'},
      {id:'park',start:'13:00',end:'14:00',title:'Walk',place:'venue',kind:'walk',status:'proposed'},
      {id:'dinner',start:'19:00',end:'20:00',title:'Thanksgiving dinner',place:'venue',kind:'dinner',status:'hours-to-check'}],
 fri:[{id:'breakfast',start:'09:00',end:'10:15',title:'Breakfast & pack',place:'venue',kind:'logistics',status:'arranged'},
      {id:'walk',start:'10:30',end:'11:25',title:'Midtown stroll',place:'venue',kind:'walk',status:'proposed'},
      {id:'pickup',start:'12:00',end:'13:00',title:'Airport pickup',place:'venue',kind:'logistics',status:'verify'}]
};
const choices={};
const ctx={window:{NYC_DATA:{
  P, DEFAULT:choices, DAYS:[['mon','MON','23 NOV'],['tue','TUE','24 NOV'],['wed','WED','25 NOV'],['thu','THU','26 NOV'],['fri','FRI','27 NOV']],
  DATES:{mon:'2026-11-23',tue:'2026-11-24',wed:'2026-11-25',thu:'2026-11-26',fri:'2026-11-27'},
  WISHES:[['MoMA','art','tue','core'],['Whitney','art','wed','core'],['Rough Trade / vinyl','vinyl','wed','core'],['Maison Premiere oysters','food','wed','choice'],['Top of the Rock','view','fri','swap']]
},NYC_PLAN:{day:(day)=>JSON.parse(JSON.stringify(original[day]))}},
localStorage,document:{},setInterval:()=>0,Date,Math,Intl,Set,Object,Array,Number,JSON,String};
vm.runInNewContext(source,ctx,{filename:'explorer.js'});
assert(ctx.window.NOUX_EXPLORER.install({headless:true}),'Explorer installs after private data');
const mins=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
const used=new Set(),days=Object.keys(original);
for(const day of days){
 const result=ctx.window.NYC_PLAN.day(day,choices);
 for(const fixed of original[day].filter(x=>['arranged','booked'].includes(x.status)||x.id==='parade')){
  assert(result.some(e=>e.id===fixed.id&&e.start===fixed.start&&e.end===fixed.end),'Fixed stop preserved '+day+'/'+fixed.id);
 }
 for(let i=1;i<result.length;i++){
  const prev=result[i-1],current=result[i];
  const end=mins(prev.end)+(mins(prev.end)<mins(prev.start)?1440:0);
  assert(end<=mins(current.start),'No overlap '+day+' '+prev.id+' > '+current.id);
 }
 for(const e of result.filter(x=>x.id.startsWith('explore_')&&!x.id.startsWith('explore_walk_'))){
  assert(!used.has(e.place),'No duplicate auto-planned place: '+e.place);
  used.add(e.place);
 }
}
assert(used.has('moma'),'Missing core wishlist attraction MoMA should be offered in an open slot');
assert(used.has('maisonpremiere'),'Oyster experience should fill a Wednesday dinner gap');
assert(used.has('bamharvey'),'Ticketed BAM option should fill a valid Wednesday theatre slot');
assert(!ctx.window.NYC_PLAN.day('wed',choices).some(x=>x.id.includes('met')),'Met never scheduled on closed Wednesday');
state.noux_explore_pace_v1='original';
for(const day of days){
 assert.equal(JSON.stringify(ctx.window.NYC_PLAN.day(day,choices)),JSON.stringify(original[day]),'Original pace preserves baseline '+day);
}
console.log('NOUX Explorer tests passed: fixed events, midnight, no collisions, no duplicates, all-day wishlist, revertible pace.');
