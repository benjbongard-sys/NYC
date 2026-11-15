/** NOUX subway proxy: MTA public GTFS-Realtime bytes, whitelisted routes only, never handles itinerary/password. */
const FEEDS=Object.freeze({ace:'gtfs-ace',bdfm:'gtfs-bdfm',l:'gtfs-l',nqrw:'gtfs-nqrw',jz:'gtfs-jz',g:'gtfs-g','1234567':'gtfs'});
const UPSTREAM='https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2F';
const DEFAULT_ALLOWED='https://benjbongard-sys.github.io';
const withCors=(origin,allow)=>({'Access-Control-Allow-Origin':origin===allow?origin:'null','Access-Control-Allow-Methods':'GET,HEAD,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin','X-Content-Type-Options':'nosniff'});
export default {
 async fetch(request, env, ctx){
  const url=new URL(request.url);
  const allow=env.ALLOWED_ORIGIN||DEFAULT_ALLOWED;
  const origin=request.headers.get('Origin')||allow;
  const cors=withCors(origin,allow);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:cors});
  if(url.pathname==='/health'){
   let healthy=false,status=0;
   try{const p=await fetch(UPSTREAM+FEEDS.ace,{headers:{Accept:'application/x-protobuf'},cf:{cacheEverything:true,cacheTtl:10}});status=p.status;healthy=p.ok&&(Number(p.headers.get('content-length'))>0||!!p.body);await p.body?.cancel?.();}catch(_){status=503}
   return Response.json({ok:healthy,upstreamStatus:status,source:'MTA official GTFS-Realtime',realtime:healthy,travel_times:'not provided',checked:new Date().toISOString()},{status:healthy?200:503,headers:{...cors,'Cache-Control':'no-store'}});
  }
  const match=/^\/feed\/(ace|bdfm|l|nqrw|jz|g|1234567)$/.exec(url.pathname);
  if(!match)return new Response('Unknown feed',{status:404,headers:cors});
  // Never proxy arbitrary URLs, forward authorization tokens, or expose secrets.
  const target=UPSTREAM+FEEDS[match[1]];
  try{
   let upstream=await fetch(target,{cf:{cacheEverything:true,cacheTtl:15},headers:{Accept:'application/x-protobuf'}});
   // Some MTA deployments still expect the unescaped slash variant.
   if(upstream.status===404){upstream=await fetch('https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct/'+FEEDS[match[1]],{cf:{cacheEverything:true,cacheTtl:15},headers:{Accept:'application/x-protobuf'}});}
   if(!upstream.ok)return Response.json({error:'Upstream feed unavailable',upstreamStatus:upstream.status},{status:502,headers:cors});
   const headers={...cors,'Content-Type':'application/x-protobuf','Cache-Control':'public, max-age=15','X-MTA-Feed':match[1],'X-Data-Source':'MTA GTFS-RT'};
   if(request.method==='HEAD')return new Response(null,{status:200,headers});
   return new Response(upstream.body,{status:200,headers});
  }catch(error){return Response.json({error:'Subway realtime temporarily unavailable'},{status:503,headers:cors});}
 }
};