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
 function makeUrl(feed,proxy){if(proxy){const base=proxy.replace(/\/+$/,'');return `${base}/feed/${encodeURIComponent(feed)}`}return DIRECT+(FEEDS[feed]||'gtfs-ace')}
 async function arrivals(stationKey,proxy){const station=window.NYC_DATA.STATIONS[stationKey]||window.NYC_DATA.STATIONS.times;
  const all=[];let errors=[];await Promise.all(station.feeds.map(async feed=>{try{
    const r=await fetch(makeUrl(feed,proxy),{cache:'no-store',signal:AbortSignal.timeout(11000)});if(!r.ok)throw Error(`HTTP ${r.status}`);const bytes=new Uint8Array(await r.arrayBuffer());if(bytes.byteLength<10)throw Error('Empty MTA feed');const values=decode(bytes);all.push(...values.filter(x=>station.codes.some(c=>x.stop.startsWith(c))));
   }catch(e){errors.push(feed+': '+e.message)}}));
  const now=Date.now()/1000;
  const sorted=all.filter(x=>x.time>now-30&&x.time<now+5400).sort((a,b)=>a.time-b.time);
  const unique=new Set();const items=sorted.filter(x=>{const key=x.route+x.stop+x.time;if(unique.has(key))return false;unique.add(key);return true}).slice(0,12);
  if(!items.length&&errors.length)throw Error('Live MTA feed could not be read. Configure a Cloudflare proxy in Settings. '+errors.join(' | '));
  return {station:station.label,items,updated:new Date().toISOString(),source:proxy?'MTA via Cloudflare Worker':'MTA direct',partial:errors.length>0,errors};
 }
 return {arrivals,decode,FEEDS,DIRECT};
})();