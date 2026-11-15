/* Synthetic tests: no private itinerary source or trip passphrase. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const script=fs.readFileSync('choice-orchestrator.js','utf8');
assert(!/NOUX_PASSPHRASE|132 W 47th|Sanctuary Hotel|private\.vault\.json/.test(script),'No private information in public module');
const db={};const storage={getItem:k=>db[k]||null,setItem:(k,v)=>{db[k]=v}};
const P={};
for(const id of ['zabars','oak','amnh','dailyProvisions','guggenheim','albertine','chelsea','luhring','pace','highline','moma','rockefeller','joespizza','cultureEspresso','nypl','snfl','golden','awoke','stella','domino','maisonPremiere','bamharvey','venue'])P[id]={name:id,address:id+', New York City, USA',lat:40.76,lng:-73.98};
const choices=[{id:'c6',day:'tue',title:'Museum choice',options:[['butterflies','AMNH Butterfly Vivarium'],['guggenheim','Guggenheim'],['chelsea','Chelsea galleries']]},{id:'c2',day:'tue',options:[['bluenote','Live jazz']]}];
const defaults={c6:'butterflies',c2:'bluenote'};
const ev=(id,start,end,title,place,kind='experience',status='proposed')=>({id,start,end,title,place,kind,status,detail:'Test event'});
const base={
 tue:[ev('breakfast','08:45','09:45','Breakfast','zabars','food'),ev('museum','10:15','12:05','AMNH','amnh','museum'),
 ev('lunch','12:15','13:10','Lunch','dailyProvisions','food'),ev('park','13:20','14:10','Oak','oak','walk'),
 ev('books','14:30','15:40','Albertine','albertine','culture'),
 ev('reset','16:10','17:23','MoMA','moma','museum'),
 ev('music','19:05','21:45','Blue Note','venue','music','ticket-to-check')],
 wed:[ev('late','09:15','10:05','Breakfast','cultureEspresso','food'),ev('library','10:15','11:30','NYPL','nypl','culture'),
 ev('snfl','11:35','12:15','SNFL','snfl','culture'),ev('lunch','12:35','13:45','Golden Diner','golden','food'),
 ev('vintage','14:30','15:06','Awoke','awoke','shopping'),ev('vintage_stella','15:17','16:02','Stella','stella','shopping'),
 ev('domino','16:20','17:10','Domino','domino','walk'),ev('hotel','18:05','19:25','Oysters','maisonPremiere','food'),
 ev('hotel_view','19:40','20:40','Rooftop','venue','cocktail'),
 ev('explore_wed_bamharvey','19:30','20:55','BAM La Distance','bamharvey','theatre','ticket-to-check'),
 ev('night','22:00','02:00','Soul in the Horn','venue','club')],
 mon:[ev('cruise','16:00','18:00','Cruise','venue','highlight','booked')],
 thu:[ev('parade','09:40','11:15','Macy’s parade','venue','highlight','public-event')],
 fri:[ev('pickup','12:00','13:00','Transfer','venue','logistics','verify')]
};
const env={window:{NYC_DATA:{P,CHOICES:choices,DEFAULT:defaults},NYC_PLAN:{day:day=>base[day].map(x=>({...x}))}},localStorage:storage,document:{dispatchEvent:()=>{}},CustomEvent:function(){},Date,Set,JSON,Object,Array,Number,Math};
vm.runInNewContext(script,env,{filename:'choice-orchestrator.js'});
const app=env.window.NOUX_CHOICES;
assert.equal(app.install(),true);
assert(choices[0].options.some(x=>x[0]==='all'),'All activities option appears in decision card');
assert(choices.some(c=>c.id==='c11'&&c.options.some(x=>x[0]==='wed')&&c.options.some(x=>x[0]==='fri')&&c.options.some(x=>x[0]==='skip')),'Sunrise can be scheduled once, swapped to Friday, or skipped');
const mins=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
function assertClean(day,c){
 const list=env.window.NYC_PLAN.day(day,c);
 for(let i=1;i<list.length;i++){
  const a=list[i-1],b=list[i];
  const end=mins(a.end)+(mins(a.end)<mins(a.start)?1440:0);
  assert(end<=mins(b.start),'Overlap '+day+': '+a.id+' / '+b.id);
 }
 return list;
}
const all={...defaults,c6:'all'};
const tue=assertClean('tue',all),wed=assertClean('wed',all);
for(const id of ['allart_butterflies','allart_guggenheim','allart_luhring','allart_pace'])assert(tue.some(x=>x.id===id),'Missing combined Tuesday '+id);
for(const id of ['art_wed_moma','art_wed_library','art_wed_snfl','wed_to_whitney','wed_frenchette','wed_whitney','wed_dante'])assert(wed.some(x=>x.id===id),'Missing shifted Wednesday '+id);
assert(!wed.some(x=>['vintage','vintage_stella','domino','hotel_view','explore_wed_bamharvey','wed_bam'].includes(x.id)),'Manhattan-first Wednesday must not force Williamsburg or an unbooked show');
assert(!wed.some(x=>x.place==='golden'),'Do not backtrack to Golden Diner before Whitney on a Manhattan day');
assert.equal(wed.find(x=>x.id==='wed_whitney').start,'14:05','Art-heavy day reaches Whitney after café lunch');
assert(!tue.some(x=>x.id==='allart_moma'),'MoMA must move to Wednesday when Chelsea included');
assert(tue.some(x=>x.id==='music'&&x.start==='19:05'),'Evening concert must be preserved');
assert(wed.some(x=>x.id==='night'&&x.end==='00:45'),'Night club must be preserved with early Thanksgiving departure suggested');
assert(!wed.some(x=>x.id==='art_wed_bam_transfer'||x.id==='wed_to_bam'),'No BAM transfer when theatre is not selected');
const brooklyn=assertClean('wed',{...all,c9:'williamsburg',c10:'bam'});
for(const id of ['wed_domino','wed_westlight','wed_oysters','wed_to_bam','wed_bam','night'])assert(brooklyn.some(x=>x.id===id),'Missing explicitly selected Brooklyn+theatre '+id);
assert(brooklyn.find(x=>x.id==='wed_domino').end==='15:25','Waterfront photographs should take 25 minutes');
const soho=assertClean('wed',{...defaults,c9:'williamsburg',c10:'skip'});
for(const id of ['wed_housingworks','wed_to_golden','wed_domino'])assert(soho.some(x=>x.id===id),'Brooklyn day includes logical SoHo → Lower Manhattan corridor: '+id);
const vintage=assertClean('wed',{...all,c9:'williamsburg_vintage',c10:'skip'});
for(const id of ['wed_awoke','wed_stella','wed_domino','wed_westlight'])assert(vintage.some(x=>x.id===id),'Missing requested fuller vintage afternoon '+id);
const dj=assertClean('wed',{...all,c9:'williamsburg',c10:'skip',c3:'louievega'});
assert(dj.some(x=>x.id==='night'&&x.place==='superiorIngredients'&&x.end==='00:45'),'Louie Vega is a selected indoor house show and not a rooftop');
const single=assertClean('tue',defaults);
assert(!single.some(x=>x.id==='allart_guggenheim'),'Single choice does not force other museum');
assert(app.alternatives(defaults).some(x=>x.group==='c6'&&x.value==='guggenheim'),'Unselected choice persists');
assert.equal(app.toggle('guggenheim'),true,'Pin additional museum');
const pinned=assertClean('tue',defaults);
assert(pinned.some(x=>x.id==='allart_guggenheim')&&pinned.some(x=>x.id==='allart_butterflies'),'Pinned museum combines with original without overwriting selection');
assert(db.noux_choice_journal_v2,'Local journal persisted');
assert.equal(app.toggle('guggenheim'),false,'Can unpin');
assert(!assertClean('tue',defaults).some(x=>x.id==='allart_guggenheim'),'Unpin restores single choice');
assert.equal(env.window.NYC_PLAN.day('mon',defaults)[0].status,'booked','Unrelated bookings untouched');
for(const selection of ['all','butterflies','guggenheim','chelsea']){
 assertClean('tue',{...defaults,c6:selection});assertClean('wed',{...defaults,c6:selection});
}
// A user-confirmed booking must survive automatic conflict repair, even if an
// alternative plan cannot be made collision-free and needs manual review.
base.wed.find(x=>x.id==='hotel_view').status='booked';
const protectedWed=env.window.NYC_PLAN.day('wed',defaults);
assert(protectedWed.some(x=>x.id==='hotel_view'&&x.status==='booked'),
  'A confirmed rooftop booking must never be silently removed');
assert(!protectedWed.some(x=>x.id==='art_wed_bam_transfer'||x.id==='wed_to_bam'),
  'No unselected BAM transfer should displace confirmed reservation');
const bookedVsBam=env.window.NYC_PLAN.day('wed',{...all,c9:'williamsburg',c10:'bam'});
assert(bookedVsBam.some(x=>x.id==='hotel_view'&&x.status==='booked'),'Confirmed rooftop booking must survive choice conflict');
assert(!bookedVsBam.some(x=>x.id==='wed_to_bam'||x.id==='wed_bam'),'Never route to optional BAM when it overlaps confirmed rooftop');
assert(app.alternatives({...all,c9:'williamsburg',c10:'bam'}).some(x=>/La Distance/.test(x.title)),'Postponed theatre remains visible in second chances');
base.wed.find(x=>x.id==='hotel_view').status='proposed';
console.log('Choice orchestrator PASS: all art, Wednesday geography, BAM protection, skyline and music selection.');
