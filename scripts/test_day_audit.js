/* Public regression fixture: entirely synthetic locations and timings. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('day-audit.js','utf8');
assert(!/private\.vault\.json|NOUX_PASSPHRASE|132 W 47th|Sanctuary Hotel/.test(source),'No personal itinerary or passphrase in public audit');
const db={},localStorage={getItem:k=>db[k]||null,setItem:(k,v)=>{db[k]=v}};
const P={hotel:{name:'Hotel',address:'Midtown New York, NY',area:'Midtown',lat:40.758,lng:-73.983},times:{name:'Times Square',address:'Times Square, New York, NY',area:'Midtown',lat:40.759,lng:-73.984},pier:{name:'Pier',address:'Pier 83, New York, NY',area:'Midtown',lat:40.762,lng:-74.001},park:{name:'Photo',address:'Midtown New York, NY',area:'Midtown',lat:40.757,lng:-73.986},losTacosTimes:{name:'Tacos',address:'229 West 43rd New York, NY',lat:40.756,lng:-73.988}};
const e=(id,start,end,title,place,kind='walk',status='proposed')=>({id,start,end,title,place,kind,status,detail:''});
const orig={
 mon:[e('flight','10:55','12:30','Flight','hotel','flight','arranged'),e('early_art','15:00','15:35','Photo detour','park'),e('cruise','16:00','18:00','Cruise','pier','highlight','booked')],
 tue:[e('photo','10:00','11:30','Oak Bridge photo stop','park')],
 wed:[e('whitney','14:25','15:45','Whitney Museum','park','museum')],
 thu:[e('parade','06:35','11:15',"Macy's Thanksgiving Day Parade",'times','highlight','public-event')],
 fri:[e('breakfast','09:45','10:15','Breakfast','hotel','food'),e('walk','10:30','11:25','Walk','park'),e('pickup','12:00','13:00','Airport pickup time to confirm','hotel','logistics','verify'),e('flight','23:15','23:59','Return flight','hotel','flight','booked')]
};
const window={NYC_DATA:{P},NYC_PLAN:{day:day=>orig[day].map(x=>({...x}))}};
vm.runInNewContext(source,{window,localStorage,Date,Math,Number,String,JSON,Object,Array,Set},{filename:'day-audit.js'});
assert(window.NOUX_DAY_AUDIT.install(),'Audit installs after decrypt');
const day=d=>window.NYC_PLAN.day(d,{});
const mon=day('mon');
assert(mon.some(x=>x.id==='cruise'&&x.status==='booked'),'Confirmed cruise survives');
assert(mon.some(x=>x.id==='mon_cruise_boarding'),'Boarding buffer included');
assert(!mon.some(x=>x.id==='early_art'),'Detour over boarding window is deferred');
const tue=day('tue');
assert.equal(tue.find(x=>x.id==='photo').end,'10:25','Photo stop capped');
const thu=day('thu');
assert.equal(thu.find(x=>x.id==='parade').start,'09:40','Early parade corrected');
const fri=day('fri');
assert.equal(fri.find(x=>x.id==='pickup').start,'15:50','Unconfirmed noon pickup is not treated as fixed');
assert(fri.some(x=>x.id==='audited_bags'),'Hotel luggage collection preserved');
assert(fri.some(x=>x.id==='audited_grand_central'),'Final afternoon near Midtown');
assert.equal(fri.find(x=>x.id==='flight').start,'23:15','Booked flight unaffected');
for(const d of ['mon','tue','wed','thu','fri']){
 const arr=day(d);
 for(let i=1;i<arr.length;i++){
  const a=arr[i-1],b=arr[i];
  const start=+a.start.slice(0,2)*60+ +a.start.slice(3);
  let finish=+a.end.slice(0,2)*60+ +a.end.slice(3);
  if(finish<start)finish+=1440;
  const next=+b.start.slice(0,2)*60+ +b.start.slice(3);
  assert(finish<=next,'Overlapping events '+d+': '+a.id+' and '+b.id);
 }
}
const checks=window.NOUX_DAY_AUDIT.pending();
assert(checks.some(x=>x.day==='mon'&&/Photo detour/.test(x.title)),'Deferred stop remains recoverable');
console.log('Five-day route audit PASS: bookings, boarding, photo timing, weekday closures, parade and JFK transfer.');
