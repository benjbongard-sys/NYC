/* NOUX choice orchestrator. Runs after private itinerary unlock.
 * Adds a real "Do all three" option for the Tuesday cultural choices,
 * preserves choice history on this device, and proposes unselected options later.
 * No personal itinerary, hotel, private dates or passphrase are bundled in this script.
 */
(function(){
'use strict';
if(window.NOUX_CHOICES)return;
const KEY='noux_choice_journal_v2';
const ART=['butterflies','guggenheim','chelsea'];
const CAN_DELAY={c6:true};
let DATA=null,PLAN=null,BASE=null,installed=false,lastSignature='';
function store(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return {}}}
function save(j){try{localStorage.setItem(KEY,JSON.stringify(j))}catch(_){}}
function journal(){const j=store();j.pinned=j.pinned||{};j.choices=j.choices||{};j.history=j.history||{};return j}
function now(){return new Date().toISOString()}
function record(choices){
 if(!choices||typeof choices!=='object')return;
 const signature=JSON.stringify(Object.keys(DATA.DEFAULT||{}).sort().map(k=>[k,choices[k]||DATA.DEFAULT[k]]));
 if(signature===lastSignature)return;
 lastSignature=signature;
 const j=journal(),updated=now();
 Object.keys(DATA.DEFAULT||{}).forEach(id=>{
  const value=choices[id]||DATA.DEFAULT[id];
  if(j.choices[id]!==value){
   if(j.choices[id]!==undefined){(j.history[id]??=[]).push({value:j.choices[id],at:updated});j.history[id]=j.history[id].slice(-12)}
   j.choices[id]=value;
  }
 });
 save(j);
}
function pinned(v){return !!journal().pinned[v]}
function toggle(v){
 if(!ART.includes(v))return false;
 const j=journal();j.pinned[v]=!j.pinned[v];save(j);
 try{document.dispatchEvent(new CustomEvent('noux:replan',{detail:{kind:'art',choice:v}}))}catch(_){}
 return j.pinned[v];
}
function activeArt(choices){
 const c=(choices&&choices.c6)||DATA.DEFAULT.c6;
 if(c==='all')return new Set(ART);
 const set=new Set(ART.includes(c)?[c]:[]);
 const j=journal();ART.forEach(x=>{if(j.pinned[x])set.add(x)});
 return set;
}
function guidance(c,v){
 if(c.id==='c6'&&ART.includes(v))return 'Can fit in the Tuesday art trail; MoMA moves to Wednesday when needed.';
 if(c.id==='c9')return 'An alternate Wednesday geography, not an extra cross-river trip. Choosing it replaces the afternoon route.';
 if(c.id==='c10')return 'Optional 19:30 Fort Greene theatre; allow travel and admission time. No ticket assumed.';
 if(c.id==='c5')return 'Saved as another area to consider. It needs an opening-hours and transport check.';
 if(['c2','c3','c4'].includes(c.id))return 'Date-specific show or club. Preserved as an option, not automatically moved to another date.';
 if(c.id==='c1')return 'An alternative restaurant or rooftop, kept for a later evening if available.';
 if(c.id==='c7')return 'A different Thanksgiving table, not a second simultaneous dinner.';
 return 'Kept available in your choices. Review other days before adding.';
}
function alternatives(choices){
 const chosen=Object.assign({},DATA.DEFAULT||{},choices||{});
 const pending=(journal().deferredWednesday||[]).map((item,i)=>({group:'c9',day:'wed',value:'deferred_'+i,title:item.title,detail:'Selected stop needs a revised time',pinned:false,actionable:false,planned:false,note:item.reason,history:true}));
 return (DATA.CHOICES||[]).flatMap(c=>(c.options||[]).filter(o=>{
  return o&&o[0]!==chosen[c.id]&&!(c.id==='c6'&&chosen.c6==='all')&&o[0]!=='all'&&!['rest','standard'].includes(o[0]);
 }).map(o=>({
  group:c.id,day:c.day,value:o[0],title:o[1],detail:o[2]||'',
  pinned:c.id==='c6'&&pinned(o[0]),actionable:c.id==='c6'&&ART.includes(o[0]),planned:c.id==='c6'&&activeArt(chosen).has(o[0]),
  note:guidance(c,o[0]),history:(journal().history[c.id]||[]).some(h=>h.value===o[0])
 }))).concat(pending);
}
function e(id,start,end,title,place,detail,kind='experience',status='proposed'){
 return {id,start,end,title,place,detail,kind,status};
}
function minutes(t){if(!t)return 0;const a=t.split(':').map(Number);return a[0]*60+a[1]}
function sorted(events){return events.sort((a,b)=>minutes(a.start)-minutes(b.start))}
function isProtected(ev){return ['booked','arranged','confirmed'].includes(String(ev.status||''))||/^(?:flight|landing|transfer|cruise|board|pickup|luggage)$/.test(ev.id)}
function keepProtected(orig){return orig.filter(isProtected)}
function addAll(group,d){
 const key='art_extra_'+d+'_'+group[0].id;
 return group.map(item=>({...item,id:item.id||key}));
}
function planTuesday(orig,wanted,choices){
 const hasB=wanted.has('butterflies'),hasG=wanted.has('guggenheim'),hasC=wanted.has('chelsea');
 const result=keepProtected(orig);
 if(hasB){
  result.push(e('allart_breakfast','08:55','09:25',"Zabar's Café · breakfast", 'zabars','2245 Broadway. Early Upper West Side start before the Butterfly Vivarium.','food'));
  result.push(e('allart_oak','09:35','09:50','Oak Bridge · Central Park','oak','Morning walk and photographs near the American Museum of Natural History.','walk'));
  result.push(e('allart_butterflies','10:15','11:15','AMNH · Davis Family Butterfly Vivarium','amnh','Original priority. Timed Vivarium entry and AMNH admission to book.','museum','ticket-to-check'));
  result.push(e('allart_lunch','11:25','11:55','Daily Provisions · quick lunch','dailyProvisions','375 Amsterdam Avenue. Fast lunch; allow cross-town travel to the Guggenheim.','food'));
 }else if(hasG){
  result.push(e('allart_breakfast','09:35','10:15','Sant Ambroeus Madison · espresso breakfast','santAmbroeus','1000 Madison Avenue, convenient for the Guggenheim.','food'));
 }else{
  result.push(e('allart_breakfast','09:10','09:45','Culture Espresso · morning coffee','cultureEspresso','72 West 38th Street, en route toward Chelsea.','food'));
 }
 if(hasG){
  result.push(e('allart_guggenheim',hasB?'12:40':'10:35',hasB?'13:35':'11:40','Guggenheim Museum · the spiral','guggenheim','1071 Fifth Avenue. Open from 10:30 on Tuesday; allow time to cross Central Park if arriving from the AMNH.','museum','ticket-to-check'));
  result.push(e('allart_albertine',hasB?'13:45':'11:50',hasB?'14:05':'12:25','Albertine Books · celestial ceiling','albertine','972 Fifth Avenue. Original bookshop wish, a short walk from the Guggenheim.','culture'));
  if(!hasB)result.push(e('allart_lunch','12:30','13:05','Via Quadronno · Italian café lunch','viaQuadronno','25 East 73rd Street. Quick lunch before the gallery trail.','food'));
 }else if(hasB){
  result.push(e('allart_albertine','12:45','13:20','Albertine Books · celestial ceiling','albertine','972 Fifth Avenue. Check bookshop opening hours.','culture'));
 }
 if(hasC){
  result.push(e('allart_chelsea_transfer',hasG&&hasB?'14:05':'13:25','14:55','Across town to Chelsea · subway or taxi','chelsea','Allow 40–90 minutes depending on origin and service; live directions take precedence.','travel','proposed'));
  result.push(e('allart_luhring','15:05','15:30','Luhring Augustine · Jason Moran: STACKS','luhring','531 West 24th Street. Named gallery, Tuesday hours 10:00–18:00.','art'));
  result.push(e('allart_pace','15:40','16:08','Pace Gallery · exhibitions on West 25th','pace','540 West 25th Street. Two nearby galleries, no separate district transfer.','art'));
  result.push(e('allart_highline','16:18','16:43','High Line · Chelsea architecture','highline','Outdoor gallery-to-park walking loop, daylight and weather permitting.','walk'));
 }else{
  result.push(e('allart_moma','15:15','16:38','MoMA · Nilima Sheikh, Surrealist Book & Brancusi','moma','11 West 53rd Street. Focused visit; the museum closes at 17:30 on Tuesday.','museum','ticket-to-check'));
  result.push(e('allart_rockefeller','16:45','17:18','Rockefeller Center · Fifth Avenue','rockefeller','A short Midtown walk after MoMA.','walk'));
 }
 const music=orig.filter(x=>x.id==='music');
 music.forEach(x=>{if(!result.some(y=>y.id===x.id))result.push(x)});
 if(music.length&&minutes(music[0].start)>=19*60){
  result.push(e('allart_pizza','17:30','18:00',"Joe's Pizza · classic NYC slice",'joespizza','7 Carmine Street, West Village. A quick bite before the music; check travel to the chosen show.','food'));
  if(choices.c2==='bluenote')result.push(e('allart_washington_sq','18:12','18:30','Washington Square · quick photographs','washingtonSquare','A short photo stop near the Blue Note, not a long sightseeing detour.','walk'));
 }
 // Other unrelated fixed events on this day remain untouched.
 orig.filter(x=>isProtected(x)&&!result.some(y=>y.id===x.id)).forEach(x=>result.push(x));
 return sorted(result);
}
function repairBam(rows){
 const hasBAM=rows.some(x=>/bamharvey|theatre|la distance/i.test((x.id||'')+' '+(x.title||''))&&x.start>='19:00'&&x.start<='20:30');
 if(!hasBAM)return sorted(rows);
 const conflictingIds=['hotel','hotel_view','explore_wed_maisonpremiere'];
 const removable=rows.filter(x=>conflictingIds.includes(x.id)&&!isProtected(x));
 if(!removable.length)return sorted(rows);
 // Never discard an independently confirmed booking when repairing a proposed itinerary.
 // A 19:30 curtain in Fort Greene is incompatible with 19:40 cocktails
 // in Williamsburg. Keep oysters only where protected events permit.
 const out=rows.filter(x=>!removable.includes(x));
 const available=(start,end)=>!out.some(x=>isProtected(x)&&minutes(x.start)<minutes(end)&&minutes(x.end)>minutes(start));
 if(!out.some(x=>x.id==='art_wed_oysters')&&available('17:28','18:10'))
  out.push(e('art_wed_oysters','17:28','18:10','Maison Premiere · oysters and cocktails','maisonPremiere','298 Bedford Avenue, Williamsburg. Short oyster stop; reserve ahead if using the dining room.','food'));
 if(!out.some(x=>x.id==='art_wed_bam_transfer')&&available('18:10','19:17'))
  out.push(e('art_wed_bam_transfer','18:10','19:17','Travel Williamsburg → BAM Fort Greene','bamharvey','Allow subway travel, waiting and theatre check-in. Live directions take priority.','travel'));
 return sorted(out);
}
function planWednesday(orig,wanted){
 if(!wanted.has('chelsea'))return repairBam(orig);
 // Chelsea replaces Tuesday MoMA. Recover MoMA on Wednesday, shifting the libraries
 // while preserving Williamsburg, the evening performance and late-night music.
 const removeIds=new Set(['late','library','snfl','lunch']);
 const origOther=orig.filter(x=>!removeIds.has(x.id)&&!/^explore_wed_(?:moma|whitney|roughtrade)$/.test(x.id));
 const result=origOther.slice();
 result.push(e('art_wed_breakfast','09:05','09:35','Culture Espresso · breakfast','cultureEspresso','72 West 38th Street. Coffee before crossing Midtown.','food'));
 result.push(e('art_wed_moma','10:30','11:22','MoMA · Nilima Sheikh, Surrealist Book & Brancusi','moma','A focused Wednesday visit at the museum’s opening time; reserve entry.','museum','ticket-to-check'));
 result.push(e('art_wed_library','11:43','12:12','NYPL · Rose Main Reading Room','nypl','476 Fifth Avenue. Visitor access depends on library rules.','culture'));
 result.push(e('art_wed_snfl','12:17','12:37','Stavros Niarchos Library · Fifth Avenue','snfl','455 Fifth Avenue. The rooftop may have separate opening restrictions.','culture'));
 result.push(e('art_wed_lunch','12:58','13:35','Golden Diner · quick lunch','golden','123 Madison Street. Queue permitting; retain the Williamsburg transfer buffer.','food'));
 return repairBam(result);
}

/* Wednesday is Manhattan-first by default. Williamsburg is a deliberate
 * afternoon choice, not an automatic filler; BAM and the club are separate. */
function wedPlaces(){
 const places={
  westlight:{name:'Westlight · Williamsburg rooftop',address:'111 N 12th St, Brooklyn, NY 11249, USA',area:'Williamsburg',lat:40.7222,lng:-73.9597,kind:'cocktail',url:'https://www.westlightnyc.com/'},
  superiorIngredients:{name:'Superior Ingredients · The Room',address:'74 Wythe Ave, Brooklyn, NY 11249, USA',area:'Williamsburg',lat:40.72232,lng:-73.95782,kind:'club',url:'https://www.si-bk.com/shows'},
  washingtonSquare:{name:'Washington Square Park',address:'Washington Square, New York, NY 10012, USA',area:'Greenwich Village',lat:40.7308,lng:-73.9973,kind:'park',url:'https://www.nycgovparks.org/parks/washington-square-park'},
  danteWest:{name:'Dante West Village · cocktails and dinner',address:'551 Hudson St, New York, NY 10014, USA',area:'West Village',lat:40.7356,lng:-74.0064,kind:'restaurant',url:'https://www.dante-nyc.com/location/dante-nyc/'},
  domino:{name:'Domino Park · waterfront',address:'15 River St, Brooklyn, NY 11249, USA',area:'Williamsburg',lat:40.7154,lng:-73.9682,kind:'walk',url:'https://www.dominopark.com/'}
 };
 Object.keys(places).forEach(k=>{if(!DATA.P[k])DATA.P[k]=places[k]});
}
function wedChoices(){
 if(!DATA.DEFAULT||!Array.isArray(DATA.CHOICES))return;
 const insert=(id,value,title,desc,options)=>{
  if(!Object.prototype.hasOwnProperty.call(DATA.DEFAULT,id))DATA.DEFAULT[id]=value;
  if(!DATA.CHOICES.some(c=>c.id===id))DATA.CHOICES.push({id,day:'wed',title,desc,options});
 };
 insert('c9','manhattan','Wednesday afternoon · Manhattan or Williamsburg?',
  'Manhattan is the default. Williamsburg becomes a purposeful skyline, rooftop and oyster excursion, never a compulsory half-day.',[
   ['manhattan','Manhattan first · Whitney, Little Island and West Village','Keep the afternoon on Manhattan, with a museum and waterside walk. Williamsburg remains available for another visit.'],
   ['williamsburg','Williamsburg · waterfront → Westlight → oysters','Domino Park in daylight, rooftop at sunset, then Maison Premiere. Travel and opening times require checking.'],
   ['williamsburg_vintage','Williamsburg · vintage shops + skyline + oysters','Add Awoke and Stella Dallas to the sunset trail; this is a fuller, more demanding afternoon.']
  ]);
 insert('c10','skip','Wednesday evening · BAM theatre?',
  'The 19:30 La Distance performance in Fort Greene is optional. Selecting it reserves travel time, not a theatre seat.',[
   ['skip','No BAM performance · keep the evening flexible','The theatre stays in Second Chances. No ticket is assumed.'],
   ['bam','BAM · La Distance at 19:30 · tickets to check','French-language theatre with English supertitles. Travel to Fort Greene and check-in are explicitly planned.']
  ]);
 const night=DATA.CHOICES.find(c=>c.id==='c3');
 if(night&&!(night.options||[]).some(o=>o[0]==='louievega')){
  night.options.push(['louievega','Louie Vega · Flashback at Superior Ingredients','25 November, 22:00–04:00 at The Room (indoors, not the rooftop). House/disco dancing; tickets not booked.']);
 }
}
function timeClash(a,b){
 const a0=minutes(a.start),b0=minutes(b.start);
 let a1=minutes(a.end),b1=minutes(b.end);
 if(a1<a0)a1+=1440;if(b1<b0)b1+=1440;
 return a0<b1&&b0<a1;
}
function planWednesdayExperience(orig,choices){
 const mode=['williamsburg','williamsburg_vintage'].includes(choices.c9)?choices.c9:'manhattan';
 const haveBookedBAM=orig.some(x=>isProtected(x)&&/bamharvey|la distance/i.test((x.place||'')+' '+(x.title||'')));
 const attendBAM=choices.c10==='bam'||haveBookedBAM;
 const oldNight=orig.find(x=>x.id==='night');
 const keep=orig.filter(x=>{
  if(isProtected(x))return true;
  if(/^(?:custom|user)_/.test(String(x.id||'')))return true;
  // Retain the morning and lunch. Rebuild only the optional afternoon/night.
  return minutes(x.end)<=14*60 && minutes(x.start)<14*60 &&
   !/^(?:explore_wed_(?:bamharvey|maisonpremiere|westlight)|explore_walk_wed_)/.test(String(x.id||'')) &&
   !['vintage','vintage_stella','domino','hotel','hotel_view'].includes(x.id);
 });
 const out=sorted(keep.slice()),deferred=[];
 const add=item=>{
  const clash=out.find(x=>timeClash(item,x));
  if(clash){
   deferred.push({title:item.title,reason:'Conflicts with '+clash.title+' · review before booking'});
   return false;
  }
  if(!out.some(x=>x.id===item.id)){out.push(item);sorted(out);return true}
  return false;
 };
 const slot=(id,start,end,title,place,detail,kind='experience',status='proposed')=>add(e(id,start,end,title,place,detail,kind,status));
 const transit=(id,start,end,title,place,detail)=>slot(id,start,end,title,place,detail+' Allow for NYC traffic, subway waits and station access; follow live MTA directions.','travel');
 if(mode==='manhattan'){
  slot('wed_whitney','14:25','15:40','Whitney Museum · art and the Meatpacking waterfront','whitney','99 Gansevoort Street. Reserve admission; adjust if you prefer another Manhattan gallery.','museum','ticket-to-check');
  slot('wed_little_island','15:52','16:17','Little Island · Hudson River walk','littleIsland','Pier 55. Outdoor public park; weather-dependent.','walk');
  slot('wed_west_village','16:30','17:00','West Village · Bleecker and Christopher Streets','westVillage','Neighbourhood walk and small independent shops; time for a relaxed evening.','walk');
  if(choices.c3!=='rest')slot('wed_dante','17:15',attendBAM?'17:55':'18:15','Dante West Village · dinner and cocktails','danteWest','551 Hudson Street, a named West Village restaurant near the afternoon trail. Suggested table; not reserved.','food','hours-to-check');
 }else{
  const vintage=mode==='williamsburg_vintage';
  if(vintage){
   transit('wed_to_brooklyn','13:35','14:15','Manhattan → Williamsburg · subway transfer','awoke','Travel towards Bedford Avenue and the vintage shops.');
   slot('wed_awoke','14:15','14:35','Awoke Vintage · browse','awoke','132 North 5th Street. Optional vintage stop.','shopping');
   slot('wed_stella','14:42','15:00','10 ft Single by Stella Dallas · vintage','stella','285 North 6th Street. A short second vintage stop.','shopping');
   transit('wed_to_domino','15:00','15:20','Walk to Domino Park','domino','Walk south and west through Williamsburg.');
   slot('wed_domino','15:20','15:45','Domino Park · Manhattan skyline in daylight','domino','East River waterfront; sunset is approximately 16:31 on this date.','walk');
   transit('wed_to_westlight','15:45','16:10','Domino Park → Westlight · walk north','westlight','Allow about 25 minutes for the waterfront-to-rooftop transfer.');
  }else{
   transit('wed_to_brooklyn','14:15','14:55','Manhattan → Williamsburg · subway transfer','domino','Leave time for the transfer to the East River waterfront.');
   slot('wed_domino','15:00','15:35','Domino Park · Manhattan skyline in daylight','domino','East River waterfront; sunset is approximately 16:31 on this date.','walk');
   transit('wed_to_westlight','15:35','16:10','Domino Park → Westlight · walk north','westlight','Allow a generous transfer to the William Vale rooftop.');
  }
  slot('wed_westlight','16:10','17:00','Westlight · sunset skyline cocktails','westlight','111 North 12th Street. Opens from 16:00 on Wednesdays; seats, weather and holiday schedule unconfirmed. This is not a confirmed DJ night.','cocktail','hours-to-check');
  transit('wed_to_oysters','17:00','17:20','Westlight → Maison Premiere · walk','maisonPremiere','Allow approximately 20 minutes south towards Bedford Avenue.');
  slot('wed_oysters','17:20',attendBAM?'18:05':'18:35','Maison Premiere · oysters and cocktails','maisonPremiere','298 Bedford Avenue. Oyster stop, not automatically a full dinner; check reservations. Published Wednesday service begins at noon.','food','hours-to-check');
 }
 if(attendBAM){
  transit('wed_to_bam',mode==='manhattan'?'18:05':'18:05','19:12',
   mode==='manhattan'?'Manhattan → BAM · theatre transfer':'Williamsburg → BAM · theatre transfer','bamharvey','Reach Fort Greene in time for the 19:30 curtain and admission.');
  if(!haveBookedBAM)slot('wed_bam','19:30','20:55','BAM · La Distance (French with English supertitles)','bamharvey','Harvey Theater, Fort Greene. Official running time 1h25. Tickets to purchase separately.','theatre','ticket-to-check');
 }
 if(oldNight&&!isProtected(oldNight)||choices.c3==='louievega'&&!oldNight){
  let night=oldNight?Object.assign({},oldNight):e('night','22:00','00:45','Night out','superiorIngredients','','club','ticket-to-check');
  if(choices.c3==='louievega'){
   night=Object.assign({},night,{start:'22:00',end:'00:45',title:'Louie Vega · Flashback · house/disco dancing',place:'superiorIngredients',kind:'club',status:'ticket-to-check',
    detail:'Superior Ingredients, The Room (indoors, no skyline rooftop). Official event runs 22:00–04:00; 00:45 is a suggested early departure before Thanksgiving. Tickets not booked.'});
  }else if(choices.c3==='rest'){
   night=Object.assign({},night,{start:attendBAM?'21:50':mode==='manhattan'?'20:30':'20:45',end:attendBAM?'23:20':'22:40',
    detail:String(night.detail||'')+' Dinner/piano programme and seating still require confirmation.'});
  }
  const lateStart=attendBAM?'21:00':mode==='manhattan'?'20:55':'21:10';
  const lateEnd=attendBAM?'21:45':mode==='manhattan'?'21:50':'21:50';
  if(choices.c3!=='rest')transit('wed_night_transfer',lateStart,lateEnd,
     attendBAM?'BAM → late-night venue · subway/taxi':mode==='manhattan'?'Manhattan → Brooklyn · club transfer':'Williamsburg → late-night venue · transfer',
     night.place,'Check the event entrance and last train connection.');
  else if(attendBAM||mode!=='manhattan')transit('wed_night_transfer',attendBAM?'20:55':'19:55',attendBAM?'21:45':'20:40',
      'Travel to The Nines · NoHo',night.place,'Allow travel from Brooklyn to Manhattan.');
  add(night);
 }
 const j=journal();
 j.deferredWednesday=deferred.slice(0,18);
 save(j);
 return sorted(out);
}
function noOverlap(events){
 for(let i=1;i<events.length;i++){
  const a=events[i-1],b=events[i];let end=minutes(a.end);
  if(end<minutes(a.start))end+=1440;
  if(end>minutes(b.start))return false;
 }
 return true;
}
function install(){
 if(installed)return true;
 DATA=window.NYC_DATA;PLAN=window.NYC_PLAN;
 if(!DATA||!PLAN||typeof PLAN.day!=='function')return false;
 const c6=(DATA.CHOICES||[]).find(x=>x.id==='c6');
 if(c6&&!(c6.options||[]).some(x=>x[0]==='all')){
  c6.options.push(['all','Do all three · AMNH + Guggenheim + Chelsea','Three art experiences across Tuesday; MoMA and the libraries move to Wednesday. Tickets remain separate.']);
  c6.title='Tuesday art trail · one, several or all?';
  c6.desc='You can do them all. The intensive plan covers Tuesday and Wednesday, not three simultaneous museums.';
 }
 wedPlaces();
 wedChoices();
 BASE=PLAN.day.bind(PLAN);
 PLAN.day=function(day,choices){
  const result=BASE(day,choices);
  if(!Array.isArray(result))return result;
  try{
   const opts=Object.assign({},DATA.DEFAULT||{},choices||{});
   record(opts);
   const wanted=activeArt(opts);
   if(day==='wed'){
    const prepared=wanted.size>=2&&wanted.has('chelsea')?planWednesday(result,wanted):result;
    const updated=planWednesdayExperience(prepared,opts);
    return noOverlap(updated)?updated:result;
   }
   if(wanted.size<2)return result;
   const updated=day==='tue'?planTuesday(result,wanted,opts):result;
   return noOverlap(updated)?updated:result;
  }catch(_){return result}
 };
 installed=true;
 return true;
}
window.NOUX_CHOICES={install,alternatives,toggle,pinned,activeArt,version:'2026.11.15-wed3',history:()=>journal().history};
})();