/* NOUX NYC subway journey planner. Public MTA static GTFS timetable + optional verified MTA GTFS-RT.
 * Official timetable: deterministic scheduled train legs and transfer paths.
 * Walking leg distances are geometric estimates, NOT surveyed pedestrian routes.
 * Live RT is never claimed for a leg without an actual matched TripUpdate prediction.
 */
(function(root,factory){
 const moduleAPI=factory();root.NYC_ROUTER=moduleAPI;
 if(typeof module!=='undefined'&&module.exports)module.exports=moduleAPI;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const CACHE=new Map();
 const EARTH=6371;
 const ROUTE_FEED={A:'ace',C:'ace',E:'ace',B:'bdfm',D:'bdfm',F:'bdfm',M:'bdfm',L:'l',N:'nqrw',Q:'nqrw',R:'nqrw',W:'nqrw',J:'jz',Z:'jz',G:'g',1:'1234567',2:'1234567',3:'1234567',4:'1234567',5:'1234567',6:'1234567',7:'1234567',S:'1234567'};
 const round=n=>Math.round(n*10)/10;
 function km(a,b){const a1=(a.lat??a[2])*Math.PI/180,b1=(b.lat??b[2])*Math.PI/180;const dlat=b1-a1,dlng=((b.lng??b[3])-(a.lng??a[3]))*Math.PI/180;const h=Math.sin(dlat/2)**2+Math.cos(a1)*Math.cos(b1)*Math.sin(dlng/2)**2;return 2*EARTH*Math.asin(Math.min(1,Math.sqrt(h)));}
 function walkMins(kmDist,entry=0){return Math.ceil(kmDist*1.30/4.6*60)+entry;}
 const asTime=m=>`${String(Math.floor(m/60)%24).padStart(2,'0')}:${String(Math.round(m)%60).padStart(2,'0')}`;
 const binFirst=(arr,start)=>{let lo=0,hi=arr.length;while(lo<hi){const mid=(lo+hi)>>1;if(arr[mid][0]<start)lo=mid+1;else hi=mid}return lo};
 function nearby(network,place,limit=6){return network.stations.map((s,i)=>({idx:i,station:s,distance:km(place,{lat:s[2],lng:s[3]})})).sort((a,b)=>a.distance-b.distance).slice(0,limit).filter((x,i)=>i<3||x.distance<=1.6)}
 function pathSegments(path,network,date,origin,dest,destWalk){const result=[];
  function recur(node){if(!node)return;if(node.prev)recur(node.prev);
   if(node.kind==='origin'){result.push({mode:'walk',from:origin.name||'Starting point',to:network.stations[node.station][1],distanceKm:round(node.distance),minutes:node.walkMinutes,note:'Estimated street walk to the station, plus subway-entry allowance'});}
   else if(node.kind==='transfer'){result.push({mode:'transfer',from:network.stations[node.from][1],to:network.stations[node.to][1],minutes:node.minutes,note:'Scheduled transfer passage allowance'});}
   else if(node.kind==='ride'){
    const train=network.routes[node.route]||['?','?',''];
    result.push({mode:'subway',route:train[1],routeId:train[0],headsign:node.headsign||network.stations[node.to][1],from:network.stations[node.from][1],to:network.stations[node.to][1],fromStation:network.stations[node.from][0],toStation:network.stations[node.to][0],fromPlatform:network.platforms[node.fromPlatform],toPlatform:network.platforms[node.toPlatform],tripId:node.tripId,depart:node.depart,arrive:node.arrive,minutes:node.arrive-node.depart,source:'MTA scheduled GTFS'});
   }
  }
  recur(path);
  if(destWalk){result.push({mode:'walk',from:network.stations[path.station][1],to:dest.name||'Destination',distanceKm:round(destWalk.distance),minutes:destWalk.minutes,note:'Estimated street walk from the station'});}
  return result;
 }
 function lookupStation(network,term){const search=String(term||'').toLowerCase();return network.stations.find(s=>s[0]===term)||network.stations.find(s=>s[1].toLowerCase().includes(search));}
 function compute(network,day,origin,destination,startMin,opts={}){
  if(!Number.isFinite(origin?.lat)||!Number.isFinite(origin?.lng)||!Number.isFinite(destination?.lat)||!Number.isFinite(destination?.lng))throw Error('Both places must have mapped coordinates');
  if(!Array.isArray(day?.connections)||!Array.isArray(network?.stations))throw Error('Official MTA timetable unavailable');
  const transferPenalty=opts.transferPenalty??3,horizon=opts.horizon??180;
  const start=Math.max(0,Math.round(startMin)),stationCount=network.stations.length;
  const times=new Float64Array(stationCount).fill(Infinity),costs=new Float64Array(stationCount).fill(Infinity),paths=new Array(stationCount).fill(null),boarded=new Map();
  const walkway=network.transfers||[],walkEdges=Array.from({length:stationCount},()=>[]);
  for(const [a,b,min] of walkway)if(a!==b&&a<stationCount&&b<stationCount)walkEdges[a].push([b,min]);
  let transferChanges=0;
  const update=(idx,time,cost,path)=>{
   if(cost>=costs[idx]-0.00001)return false;
   costs[idx]=cost;times[idx]=time;paths[idx]=path;
   const queue=[idx];let q=0;
   while(q<queue.length&&q<150){const from=queue[q++];for(const [to,mins] of walkEdges[from]){
    const newT=times[from]+mins,newC=costs[from]+mins;
    if(newC+0.01<costs[to]){const next={kind:'transfer',from,to,minutes:mins,station:to,prev:paths[from],changes:paths[from].changes||0};costs[to]=newC;times[to]=newT;paths[to]=next;queue.push(to);transferChanges++;}
   }}return true;
  };
  for(const s of nearby(network,origin,6)){if(s.distance>2)continue;
    const minutes=walkMins(s.distance,2);update(s.idx,start+minutes,start+minutes,{kind:'origin',station:s.idx,distance:s.distance,walkMinutes:minutes,changes:0});
  }
  let scanned=0;
  const c=day.connections,lo=binFirst(c,start),maxDepart=start+horizon;
  for(let i=lo;i<c.length&&c[i][0]<=maxDepart;i++){
   const [dep,arr,from,to,trip,fromPlatform,toPlatform]=c[i];scanned++;
   if(arr>start+horizon+90)continue;
   let state=boarded.get(trip);
   if(!state){const prev=paths[from];if(!prev)continue;
    const wait=prev.kind==='origin'||prev.kind==='transfer'?0:3;
    if(dep<times[from]+wait)continue;
    const train=day.trips[trip];
    const changes=(prev.changes||0)+(prev.kind==='ride'?1:0);
    state={prev,from,depart:dep,trip,fromPlatform,route:train[0],headsign:train[1],tripId:train[2],changes};
    boarded.set(trip,state);
   }
   const path={kind:'ride',station:to,from:state.from,to,depart:state.depart,arrive:arr,prev:state.prev,route:state.route,headsign:state.headsign,tripId:state.tripId,fromPlatform:state.fromPlatform,toPlatform,changes:state.changes};
   const cst=arr+state.changes*transferPenalty;
   if(cst<costs[to])update(to,arr,cst,path);
  }
  let best=null;
  for(const s of nearby(network,destination,8)){
   const path=paths[s.idx];if(!path)continue;
   const mins=walkMins(s.distance,1),arr=times[s.idx]+mins,score=costs[s.idx]+mins;
   if(!best||score<best.score)best={path,arr,score,walk:{distance:s.distance,minutes:mins}};
  }
  // Consider walking, including places where walking beats the subway.
  const directDistance=km(origin,destination),directWalk=walkMins(directDistance);
  if((best&&directWalk<=best.arr-start+2)||(!best&&directDistance<=6))return {mode:'walk',source:'Estimated street walking (no routing API)',departure:start,arrival:start+directWalk,minutes:directWalk,distanceKm:round(directDistance),segments:[{mode:'walk',from:origin.name||'Starting point',to:destination.name||'Destination',distanceKm:round(directDistance),minutes:directWalk,note:'Approximate: straight-line distance × 1.30, not a mapped pedestrian path'}],scheduled:true,date:day.date,scannedConnections:scanned,transferCount:0};
  if(!best)return {mode:'unavailable',source:'Official static GTFS',departure:start,arrival:null,reason:'No scheduled subway journey found within the 3-hour search horizon. Check service notices or open live directions.',segments:[],date:day.date,scannedConnections:scanned};
  const segments=pathSegments(best.path,network,day.date,origin,destination,best.walk);
  const ride=segments.filter(s=>s.mode==='subway');
  if(!ride.length)return {mode:'walk',source:'Estimated street walking',departure:start,arrival:start+directWalk,minutes:directWalk,distanceKm:round(directDistance),segments:[{mode:'walk',from:origin.name||'Starting point',to:destination.name||'Destination',distanceKm:round(directDistance),minutes:directWalk}],scheduled:true,date:day.date};
  return {mode:'transit',departure:start,arrival:best.arr,minutes:best.arr-start,source:'Official MTA scheduled GTFS',date:day.date,segments,scheduled:true,transferCount:Math.max(0,ride.length-1),lines:ride.map(x=>x.route),scannedConnections:scanned,feedVersion:network.generated_utc,approximateWalking:true};
 }
 const dayUrl=(date)=>`assets/subway/${date}.json`;
 const networkUrl='assets/subway/network.json';
 async function fetchDoc(path,base=''){
  if(!/^(assets\/subway\/)/.test(path))throw Error('Invalid MTA timetable path');
  const url=(base||((typeof window!=='undefined'&&window.NYC_BASE)||'./'))+path;
  let r, j;
  if(path.endsWith('.json')&&path!==networkUrl&&typeof DecompressionStream==='function'){
   try{r=await fetch(url+'.gz',{cache:'default',signal:AbortSignal.timeout(18000)});
    if(r.ok){const decoded=r.body.pipeThrough(new DecompressionStream('gzip'));j=await new Response(decoded).json();}
   }catch(_){/* Fallback to plain JSON if a browser cannot decode gzip */}
  }
  if(!j){r=await fetch(url,{cache:'default',signal:AbortSignal.timeout(18000)});
   if(!r.ok)throw Error('MTA schedule data not published or offline: HTTP '+r.status);j=await r.json();}
  if(!j||typeof j!=='object')throw Error('Invalid subway timetable response');return j;
 }
 async function loadNetwork(){if(!CACHE.has('network'))CACHE.set('network',fetchDoc(networkUrl).catch(e=>{CACHE.delete('network');throw e}));return CACHE.get('network');}
 async function loadDay(date){if(!/^2026-11-2[3-7]$/.test(date))throw Error('Subway schedule only prepared for the visit dates');if(!CACHE.has(date))CACHE.set(date,fetchDoc(dayUrl(date)).catch(e=>{CACHE.delete(date);throw e}));return CACHE.get(date);}
 async function plan(date,origin,dest,minutes,opts={}){const [network,day]=await Promise.all([loadNetwork(),loadDay(date)]);return compute(network,day,origin,dest,minutes,opts)}
 const nyTimestamp=(date,minutes)=>Math.floor(Date.parse(`${date}T00:00:00-05:00`)/1000+minutes*60);
 function matchRT(segments,trips,startStamp,date){
  let time=startStamp,actual=0,lacking=0,missed=false;const newSegments=[];
  for(const seg of segments){
   if(seg.mode==='walk'||seg.mode==='transfer'){time+=(seg.minutes||0)*60;newSegments.push({...seg,source:'Estimated walking/transfer allowance'});continue;}
   if(seg.mode!=='subway'){newSegments.push(seg);continue;}
   const options=[];
   for(const trip of trips){if(trip.route!==seg.routeId)continue;const i=trip.stops.findIndex(x=>x.stop===seg.fromPlatform),j=trip.stops.findIndex((x,k)=>k>i&&x.stop===seg.toPlatform);if(i<0||j<=i)continue;
    const dep=trip.stops[i].dep||trip.stops[i].arr,arr=trip.stops[j].arr||trip.stops[j].dep;
    if(dep>=time&&dep<=time+85*60&&arr>=dep)options.push({dep,arr,tripId:trip.tripId});}
   options.sort((a,b)=>a.arr-b.arr);
   if(options.length){const best=options[0];const next={...seg,source:'Live MTA GTFS-RT trip prediction',live:true,scheduledDeparture:seg.depart,scheduledArrival:seg.arrive,liveDeparture:best.dep,liveArrival:best.arr,minutes:Math.round((best.arr-best.dep)/60),tripIdRealtime:best.tripId,waitMinutes:Math.round((best.dep-time)/60)};time=best.arr;actual++;newSegments.push(next);}
   else{lacking++;const dep=nyTimestamp(date,seg.depart); // timetable departure, NOT a live prediction
    if(dep<time-30){missed=true;newSegments.push({...seg,source:'Scheduled departure already passed: replan required',live:false,missingLive:true,missedSchedule:true});continue;}
    const arr=dep+seg.minutes*60;time=arr;newSegments.push({...seg,source:'Scheduled estimate: no matching live train',live:false,missingLive:true});}
  }
  return {segments:newSegments,liveLegs:actual,nonliveLegs:lacking,missedSchedule:missed,arrivalEpoch:missed?null:time,arrivalNY:missed?null:new Date(time*1000).toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit'}),source:missed?'Missed planned connection; replan required':actual&&lacking===0?'Matched MTA GTFS-RT journey segments':'Partially live: unmatched segments use schedule estimates'};
 }
 return {km,walkMins,nearby,compute,plan,loadNetwork,loadDay,lookupStation,asTime,nyTimestamp,matchRT,ROUTE_FEED};
});