/* NYX — a genuinely interactive React trip concierge.
   Browser-only storage. No purchase, booking, contact or live prediction is fabricated. */
(function(){
 const R=window.React, ReactDOM=window.ReactDOM, h=R.createElement;
 const {useState,useEffect,useMemo,useRef}=R;
 const DATA=window.NYC_DATA, PLAN=window.NYC_PLAN, MTA=window.NYC_MTA;
 const $=(tag,props,...children)=>h(tag,props,...children.flat().filter(x=>x!==null&&x!==undefined&&x!==false));
 const storeKey='nyc_lyna_trip_v6';
 const init=()=>{try{const stored=JSON.parse(localStorage.getItem(storeKey)||'{}');const fromUrl=new URLSearchParams(location.search).get('choices');if(fromUrl){const json=JSON.parse(decodeURIComponent(escape(atob(fromUrl.replace(/-/g,'+').replace(/_/g,'/')))));return {...stored,choices:{...DATA.DEFAULT,...json}}}return stored}catch(_){return{}}};
 const FIRST=init();
 const pad=n=>String(n).padStart(2,'0');
 const nyClock=()=>{const f=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});const z={};for(const p of f.formatToParts(new Date()))z[p.type]=p.value;return {date:`${z.year}-${z.month}-${z.day}`,minutes:Number(z.hour)*60+Number(z.minute),clock:`${z.hour}:${z.minute}`}};
 const link=(url,txt,cls='textlink')=>$('a',{href:url,target:'_blank',rel:'noopener noreferrer',className:cls},txt,' ↗');
 const ICON={star:'✦',clock:'◷',pin:'⌖',music:'♫',check:'✓',arrow:'↗',train:'Ⓜ',locked:'◆'};
 function fmt(k){return ({booked:'Booked by Lyna',arranged:'Travel anchor','ticket-to-check':'Tickets to check',verify:'Verify voucher',unverified:'Not fully verified','hours-to-check':'Holiday hours to confirm',proposed:'Proposed'})[k]||k}
 function Badge({status}){return $('span',{className:'badge '+(['booked','arranged'].includes(status)?'b-good':['unverified','verify','hours-to-check'].includes(status)?'b-warn':'')},fmt(status))}
 function CoverPhoto({name,className='',alt='',caption=false}){
  const [idx,setIdx]=useState(0),[failed,setFailed]=useState(false);const srcMeta=window.NYC_PHOTO_SOURCES?.[name];const downloaded=window.NYC_PHOTO_INDEX?.[name];
  const choices=[downloaded?.path?window.NYC_BASE+downloaded.path:null,...(srcMeta?.urls||[])].filter(Boolean);
  const src=choices[idx]||null;
  useEffect(()=>{setIdx(0);setFailed(false)},[name,downloaded?.path]);
  return $('div',{className:'photo '+className},src&&!failed?$('img',{src,alt:alt||downloaded?.label||srcMeta?.label||name,loading:'lazy',decoding:'async',onError:()=>idx+1<choices.length?setIdx(idx+1):setFailed(true)}):$('div',{className:'no-photo'},$('span',null,'PHOTO'),$('b',null,srcMeta?.label||name),$('small',null,'Photo currently unavailable · view original source below')),
   caption&&$('div',{className:'photo-caption'},$('span',null,srcMeta?.exact===false?'NYC atmosphere':'Real place photograph'),srcMeta?.source&&link(srcMeta.source,'Source')));
 }
 function SectionHead({eyebrow,title,sub,action}){return $('div',{className:'sectionhead'},$('div',null,$('div',{className:'eyebrow'},eyebrow),$('h2',null,title),sub&&$('p',{className:'section-sub'},sub)),action||null)}
 function Destination({place}){const p=DATA.P[place];return p?$('span',{className:'small-place'},ICON.pin+' '+p.area):null}
 function Toast({msg}){if(!msg)return null;return $('div',{className:'toast'},msg)}
 function DecisionCard({c,choices,onChoose,bookings,setBookings}){
  const selection=choices[c.id],selected=c.options.find(a=>a[0]===selection);const valid=selected?.[1]||'Undecided';
  return $('div',{className:'decision-card',id:'decision-'+c.id},
   $('div',{className:'decision-header'},$('span',{className:'decision-id'},c.id.toUpperCase()),$('span',{className:'decision-day'},c.day==='mon'?'MON 23':c.day==='tue'?'TUE 24':c.day==='wed'?'WED 25':c.day==='thu'?'THU 26':'FRI 27')),
   $('h3',null,c.title),$('p',{className:'sub'},c.desc),
   $('div',{className:'choice-rows'},c.options.map(o=>$('button',{key:o[0],type:'button',className:'choice-row'+(selection===o[0]?' active':''),onClick:()=>onChoose(c.id,o[0]),'aria-pressed':selection===o[0]},
    $('span',{className:'radio'},selection===o[0]?'✓':''),$('span',{className:'choice-text'},$('b',null,o[1]),$('small',null,o[2]))))),
   $('div',{className:'choice-footer'},$('span',null,'CURRENT CHOICE'),$('strong',null,valid),['c2','c3','c4'].includes(c.id)&&$('label',{className:'book-check'},$('input',{type:'checkbox',checked:!!bookings[`${c.id}:${selection}`],onChange:e=>setBookings(b=>({...b,[`${c.id}:${selection}`]:e.target.checked}))}),' Tickets purchased (manual)'))
  );
 }
 function DecisionPanel({choices,setChoice,bookings,setBookings,filter=null}){const cs=filter?DATA.CHOICES.filter(x=>x.day===filter):DATA.CHOICES;return $('div',{className:'decisions-grid'},cs.map(c=>$(DecisionCard,{key:c.id,c,choices,onChoose:setChoice,bookings,setBookings})))}
 function getRoutes(events){const legs=PLAN.legs(events);const m={};for(const l of legs){const key=l.to.id;(m[key]??=[]).push(l)}return m}
 function Timeline({day,events,liveNow,bookings}){
  const legs=getRoutes(events),isToday=liveNow.date===DATA.DATES[day];let next=events.find(e=>PLAN.mins(e.end) > liveNow.minutes);
  return $('div',{className:'timeline'},events.map((e,i)=>{
   const p=DATA.P[e.place],lg=legs[e.id]||[],past=isToday&&PLAN.mins(e.end)<liveNow.minutes;
   return $('div',{key:e.id},lg.map((l,j)=>$('div',{className:'travel-leg '+(l.warning==='tight'?'tight':''),key:'leg'+j},$('span',{className:'travel-track'},'↗'),$('span',null,`${l.mode==='walking'?'Walk':'Subway / taxi'} · allow ~${l.estimate} min (estimate, not live)`),$('span',{className:'travel-slack'},l.slack<l.estimate?'Check timing':' '),link(PLAN.routeUrl(l.from.place,l.to.place,l.mode),'Live directions'))),
   $('div',{className:'event '+(past?'passed ':'')+(e.status==='booked'?'event-booked ':'')+(isToday&&next?.id===e.id?'event-next':'')},
    $('div',{className:'event-time'},$('b',null,e.start),$('small',null,e.end)),
    $('div',{className:'event-track'},$('i',null)),
    $('div',{className:'event-content'},$('div',{className:'event-top'},$('div',{className:'event-kind'},e.kind),$(Badge,{status:e.status})),
     $('h3',null,e.title),$('p',null,e.detail),
     $('div',{className:'event-actions'},$(Destination,{place:e.place}),p&&link(PLAN.routeUrl('sanctuary',e.place,'transit'),'Directions'),p?.url&&link(p.url,'Official page'))),
    (i<5||e.kind==='club'||e.kind==='highlight')&&p?.photo&&$(CoverPhoto,{name:p.photo,className:'event-thumb'})
   ));
  }));
 }
 function TimeInfo(){const [v,setV]=useState(nyClock());useEffect(()=>{const id=setInterval(()=>setV(nyClock()),30000);return()=>clearInterval(id)},[]);return $('span',{className:'time-now'},'NYC local ',v.clock)}
 function DaySummary({d,choices,now,onSelect,active}){const [key,day,date,sub]=d;const eventCount=PLAN.day(key,choices).length;return $('button',{type:'button',className:'daytab'+(active===key?' chosen':''),onClick:()=>onSelect(key)},$('small',null,date),$('b',null,day),$('span',null,sub),$('small',{className:'count'},eventCount+' stops'))}
 function TripDay({day,choices,setChoice,bookings,setBookings,now}){const events=useMemo(()=>PLAN.day(day,choices),[day,choices]);const d=DATA.DAYS.find(a=>a[0]===day);const changed=DATA.CHOICES.filter(c=>c.day===day),conf=day==='thu'?PLAN.findConflicts(choices):[]; const nextToday=now.date===DATA.DATES[day]?events.find(e=>PLAN.mins(e.end)>now.minutes):null;
  return $('div',{className:'day-view'},
   $(SectionHead,{eyebrow:`${d[1]} · ${d[2]} · 2026`,title:d[3],sub:day==='mon'?'16:00 Golden Hour Cruise is BOOKED. Its pier and boarding deadline must match the voucher.':day==='thu'?'Thanksgiving. Restaurant and rooftop openings need date-specific confirmation.':'Every selected alternative changes the route and the pacing.'}),
   $('div',{className:'day-hero'},$('div',{className:'day-hero-text'},$('div',{className:'overline'},'CURATED FOR TWO'),$('h3',null,({mon:'The city, from the water.',tue:'The beautiful slow discoveries.',wed:'A little wild, a lot of soul.',thu:'Our New York after dark.',fri:'One last look.'})[day]),$('p',null,({mon:'Land, breathe, eat, cruise, dress up. No mad rush.',tue:'Butterflies, books and a luminous soundtrack.',wed:'Two libraries, Williamsburg, then a real dancefloor.',thu:'We refuse to confuse an open bar with a real house night.',fri:'A final neighbourhood moment, never at the expense of the transfer.'})[day])),
    $(CoverPhoto,{name:({mon:'cruise',tue:'butterfly',wed:'domino',thu:'westlight',fri:'grandcentral'})[day],className:'day-hero-photo',caption:true})),
   nextToday&&$('div',{className:'today-strip'},'LIVE TODAY IN NYC · ', $('strong',null,`Up next ${nextToday.start}: ${nextToday.title}`),' · Transport estimates remain approximate; use live directions.'),
   conf.length>0&&$('div',{className:'warnings'},$('strong',null,'Timing & verification notes'),conf.map((x,i)=>$('p',{key:i},'• '+x))),
   $('div',{className:'columns'},$('div',{className:'route-column'},$('div',{className:'minihead'},'YOUR LIVE-ADAPTING SCHEDULE', $('small',null,'All times New York local · proposals unless labelled booked')),$(Timeline,{day,events,liveNow:now,bookings})),
    $('aside',{className:'aside-column'},$('div',{className:'sticky'},$('h3',null,'Your decisions'),$('p',{className:'sub'},'Changing one selection redraws the agenda and the map.'),$(DecisionPanel,{choices,setChoice,bookings,setBookings,filter:day}),
      $('div',{className:'side-note'},'Subway arrival times are real-time only near departure. Travel allowances shown on the timeline are planning estimates, never a claim of live routing.')))));
 }
 function MapView({day,choices}){
  const el=useRef(null),map=useRef(null),layer=useRef(null),[status,setStatus]=useState('Loading map…');
  const events=useMemo(()=>PLAN.day(day,choices),[day,choices]);const pts=events.map(e=>({event:e,place:DATA.P[e.place]})).filter(a=>a.place&&a.place.lat);
  useEffect(()=>{
   if(!el.current)return;
   if(!window.L){setStatus('Interactive map tiles require an internet connection. Route list is available below.');return;}
   if(!map.current){map.current=window.L.map(el.current,{zoomControl:true,scrollWheelZoom:false});window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map.current);}
   if(layer.current)layer.current.remove();layer.current=window.L.layerGroup().addTo(map.current);
   const seen=new Set(),coords=[];
   pts.forEach((entry,i)=>{const p=entry.place;const unique=p.lat.toFixed(4)+p.lng.toFixed(4);if(seen.has(unique))return;seen.add(unique);coords.push([p.lat,p.lng]);const content=`<div style="font:13px system-ui"><b>${p.name.replace(/</g,'&lt;')}</b><br/>${entry.event.start} · ${entry.event.title.replace(/</g,'&lt;')}</div>`;window.L.marker([p.lat,p.lng]).bindPopup(content).addTo(layer.current)});
   if(coords.length>1){window.L.polyline(coords,{color:'#af8e5a',weight:3,dashArray:'5,8',opacity:.85}).addTo(layer.current);map.current.fitBounds(coords,{padding:[40,40],maxZoom:12});}
   else if(coords.length===1)map.current.setView(coords[0],12);
   requestAnimationFrame(()=>map.current?.invalidateSize());setStatus('');
  },[day,choices]);
  useEffect(()=>()=>{map.current?.remove();map.current=null},[]);
  return $('div',{className:'map-layout'},$(SectionHead,{eyebrow:'GEOGRAPHY',title:'The route, adapting to your choices',sub:'Pins are approximate and connect the actual chosen stops. The line illustrates stop order, not an MTA train route.'}),
   $('div',{className:'map-board'},$('div',{className:'map-canvas',ref:el,role:'application','aria-label':'NYC itinerary map'}),status&&$('p',{className:'map-status'},status)),
   $('div',{className:'route-list'},pts.map((x,i)=>$('div',{className:'route-stop',key:i},$('span',{className:'route-number'},i+1),$('div',null,$('b',null,x.event.title),$('p',null,x.event.start+' · '+x.place.area)),link('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(x.place.address),'Open maps')))));
 }
 function LivePanel({day,choices,proxy,setProxy,now}){
  const [station,setStation]=useState('times'),[result,setResult]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
  const stations=DATA.STATIONS;
  const nearby=useMemo(()=>{let evs=PLAN.day(day,choices);const current=DATA.DATES[day]===now.date?evs.find(x=>PLAN.mins(x.end)>=now.minutes):evs.find(x=>x.kind==='club'||x.kind==='museum'||x.kind==='culture');return DATA.P[current?.place]?.station||'times'},[day,choices,now.date,now.minutes]);
  useEffect(()=>{setStation(nearby)},[nearby]);
  const fetchNow=async()=>{setLoading(true);setError('');try{const d=await MTA.arrivals(station,proxy);setResult(d)}catch(e){setResult(null);setError(e.message||String(e))}setLoading(false)};
  useEffect(()=>{setResult(null);setError('')},[station,proxy]);
  useEffect(()=>{if(!Object.values(DATA.DATES).includes(now.date))return;let alive=true;const reload=()=>{if(alive)fetchNow()};reload();const timer=setInterval(reload,45000);return()=>{alive=false;clearInterval(timer)}},[station,proxy,now.date]);
  return $('div',{className:'live-page'},$(SectionHead,{eyebrow:'MTA · SUBWAY REALTIME',title:'Your next train, not a guessed timetable',sub:'Live train predictions are fetched only when requested. Official MTA GTFS-Realtime data; a separate proxy is available if browser CORS prevents direct access.'}),
    $('div',{className:'live-grid'},$('div',{className:'live-card'},$('div',{className:'live-header'},$('span',{className:'mta-logo'},'MTA'),$('div',null,$('h3',null,'Live platform arrivals'),$('p',null,'Choose a nearby station'))),
      $('label',{className:'field'},'Station', $('select',{value:station,onChange:e=>setStation(e.target.value)},Object.entries(stations).map(([id,s])=>$('option',{value:id,key:id},s.label)))),
      $('button',{className:'primary-button',onClick:fetchNow,disabled:loading},loading?'Reading MTA feeds…':'Refresh live trains'),
      result&&$('div',{className:'departures'},$('div',{className:'source-label'},result.source+' · updated '+new Date(result.updated).toLocaleTimeString('en-US',{timeZone:'America/New_York'})),
       result.items.length?result.items.map((r,i)=>$('div',{className:'train-row',key:i},$('span',{className:'train-dot'},r.route||'?'),$('span',null,r.stop.endsWith('N')?'Uptown / North':'Downtown / South'),$('strong',null,Math.max(0,Math.round((r.time-Date.now()/1000)/60))+' min'))):$('p',{className:'sub'},'No live predictions available for the selected stop right now.'),result.partial&&$('p',{className:'error-inline'},'Some MTA feeds are unavailable.')),
      error&&$('div',{className:'error-box'},$('strong',null,'Live feed unavailable'),$('p',null,error),$('p',null,'No arrivals are being invented. Follow the official MTA page or configure the proxy in Settings.'))),
     $('div',{className:'live-card'},$('h3',null,'How to use this on your trip'),$('p',null,'The app recalculates which station to check when you change the day or the chosen venue. Subway feeds report platform arrival estimates, not a full door-to-door travel time.'),$('p',{className:'sub'},'For your exact itinerary and any reroutes, always open live transit directions as you leave.'),$('div',{className:'live-links'},link('https://new.mta.info/','Official MTA service status'),link('https://www.google.com/maps/dir/?api=1&travelmode=transit','Live Google Maps transit')), $('div',{className:'settings-strip'},'Current data source: ',proxy?'Custom CORS proxy':'Direct MTA (browser CORS may block)'))));
 }
 function Wishes({filter,setFilter}){const [search,setSearch]=useState('');const tags=[['all','All'],['art','Art'],['culture','Culture'],['music','Music'],['view','Views'],['food','Food'],['house','House']];const ws=DATA.WISHES.filter(x=>(filter==='all'||x[1]===filter)&&(!search||x[0].toLowerCase().includes(search.toLowerCase())));
  return $('div',{className:'wishes'},$(SectionHead,{eyebrow:'LYNA’S ORIGINAL LIST + NEW ADDITIONS',title:'Everything is still here',sub:'An option remains visible even when it is not selected in the main route. Core ≠ booked; “watch” ≠ confirmed.'}),
   $('div',{className:'filterbar'},$('div',{className:'segmented'},tags.map(x=>$('button',{key:x[0],className:filter===x[0]?'selected':'',onClick:()=>setFilter(x[0])},x[1]))),$('input',{type:'search',placeholder:'Search the wish list…',value:search,onChange:e=>setSearch(e.target.value)})),
   $('div',{className:'wish-grid'},ws.map((x,i)=>$('article',{className:'wish-item',key:i},$('b',null,x[0]),$('div',null,$('span',null,x[1]+' · '+x[2]),$('em',null,x[3]))))));
 }
 function JourneyOverview({choices,setChoice,setDay,setTab,bookings}){
  return $('div',null,$('div',{className:'hero'},$('div',{className:'hero-copy'},$('div',{className:'hero-kicker'},'BEN × LYNA · 23—27 NOVEMBER 2026'),$('h1',null,'New York,', $('em',null,' our way.')),$('p',null,'An extraordinary city. An unhurried programme. The right music, the right views, and every choice we make together.'),$('div',{className:'hero-actions'},$('button',{className:'primary-button',onClick:()=>setTab('plan')},'Explore our itinerary ↗'),$('button',{className:'ghost-button',onClick:()=>setTab('choices')},'Make the decisions')),
     $('div',{className:'hero-facts'},$('span',null,'5 DAYS'),$('span',null,'4 NIGHTS'),$('span',null,'1 BOOKED CRUISE'),$('span',null,'8 DECISIONS'))),
     $('div',{className:'hero-images'},$(CoverPhoto,{name:'westlight',className:'hero-photo-main',caption:true}),$(CoverPhoto,{name:'albertine',className:'hero-photo-small',caption:true}))),
   $('div',{className:'overview-grid'},$('div',{className:'prologue'},$('div',{className:'eyebrow'},'ONE THING IS ALREADY BOOKED'),$('h2',null,'Monday, 4:00 pm.'),$('p',null,'Lyna’s Golden Hour Cruise. After landing at JFK at 10:55, we protect the boarding buffer and make the first evening deliberately relaxed.'),$('div',{className:'prologue-actions'},$('button',{onClick:()=>{setDay('mon');setTab('plan')}},'See Monday’s full timing →'),$(Badge,{status:'booked'}))),
    $('div',{className:'choices-preview'},$('div',{className:'eyebrow'},'OUR NIGHTLIFE MISSION'),$('h2',null,'Real house. Real dancing. Real skyline.'),$('p',null,'A rooftop cocktail is not a DJ party. We choose with eyes open: Louie Vega or Soul in the Horn on Wednesday; Le Bain or Westlight + David Morales on Thursday.'),$('div',{className:'pills'},$('span',null,'SOULFUL HOUSE'),$('span',null,'DISCO'),$('span',null,'JAZZ'),$('span',null,'REFINEMENT')))),
   $('div',{className:'overline dayset-title'},'THE FIVE CHAPTERS'),$('div',{className:'chapter-grid'},DATA.DAYS.map((d,i)=>$('button',{key:d[0],className:'chapter',onClick:()=>{setDay(d[0]);setTab('plan')}},$(CoverPhoto,{name:({mon:'cruise',tue:'butterfly',wed:'domino',thu:'lebain',fri:'grandcentral'})[d[0]]}),$('span',null,d[2]),$('b',null,d[3]),$('small',null,'Explore day ↗')))));
 }
 function Footer(){return $('footer',{className:'footer'},$('b',null,'NOUX / NYC 2026'),$('span',null,'Privately curated for Ben & Lyna · no tickets purchased by this site'),$('span',null,'Photo sources credited. MTA © Metropolitan Transportation Authority · Map © OpenStreetMap'))}
 function App(){const [choices,setChoices]=useState({...DATA.DEFAULT,...(FIRST.choices||{})}),[bookings,setBookings]=useState(FIRST.bookings||{}),[tab,setTab]=useState('home'),[day,setDay]=useState('mon'),[filter,setFilter]=useState('all'),[now,setNow]=useState(nyClock()),[proxy,setProxy]=useState(FIRST.proxy||''),[showSettings,setShowSettings]=useState(false),[toast,setToast]=useState(''),[sourceReady,setSourceReady]=useState(0);
  useEffect(()=>{const id=setInterval(()=>setNow(nyClock()),30000);return()=>clearInterval(id)},[]);
  useEffect(()=>{try{localStorage.setItem(storeKey,JSON.stringify({choices,bookings,proxy}))}catch(_){/* embedded preview or locked-down browser */}},[choices,bookings,proxy]);
  useEffect(()=>{fetch(window.NYC_BASE+'assets/photo-index.json',{cache:'no-store'}).then(r=>r.json()).then(j=>{window.NYC_PHOTO_INDEX=j;setSourceReady(n=>n+1)}).catch(()=>{})},[]);
  const setChoice=(id,val)=>{setChoices(old=>({...old,[id]:val}));setToast('The itinerary and map were updated.');setTimeout(()=>setToast(''),2500)};
  const exportICS=()=>{let lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//NOUX NYC//Trip Planner//EN','CALSCALE:GREGORIAN'];for(const [day,date] of Object.entries(DATA.DATES)){for(const e of PLAN.day(day,choices)){if(['travel','recovery','logistics'].includes(e.kind))continue;
   const ds=date.replace(/-/g,''),s=e.start.replace(':','')+'00',t=e.end.replace(':','')+'00';const end=(PLAN.mins(e.end)<PLAN.mins(e.start)?new Date(Date.parse(date+'T12:00:00Z')+86400000).toISOString().slice(0,10).replace(/-/g,''):ds);
   lines.push('BEGIN:VEVENT',`UID:nyc-${day}-${e.id}@noux`, `DTSTART;TZID=America/New_York:${ds}T${s}`,`DTEND;TZID=America/New_York:${end}T${t}`,`SUMMARY:${e.title.replace(/[,;]/g,' ')}`,`DESCRIPTION:${(e.detail+' | '+fmt(e.status)).replace(/[;,]/g,' ')}`,`LOCATION:${(DATA.P[e.place]?.address||'New York').replace(/[,;]/g,' ')}`,'END:VEVENT');
  }}lines.push('END:VCALENDAR');const blob=new Blob([lines.join('\r\n')],{type:'text/calendar;charset=utf-8'});download(blob,'Ben-Lyna-NYC-2026.ics')};
  const download=(blob,name)=>{const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000)};
  const share=async()=>{const s=btoa(unescape(encodeURIComponent(JSON.stringify(choices)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');const url=location.origin+location.pathname+'?choices='+s;try{await navigator.clipboard.writeText(url);setToast('Choice-only sharing link copied. Booking flags remain local.')}catch(_){prompt('Copy your sharing link:',url)}setTimeout(()=>setToast(''),3500)};
  const tabs=[['home','Overview'],['plan','Daily itinerary'],['map','Route map'],['subway','Subway arrivals'],['choices','Lyna’s decisions'],['wishes','Wish list']];
  return $('div',{className:'app-shell'},$('header',{className:'topbar'},$('div',{className:'brand',onClick:()=>setTab('home'),role:'button',tabIndex:0},$('span',{className:'brand-emblem'},'N'),$('span',null,$('b',null,'NOUX'),$('small',null,'NEW YORK EDITION'))),
    $('nav',{className:'mainnav'},tabs.map(t=>$('button',{key:t[0],className:tab===t[0]?'current':'',onClick:()=>setTab(t[0])},t[1]))),
    $('div',{className:'top-tools'},$(TimeInfo,{}),$('button',{className:'settings-button',title:'Settings',onClick:()=>setShowSettings(true)},'⚙'))),
   $('main',{className:'main'},tab==='home'&&$(JourneyOverview,{choices,setChoice,setDay,setTab,bookings}),
    tab==='plan'&&$('div',null,$('div',{className:'daytabs'},DATA.DAYS.map(d=>$(DaySummary,{d,key:d[0],choices,now,onSelect:setDay,active:day}))),$(TripDay,{day,choices,setChoice,bookings,setBookings,now})),
    tab==='map'&&$('div',null,$('div',{className:'daytabs'},DATA.DAYS.map(d=>$(DaySummary,{d,key:d[0],choices,now,onSelect:setDay,active:day}))),$(MapView,{day,choices})),
    tab==='subway'&&$(LivePanel,{day,choices,proxy,setProxy,now}),
    tab==='choices'&&$('div',null,$(SectionHead,{eyebrow:'LYNA, IT’S YOUR TURN',title:'Choose our version of New York.',sub:'Eight decisions. Each selection changes the itinerary, routes and the live map. Nothing is paid or reserved automatically.'}),
      $('div',{className:'decision-actions'},$('button',{className:'primary-button',onClick:()=>setTab('plan')},'See updated itinerary →'),$('button',{className:'ghost-button',onClick:share},'Share choices only'),$('button',{className:'ghost-button',onClick:exportICS},'Export calendar (.ics)')),
      $(DecisionPanel,{choices,setChoice,bookings,setBookings}),$('div',{className:'privacy-card'},'All choices and booking flags are stored in this browser. Sharing a link sends choices only. There is no account, no remote database, and no automatic purchase.')),
    tab==='wishes'&&$(Wishes,{filter,setFilter})),
   $(Footer,{}),$(Toast,{msg:toast}),showSettings&&$('div',{className:'modal-overlay',onClick:()=>setShowSettings(false)},$('section',{className:'modal',onClick:e=>e.stopPropagation()},$('div',{className:'modal-head'},$('h2',null,'Trip settings'),$('button',{onClick:()=>setShowSettings(false)},'✕')),
      $('p',null,'GitHub Pages hosts the planner. Live MTA arrivals need browser CORS access or the optional Cloudflare Worker included in the repository. No API key required for MTA public feeds.'),
      $('label',{className:'field'},'Cloudflare MTA proxy URL (optional)', $('input',{value:proxy,onChange:e=>setProxy(e.target.value),placeholder:'https://nyc-lyna-mta-feed.<account>.workers.dev',spellCheck:false})),
      $('p',{className:'sub'},'Leave blank to try the official MTA endpoint directly. If your browser blocks the feed, configure the Worker. The app never invents an arrival time.'),
      $('div',{className:'settings-actions'},$('button',{className:'ghost-button',onClick:()=>window.print()},'Print selected plan'),$('button',{className:'ghost-button',onClick:exportICS},'Download .ics'),$('button',{className:'primary-button',onClick:()=>setShowSettings(false)},'Done')),
      $('p',{className:'privacy-warning'},'Privacy: if you publish this repository publicly, its source includes travel dates, hotel and programme. Do not assume a simple page password protects these details.'))));
 }
 window.NYX=App;
 const mount=()=>ReactDOM.render($(App,{}),document.getElementById('root'));
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();