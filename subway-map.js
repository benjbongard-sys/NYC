/* NOUX Subway Companion. Runs only after the encrypted trip unlocks.
 * Geographical station map is based on MTA GTFS stops; subway paths are schematic
 * straight connections, NOT official tunnel geometry. Forecast markers show the
 * NEXT PREDICTED STOP, not physical GPS train positions. No direct blocked MTA requests.
 */
(function(){
'use strict';
if(window.NOUX_SUBWAY)return;
let DATA=null, MTA=null, ROUTER=null, installed=false, panel=null, map=null, network=null;
let stationKey='times',destKey='',dayKey='mon',timeValue='10:00',direction='all',live=[],liveUpdated=null,liveWarning='',route=null,routeNote='',inflight=false,lastRefresh=0;
const routes={A:'#0039a6',C:'#0039a6',E:'#0039a6',B:'#ff6319',D:'#ff6319',F:'#ff6319',M:'#ff6319',G:'#6cbe45',L:'#a7a9ac',N:'#fccc0a',Q:'#fccc0a',R:'#fccc0a',W:'#fccc0a',J:'#996633',Z:'#996633','1':'#ee352e','2':'#ee352e','3':'#ee352e','4':'#00933c','5':'#00933c','6':'#00933c','7':'#b933ad',S:'#808183'};
const empty=()=>({type:'FeatureCollection',features:[]});
const geof=(coords,props={})=>({type:'Feature',properties:props,geometry:{type:'Point',coordinates:coords}});
const linef=(coords,props={})=>({type:'Feature',properties:props,geometry:{type:'LineString',coordinates:coords}});
const code=stop=>String(stop||'').replace(/[NS]$/,'');
const timeOf=t=>{let v=String(t||'10:00').split(':').map(Number);return (v[0]||0)*60+(v[1]||0)};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const ui=(tag,cls,txt)=>{let x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x};
const btn=(text,cb,cls)=>{let x=ui('button',cls||'',text);x.type='button';x.addEventListener('click',cb);return x};
const setText=(sel,txt)=>{let el=panel?.querySelector(sel);if(el)el.textContent=txt};
const asRoute=r=>String(r||'?').toUpperCase();
function formatNY(){const p={};new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).forEach(x=>p[x.type]=x.value);return {date:p.year+'-'+p.month+'-'+p.day,time:p.hour+':'+p.minute}}
function directionName(stop,route){
 const d=String(stop||'').slice(-1).toUpperCase();
 if(d!=='N'&&d!=='S')return 'Check the platform destination sign';
 if(['L','G','7','S'].includes(asRoute(route)))return (d==='N'?'N':'S')+' platform · check the line’s final station sign';
 return d==='N'?'Uptown / northbound platform':'Downtown / southbound platform';
}
function getProxy(){
 try{const v=JSON.parse(localStorage.getItem('nyc_lyna_trip_v6')||'{}');if(v.proxy&&/^https:\/\//.test(v.proxy))return v.proxy}catch(_){}
 return typeof window.NYC_MTA_PROXY_URL==='string'?window.NYC_MTA_PROXY_URL:'';
}
function stationInfo(){
 return DATA.STATIONS[stationKey]||DATA.STATIONS.times||Object.values(DATA.STATIONS)[0];
}
function pointFor(id){
 const mapById=network&&network.stations.find(s=>s[0]===id);
 return mapById?[mapById[3],mapById[2]]:null;
}
function originPoint(){
 const st=stationInfo();
 for(const c of st.codes||[]){const pos=pointFor(c);if(pos)return {name:st.label,lat:pos[1],lng:pos[0]}}
 const a=DATA.P.times||Object.values(DATA.P)[0];return {name:st.label,lat:a.lat,lng:a.lng}
}
function featuresFromLive(){
 const pts=[],paths=[],now=Date.now()/1000;
 live.slice(0,10).forEach((train,i)=>{
  const future=train.trip.stops.filter(x=>(x.arr||x.dep)>=now-90).slice(0,12);
  const coordinates=future.map(x=>pointFor(code(x.stop))).filter(Boolean);
  if(coordinates.length>=2)paths.push(linef(coordinates,{route:train.trip.route,color:routes[asRoute(train.trip.route)]||'#c5d0d7',id:'live-'+i}));
  const first=future[0],firstPos=first&&pointFor(code(first.stop));
  if(firstPos)pts.push(geof(firstPos,{route:train.trip.route,eta:Math.max(0,Math.ceil(((first.arr||first.dep)-now)/60)),kind:'Forecast next stop, not GPS train location'}));
 });
 return {paths:{type:'FeatureCollection',features:paths},trains:{type:'FeatureCollection',features:pts}};
}
function routeGeometry(){
 if(!route||!route.segments)return empty();
 const stations=[];
 route.segments.filter(s=>s.mode==='subway').forEach(s=>{
  const a=pointFor(s.fromStation),b=pointFor(s.toStation);
  if(a&&!stations.some(v=>v[0]===a[0]&&v[1]===a[1]))stations.push(a);
  if(b)stations.push(b);
 });
 return stations.length>=2?{type:'FeatureCollection',features:[linef(stations,{route:'selected'})]}:empty();
}
function mapData(name,data){
 try{if(map&&map.isStyleLoaded()&&map.getSource(name))map.getSource(name).setData(data)}catch(_){}
}
function redraw(){
 if(!panel)return;
 const st=stationInfo(),root=panel.querySelector('.noux-subway-list');
 if(root){
  root.replaceChildren();
  const chosen=live.filter(t=>direction==='all'||t.stop.endsWith(direction));
  if(!live.length)root.appendChild(ui('p','noux-subway-muted',liveWarning||'Press “Refresh predictions” to see verified MTA train arrivals.'));
  chosen.slice(0,9).forEach(t=>{
   const row=ui('div','noux-subway-train'),dot=ui('span','noux-train-pill',t.trip.route);
   dot.style.background=routes[asRoute(t.trip.route)]||'#5f7182';
   const copy=ui('div','noux-subway-train-text'),head=ui('b',null,directionName(t.stop,t.trip.route));
   const where=ui('small',null,(t.nextName?'Next: '+t.nextName+' · ':'')+'Official arrival prediction');
   copy.append(head,where);
   row.append(dot,copy,ui('strong','noux-train-eta',Math.max(0,Math.ceil((t.eta-Date.now()/1000)/60))+' min'));
   root.append(row);
  });
  if(live.length&&!chosen.length)root.append(ui('p','noux-subway-muted','No verified trains for that platform direction. Switch the direction filter.'));
 }
 let stamp=panel.querySelector('.noux-subway-fresh');
 if(stamp){const ts=liveUpdated?new Date(liveUpdated*1000).toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit'}):null;stamp.textContent=ts?'Official MTA prediction updated '+ts+' NYC · 35 s refresh':(liveWarning||'Awaiting live MTA feeds');}
 const data=featuresFromLive();
 mapData('noux-live-paths',data.paths);mapData('noux-live-next',data.trains);
 mapData('noux-route-preview',routeGeometry());
 const p=originPoint();mapData('noux-selected-station',{type:'FeatureCollection',features:[geof([p.lng,p.lat],{title:st.label})]});
}
function safeLayer(id,type,source,paint){
 if(map&&map.getSource(source)&&!map.getLayer(id))map.addLayer({id,type,source,paint});
}
async function setupMap(host){
 if(!window.maplibregl){setText('.noux-subway-map-msg','Interactive map unavailable; written directions remain available.');return}
 try{
  map=new window.maplibregl.Map({container:host,style:'https://tiles.openfreemap.org/styles/liberty',center:[-73.983,40.758],zoom:11.8,attributionControl:true});
  map.addControl(new window.maplibregl.NavigationControl({showCompass:true}),'top-right');
  map.on('load',()=>{
   map.addSource('noux-stations',{type:'geojson',data:{type:'FeatureCollection',features:network.stations.filter(s=>Number.isFinite(s[2])&&Number.isFinite(s[3])).map(s=>geof([s[3],s[2]],{name:s[1],code:s[0]}))}});
   map.addSource('noux-selected-station',{type:'geojson',data:empty()});
   map.addSource('noux-live-paths',{type:'geojson',data:empty()});
   map.addSource('noux-live-next',{type:'geojson',data:empty()});
   map.addSource('noux-route-preview',{type:'geojson',data:empty()});
   safeLayer('noux-stations-layer','circle','noux-stations',{ 'circle-radius': ['interpolate',['linear'],['zoom'],9,1.5,14,4.5], 'circle-color':'#cbd4dc', 'circle-opacity':0.47,'circle-stroke-width':0.5,'circle-stroke-color':'#172c40'});
   safeLayer('noux-live-paths-layer','line','noux-live-paths',{'line-width':3,'line-opacity':0.7,'line-color':['get','color']});
   safeLayer('noux-route-layer','line','noux-route-preview',{'line-color':'#f1cd8c','line-width':5,'line-dasharray':[2,1],'line-opacity':0.85});
   safeLayer('noux-live-next-layer','circle','noux-live-next',{'circle-radius':10,'circle-color':'#e5b87b','circle-stroke-width':3,'circle-stroke-color':'#151f2b'});
   safeLayer('noux-selected-station-layer','circle','noux-selected-station',{'circle-radius':9,'circle-color':'#f5f8fc','circle-stroke-color':'#2e637c','circle-stroke-width':4});
   map.on('click','noux-stations-layer',event=>{
    const f=event.features?.[0];if(!f)return;
    const popup=ui('div',null,f.properties?.name||'MTA station');
    new window.maplibregl.Popup({closeButton:true}).setLngLat(event.lngLat).setDOMContent(popup).addTo(map);
   });
   redraw();map.resize();
  });
  map.on('error',()=>{setText('.noux-subway-map-msg','Map tiles are unavailable. Route steps and arrival predictions can still be used.')});
 }catch(_){setText('.noux-subway-map-msg','Map is not supported on this device. Follow the written subway steps below.')}
}
async function load(){
 if(network)return network;
 if(!ROUTER||typeof ROUTER.loadNetwork!=='function')throw Error('Official MTA station geometry is unavailable');
 network=await ROUTER.loadNetwork();
 if(!Array.isArray(network.stations)||network.stations.length<100)throw Error('MTA station map could not load');
 return network;
}
function normalizeDestination(){
 const valid=Object.keys(DATA.P).filter(k=>Number.isFinite(DATA.P[k].lat)&&Number.isFinite(DATA.P[k].lng)&&DATA.P[k].kind!=='airport');
 if(!valid.includes(destKey))destKey=valid.includes('domino')?'domino':valid.includes('dumbo')?'dumbo':valid.find(k=>k!=='sanctuary')||valid[0];
 return valid;
}
async function planTrip(){
 if(!panel||!network)return;
 const target=DATA.P[destKey],routeBox=panel.querySelector('.noux-subway-directions');
 routeBox.replaceChildren();
 if(!target){routeBox.append(ui('p','noux-subway-muted','Choose a mapped destination.'));return}
 routeNote='Reading official planned MTA timetable…';setText('.noux-subway-plan-status',routeNote);
 try{
  const date=DATA.DATES[dayKey],origin=originPoint();
  const journey=await ROUTER.plan(date,origin,target,timeOf(timeValue));
  if(!panel)return;
  route=journey;routeNote=journey.source||'MTA scheduled timetable';
  if(journey.mode==='unavailable'){routeBox.append(ui('p','noux-subway-muted','No scheduled subway route found. Use the official MTA app or live Google Maps directions.'))}
  else if(journey.mode==='walk'){
   routeBox.append(ui('div','noux-subway-guide','Walking is the faster option here · approximately '+journey.minutes+' minutes. Walking distances are estimates, not live turn-by-turn directions.'));
  }else{
   let n=0;
   (journey.segments||[]).forEach(seg=>{
    const row=ui('div','noux-subway-step');n++;
    let title='',details='';
    if(seg.mode==='subway'){
     title='Board '+(seg.route||seg.routeId||'?')+' toward '+(seg.headsign||'the signed terminal');
     details=directionName(seg.fromPlatform||'',seg.routeId)+' · '+seg.from+' → '+seg.to;
    }else if(seg.mode==='transfer'){
     title='Change platforms / transfer';details=(seg.from||'')+' → '+(seg.to||'')+' · allow ~'+(seg.minutes||'?')+' min';
    }else{
     title='Walk';details=(seg.from||'')+' → '+(seg.to||'')+' · about '+(seg.minutes||'?')+' min (estimate)';
    }
    row.append(ui('span','noux-subway-step-count',String(n)),ui('div','noux-subway-step-copy'));
    row.lastChild.append(ui('b',null,title),ui('small',null,details));
    routeBox.append(row);
   });
  }
  routeBox.append(ui('small','noux-subway-disclaimer','Always check the destination on the platform sign, then the letter/number on the arriving train. Platform directions and service can change.'));
  setText('.noux-subway-plan-status','Official scheduled GTFS · '+(journey.minutes||'?')+' min estimate · '+((journey.transferCount||0))+' changes');
  redraw();
  const a=originPoint(),b=target;
  if(map&&map.loaded())try{const bounds=new window.maplibregl.LngLatBounds();bounds.extend([a.lng,a.lat]);bounds.extend([b.lng,b.lat]);map.fitBounds(bounds,{padding:55,maxZoom:13,duration:550})}catch(_){}
 }catch(error){
  route=null;routeNote=String(error.message||error);
  routeBox.append(ui('p','noux-subway-muted','Scheduled route not available: '+routeNote));
  setText('.noux-subway-plan-status','Use the official MTA map and station signs.');
 }
}
async function fetchLive(force=false){
 if(!panel||inflight)return;
 if(!force&&Date.now()-lastRefresh<26000)return;
 const proxy=getProxy(),st=stationInfo();if(!proxy){liveWarning='Live predictions unavailable; open the official MTA app.';redraw();return}
 inflight=true;lastRefresh=Date.now();setText('.noux-subway-fresh','Refreshing MTA predictions…');
 try{
  if(typeof MTA.tripUpdates!=='function')throw Error('Live trip predictions require the current MTA client');
  const res=await MTA.tripUpdates(st.feeds||[],proxy);
  if(!panel)return;
  const now=Date.now()/1000,match=new Set(st.codes||[]);
  const next=[];
  (res.trips||[]).forEach(trip=>{
   const found=trip.stops.find(x=>match.has(code(x.stop))&&(x.arr||x.dep)>=now-30);
   if(!found)return;
   const eta=found.arr||found.dep;if(eta>now+3600)return;
   const first=trip.stops.find(x=>(x.arr||x.dep)>now-60),pos=first?pointFor(code(first.stop)):null;
   const last=trip.stops.slice(-1)[0];
   next.push({trip,eta,stop:found.stop,nextName:first?network.stations.find(s=>s[0]===code(first.stop))?.[1]:null,pos,last});
  });
  next.sort((a,b)=>a.eta-b.eta);const unique=new Set();
  live=next.filter(x=>{const id=x.trip.tripId+' '+x.stop+' '+x.eta;if(unique.has(id))return false;unique.add(id);return true}).slice(0,20);
  liveUpdated=res.updatedEpoch||Math.floor(Date.now()/1000);
  liveWarning=live.length?'':res.failed?.length?'Some lines could not be read. Try again.':'No verified predictions for this station right now.';
 }catch(_){live=[];liveUpdated=null;liveWarning='MTA predictions temporarily unavailable. No times are being estimated or invented.'}
 finally{inflight=false;redraw()}
}
function buildPanel(){
 const section=ui('section','noux-subway-companion'),head=ui('div','noux-subway-top');
 section.id='noux-subway-companion';
 head.append(ui('span','noux-kicker','NOUX · SUBWAY NAVIGATOR'),ui('h2',null,'A live map. The right platform.'));
 head.append(ui('p','noux-subway-muted','Official MTA predicted arrivals and scheduled station-to-station directions. Forecast pins are next stops, not GPS train locations.'));
 section.append(head);
 const form=ui('div','noux-subway-controls');
 const stSelect=ui('select'),toSelect=ui('select'),daySelect=ui('select'),timeInput=ui('input');
 timeInput.type='time';timeInput.value=timeValue;timeInput.setAttribute('aria-label','Depart at New York local time');
 Object.entries(DATA.STATIONS).forEach(([k,v])=>{let x=ui('option',null,v.label);x.value=k;stSelect.append(x)});
 stSelect.value=stationKey;stSelect.setAttribute('aria-label','Start at subway station');
 normalizeDestination().sort((a,b)=>DATA.P[a].name.localeCompare(DATA.P[b].name)).forEach(k=>{const p=DATA.P[k];let x=ui('option',null,p.name);x.value=k;toSelect.append(x)});
 toSelect.value=destKey;toSelect.setAttribute('aria-label','Destination');
 Object.entries(DATA.DATES||{}).forEach(([d,v])=>{let x=ui('option',null,v);x.value=d;daySelect.append(x)});
 daySelect.value=dayKey;
 function field(label,control){const node=ui('label','noux-subway-field');node.append(ui('span',null,label),control);return node}
 form.append(field('Starting station',stSelect),field('Destination',toSelect),field('Visit day',daySelect),field('Leave at (NYC)',timeInput));
 stSelect.addEventListener('change',()=>{stationKey=stSelect.value;route=null;live=[];liveUpdated=null;redraw();fetchLive(true);planTrip()});
 toSelect.addEventListener('change',()=>{destKey=toSelect.value;planTrip()});
 daySelect.addEventListener('change',()=>{dayKey=daySelect.value;planTrip()});
 timeInput.addEventListener('change',()=>{timeValue=timeInput.value;planTrip()});
 section.append(form);
 const actions=ui('div','noux-subway-actions');
 actions.append(btn('Plan route →',planTrip,'noux-subway-primary'),btn('Refresh predictions',()=>fetchLive(true),'noux-subway-secondary'));
 section.append(actions);
 const shell=ui('div','noux-subway-map-shell'),mapHost=ui('div','noux-subway-map'),msg=ui('span','noux-subway-map-msg','Geographic station map · schematic route lines');
 shell.append(mapHost,msg);section.append(shell);
 const legend=ui('div','noux-subway-legend');
 legend.append(ui('span',null,'White pin · selected station'),ui('span',null,'Gold pins · next forecast stops'),ui('span',null,'Dashed gold · planned route'));
 section.append(legend);
 const grid=ui('div','noux-subway-columns'),a=ui('div','noux-subway-card'),b=ui('div','noux-subway-card');
 a.append(ui('h3',null,'Trains at your station'));
 const filters=ui('div','noux-subway-filters');
 [['all','Both'],['N','N / Uptown'],['S','S / Downtown']].forEach(([key,label])=>{
  const control=btn(label,()=>{direction=key;filters.querySelectorAll('button').forEach(n=>n.classList.toggle('active',n.dataset.direction===key));redraw()},'noux-subway-dir'+(key===direction?' active':''));
  control.dataset.direction=key;filters.append(control);
 });
 a.append(filters,ui('small','noux-subway-fresh','Awaiting live MTA feeds'),ui('div','noux-subway-list'));
 b.append(ui('h3',null,'Step-by-step: take the correct direction'),ui('small','noux-subway-plan-status','Choose your route'),ui('div','noux-subway-directions'));
 grid.append(a,b);section.append(grid);
 const safety=ui('div','noux-subway-tip');
 safety.append(ui('b',null,'Avoid the wrong train'),ui('p',null,'Match all three: line letter/number, signed terminal destination and platform direction. “Uptown” or “Downtown” alone is not enough on the L, G or crosstown services. During Thanksgiving, check last-minute service notices.'));
 safety.append(btn('Official MTA Subway Map ↗',()=>window.open('https://new.mta.info/maps/subway-line-maps','_blank','noopener,noreferrer'),'noux-subway-secondary'));
 section.append(safety);
 return {section,mapHost};
}
async function mount(){
 if(panel&&panel.isConnected)return;
 const active=Array.from(document.querySelectorAll('.topbar .mainnav button')).find(x=>x.classList.contains('current')&&/subway|MTA|arrival/i.test(x.textContent));
 const parent=document.querySelector('.live-page')||(active&&document.querySelector('main.main'));
 if(!parent)return;
 try{map?.remove()}catch(_){}
 map=null;panel=null;network=null;
 const parts=buildPanel();panel=parts.section;parent.appendChild(panel);
 setText('.noux-subway-map-msg','Loading MTA station geometry…');
 try{await load();if(!panel?.isConnected)return;await setupMap(parts.mapHost);await planTrip();await fetchLive(true)}
 catch(_){setText('.noux-subway-map-msg','Station map is temporarily unavailable; use the official MTA map link below.')}
}
function locate(){
 if(!installed)return;
 if(panel&&!panel.isConnected){panel=null;try{map?.remove()}catch(_){}map=null;network=null}
 const current=Array.from(document.querySelectorAll('.topbar .mainnav button')).find(x=>x.classList.contains('current')&&/subway|MTA|arrival/i.test(x.textContent));
 if(!panel&&(document.querySelector('.live-page')||current))mount();
}
function install(){
 if(installed)return true;
 DATA=window.NYC_DATA;MTA=window.NYC_MTA;ROUTER=window.NYC_ROUTER;
 if(!DATA?.STATIONS||!DATA?.P||!MTA||!ROUTER)return false;
 const date=formatNY().date;
 dayKey=Object.entries(DATA.DATES||{}).find(([,value])=>value===date)?.[0]||'mon';
 timeValue=date===(DATA.DATES||{})[dayKey]?formatNY().time:'10:00';
 installed=true;
 const root=document.getElementById('root')||document.body;
 new MutationObserver(locate).observe(root,{childList:true,subtree:true});
 const synced=()=>{const original=document.querySelector('.live-page .live-card select');if(original&&DATA.STATIONS[original.value]&&original.value!==stationKey){stationKey=original.value;const select=panel?.querySelector('.noux-subway-field select');if(select)select.value=stationKey;fetchLive(true);planTrip()}};
 root.addEventListener('change',e=>{if(e.target.closest?.('.live-page .live-card'))setTimeout(synced,10)});
 setInterval(()=>{locate();if(panel?.isConnected){synced();fetchLive(false);redraw()}},35000);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',locate,{once:true});else locate();
 return true;
}
window.NOUX_SUBWAY={install,version:'2026.11.15',directionName};
})();