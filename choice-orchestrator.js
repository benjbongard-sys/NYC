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
 if(c.id==='c5')return 'Saved as another area to consider. It needs an opening-hours and transport check.';
 if(['c2','c3','c4'].includes(c.id))return 'Date-specific show or club. Preserved as an option, not automatically moved to another date.';
 if(c.id==='c1')return 'An alternative restaurant or rooftop, kept for a later evening if available.';
 if(c.id==='c7')return 'A different Thanksgiving table, not a second simultaneous dinner.';
 return 'Kept available in your choices. Review other days before adding.';
}
function alternatives(choices){
 const chosen=Object.assign({},DATA.DEFAULT||{},choices||{});
 return (DATA.CHOICES||[]).flatMap(c=>(c.options||[]).filter(o=>{
  return o&&o[0]!==chosen[c.id]&&o[0]!=='all'&&!['rest','standard'].includes(o[0]);
 }).map(o=>({
  group:c.id,day:c.day,value:o[0],title:o[1],detail:o[2]||'',
  pinned:c.id==='c6'&&pinned(o[0]),actionable:c.id==='c6'&&ART.includes(o[0]),
  note:guidance(c,o[0]),history:(journal().history[c.id]||[]).some(h=>h.value===o[0])
 })));
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
  result.push(e('allart_oak','09:30','10:00','Oak Bridge · Central Park','oak','Morning walk and photographs near the American Museum of Natural History.','walk'));
  result.push(e('allart_butterflies','10:15','11:25','AMNH · Davis Family Butterfly Vivarium','amnh','Original priority. Timed Vivarium entry and AMNH admission to book.','museum','ticket-to-check'));
  result.push(e('allart_lunch','11:35','12:05','Daily Provisions · quick lunch','dailyProvisions','375 Amsterdam Avenue. Fast lunch; allow cross-town travel to the Guggenheim.','food'));
 }else if(hasG){
  result.push(e('allart_breakfast','09:35','10:15','Sant Ambroeus Madison · espresso breakfast','santAmbroeus','1000 Madison Avenue, convenient for the Guggenheim.','food'));
 }else{
  result.push(e('allart_breakfast','09:10','09:45','Culture Espresso · morning coffee','cultureEspresso','72 West 38th Street, en route toward Chelsea.','food'));
 }
 if(hasG){
  result.push(e('allart_guggenheim',hasB?'12:40':'10:35',hasB?'13:35':'11:40','Guggenheim Museum · the spiral','guggenheim','1071 Fifth Avenue. Open from 10:30 on Tuesday; allow time to cross Central Park if arriving from the AMNH.','museum','ticket-to-check'));
  result.push(e('allart_albertine',hasB?'13:45':'11:50',hasB?'14:10':'12:25','Albertine Books · celestial ceiling','albertine','972 Fifth Avenue. Original bookshop wish, a short walk from the Guggenheim.','culture'));
  if(!hasB)result.push(e('allart_lunch','12:30','13:05','Via Quadronno · Italian café lunch','viaQuadronno','25 East 73rd Street. Quick lunch before the gallery trail.','food'));
 }else if(hasB){
  result.push(e('allart_albertine','12:45','13:20','Albertine Books · celestial ceiling','albertine','972 Fifth Avenue. Check bookshop opening hours.','culture'));
 }
 if(hasC){
  result.push(e('allart_chelsea_transfer',hasG&&hasB?'14:10':'13:25','14:55','Across town to Chelsea · subway or taxi','chelsea','Allow 40–90 minutes depending on origin and service; live directions take precedence.','travel','proposed'));
  result.push(e('allart_luhring','15:05','15:35','Luhring Augustine · Jason Moran: STACKS','luhring','531 West 24th Street. Named gallery, Tuesday hours 10:00–18:00.','art'));
  result.push(e('allart_pace','15:43','16:16','Pace Gallery · exhibitions on West 25th','pace','540 West 25th Street. Two nearby galleries, no separate district transfer.','art'));
  result.push(e('allart_highline','16:23','17:02','High Line · Chelsea architecture','highline','Outdoor gallery-to-park walking loop, daylight and weather permitting.','walk'));
 }else{
  result.push(e('allart_moma','15:15','16:38','MoMA · Nilima Sheikh, Surrealist Book & Brancusi','moma','11 West 53rd Street. Focused visit; the museum closes at 17:30 on Tuesday.','museum','ticket-to-check'));
  result.push(e('allart_rockefeller','16:45','17:18','Rockefeller Center · Fifth Avenue','rockefeller','A short Midtown walk after MoMA.','walk'));
 }
 const music=orig.filter(x=>!isProtected(x)&&x.id==='music');
 music.forEach(x=>result.push(x));
 if(music.length&&minutes(music[0].start)>=19*60){
  result.push(e('allart_pizza','17:45','18:13',"Joe's Pizza · classic NYC slice",'joespizza','7 Carmine Street, West Village. A quick bite before the music; check travel to the chosen show.','food'));
 }
 // Other unrelated fixed events on this day remain untouched.
 orig.filter(x=>isProtected(x)&&!result.some(y=>y.id===x.id)).forEach(x=>result.push(x));
 return sorted(result);
}
function planWednesday(orig,wanted){
 if(!wanted.has('chelsea'))return orig;
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
 const hasBAM=result.some(x=>/bamharvey|theatre|la distance/i.test(x.id+' '+x.title)&&x.start>='19:00'&&x.start<='20:30');
 if(hasBAM){
  for(let i=result.length-1;i>=0;i--){
   const v=result[i];
   if(['hotel','hotel_view'].includes(v.id)||/^explore_wed_maisonpremiere$/.test(v.id))result.splice(i,1);
  }
  result.push(e('art_wed_oysters','17:28','18:10','Maison Premiere · oysters and cocktails','maisonPremiere','298 Bedford Avenue, Williamsburg. Short oyster stop, not a three-hour dinner; check service and reservation.','food'));
  result.push(e('art_wed_bam_transfer','18:10','19:17','Travel Williamsburg → BAM Fort Greene','bamharvey','Allow for subway access, waiting and the theatre check-in; verify the actual travel route.','travel'));
 }
 return sorted(result);
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
 BASE=PLAN.day.bind(PLAN);
 PLAN.day=function(day,choices){
  const result=BASE(day,choices);
  if(!Array.isArray(result))return result;
  try{
   const opts=Object.assign({},DATA.DEFAULT||{},choices||{});
   record(opts);
   const wanted=activeArt(opts);
   if(wanted.size<2)return result;
   const updated=day==='tue'?planTuesday(result,wanted,opts):day==='wed'?planWednesday(result,wanted):result;
   return noOverlap(updated)?updated:result;
  }catch(_){return result}
 };
 installed=true;
 return true;
}
window.NOUX_CHOICES={install,alternatives,toggle,pinned,activeArt,version:'2026.11.15',history:()=>journal().history};
})();