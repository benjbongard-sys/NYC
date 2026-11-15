const fs=require('fs'); const vm=require('vm'); const context={window:{},console,URL,URLSearchParams,TextDecoder,Uint8Array};vm.createContext(context);
['data.js','itinerary.js','mta.js'].forEach(n=>vm.runInContext(fs.readFileSync(__dirname+'/../'+n,'utf8'),context));
const D=context.window.NYC_DATA,P=context.window.NYC_PLAN,M=context.window.NYC_MTA;
const check=(expr,msg)=>{if(!expr)throw new Error(msg)};
for(const day of ['mon','tue','wed','thu','fri']){let es=P.day(day,D.DEFAULT);check(es.length>=4,day+' missing plan');check(es.every(x=>D.P[x.place]),'Unknown place on '+day);}
check(P.day('mon',D.DEFAULT).filter(x=>x.status==='booked').length===1,'Cruise booking invariant');
for(const c of D.CHOICES){for(const o of c.options){const prefs={...D.DEFAULT,[c.id]:o[0]};let e=P.day(c.day,prefs);check(e.length>=3,`choice ${c.id} ${o[0]} broke events`);check(e.every(x=>D.P[x.place]),`missing stop for ${o[0]}`);}}
let west=P.day('thu',{...D.DEFAULT,c4:'westmorales'});check(west.some(x=>x.title.includes('Westlight'))&&west.some(x=>x.title.includes('David Morales')),'Westlight choice not applied');
let sou=P.day('wed',{...D.DEFAULT,c3:'soul'});check(sou.some(x=>x.title.includes('Soul in the Horn')),'Soul option not applied');
let lou=P.day('wed',{...D.DEFAULT,c3:'louie'});check(lou.some(x=>x.title.includes('Louie Vega')),'Louie option not applied');
const tag=(f,wire)=>BigInt(f*8+wire);const v=x=>{let n=BigInt(x),r=[];while(n>=128n){r.push(Number(n&127n)+128);n>>=7n}r.push(Number(n));return r};const bytes=x=>Array.isArray(x)?x:[...new TextEncoder().encode(x)];const fld=(f,p)=>[...v(tag(f,2)),...v(bytes(p).length),...bytes(p)];
const arrivalRaw=[...v(tag(2,0)),...v(Math.floor(Date.now()/1000)+600)];
const stopRaw=[...fld(4,'L08N'),...fld(2,arrivalRaw)];
const tuRaw=[...fld(1,fld(5,'L')),...fld(2,stopRaw)];
const feed=fld(2,fld(3,tuRaw));
const parsed=M.decode(Uint8Array.from(feed));check(parsed.length===1,'GTFS decoder length');check(parsed[0].route==='L'&&parsed[0].stop==='L08N','GTFS parser fields');
console.log('PASS:',D.CHOICES.length,'interactive choices, 5 days, Monday cruise booking, route swaps, synthetic MTA GTFS-RT decode.');