/* Tiny dependency-free GTFS-RT TripUpdate parser (protobuf wire types 0,1,2,5).
   Does not infer train routes or subway itineraries. Feed messages reflect MTA estimates only. */
window.NYC_MTA=(function(){
 const FEEDS={ace:'gtfs-ace',bdfm:'gtfs-bdfm',l:'gtfs-l',nqrw:'gtfs-nqrw',jz:'gtfs-jz',g:'gtfs-g',1234567:'gtfs'};
 const DIRECT='https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct/';
 function decode(bytes){let i=0,arr=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);const n=arr.length;
  function v(){let value=0,mult=1,count=0;while(i<n&&count++<10){let c=arr[i++];value+=(c&127)*mult;if(!(c&128))return value;mult*=128;}return value}
  function sub(end){let out={};while(i<end){let tag=v();if(!tag)break;let field=Math.floor(tag/8),wt=tag%8;let val;if(wt===0)val=v();else if(wt===2){let len=v();val=arr.subarray(i,Math.min(i+len,n));i+=len;}else if(wt===1){i+=8;continue}else if(wt===5){i+=4;continue}else{throw Error('Unknown protobuf wire type '+wt)}(out[field]??=[]).push(val)}return out}
  const root=sub(n),result=[];
  const str=b=>new TextDecoder().decode(b||new Uint8Array());
  for(const e of root[2]||[]){let en;try{const old=i;i=0;const save=arr;arr=e;const ent=sub(e.length);arr=save;i=old;en=ent}catch(_){continue}
   if(!en[3]||!en[3][0])continue;
   let tu;try{tu=parseSlice(en[3][0]);}catch(_){continue}
   const trip=tu[1]?.[0]?parseSlice(tu[1][0]):{};
   const route=str(trip[5]?.[0]);
   for(const st of tu[2]||[]){let up;try{up=parseSlice(st)}catch(_){continue}const sid=str(up[4]?.[0]);if(!sid)continue;
    const arrival=up[2]?.[0]?parseSlice(up[2][0]):{};
    const dep=up[3]?.[0]?parseSlice(up[3][0]):{};
    let t=arrival[2]?.[0]||dep[2]?.[0];if(t&&Number.isFinite(t))result.push({route,stop:sid,time:t});
   }
  }
  return result;
  function parseSlice(slice){let oldArr=arr,oldI=i;arr=slice;i=0;let r=sub(slice.length);arr=oldArr;i=oldI;return r}
 }
 function makeUrl(feed,proxy){if(!/^https:\/\//.test(proxy||''))throw Error('A secure Cloudflare Worker URL is needed for live MTA arrivals.');const base=proxy.replace(/\/+$/,'');return `${base}/feed/${encodeURIComponent(feed)}`;}
 async function arrivals(stationKey,proxy){if(!proxy)throw Error('Live MTA requires a connected Cloudflare Worker; no direct-browser requests will be attempted.');const station=window.NYC_DATA.STATIONS[stationKey]||window.NYC_DATA.STATIONS.times;
  const all=[];let errors=[];await Promise.all(station.feeds.map(async feed=>{try{
    const r=await fetch(makeUrl(feed,proxy),{cache:'no-store',signal:AbortSignal.timeout(11000)});if(!r.ok)throw Error(`HTTP ${r.status}`);const bytes=new Uint8Array(await r.arrayBuffer());if(bytes.byteLength<10)throw Error('Empty MTA feed');const values=decode(bytes);all.push(...values.filter(x=>station.codes.some(c=>x.stop.startsWith(c))));
   }catch(e){errors.push(feed+': '+e.message)}}));
  const now=Date.now()/1000;
  const sorted=all.filter(x=>x.time>now-30&&x.time<now+5400).sort((a,b)=>a.time-b.time);
  const unique=new Set();const items=sorted.filter(x=>{const key=x.route+x.stop+x.time;if(unique.has(key))return false;unique.add(key);return true}).slice(0,12);
  if(!items.length&&errors.length)throw Error('The connected MTA Worker could not read the official feeds: '+errors.join(' | '));
  return {station:station.label,items,updated:new Date().toISOString(),source:proxy?'MTA via Cloudflare Worker':'MTA direct',partial:errors.length>0,errors};
 }
 async function health(proxy){if(!/^https:\/\//.test(proxy||''))throw Error('Enter an HTTPS Cloudflare Worker address.');const r=await fetch(proxy.replace(/\/+$/,'')+'/health',{signal:AbortSignal.timeout(13000),cache:'no-store'});const body=await r.json().catch(()=>({}));if(!r.ok||!body.ok)throw Error('Worker connected but MTA upstream unavailable (HTTP '+r.status+').');return body;}

 // Full MTA GTFS-Realtime trip predictions for an explicitly selected route.
 // Unlike the station-arrival list, these preserve downstream stop times from the *same train*.
 const tripCache=new Map();
 function gtfsFields(bytes){
  let i=0;const arr=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);const out={};
  const varint=()=>{let result=0,mul=1;while(i<arr.length){const v=arr[i++];result+=(v&127)*mul;if(!(v&128))return result;mul*=128;if(mul>1e17)throw Error('Invalid protobuf varint')}throw Error('Truncated protobuf')};
  while(i<arr.length){const tag=varint(),f=Math.floor(tag/8),wire=tag%8;let value;
   if(wire===0)value=varint();
   else if(wire===2){const size=varint();value=arr.subarray(i,Math.min(arr.length,i+size));i+=size;}
   else if(wire===1){i+=8;continue;}
   else if(wire===5){i+=4;continue;}
   else throw Error('Unexpected protobuf wire format');
   (out[f]??=[]).push(value);
  }return out;
 }
 function readTrips(raw){
  const data=gtfsFields(raw),rows=[],str=b=>new TextDecoder().decode(b||new Uint8Array());
  const meta=data[1]?.[0]?gtfsFields(data[1][0]):{};
  const updated=meta[3]?.[0]?Number(meta[3][0]):null;
  for(const en of data[2]||[]){
   try{
    const entity=gtfsFields(en);if(!entity[3]?.[0])continue;
    const up=gtfsFields(entity[3][0]),trip=up[1]?.[0]?gtfsFields(up[1][0]):{};
    const route=str(trip[5]?.[0]),tripId=str(trip[1]?.[0]);if(!route)continue;
    const stops=[];
    for(const b of up[2]||[]){const x=gtfsFields(b),stop=str(x[4]?.[0]);if(!stop)continue;
     const arrival=x[2]?.[0]?gtfsFields(x[2][0]):{},departure=x[3]?.[0]?gtfsFields(x[3][0]):{};
     const arr=Number(arrival[2]?.[0]||0),dep=Number(departure[2]?.[0]||0);
     if(arr||dep)stops.push({stop,arr,dep});
    }
    if(stops.length>1)rows.push({route,tripId,stops});
   }catch(_){}
  }
  return {updated,rows};
 }
 async function tripUpdates(feeds,proxy){
  if(!proxy||!/^https:\/\//.test(proxy))throw Error('Live journey predictions require the authorised Cloudflare Worker.');
  const wanted=[...new Set(feeds)].filter(x=>FEEDS[x]);let found=[],failed=[];let stamps=[];
  await Promise.all(wanted.map(async f=>{
   const key=proxy+'::'+f,now=Date.now();let promise=tripCache.get(key);
   if(!promise||now-promise.at>19000){
    promise={at:now,value:(async()=>{const r=await fetch(makeUrl(f,proxy),{cache:'no-store',signal:AbortSignal.timeout(14000)});if(!r.ok)throw Error(`HTTP ${r.status}`);return readTrips(new Uint8Array(await r.arrayBuffer()));})()};
    tripCache.set(key,promise);
   }
   try{const response=await promise.value;found.push(...response.rows);if(response.updated)stamps.push(response.updated);}
   catch(e){tripCache.delete(key);failed.push(`${f}: ${e.message}`);}
  }));
  if(wanted.length&&found.length===0&&failed.length)throw Error('Live trip predictions unavailable: '+failed.join(' | '));
  const freshness=stamps.length?Math.min(...stamps):null;
  return {trips:found,updatedEpoch:freshness,feeds:wanted,failed};
 }

 return {arrivals,health,decode,FEEDS,readTrips,tripUpdates};
})();