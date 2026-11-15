/* Synthetic regression fixtures: private itinerary and passphrase are never published. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('venues.js','utf8');
assert(!/private\.vault\.json|NOUX_PASSPHRASE|132 W 47th|Sanctuary Hotel/.test(source));
const choiceIds=[
 ['c1',['rest','stcloud','nubeluz']],['c2',['bluenote','rest']],['c3',['soul','rest']],
 ['c4',['lebain','morales','westmorales','boogie','rest']],['c5',['highline','mercer','rest']],
 ['c6',['butterflies','chelsea','guggenheim']],['c7',['standard','river']],['c8',['rockefeller','grand','rest']]
];
const defaults={c1:'rest',c2:'bluenote',c3:'soul',c4:'lebain',c5:'highline',c6:'butterflies',c7:'standard',c8:'rockefeller'};
const ev=(id,start,end,title,place,kind,status='proposed')=>({id,start,end,title,place,kind,status,detail:'A general location to resolve'});
const original={
 mon:[ev('flight','10:55','12:30','Airport','airport','logistics','arranged'),ev('cruise','16:00','18:00','Harbour cruise','pier','highlight','booked'),ev('dinner','19:20','20:35','Dinner','hotel','food')],
 tue:[ev('breakfast','08:45','09:45','Breakfast','hotel','food'),ev('lunch','12:15','13:10','Nearby lunch','hotel','food'),ev('reset','16:10','18:15','Rest','hotel','recovery')],
 wed:[ev('vintage','14:30','16:15','Vintage','district','shopping'),ev('hotel','18:05','21:10','Return to hotel','hotel','recovery'),ev('explore_wed_bamharvey','19:30','20:55','Theatre','bamharvey','theatre','ticket-to-check')],
 thu:[ev('lunch','13:10','14:05','Lunch','hotel','food'),ev('dinner','19:00','20:15','Holiday dinner','hotel','dinner'),ev('night','22:00','01:30','Music','club','club')],
 fri:[ev('breakfast','09:45','10:15','Breakfast','hotel','logistics','arranged'),ev('pickup','12:00','13:00','Airport pickup','hotel','logistics','verify')]
};
const w={NYC_DATA:{P:{},DEFAULT:defaults,CHOICES:choiceIds.map(row=>({id:row[0],options:row[1].map(x=>[x,x,'generic'])}))},NYC_PLAN:{day:(d)=>JSON.parse(JSON.stringify(original[d]))}};
vm.runInNewContext(source,{window:w},{filename:'venues.js'});
assert.equal(w.NOUX_VENUES.install(),true);
assert(w.NOUX_VENUES.catalogue()>=25,'25+ named venues');
assert(w.NYC_DATA.P.modernBar.address.includes('53rd St'),'Monday dinner address');
assert(w.NYC_DATA.P.kru.url.startsWith('https://'),'Thanksgiving KRU website');
assert(w.NYC_DATA.P.pier57roof.address.includes('11th Ave'),'Pier 57 route');
const day=(d,c={})=>w.NYC_PLAN.day(d,{...defaults,...c});
const entry=(d,id,c={})=>{let e=day(d,c).find(x=>x.id===id);assert(e,'Missing '+d+'/'+id);return e};
assert.equal(entry('mon','dinner').place,'modernBar');
assert.equal(entry('mon','dinner',{c1:'stcloud'}).place,'osteriaDoge');
assert.equal(entry('mon','dinner',{c1:'nubeluz'}).place,'zaytinya');
assert(day('mon').some(e=>e.id==='named_mon_rockefeller'),'Monday evening walk');
assert.equal(entry('tue','lunch').place,'dailyProvisions');
assert.equal(entry('tue','lunch',{c6:'chelsea'}).place,'losTacosChelsea');
assert.equal(entry('wed','vintage').place,'awoke');
assert(day('wed').some(e=>e.id==='vintage_stella'&&e.place==='stella'),'Second thrift store');
assert(day('wed').some(e=>e.id==='explore_wed_bamharvey'&&/La Distance/.test(e.title)),'BAM show named');
assert.equal(entry('thu','dinner').place,'standardGrill');
const leBain=entry('thu','night',{c4:'lebain'});
assert.equal(leBain.start,'22:00','Official Thanksgiving doors at 22:00');
assert.equal(leBain.end,'00:45','Optional early departure, not venue closure time');
assert(/Thanksgiving/.test(leBain.title)&&/capacity/.test(leBain.detail),'DJ night and door caution shown');
assert(!/guaranteed rooftop access/i.test(leBain.detail),'No claim of guaranteed outdoor terrace access');
assert.equal(entry('thu','dinner',{c4:'morales'}).place,'kru');
assert.equal(entry('thu','dinner',{c4:'westmorales'}).place,'leuca');
assert.equal(entry('thu','dinner',{c4:'boogie'}).place,'smithNoMad');
assert.equal(entry('thu','dinner',{c7:'river'}).place,'river');
assert.equal(entry('thu','night',{c4:'boogie',c7:'river'}).start,'21:15');
assert.equal(entry('fri','breakfast').place,'hotel','Use included hotel buffet for Friday breakfast');
assert.equal(entry('fri','breakfast').start,'09:00','Buffet is within 07:00–10:00 service');
assert.equal(entry('fri','breakfast').end,'09:35','Allow checkout and final sightseeing');
assert.equal(entry('fri','breakfast').status,'proposed','Breakfast is not reserved');
assert.equal(entry('fri','pickup').status,'verify','Pickup remains unconfirmed');
assert(day('mon').some(e=>e.id==='cruise'&&e.status==='booked'),'Booked cruise preserved');
const mins=t=>+t.slice(0,2)*60+ +t.slice(3);
for(const c4 of ['lebain','morales','westmorales','boogie','rest']){
for(const c7 of ['standard','river']){
 let items=day('thu',{c4,c7});
 for(let i=1;i<items.length;i++){let a=items[i-1],b=items[i],end=mins(a.end)+(mins(a.end)<mins(a.start)?1440:0);
  assert(end<=mins(b.start),'Holiday schedule overlaps '+c4+'/'+c7+' '+a.id+' '+b.id);
 }
}}
console.log('NOUX named-venue tests PASS: holidays, actual addresses, no overlaps, no invented bookings.');
