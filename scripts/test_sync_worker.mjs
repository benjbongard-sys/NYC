/* NOUX cloud sync Worker security and revision test. Node 22, no external packages. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { webcrypto } from 'node:crypto';
const source=fs.readFileSync('cloudflare/sync-worker.js','utf8')
 .replace('export class NouxRoom','class NouxRoom')
 .replace('export default {','const app = {');
const {NouxRoom,app}=new Function('crypto','Response','Request','Headers',source+';return {NouxRoom,app}')(webcrypto,Response,Request,Headers);
function database(){
 let row=null;
 return {exec(query,...params){
  if(query.startsWith('CREATE TABLE'))return {toArray:()=>[]};
  if(query.startsWith('SELECT'))return {toArray:()=>row?[{...row}]:[]};
  if(query.startsWith('INSERT')){row={verifier:params[0],revision:params[1],box:params[2],updated_at:params[3]};return {toArray:()=>[]}};
  if(query.startsWith('UPDATE')){row={...row,revision:params[0],box:params[1],updated_at:params[2]};return {toArray:()=>[]}};
  throw Error('Unexpected SQL: '+query)
 }};
}
const instance=new NouxRoom({storage:{sql:database()}});
const env={ALLOWED_ORIGIN:'https://benjbongard-sys.github.io',ROOMS:{idFromName:n=>n,get:()=>({fetch:req=>instance.fetch(req)})}};
const room=Buffer.alloc(16,23).toString('base64url');
const secret=Buffer.alloc(32,47).toString('base64url');
const other=Buffer.alloc(32,72).toString('base64url');
const encrypted={version:1,iv:Buffer.alloc(12,99).toString('base64'),ct:Buffer.alloc(96,104).toString('base64')};
const url='https://noux-sync.example/v1/rooms/'+room;
const call=(method,token=secret,body,origin='https://benjbongard-sys.github.io')=>{
 const headers={'Origin':origin,'Authorization':'Bearer '+token};
 if(body)headers['Content-Type']='application/json';
 return app.fetch(new Request(url,{method,headers,body:body?JSON.stringify(body):undefined}),env)
};
const health=await app.fetch(new Request('https://noux-sync.example/health'),env);
assert.equal(health.status,200);
const preflight=await app.fetch(new Request(url,{method:'OPTIONS',headers:{Origin:env.ALLOWED_ORIGIN,'Access-Control-Request-Method':'PUT','Access-Control-Request-Headers':'authorization,content-type'}}),env);
assert.equal(preflight.status,204);
assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),env.ALLOWED_ORIGIN);
assert.equal((await call('GET')).status,404,'Unused room has no document');
const initial=await call('PUT',secret,{baseRevision:0,encrypted});
assert.equal(initial.status,200);
assert.equal((await initial.json()).revision,1);
const read=await call('GET');
assert.equal(read.status,200);
assert.deepEqual((await read.json()).encrypted,encrypted,'No loss of ciphertext');
assert.equal((await call('PUT',secret,{baseRevision:0,encrypted})).status,409,'Stale upload cannot overwrite latest');
assert.equal((await call('GET',other)).status,403,'Wrong pairing key cannot read the room');
assert.equal((await call('PUT',other,{baseRevision:1,encrypted})).status,403,'Wrong pairing key cannot write');
assert.equal((await call('GET',secret,undefined,'https://malicious.example')).status,403,'Only allowed browser origin');
assert.equal((await call('PUT',secret,{baseRevision:1,encrypted:{...encrypted,ct:'not valid'}})).status,400,'Reject malformed ciphertext');
const again=await call('PUT',secret,{baseRevision:1,encrypted});
assert.equal((await again.json()).revision,2,'Optimistic revision incremented');
const noAuth=await app.fetch(new Request(url),env);
assert.equal(noAuth.status,401,'Unauthenticated room request rejected');
assert(!JSON.stringify(instance).includes(secret),'Clear pairing key is not stored in room');
console.log('NO UX encrypted sync Worker PASS: origin checks, bearer verifier, encrypted-only state, stale-write conflict, rev CAS.');
