// Cloudflare Worker — CORS safe proxy for *public* MTA GTFS-Realtime feeds.
// Deploy with Wrangler. No API token required for the feeds themselves.
const FEEDS={ace:'gtfs-ace',bdfm:'gtfs-bdfm',l:'gtfs-l',nqrw:'gtfs-nqrw',jz:'gtfs-jz',g:'gtfs-g','1234567':'gtfs'};
const ORIGIN='https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct/';
export default {async fetch(request,env,ctx){const url=new URL(request.url);const origin=request.headers.get('Origin')||'*';
 const allow=env.ALLOWED_ORIGIN||'*';const ok=allow==='*'||allow===origin;const cors={'Access-Control-Allow-Origin':ok?origin:'null','Access-Control-Allow-Methods':'GET,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:cors});
 if(url.pathname==='/health')return Response.json({ok:true,provider:'MTA GTFS-RT',note:'Live arrivals only, not complete trip planning'}, {headers:cors});
 const match=url.pathname.match(/^\/feed\/(ace|bdfm|l|nqrw|jz|g|1234567)$/);if(!match)return new Response('Not found',{status:404,headers:cors});
 const target=ORIGIN+FEEDS[match[1]];
 try{const response=await fetch(target,{cf:{cacheTtl:18,cacheEverything:true},headers:{Accept:'application/x-protobuf'}});
  if(!response.ok)throw new Error('MTA HTTP '+response.status);
  const h={...cors,'Content-Type':'application/x-protobuf','Cache-Control':'public, max-age=15','X-Source':'MTA official GTFS-RT feed','X-Feed':match[1]};
  return new Response(response.body,{status:200,headers:h});
 }catch(e){return Response.json({error:'MTA unavailable',detail:String(e.message)},{status:502,headers:cors});}
 }};