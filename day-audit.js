/* NOUX five-day schedule audit. Public routing rules only; no private itinerary. */
(function(){
'use strict';
if(window.NOUX_DAY_AUDIT)return;
const KEY='noux_route_review_v1';
let DATA=null,PLAN=null,BASE=null,installed=false;
const minute=t=>{const m=/^(\d{1,2}):(\d{2})$/.exec(String(t||''));return m?+m[1]*60 + +m[2]:NaN};
const time=m=>String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const end=e=>{const a=minute(e.start),b=minute(e.end);return b<a?b+1440:b};
const sorted=x=>x.sort((a,b)=>minute(a.start)-minute(b.start));
const hard=e=>['booked','confirmed','arranged'].includes(String(e.status||'').toLowerCase())||e.auditAnchor===true||/^(?:flight|landing|cruise|board|luggage)$/.test(String(e.id||''));
const personal=e=>hard(e)||/^(?:custom|user)_/.test(String(e.id||''))||e.id==='night';
const item=(id,start,finish,title,place,detail,kind='experience',status='proposed')=>({id,start,end:finish,title,place,detail,kind,status});
function addPlace(id,place){if(!DATA.P[id])DATA.P[id]=place}
function placeForHotel(rows){const direct=['sanctuary','hotel','times'].find(k=>DATA.P[k]);if(direct)return direct;const e=rows.find(v=>/hotel|bags|check.?out/i.test(v.title||''));return e?e.place:(Object.keys(DATA.P)[0]||'times')}
function propose(rows,e){if(!rows.some(x=>x.id===e.id))rows.push(e)}
function review(reason,e,day,pending){pending.push({day,title:e.title,reason,start:e.start,place:e.place})}
function coordinates(e){const p=DATA.P[e.place];return p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)?p:null}
function kilometers(a,b){const rad=Math.PI/180,dy=(b.lat-a.lat)*rad,dx=(b.lng-a.lng)*rad;return 12742*Math.asin(Math.min(1,Math.sqrt(Math.sin(dy/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dx/2)**2)))}
function borough(p){const t=String(p.address||'')+' '+String(p.area||'');return /brooklyn|dumbo|fort greene|williamsburg|bushwick/i.test(t)?'Brooklyn':/manhattan|new york, ny|midtown|village|chelsea|upper west|upper east/i.test(t)?'Manhattan':'other'}
function minTransfer(a,b){if(['travel','airport','flight'].includes(a.kind)||['travel','airport','flight'].includes(b.kind))return 0;const pa=coordinates(a),pb=coordinates(b);if(!pa||!pb)return 0;const km=kilometers(pa,pb);if(km<0.15)return 3;let result=km<0.8?Math.ceil(5+km*12):km<1.6?Math.ceil(8+km*12):Math.ceil(12+km*4.5);const ba=borough(pa),bb=borough(pb);if(ba!==bb&&ba!=='other'&&bb!=='other')result=Math.max(result,35);return Math.min(result,65)}
function trim(e){if(personal(e))return e;const out={...e},t=String(e.title||'').toLowerCase(),d=end(out)-minute(out.start);let cap=null;
 if(/oak bridge|domino park|washington square|st\. patrick.*exterior|rockefeller.*photo/.test(t))cap=25;
 if(/butterfly vivarium/.test(t))cap=60;
 if(/luhring augustine|pace gallery/.test(t))cap=35;
 if(/stavros niarchos.*rooftop/.test(t))cap=25;
 if(cap!==null&&d>cap&&d<240)out.end=time(minute(out.start)+cap);
 return out}
function monday(rows){const cruise=rows.find(e=>e.id==='cruise'||(/cruise/i.test(e.title||'')&&hard(e)));if(!cruise)return rows;
 const s=minute(cruise.start);if(!Number.isFinite(s)||s<60)return rows;
 // Arrival-day transfers are the priority: never fit a speculative Midtown detour
 // immediately before a time-specific booked cruise. Exact departure pier is on the ticket.
 if(!rows.some(e=>e.id==='mon_cruise_transfer')){
  const x=item('mon_cruise_transfer',time(s-105),time(s-45),'Head to the confirmed cruise departure pier',cruise.place,'60-minute planning buffer from Midtown, not a certified journey. If JFK arrival or hotel bag drop runs late, skip optional sightseeing and travel directly to the ticketed pier.','travel');
  x.auditAnchor=true;propose(rows,x);
 }
 if(!rows.some(e=>/boarding|check.?in.*pier|mon_cruise_boarding/i.test((e.id||'')+' '+(e.title||'')))){
  const e=item('mon_cruise_boarding',time(s-45),time(s-15),'Cruise pier · security and boarding buffer',cruise.place,'Arrive at the actual booked departure pier. Terminal and transfer are subject to the ticket; this is a buffer, not a second reservation.','logistics');
  e.auditAnchor=true;propose(rows,e)
 }return rows}
function thursday(rows){for(let i=rows.length-1;i>=0;i--){const e=rows[i];if(!hard(e)&&e.kind==='travel'&&minute(e.start)<540&&/parade/i.test((e.id||'')+' '+(e.title||'')))rows.splice(i,1)}
 const parade=rows.find(e=>/macy.{0,28}parade|thanksgiving.{0,24}parade/i.test(e.title||'')&&e.kind!=='travel');
 if(parade&&!hard(parade)&&minute(parade.start)<555){parade.start='09:40';parade.end='11:15';parade.detail=String(parade.detail||'')+' Relaxed public viewing near Sixth Avenue; no front-row guarantee. NYPD barriers may restrict crossing.'}
 if(parade)parade.auditAnchor=true;
 const existingWalk=rows.find(e=>e.id==='centennial_parade_walk'||e.id==='audited_parade_walk');
 if(existingWalk)existingWalk.auditAnchor=true;
 if(parade&&!existingWalk){
  const x=item('audited_parade_walk','09:15','09:40','Walk to Sixth Avenue · Thanksgiving viewing','centennial_parade','Crowds and barriers may require a different walking approach.','travel');x.auditAnchor=true;propose(rows,x)
 }
 return rows}
function sunrise(day,rows,choices){
 const requested=(choices&&choices.c11)||((DATA.DEFAULT||{}).c11||'skip');
 if(requested!==day||!['wed','fri'].includes(day))return rows;
 // Recommended, never a booking. Respect separately confirmed morning events.
 const occupied=rows.find(e=>hard(e)&&minute(e.start)<540&&end(e)>360);
 if(occupied)return rows;
 addPlace('auditDumboSunrise',{name:'Pebble Beach · DUMBO Brooklyn Bridge Park',address:'Main Street and Plymouth Street, Brooklyn, NY 11201, USA',area:'DUMBO, Brooklyn',lat:40.7038,lng:-73.9891,kind:'waterfront',url:'https://brooklynbridgepark.org/about/'});
 addPlace('auditBridgeWalk',{name:'Brooklyn Bridge Pedestrian Walkway',address:'Tillary Street and Adams Street, Brooklyn, NY 11201, USA',area:'Brooklyn Bridge',lat:40.6972,lng:-73.9894,kind:'walk',url:'https://www.nyc.gov/html/dot/html/infrastructure/brooklyn-bridge.shtml'});
 const home=placeForHotel(rows);
 const sunriseTime=day==='wed'?'06:54':'06:56';
 const sunriseNote='Actual sunrise '+sunriseTime+' NYC local time; Brooklyn Bridge Park opens at 06:00. Weather, lighting and MTA services may vary.';
 const tasks=[
  item('sunrise_'+day+'_out','06:00','06:45','Subway to DUMBO · A/C downtown & Brooklyn-bound','auditDumboSunrise','From Midtown take the A/C towards Brooklyn to High St, then walk to the waterfront. Check the platform signs and live MTA departures. Approximately 45 minutes including the walk.','travel'),
  item('sunrise_'+day+'_photos','06:45','07:10','Brooklyn Bridge at sunrise · DUMBO photographs','auditDumboSunrise',sunriseNote+' Photograph the bridge, skyline and waterfront; no reservation is required.','walk'),
  item('sunrise_'+day+'_entrance','07:10','07:30','DUMBO → Brooklyn Bridge pedestrian entrance','auditBridgeWalk','Walk inland to the Brooklyn Bridge pedestrian access, allowing a photo stop at Washington Street.','travel'),
  item('sunrise_'+day+'_bridge','07:30','08:05','Walk Brooklyn Bridge towards Manhattan · photo stops','auditBridgeWalk','Walk from Brooklyn to Manhattan on the pedestrian deck. Sunrise is over by this point; enjoy the morning light.','walk'),
  item('sunrise_'+day+'_return','08:05','08:55','Return to Midtown · subway / breakfast',home,'Reach the hotel or selected breakfast venue with enough margin for the day’s first timed visit. Check live directions.','travel')
 ];
 tasks.forEach(x=>propose(rows,x));
 return rows;
}
function friday(rows){
 const pickup=rows.find(e=>e.id==='pickup'||(/airport transfer|airport pickup|group coach/i.test(e.title||'')&&e.kind==='logistics'));
 // The group coach is arranged by the travel organiser. Departure is around 17:00:
 // this is an actual constraint, not the earlier provisional noon pickup.
 // New documented group transfer supersedes the former 12:00 or 15:50
 // placeholder, even if an older workflow incorrectly labelled it arranged.
 const stalePickup=pickup&&(['12:00','15:50'].includes(pickup.start)||!hard(pickup));
 if(stalePickup){
  pickup.start='16:45';pickup.end='17:10';pickup.status='arranged';
  pickup.title='Guided group coach · airport Terminal 1, around 17:00';
  pickup.detail='Organised hotel pickup with a French-speaking guide, around 17:00. Be in the lobby by 16:45. Exact coach boarding time is subject to the group guide. Assistance with airport check-in and boarding.';
 }else if(!pickup){
  const e=item('pickup','16:45','17:10','Guided group coach · airport Terminal 1, around 17:00',placeForHotel(rows),'Group guide meets passengers at the hotel. Be in the lobby by 16:45; exact coach boarding time subject to the organiser.','logistics','arranged');
  propose(rows,e);
 }
 const hotel=placeForHotel(rows);
 const times=DATA.P.losTacosTimes?'losTacosTimes':hotel;
 addPlace('auditGrandCentral',{name:'Grand Central Terminal',address:'89 E 42nd St, New York, NY 10017, USA',area:'Midtown',lat:40.75273,lng:-73.97723,kind:'architecture',url:'https://grandcentralterminal.com/visit/'});
 addPlace('auditBryantPark',{name:'Bryant Park Winter Village',address:'42nd Street and Sixth Avenue, New York, NY 10018, USA',area:'Midtown',lat:40.7536,lng:-73.9832,kind:'walk',url:'https://bryantpark.org/activities/bank-of-america-winter-village-at-bryant-park'});
 const breakfast=rows.find(e=>e.id==='breakfast'||(/breakfast|petit.d.jeu/i.test(e.title||'')&&e.kind==='food'));
 if(breakfast&&!hard(breakfast))breakfast.detail=(breakfast.detail||'')+' Hotel breakfast buffet is available daily 07:00–10:00; choose this breakfast or the outside café, not both.';
 if(!rows.some(e=>/check.?out|bag drop|store.*luggage/i.test((e.id||'')+' '+(e.title||''))))
  propose(rows,item('audited_checkout','11:35','11:55','Hotel checkout · leave luggage at reception',hotel,'Room must be vacated before 12:00; luggage storage is available for the afternoon.','logistics'));
 propose(rows,item('audited_friday_lunch','12:05','12:40','Midtown lunch · Los Tacos No. 1',times,'229 West 43rd Street if chosen; allow approximately 35 minutes.','food'));
 propose(rows,item('audited_grand_central','13:15','13:45','Grand Central Terminal · architecture and photographs','auditGrandCentral','30 minutes in the Main Concourse. Transit Museum gift shop and 2026 Holiday Fair are nearby in the same terminal; use free time to shop.','culture'));
 propose(rows,item('audited_grand_shops','13:45','14:25','Grand Central · Holiday Fair and Transit Museum shop','auditGrandCentral','Both located inside Grand Central: shopping and gifts without a separate subway journey. Friday hours and availability to check.','shopping'));
 const alreadyBryant=rows.some(e=>/bryant park/i.test(String(e.title||'')));
 if(alreadyBryant){
  addPlace('auditStPatrick',{name:"St. Patrick's Cathedral",address:'5th Ave at East 50th Street, New York, NY 10022, USA',area:'Midtown',lat:40.7585,lng:-73.976,kind:'culture',url:'https://saintpatrickscathedral.org/'});
  if(!rows.some(e=>/st. patrick|st patrick/i.test(String(e.title||''))))
   propose(rows,item('audited_stpatrick','14:35','15:00',"St. Patrick's Cathedral · focused visit",'auditStPatrick','Fifth Avenue interior or exterior depending on services; short visit, then walk towards the hotel.','culture'));
 }else{
  propose(rows,item('audited_bryant','14:35','15:00','Bryant Park · Winter Village and holiday shops','auditBryantPark','Short holiday-market visit near the route back to the hotel.','walk'));
 }
 propose(rows,item('audited_bags','16:10','16:40','Hotel · collect bags and prepare for coach',hotel,'Retrieve luggage from reception, use the restroom and be at the lobby for the group guide by 16:45.','logistics'));
 return rows
}
function openOn(day,e){const p=String(e.place||'').toLowerCase(),t=String(e.title||'').toLowerCase();
 if(day==='thu'&&(/\b(amnh|guggenheim|moma|whitney|met|butterflies)\b/.test(p)||/museum of modern art|butterfly vivarium|guggenheim|whitney museum|metropolitan museum/.test(t)))return false;
 if(day==='wed'&&(p==='met'||/\bthe met\b/.test(t)))return false;
 if(day==='tue'&&(p==='whitney'||/whitney museum/.test(t)))return false;
 return true}
function resolve(day,list){const pending=[],kept=[];for(const e0 of sorted(list.map(trim))){const e={...e0};if(!Number.isFinite(minute(e.start))||!Number.isFinite(minute(e.end))){review('Invalid time; retained for manual correction',e,day,pending);kept.push(e);continue}
 if(!openOn(day,e)&&!personal(e)){review('Venue closed on this weekday or on Thanksgiving; saved as an alternative',e,day,pending);continue}
 for(let attempt=0;attempt<5;attempt++){
  const hit=kept.find(x=>Number.isFinite(minute(x.start))&&minute(e.start)<end(x)&&minute(x.start)<end(e));
  if(!hit)break;
  if(personal(e)&&!personal(hit)){kept.splice(kept.indexOf(hit),1);review('Overlaps a protected commitment: '+e.title,hit,day,pending);continue}
  if(personal(e)&&personal(hit)){review('Two protected commitments overlap: '+hit.title,e,day,pending);break}
  const shift=end(hit)-minute(e.start)+5;
  if(!personal(e)&&shift<=15&&end(e)+shift<= (day==='fri'?950:day==='mon'?1410:1440)){e.start=time(minute(e.start)+shift);e.end=time(end(e)+shift);continue}
  review('Overlaps '+hit.title+'; keep as a second-chance option',e,day,pending);e._defer=true;break;
 }
 if(e._defer)continue;
 const prev=kept.length?kept[kept.length-1]:null;
 if(prev&&minute(e.start)>=end(prev)){
  const available=minute(e.start)-end(prev),needed=minTransfer(prev,e);
  if(needed>available+4){const warning='Transfer check: about '+needed+' minutes recommended from '+prev.title+'; current buffer '+available+' minutes.';
   e.detail=(e.detail||'')+' '+warning;review(warning,e,day,pending)
  }
 }
 kept.push(e)
 }
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');saved[day]=pending.slice(0,40);localStorage.setItem(KEY,JSON.stringify(saved))}catch(_){}
 return sorted(kept)}
function install(){if(installed)return true;DATA=window.NYC_DATA;PLAN=window.NYC_PLAN;if(!DATA||!DATA.P||!PLAN||typeof PLAN.day!=='function')return false;
 BASE=PLAN.day.bind(PLAN);PLAN.day=function(day,choices){const original=BASE(day,choices);if(!Array.isArray(original))return original;
 try{const rows=original.map(x=>({...x}));if(day==='mon')monday(rows);if(day==='thu')thursday(rows);if(day==='fri')friday(rows);if(day==='wed'||day==='fri')sunrise(day,rows,choices);return resolve(day,rows)}catch(_){return original}
 };installed=true;return true}
window.NOUX_DAY_AUDIT={install,version:'2026.11.15-audit-v4',pending:()=>{try{return Object.values(JSON.parse(localStorage.getItem(KEY)||'{}')).flat().filter(Boolean)}catch(_){return []}}};
})();