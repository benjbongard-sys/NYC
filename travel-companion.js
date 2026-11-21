/* NOUX Travel Companion: offline pack, booking readiness, next move,
 * near-route food/weather and Lyna's guided decision Passport.
 * Runs only after decryption/healthy React first paint. Never changes React DOM.
 */
(function(){
'use strict';
if(window.NOUX_COMPANION)return;
const DAYS=['mon','tue','wed','thu','fri'];
const LABELS={mon:'Mon 23',tue:'Tue 24',wed:'Wed 25',thu:'Thu 26',fri:'Fri 27'};
const JOURNAL='noux_choice_journal_v2';
const AREAS=[
 {id:'midtown',label:'Midtown & Times Sq',lat:40.759,lng:-73.985,indoor:'Grand Central Terminal / MoMA',address:'89 East 42nd Street, New York, NY 10017, USA'},
 {id:'chelsea',label:'Chelsea & Meatpacking',lat:40.744,lng:-74.005,indoor:'Chelsea Market',address:'75 Ninth Avenue, New York, NY 10011, USA'},
 {id:'village',label:'West Village',lat:40.734,lng:-74.002,indoor:'Whitney Museum / local cafés',address:'99 Gansevoort Street, New York, NY 10014, USA'},
 {id:'les',label:'Lower East Side',lat:40.721,lng:-73.991,indoor:'Essex Market',address:'88 Essex Street, New York, NY 10002, USA'},
 {id:'williamsburg',label:'Williamsburg',lat:40.718,lng:-73.961,indoor:"Mable's Smokehouse / indoor cafés",address:'44 Berry Street, Brooklyn, NY 11249, USA'}
];
const TABS=[['passport','Passport'],['go','GO'],['bookings','Tickets'],['nearby','Nearby'],['offline','Offline']];
const NOTE='No new bookings or itinerary changes happen automatically.';
let OPEN=false,ROOT=null,LAUNCHER=null,INSTALLED=false;
let TAB='passport',WHO='Lyna',STEP=0,GO_DAY='auto',AREA='midtown';
let WEATHER=null,WEATHER_AT=0,WEATHER_ERROR='',BUSY=false;
let OFFLINE=null,OFFLINE_ERROR='',OFFLINE_BUSY=false,OFFLINE_REG=null,TOAST='';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n};
const btn=(title,fn,cls)=>{const n=el('button',cls||'',title);n.type='button';n.addEventListener('click',fn);return n};
const note=(text)=>el('p','noux-companion-help',text);
function journal(){try{const j=JSON.parse(localStorage.getItem(JOURNAL)||'{}');return j&&typeof j==='object'&&!Array.isArray(j)?j:{}}catch(_){return {}}}
function saveJournal(fn){try{const j=journal();fn(j);localStorage.setItem(JOURNAL,JSON.stringify(j));document.dispatchEvent(new CustomEvent('noux:local-change',{detail:{source:'companion'}}));return true}catch(_){TOAST='Could not save this browser setting; check private browsing or storage permissions.';return false}}
function currentChoices(){
 const chosen=Object.assign({},window.NYC_DATA?.DEFAULT||{});
 try{
  const keys=Object.keys(localStorage).filter(k=>/^nyc_lyna_trip_v\d+$/.test(k)).sort((a,b)=>Number(b.split('_v').pop())-Number(a.split('_v').pop()));
  if(keys.length){const stored=JSON.parse(localStorage.getItem(keys[0])||'{}');if(stored?.choices&&typeof stored.choices==='object')Object.assign(chosen,stored.choices)}
 }catch(_){}
 return chosen;
}
function events(day){
 try{
  const list=window.NYC_PLAN?.day?.(day,currentChoices());
  return Array.isArray(list)?list.filter(x=>x&&typeof x.start==='string'&&x.title).slice().sort((a,b)=>minute(a.start)-minute(b.start)):[];
 }catch(_){return []}
}
function minute(s){const a=/^(\d{1,2}):(\d{2})$/.exec(String(s||''));return a?+a[1]*60 + +a[2]:0}
function timeNY(){
 const parts={};
 try{new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).forEach(x=>parts[x.type]=x.value)}catch(_){}
 return {date:parts.year+'-'+parts.month+'-'+parts.day,clock:parts.hour+':'+parts.minute,minutes:minute(parts.hour+':'+parts.minute)}
}
function place(ev){
 return window.NYC_DATA?.P?.[ev?.place]||null;
}
function maps(address,mode='transit'){
 return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(address)+'&travelmode='+encodeURIComponent(mode);
}
function external(title,url,cls){
 const a=el('a',cls||'noux-companion-link',title);
 if(/^https:\/\//.test(url||'')){a.href=url;a.target='_blank';a.rel='noopener noreferrer'}
 return a;
}
function maybeTitle(text,max=200){return String(text||'').slice(0,max)}
function areaFor(p){
 const value=String(p?.area||'').toLowerCase();
 if(/williamsburg|brooklyn/.test(value))return 'williamsburg';
 if(/lower east/.test(value))return 'les';
 if(/west village|greenwich village/.test(value))return 'village';
 if(/chelsea|meatpacking/.test(value))return 'chelsea';
 if(/hell|times|midtown|rockefeller|theater|theatre/.test(value))return 'midtown';
 return null;
}
function foodByArea(area){
 const all=window.NOUX_FOOD_WISHLIST?.catalogue?.()||[];
 return all.filter(x=>areaFor(x)===area);
}
function nearestArea(lat,lng){
 const rad=Math.PI/180;const dist=(a,b)=>{
  const dy=(b.lat-a.lat)*rad,dx=(b.lng-a.lng)*rad;
  const v=Math.sin(dy/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dx/2)**2;
  return 2*6371*Math.asin(Math.min(1,Math.sqrt(v)));
 };
 return AREAS.map(x=>({...x,km:dist({lat,lng},x)})).sort((a,b)=>a.km-b.km)[0];
}
function goData(daySetting=GO_DAY){
 const now=timeNY();
 const matches=Object.keys(window.NYC_DATA?.DATES||{}).find(k=>window.NYC_DATA.DATES[k]===now.date);
 const day=daySetting==='auto'?matches||'mon':daySetting;
 const rows=events(day),live=daySetting==='auto'&&!!matches;
 let index=0;
 if(live){
  index=rows.findIndex(x=>{let end=minute(x.end),start=minute(x.start);if(end<start)end+=1440;return end>now.minutes});
  if(index<0)index=rows.length;
 }
 return {day,rows,index,now,live};
}
function progress(who=WHO){
 const j=journal();return j.nouxPassport?.[who]||{reviewed:{},deferred:{}};
}
function markPassport(id,status){
 saveJournal(j=>{
  j.nouxPassport??={};
  const record=j.nouxPassport[WHO]??={reviewed:{},deferred:{}};
  record.reviewed??={};record.deferred??={};
  if(status==='done'){record.reviewed[id]=Date.now();delete record.deferred[id]}
  else{record.deferred[id]=Date.now();delete record.reviewed[id]}
 });
}
function steps(){
 const sections=[
  {id:'welcome',type:'intro',phase:'Discover',title:'Your New York Passport',detail:'A quick tour of the five-day journey. Nothing here is booked by tapping Next. We will revisit every real decision together.'}
 ];
 const choices=(window.NYC_DATA?.CHOICES||[]).filter(c=>c&&c.id&&Array.isArray(c.options));
 const order={mon:0,tue:1,wed:2,thu:3,fri:4};
 choices.slice().sort((a,b)=>(order[a.day]??5)-(order[b.day]??5)||String(a.id).localeCompare(String(b.id))).forEach(c=>{
  sections.push({id:'choice:'+c.id,type:'choice',phase:LABELS[c.day]||'Decisions',title:c.title||'Your next decision',detail:c.desc||'Choose what feels most memorable.',choice:c});
 });
 sections.push(
  {id:'wishlist',type:'feature',phase:'Explore',title:'Food and hidden favourites',detail:'Use the Food guide to see real addresses, hours and route-fit days. A wishlist idea is not an automatic stop.',tab:'nearby'},
  {id:'go',type:'feature',phase:'Explore',title:'Never miss the next move',detail:'GO shows the next scheduled stop, expected start time and one-tap Maps directions. Always prioritise booked activities.',tab:'go'},
  {id:'bookings',type:'feature',phase:'Be ready',title:'Tickets and reservations',detail:'Tickets keeps unconfirmed experiences visible, without mislabelling a preference as booked.',tab:'bookings'},
  {id:'offline',type:'feature',phase:'Be ready',title:'Save our offline essentials',detail:'Download public website files plus the encrypted itinerary. Keep the passphrase; live subway arrivals still need internet.',tab:'offline'},
  {id:'packing',type:'feature',phase:'Be ready',title:'Packing, presents and shared sync',detail:'Benjamin and Lyna have separate packing ticks; gifts and choices sync on paired phones. Use Departure & gifts for the final sweep.',tab:'departure'}
 );
 return sections;
}
function isDone(id){return !!progress().reviewed?.[id]}
function isLater(id){return !!progress().deferred?.[id]}
function reviewedCount(){return steps().filter(s=>isDone(s.id)).length}
function notice(message){TOAST=message;if(OPEN)render()}
function selectNativeChoice(choice,option){
 // Delegate to the real React UI. Never write another copy of itinerary choices.
 const nav=Array.from(document.querySelectorAll('.topbar .mainnav button')).find(x=>/decisions/i.test(x.textContent||''));
 if(nav)nav.click();
 close();
 setTimeout(()=>{
  const node=document.getElementById('decision-'+choice.id);
  const rows=node?Array.from(node.querySelectorAll('.choice-row')):[];
  const normal=x=>String(x||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const title=normal(option[1]);
  const target=rows.find(x=>normal(x.textContent||'').startsWith(title))||rows.find(x=>normal(x.textContent||'').includes(title));
  if(target&&typeof target.click==='function'){
   target.click();markPassport('choice:'+choice.id,'done');
   STEP=Math.min(steps().length-1,STEP+1);
   TOAST='Choice saved by the original Decisions card. Your Passport is ready for the next step.';
  }else{
   TOAST='Open this decision in the app and select your preference there. No choice was changed automatically.';
  }
  if(node)node.scrollIntoView({behavior:'smooth',block:'center'});
 },130);
}
function renderPassport(){
 const out=el('div','noux-companion-stack'),all=steps(),index=Math.max(0,Math.min(STEP,all.length-1)),step=all[index],p=progress();
 const intro=el('div','noux-passport-top');
 intro.append(el('span','noux-passport-stamp','NOUX / PASSPORT'));
 const chooser=el('select','noux-companion-select');
 ['Lyna','Benjamin'].forEach(k=>{const op=el('option',null,k);op.value=k;chooser.append(op)});
 chooser.value=WHO;chooser.addEventListener('change',()=>{WHO=chooser.value;STEP=0;render()});
 intro.append(chooser);out.append(intro);
 const count=reviewedCount(),meter=el('div','noux-passport-meter'),bar=el('span');
 bar.style.width=Math.round(count/all.length*100)+'%';meter.append(bar);out.append(meter);
 out.append(el('p','noux-companion-kicker','STEP '+(index+1)+' / '+all.length+' · '+count+' passport stamps · '+step.phase));
 out.append(el('h3','noux-companion-heading',step.title));
 out.append(note(step.detail));
 if(step.type==='choice'){
  const choice=step.choice,selected=currentChoices()[choice.id]||window.NYC_DATA.DEFAULT?.[choice.id]||'';
  const list=el('div','noux-passport-options');
  (choice.options||[]).forEach(opt=>{
   if(!Array.isArray(opt))return;
   const row=el('div','noux-passport-option'),copy=el('div','noux-passport-option-copy');
   copy.append(el('strong',null,opt[1]||opt[0]),el('small',null,opt[2]||''));
   if(selected===opt[0])copy.append(el('span','noux-passport-current','Current plan'));
   const choose=btn('Choose',()=>selectNativeChoice(choice,opt),'noux-companion-secondary');
   row.append(copy,choose);list.append(row);
  });
  out.append(list);
  out.append(note('Choose uses the original NOUX Decisions card, so your shared itinerary remains the single source of truth. An option is not a reservation.'));
 }else if(step.type==='feature'){
  const action=step.tab==='departure'
   ?btn('Open packing & gifts',()=>{close();document.querySelector('.noux-departure-launcher')?.click()},'noux-companion-primary')
   :btn('Explore this section',()=>{TAB=step.tab;render()},'noux-companion-primary');
  out.append(action);
 }else{
  const dates=el('div','noux-passport-days');
  DAYS.forEach(d=>dates.append(el('span',null,LABELS[d])));
  out.append(dates);
 }
 const status=isDone(step.id)?'Passport stamped':isLater(step.id)?'Decide later':'Not reviewed yet';
 out.append(el('p','noux-passport-review',status));
 const controls=el('div','noux-companion-actions');
 controls.append(btn('‹ Previous',()=>{STEP=Math.max(0,index-1);render()},'noux-companion-secondary'));
 controls.append(btn('Decide later',()=>{markPassport(step.id,'later');STEP=Math.min(all.length-1,index+1);render()},'noux-companion-secondary'));
 controls.append(btn('Stamp as reviewed',()=>{markPassport(step.id,'done');STEP=Math.min(all.length-1,index+1);render()},'noux-companion-primary'));
 if(index<all.length-1)controls.append(btn('Next ›',()=>{STEP=index+1;render()},'noux-companion-secondary'));
 out.append(controls);
 if(count===all.length)out.append(el('p','noux-passport-finish','Passport complete. You can still change any choice in Decisions, and revisit this tour whenever you want.'));
 const deferred=all.filter(s=>p.deferred?.[s.id]);
 if(deferred.length){
  const pending=el('div','noux-passport-pending');
  pending.append(el('strong',null,'Still to decide · '+deferred.length));
  deferred.forEach(t=>pending.append(btn(t.title,()=>{STEP=all.findIndex(s=>s.id===t.id);render()},'noux-passport-jump')));
  out.append(pending);
 }
 return out;
}
function taskKey(day,ev){return day+':'+String(ev.id||ev.title||'').slice(0,110)}
function bookingTasks(){
 const result=[],seen=new Set();
 const add=t=>{if(!seen.has(t.id)){seen.add(t.id);result.push(t)}};
 for(const day of DAYS){
  for(const ev of events(day)){
   const status=String(ev.status||'').toLowerCase();
   if(!['booked','arranged','confirmed','ticket-to-check','unverified','hours-to-check','verify'].includes(status))continue;
   add({id:taskKey(day,ev),day,title:ev.title,status,detail:ev.detail||'',place:ev.place});
  }
 }
 const mon=events('mon').find(e=>/cruise/i.test(e.title||'')&&['booked','confirmed'].includes(String(e.status).toLowerCase()));
 if(mon)add({id:'extra:cruise-pier',day:'mon',title:'Verify cruise pier & boarding instructions',status:'verify',detail:'Use the exact terminal and check-in time printed on your booking, not a guessed pier.',place:mon.place});
 const fri=events('fri').find(e=>/coach|airport transfer|pickup/i.test(e.title||'')||e.id==='pickup');
 if(fri)add({id:'extra:coach',day:'fri',title:'Confirm lobby meeting point for arranged group transfer',status:'verify',detail:'Have all luggage collected and follow the organiser’s instructions.',place:fri.place});
 return result.slice(0,90);
}
function markReady(id,checked){
 saveJournal(j=>{j.nouxReadiness??={};j.nouxReadiness[id]={handled:!!checked,at:Date.now()}});
 render();
}
function renderBookings(){
 const out=el('div','noux-companion-stack'),items=bookingTasks(),flags=journal().nouxReadiness||{};
 const pending=items.filter(x=>!flags[x.id]?.handled);
 out.append(el('h3','noux-companion-heading','Tickets & readiness'));
 out.append(note('These are your itinerary’s actual booking statuses. Checking a task means you personally reviewed it; NOUX does not buy tickets or verify reservations.'));
 out.append(el('p','noux-companion-kicker',pending.length+' items to review · '+(items.length-pending.length)+' reviewed'));
 if(!items.length)out.append(note('No ticketed or arranged stops were detected. Your original itinerary remains unchanged.'));
 for(const day of DAYS){
  const group=items.filter(x=>x.day===day);if(!group.length)continue;
  out.append(el('h4','noux-companion-section',LABELS[day]));
  for(const t of group){
   const card=el('div','noux-companion-task');
   const check=el('input');check.type='checkbox';check.checked=!!flags[t.id]?.handled;
   check.setAttribute('aria-label','Reviewed: '+t.title);check.addEventListener('change',()=>markReady(t.id,check.checked));
   const info=el('div','noux-companion-taskinfo');
   info.append(el('strong',null,t.title));
   const label=['booked','confirmed','arranged'].includes(t.status)?'Scheduled/arranged in the itinerary':'Still requires checking';
   info.append(el('small',null,label+' · '+t.status));
   if(t.detail)info.append(el('p',null,maybeTitle(t.detail,350)));
   const v=window.NYC_DATA?.P?.[t.place];
   if(v?.address)info.append(external('Venue directions',maps(v.address),'noux-companion-link'));
   card.append(check,info);out.append(card);
  }
 }
 return out;
}
function renderGo(){
 const out=el('div','noux-companion-stack'),data=goData(),rows=data.rows;
 out.append(el('h3','noux-companion-heading','GO · your next move'));
 out.append(note('Simple live-clock view of your planned itinerary. Transit durations are estimates; check the real route before departing.'));
 const days=el('div','noux-companion-daychips');
 [['auto','Today / preview'],...DAYS.map(d=>[d,LABELS[d]])].forEach(([d,label])=>days.append(btn(label,()=>{GO_DAY=d;render()},'noux-companion-day'+(GO_DAY===d?' active':''))));
 out.append(days);
 out.append(el('p','noux-companion-kicker',data.live?'NEW YORK TIME '+data.now.clock:'PREVIEW · '+LABELS[data.day]+' · New York EST'));
 if(!rows.length){out.append(note('No planned stops available for this day. Try another day or use the native itinerary.'));return out}
 const first=Math.min(data.index,rows.length-1);
 const current=rows[first];
 if(data.index>=rows.length){out.append(note('All events for this day are completed.'));return out}
 const card=el('div','noux-companion-next');
 card.append(el('small',null,data.live&&minute(current.start)<=data.now.minutes?'HAPPENING OR COMING NEXT':'NEXT PLANNED STOP'));
 card.append(el('h4',null,current.title));
 card.append(el('p',null,current.start+'–'+current.end+' · '+current.kind+' · '+(current.status||'proposed')));
 const p=place(current);
 if(p?.name)card.append(el('p',null,p.name+(p.address?' · '+p.address:'')));
 if(current.detail)card.append(el('p','noux-companion-help',maybeTitle(current.detail,390)));
 const actions=el('div','noux-companion-actions');
 if(p?.address){actions.append(external('Transit directions',maps(p.address,'transit'),'noux-companion-primary noux-companion-link'));actions.append(external('Walking directions',maps(p.address,'walking'),'noux-companion-secondary noux-companion-link'))}
 else actions.append(note('This stop has no verified mapped address yet. Open the original itinerary for details.'));
 card.append(actions);out.append(card);
 const future=rows.slice(first+1,first+4);
 if(future.length){
  out.append(el('h4','noux-companion-section','After that'));
  future.forEach(ev=>{const row=el('div','noux-companion-follow');row.append(el('strong',null,ev.start),el('span',null,ev.title));out.append(row)});
 }
 out.append(external('Official MTA subway maps','https://new.mta.info/maps/subway-line-maps'));
 out.append(note('MTA realtime predictions and map tiles need internet. Never infer platform direction solely from the final destination; check train line and terminal sign.'));
 return out;
}
function locationArea(){
 if(!navigator.geolocation){notice('This device does not offer browser location. Choose a neighbourhood manually.');return}
 navigator.geolocation.getCurrentPosition(pos=>{
  const found=nearestArea(pos.coords.latitude,pos.coords.longitude);
  AREA=found.id;TOAST='Closest approximate neighbourhood: '+found.label+' (not a walking-distance estimate).';
  render();
 },()=>notice('Location is unavailable or permission was declined. Choose the area manually.'),{enableHighAccuracy:false,timeout:8000,maximumAge:300000});
}
async function checkWeather(){
 if(BUSY)return;
 BUSY=true;WEATHER_ERROR='';render();
 try{
  const q='https://api.open-meteo.com/v1/forecast?latitude=40.758&longitude=-73.985&current=temperature_2m,wind_speed_10m,precipitation,weather_code&daily=precipitation_probability_max,wind_speed_10m_max,temperature_2m_max,temperature_2m_min,weather_code&timezone=America%2FNew_York&forecast_days=7';
  const response=await fetch(q,{cache:'no-store'});
  if(!response.ok)throw Error('Weather service returned '+response.status);
  const v=await response.json();
  if(!Array.isArray(v?.daily?.time))throw Error('No current forecast available');
  WEATHER=v;WEATHER_AT=Date.now();
 }catch(_){WEATHER_ERROR='Forecast unavailable right now. Outdoor alternatives below remain available; verify opening hours.'}
 finally{BUSY=false;if(OPEN&&TAB==='nearby')render()}
}
function dailyWeather(day){
 const date=window.NYC_DATA?.DATES?.[day];if(!WEATHER?.daily||!date)return null;
 const i=WEATHER.daily.time.indexOf(date);if(i<0)return null;
 return {date,rain:WEATHER.daily.precipitation_probability_max?.[i],wind:WEATHER.daily.wind_speed_10m_max?.[i],low:WEATHER.daily.temperature_2m_min?.[i],high:WEATHER.daily.temperature_2m_max?.[i],code:WEATHER.daily.weather_code?.[i]};
}
function renderNearby(){
 const out=el('div','noux-companion-stack');
 out.append(el('h3','noux-companion-heading','Food near your route'));
 out.append(note('Pick your current neighbourhood or ask the browser to suggest an approximate area. Location stays on this phone; no GPS coordinates are uploaded to NOUX.'));
 const areas=el('div','noux-companion-daychips');
 AREAS.forEach(a=>areas.append(btn(a.label,()=>{AREA=a.id;render()},'noux-companion-day'+(AREA===a.id?' active':''))));
 out.append(areas,btn('Use my approximate location',locationArea,'noux-companion-secondary'));
 const picks=foodByArea(AREA);
 out.append(el('h4','noux-companion-section',picks.length+' nearby food ideas · '+(AREAS.find(x=>x.id===AREA)?.label||AREA)));
 if(!picks.length)out.append(note('No curated match for this area. Try the Food guide, or search nearby businesses in Maps.'));
 for(const p of picks){
  const card=el('div','noux-companion-food');
  card.append(el('strong',null,p.venue||p.name),el('small',null,p.area+' · published hours: '+(p.regular||p.hours)));
  card.append(el('p',null,p.note));
  if(p.address)card.append(external('Directions from here',maps(p.address),'noux-companion-link'));
  out.append(card);
 }
 out.append(external('Open full Food guide', 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('food near '+(AREAS.find(x=>x.id===AREA)?.label||'New York City'))));
 out.append(el('h3','noux-companion-heading','Weather & indoor alternatives'));
 out.append(note('Current published forecast from Open-Meteo, checked on demand. Not a booking or an automatic route substitution.'));
 out.append(btn(BUSY?'Checking forecast…':'Check New York forecast',()=>{void checkWeather()},'noux-companion-primary'));
 if(WEATHER){
  const stamp='Last checked '+new Date(WEATHER_AT).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  out.append(el('p','noux-companion-kicker',stamp));
  for(const day of DAYS){
   const w=dailyWeather(day);if(!w)continue;
   const rain=Number(w.rain)||0,wind=Number(w.wind)||0;
   const risk=rain>=55||wind>=35;
   const line=el('div','noux-companion-forecast');
   line.append(el('strong',null,LABELS[day]));
   line.append(el('span',null,(w.low??'–')+'–'+(w.high??'–')+'°C · rain '+(w.rain??'–')+'% · max wind '+(w.wind??'–')+' km/h'));
   line.append(el('small',null,risk?'Outdoor plan needs a weather backup':'No major rain/wind trigger in this forecast'));
   out.append(line);
  }
 }
 if(WEATHER_ERROR)out.append(el('p','noux-companion-error',WEATHER_ERROR));
 const a=AREAS.find(x=>x.id===AREA);
 out.append(el('h4','noux-companion-section','Indoor alternative in this neighbourhood'));
 out.append(note(a.indoor+'. Check actual hours before going, especially on Thanksgiving. No booked outdoor experience will be cancelled automatically.'));
 out.append(external('Map indoor fallback',maps(a.address),'noux-companion-secondary noux-companion-link'));
 out.append(external('Forecast source · Open-Meteo','https://open-meteo.com/en/docs'));
 return out;
}
async function offlineRequest(type){
 if(!navigator.serviceWorker)throw Error('Service workers are unavailable in this browser.');
 const registration=OFFLINE_REG||await navigator.serviceWorker.ready;
 const target=navigator.serviceWorker.controller||registration.active||registration.waiting;
 if(!target)throw Error('Offline worker is not active. Reload the website once while online.');
 return new Promise((resolve,reject)=>{
  const channel=new MessageChannel(),timeout=setTimeout(()=>reject(Error('Offline storage did not respond. Try again while online.')),30000);
  channel.port1.onmessage=event=>{
   clearTimeout(timeout);channel.port1.close();
   if(event.data?.ok)resolve(event.data.result);else reject(Error(event.data?.error||'Offline storage unavailable'));
  };
  target.postMessage({type},[channel.port2]);
 });
}
async function offlineAction(type){
 if(OFFLINE_BUSY)return;
 if(type==='NOUX_OFFLINE_CLEAR'&&!confirm('Remove the downloaded offline pack? This does NOT erase your saved choices, sync pairing, or checklists.'))return;
 OFFLINE_BUSY=true;OFFLINE_ERROR='';render();
 try{
  const result=await offlineRequest(type);
  if(type==='NOUX_OFFLINE_SAVE')OFFLINE=result;
  else if(type==='NOUX_OFFLINE_CLEAR')OFFLINE={ready:false};
  else OFFLINE=result;
  if(type==='NOUX_OFFLINE_SAVE'&&!result.ok)OFFLINE_ERROR='Offline pack is incomplete: '+(result.failed||[]).slice(0,5).join(', ')+'. Retry while connected.';
 }catch(e){OFFLINE_ERROR=e.message}
 finally{OFFLINE_BUSY=false;if(OPEN&&TAB==='offline')render()}
}
function renderOffline(){
 const out=el('div','noux-companion-stack');
 out.append(el('h3','noux-companion-heading','Offline Travel Essentials'));
 out.append(note('Download a safe offline copy for subway tunnels or poor reception. This pack stores PUBLIC website files and your already-encrypted itinerary vault. Your private passphrase and decrypted itinerary are never cached.'));
 const ready=OFFLINE?.ready||OFFLINE?.ok&&OFFLINE.vaultSaved&&OFFLINE.failed?.length===0;
 out.append(el('p','noux-companion-kicker',ready?'OFFLINE PACK READY':'OFFLINE PACK NOT VERIFIED'));
 if(OFFLINE?.publicCount!==undefined)out.append(note(OFFLINE.publicCount+' / '+(OFFLINE.total||'–')+' public files saved; encrypted vault '+(OFFLINE.vaultSaved?'saved':'not saved')));
 const actions=el('div','noux-companion-actions');
 actions.append(btn(OFFLINE_BUSY?'Saving…':'Save / update offline pack',()=>{void offlineAction('NOUX_OFFLINE_SAVE')},'noux-companion-primary'));
 actions.append(btn('Check offline status',()=>{void offlineAction('NOUX_OFFLINE_STATUS')},'noux-companion-secondary'));
 actions.append(btn('Clear offline pack',()=>{void offlineAction('NOUX_OFFLINE_CLEAR')},'noux-companion-secondary'));
 out.append(actions);
 if(OFFLINE_ERROR)out.append(el('p','noux-companion-error',OFFLINE_ERROR));
 out.append(el('h4','noux-companion-section','What works offline?'));
 out.append(note('The login screen, public guides and encrypted itinerary can open with the same passphrase after the pack is saved. GPS, live MTA arrivals, forecast updates and map tiles require internet. Verify it once by switching to airplane mode and reloading after saving.'));
 out.append(note('Offline access depends on this device retaining browser Cache Storage. Do not clear website data; save a copy on each phone independently.'));
 return out;
}
function heading(){
 const bar=el('div','noux-companion-head'),title=el('div');
 title.append(el('small','noux-companion-brand','NOUX · YOUR NEW YORK'),el('h2',null,'Travel Companion'),el('p',null,'Your guide to deciding, getting around and being ready.'));
 bar.append(title,btn('× Close',close,'noux-companion-close'));return bar;
}
function render(){
 if(!ROOT||!OPEN)return;
 const inner=ROOT.querySelector('.noux-companion-inner');if(!inner)return;
 const nav=el('div','noux-companion-tabs');
 TABS.forEach(([id,label])=>nav.append(btn(label,()=>{TAB=id;render()},'noux-companion-tab'+(TAB===id?' active':''))));
 let body;
 try{body=TAB==='passport'?renderPassport():TAB==='go'?renderGo():TAB==='bookings'?renderBookings():TAB==='nearby'?renderNearby():renderOffline()}
 catch(_){body=el('div');body.append(note('This section is temporarily unavailable. The original itinerary remains unchanged.'))}
 inner.replaceChildren(heading(),nav,body);
 if(TOAST)inner.append(el('p','noux-companion-status',TOAST));
}
function open(tab){
 if(!INSTALLED)return;
 if(tab&&TABS.some(x=>x[0]===tab))TAB=tab;
 ROOT.hidden=false;OPEN=true;document.body.classList.add('noux-companion-open');
 render();ROOT.querySelector('.noux-companion-close')?.focus();
}
function close(){OPEN=false;if(ROOT)ROOT.hidden=true;document.body.classList.remove('noux-companion-open')}
function install(){
 if(INSTALLED)return true;
 if(!window.NYC_DATA||!window.NYC_PLAN||typeof window.NYC_PLAN.day!=='function')return false;
 ROOT=el('section','noux-companion-modal');ROOT.id='noux-companion';
 ROOT.hidden=true;ROOT.setAttribute('role','dialog');ROOT.setAttribute('aria-modal','true');ROOT.setAttribute('aria-label','New York Travel Companion');
 ROOT.append(el('div','noux-companion-inner'));document.body.append(ROOT);
 LAUNCHER=btn('Travel Companion',()=>open(),'noux-companion-launcher');LAUNCHER.id='noux-companion-launcher';document.body.append(LAUNCHER);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&OPEN)close()});
 INSTALLED=true;
 if(navigator.serviceWorker){
  navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(reg=>{
   OFFLINE_REG=reg;
   return offlineRequest('NOUX_OFFLINE_STATUS');
  }).then(v=>{OFFLINE=v;if(OPEN&&TAB==='offline')render()}).catch(e=>{OFFLINE_ERROR='Offline support not active: '+e.message});
 }else OFFLINE_ERROR='Offline support is not available in this browser.';
 return true;
}
window.NOUX_COMPANION={install,open,goData,bookingTasks,steps,nearestArea,foodByArea,version:'2026.11.21-toolkit1'};
})();