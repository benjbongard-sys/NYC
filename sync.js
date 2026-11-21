/* NOUX encrypted shared trip. Public application glue; no embedded secrets.
 * Pairing credential & cache encrypted with the locally derived itinerary AES key.
 * Cloudflare receives only AES-GCM ciphertext and the bearer capability.
 */
(function(){
'use strict';
if(window.NOUX_SYNC)return;
const PAIR_KEY='noux_sync_pair_aes_v1',CACHE_KEY='noux_sync_cache_aes_v1',AAD_PAIR='NOUX-SYNC-PAIR-V1',AAD_CACHE='NOUX-SYNC-CACHE-V1',AAD_DOC='NOUX-SYNC-DOCUMENT-V1';
const DEFAULT_URL='https://noux-sync.benjbongard.workers.dev';
const PAIR_RE=/^NOUX1\.([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})$/;
const POLL_MS=6500;
let KEY=null,CORE=null,CONFIG=null,CACHE=null,DEVICE='',RUNNING=false,READY=false,OPEN=false,DISPLAY_CODE=false;
let PANEL=null,LAUNCHER=null,LAST_OK=0,ERROR='',INFO='',IMPORT_CHANGED=false,STORAGE_TIMER=0,POLL_TIMER=0,SPEND=0;
const enc=new TextEncoder(),dec=new TextDecoder();
const b64=x=>{
 const bytes=new Uint8Array(x);let binary='';
 // A full itinerary can be megabytes. Spreading all bytes into one function
 // call crashes Safari/iPhone and Chrome with "too many arguments".
 for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(binary);
};
const unb64=x=>Uint8Array.from(atob(x),c=>c.charCodeAt(0));
const clone=x=>JSON.parse(JSON.stringify(x));
const exists=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e};
const button=(t,fn,cls)=>{const x=el('button',cls||'',t);x.type='button';x.addEventListener('click',fn);return x};
const makeId=n=>{const x=crypto.getRandomValues(new Uint8Array(n));return b64(x).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')};
function serviceUrl(){
 const candidate=typeof window.NYC_SYNC_API_URL==='string'?window.NYC_SYNC_API_URL:DEFAULT_URL;
 try{
  const url=new URL(candidate);
  if(url.protocol!=='https:'||url.hostname!=='noux-sync.benjbongard.workers.dev'||url.username||url.password)return DEFAULT_URL;
  return url.origin;
 }catch(_){return DEFAULT_URL}
}
async function seal(data,label){
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(label)},KEY,enc.encode(JSON.stringify(data)));
 return {version:1,iv:b64(iv),ct:b64(cipher)};
}
async function openSeal(raw,label){
 const box=typeof raw==='string'?JSON.parse(raw):raw;
 if(!box||box.version!==1||typeof box.iv!=='string'||typeof box.ct!=='string')throw Error('Invalid encrypted sync state');
 const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(box.iv),additionalData:enc.encode(label)},KEY,unb64(box.ct));
 return JSON.parse(dec.decode(bytes));
}
async function locallySave(name,obj,aad){localStorage.setItem(name,JSON.stringify(await seal(obj,aad)))}
async function locallyRead(name,aad){const stored=localStorage.getItem(name);return stored?await openSeal(stored,aad):null}
function notify(msg,type='info'){
 INFO=msg||'';
 if(type==='error')ERROR=INFO;
 updateStatus();
 if(OPEN)render();
}
function statusText(){
 if(!CONFIG)return 'Not paired · changes remain on this device';
 if(RUNNING)return 'Synchronising encrypted changes…';
 if(ERROR)return ERROR;
 if(LAST_OK)return 'Shared trip synced · '+new Date(LAST_OK).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
 return 'Pairing saved · waiting for Cloudflare';
}
function updateStatus(){
 if(LAUNCHER)LAUNCHER.textContent=CONFIG?(IMPORT_CHANGED?'New trip updates · review':'Shared trip · '+(ERROR?'offline':LAST_OK?'synced':'connecting')):'Set up shared sync';
 const text=PANEL&&PANEL.querySelector('.noux-sync-status');
 if(text)text.textContent=statusText();
}
function formatPair(pair){return 'NOUX1.'+pair.room+'.'+pair.token}
function parsePair(s){
 const m=PAIR_RE.exec(String(s||'').trim());
 if(!m)throw Error('Invalid pairing code. It must begin NOUX1.');
 return {room:m[1],token:m[2]};
}
async function api(method,body){
 if(!CONFIG)throw Error('Shared trip has not been paired');
 if(typeof navigator!=='undefined'&&navigator.onLine===false)throw Error('Offline. Your changes remain saved locally.');
 const headers={'Authorization':'Bearer '+CONFIG.token,'Accept':'application/json'};
 if(body!==undefined)headers['Content-Type']='application/json';
 const ctl=typeof AbortController!=='undefined'?new AbortController():null;
 const timeout=ctl?setTimeout(()=>ctl.abort(),12000):null;
 try{
  const r=await fetch(serviceUrl()+'/v1/rooms/'+CONFIG.room,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:ctl?.signal});
  let value={};try{value=await r.json()}catch(_){}
  return {status:r.status,data:value};
 }catch(err){
  throw Error(err&&err.name==='AbortError'?'Shared service timed out; changes are safe locally.':'Shared service unreachable; changes are safe locally.');
 }finally{if(timeout)clearTimeout(timeout)}
}
async function snapshot(){
 try{await window.NOUX_DEPARTURE?.whenSaved?.()}catch(_){}
 const packing=await window.NOUX_DEPARTURE?.getSharedSnapshot?.();
 return CORE.scan(localStorage,packing||{check:{},items:[]});
}
// Distinguish genuine remote itinerary changes from local self-synchronisation.
function incomingItineraryChange(local,merged){
 for(const [key,record] of Object.entries(merged||{})){
  const path=CORE.parseKey(key);
  if(!path||path[0]==='@noux-departure'||!record||typeof record!=='object')continue;
  if(record.deleted){if(exists(local,key))return true}
  else if(!exists(local,key)||JSON.stringify(local[key])!==JSON.stringify(record.value))return true;
 }
 return false;
}
async function applyRecords(records,notifyExternal=false){
 const packing=await window.NOUX_DEPARTURE?.getSharedSnapshot?.();
 const result=CORE.apply(localStorage,packing||{check:{},items:[]},records);
 if(result.checklistChanged&&window.NOUX_DEPARTURE?.applySharedSnapshot){
  await window.NOUX_DEPARTURE.applySharedSnapshot(result.checklist);
 }
 if(notifyExternal&&result.changedKeys.length){
  IMPORT_CHANGED=true;
  // Preserve the current decrypted React app and make the fresh data visible
  // after a controlled reload. Never overwrite React state by clicking tabs.
  // React's active state may still hold the previous choice. Prevent
  // another edit from unintentionally replacing the incoming shared choice.
  // The packing checklist, mounted outside React, remains fully accessible.
  const main=document.getElementById('root');if(main)main.inert=true;
  const explore=document.querySelector('.noux-explorer-launch');if(explore)explore.disabled=true;
  let toast=document.getElementById('noux-sync-notice');
  if(!toast){
   toast=el('div','noux-sync-notice');toast.id='noux-sync-notice';
   toast.append(el('span',null,'New shared itinerary changes are saved. Reopen the itinerary before editing further to avoid overwriting them.'));
   toast.append(button('View latest itinerary',()=>location.reload(),'noux-sync-primary'));
   document.body.append(toast);
  }
  try{window.dispatchEvent(new CustomEvent('noux:sync-data-arrived',{detail:{keys:result.changedKeys.length}}))}catch(_){}
 }
 return result;
}
async function persist(){
 if(!CONFIG||!CACHE)return;
 await locallySave(CACHE_KEY,{room:CONFIG.room,revision:CACHE.revision,records:CACHE.records,baseline:CACHE.baseline,lastStamp:CACHE.lastStamp,device:DEVICE},AAD_CACHE);
}
function clock(){
 const t=Math.max(Date.now(),Number(CACHE?.lastStamp||0)+1);
 CACHE.lastStamp=t;return t;
}
function recordFrom(fields,device){
 const out={};
 for(const [k,v] of Object.entries(fields)){
  if(!CORE.parseKey(k))continue;
  out[k]={value:v,deleted:false,t:clock(),device};
 }
 return out;
}
function sameRecords(a,b){return JSON.stringify(a)===JSON.stringify(b)}
async function refresh(){
 if(!CONFIG||RUNNING)return;
 RUNNING=true;ERROR='';updateStatus();
 try{
  let local=await snapshot();
  // On initial pairing to an existing shared room, preserve unique local
  // additions, but let the established room win for already-shared choices.
  let ours=CACHE&&CACHE.room===CONFIG.room?CORE.diff(CACHE.baseline,local,CACHE.records,DEVICE,clock):null;
  const initial=!ours;
  let remoteRevision=0,remoteFields={},roomExists=false;
  for(let attempt=0;attempt<4;attempt++){
   const get=await api('GET');
   if(get.status===200){
    roomExists=true;remoteRevision=get.data.revision;
    const data=await openSeal(get.data.encrypted,AAD_DOC);
    if(!data||data.schema!==1||!data.fields||typeof data.fields!=='object'||Array.isArray(data.fields))throw Error('Shared data version is incompatible. No local changes were overwritten.');
    remoteFields=data.fields;
   }else if(get.status===404){roomExists=false;remoteRevision=0;remoteFields={};
    if(CACHE&&CACHE.room===CONFIG.room&&CACHE.revision>0)throw Error('The original shared room is missing. Re-pair instead of overwriting it.');
   }else if(get.status===403||get.status===401)throw Error('Pairing key rejected. Check the code on both devices.');
   else throw Error('Cloudflare sync unavailable (HTTP '+get.status+'). Your local edits are safe.');
   if(initial){
    if(roomExists){
     ours={};
     for(const [k,value] of Object.entries(local)){
      if(!exists(remoteFields,k)){
       ours[k]={value,deleted:false,t:Date.now(),device:DEVICE};
      }
     }
    }else{
     // First paired device creates the shared room from its saved local state.
     CACHE={room:CONFIG.room,revision:0,records:{},baseline:{},lastStamp:0};
     ours=recordFrom(local,DEVICE);
    }
   }
   const merged=CORE.merge(remoteFields,ours);
   if(!roomExists||!sameRecords(merged,remoteFields)){
    const encrypted=await seal({schema:1,fields:merged},AAD_DOC);
    const put=await api('PUT',{baseRevision:remoteRevision,encrypted});
    if(put.status===409){continue}
    if(put.status!==200)throw Error('Sync upload failed (HTTP '+put.status+'); local changes are still safe.');
    remoteRevision=put.data.revision;
   }
   // A user may edit the itinerary while the network request is in flight.
   // Never overwrite such a just-made local edit with a stale snapshot.
   const latest=await snapshot();
   if(JSON.stringify(latest)!==JSON.stringify(local)){
    CACHE={room:CONFIG.room,revision:remoteRevision,records:merged,baseline:local,lastStamp:Math.max(Number(CACHE?.lastStamp||0),Date.now())};
    await persist();
    queueRefresh();
    INFO='New local edit detected during sync; retrying safely.';
    return;
   }
   await applyRecords(merged,incomingItineraryChange(local,merged));
   CACHE={room:CONFIG.room,revision:remoteRevision,records:merged,baseline:await snapshot(),lastStamp:Math.max(Number(CACHE?.lastStamp||0),Date.now())};
   await persist();
   LAST_OK=Date.now();ERROR='';
   return;
  }
  throw Error('Two devices updated simultaneously. Your changes remain queued for the next attempt.');
 }catch(e){
  ERROR=e instanceof Error?e.message:'Sync temporarily unavailable; local changes are retained.';
 }finally{RUNNING=false;updateStatus();if(OPEN)render()}
}
function queueRefresh(){
 if(!CONFIG)return;
 if(STORAGE_TIMER)clearTimeout(STORAGE_TIMER);
 STORAGE_TIMER=setTimeout(()=>{STORAGE_TIMER=0;void refresh()},1000);
}
async function begin(pair,person,mode){
 const previous=CONFIG;
 if(mode==='join'){
  const original=CONFIG;
  CONFIG={...pair,person};
  const probe=await api('GET');
  CONFIG=original;
  if(probe.status===404)throw Error('The first device has not created this shared trip online yet.');
  if(probe.status===403||probe.status===401)throw Error('Pairing code rejected.');
  if(probe.status!==200)throw Error('Sync service is not reachable yet. Please deploy the Cloudflare Worker first.');
 }
 CONFIG={room:pair.room,token:pair.token,person};
 CACHE=null;LAST_OK=0;ERROR='';IMPORT_CHANGED=false;
 try{await locallySave(PAIR_KEY,CONFIG,AAD_PAIR);localStorage.removeItem(CACHE_KEY)}
 catch(err){CONFIG=previous;throw err}
 void refresh();
 render();
}
async function create(person){
 const pair={room:makeId(16),token:makeId(32)};
 DISPLAY_CODE=true;await begin(pair,person,'create');
}
async function forget(){
 if(!confirm('Disconnect this device from the shared trip? Local choices and checklists remain on this device.'))return;
 CONFIG=null;CACHE=null;ERROR='';LAST_OK=0;DISPLAY_CODE=false;IMPORT_CHANGED=false;
 localStorage.removeItem(PAIR_KEY);localStorage.removeItem(CACHE_KEY);
 render();
}
async function copyCode(){
 if(!CONFIG)return;
 const code=formatPair(CONFIG);
 try{await navigator.clipboard.writeText(code);notify('Pairing code copied. Send it privately to your partner.')}catch(_){
  DISPLAY_CODE=true;notify('Copy the pairing code from the text field below.');
 }
}
function heading(){
 const box=el('div','noux-sync-head'),left=el('div');
 left.append(el('small','noux-sync-kicker','NOUX / PRIVATE SYNC'),el('h2',null,'One trip, two phones'),el('p',null,'Private changes shared securely between Benjamin and Lyna.'));
 box.append(left,button('× Close',close,'noux-sync-close'));return box;
}
function field(label,node){const outer=el('label','noux-sync-field');outer.append(el('span',null,label),node);return outer}
function selectPerson(defaultValue){
 const choice=el('select');[['Benjamin','Benjamin'],['Lyna','Lyna']].forEach(([v,t])=>{const opt=el('option',null,t);opt.value=v;choice.append(opt)});
 choice.value=defaultValue;return choice;
}
function initScreen(){
 const area=el('div','noux-sync-body');
 if(ERROR)area.append(el('p','noux-sync-error',ERROR));
 const intro=el('p','noux-sync-copy','To activate cross-device saving, create one private pairing code on the first phone, then enter that code on the other phone after unlocking NOUX. No passwords or unencrypted trip details are uploaded.');
 const chooser=selectPerson('Benjamin'),form=el('div','noux-sync-setup');
 form.append(field('This phone belongs to',chooser));
 form.append(button('Create our shared trip',()=>{void create(chooser.value).catch(e=>notify(e.message,'error'))},'noux-sync-primary'));
 const join=el('form','noux-sync-join');
 const input=el('input');input.placeholder='NOUX1.••• pairing code';input.autocomplete='off';input.spellcheck=false;input.required=true;input.maxLength=110;
 const label=field('Pair this phone using a code from the first device',input);
 const action=el('button','noux-sync-secondary','Join existing trip');action.type='submit';join.append(label,action);
 join.addEventListener('submit',ev=>{ev.preventDefault();try{const pair=parsePair(input.value);void begin(pair,chooser.value,'join').catch(e=>notify(e.message,'error'))}catch(e){notify(e.message,'error')}});
 area.append(intro,form,join);
 return area;
}
function connectedScreen(){
 const body=el('div','noux-sync-body');
 body.append(el('p','noux-sync-copy','Connected as '+CONFIG.person+'. Changes made on this device are saved locally first, then encrypted and sent to the shared trip automatically while online.'));
 const summary=el('div','noux-sync-statusbox');
 summary.append(el('strong',null,ERROR?'Sync attention needed':'Shared trip connected'),el('p','noux-sync-status',statusText()));
 if(IMPORT_CHANGED){
  const changed=el('p','noux-sync-new','Changes from the other device have been saved locally. The packing list updates immediately; reopen the itinerary before further edits to prevent stale selections from overwriting them.');
  summary.append(changed,button('Reopen itinerary to view latest',()=>location.reload(),'noux-sync-secondary'));
 }
 body.append(summary);
 const actions=el('div','noux-sync-actions');
 actions.append(button('Sync now',()=>{void refresh()},'noux-sync-primary'));
 actions.append(button('Copy pairing code',()=>{void copyCode()},'noux-sync-secondary'));
 actions.append(button(DISPLAY_CODE?'Hide code':'Show pairing code',()=>{DISPLAY_CODE=!DISPLAY_CODE;render()},'noux-sync-secondary'));
 body.append(actions);
 if(DISPLAY_CODE){
  const share=el('div','noux-sync-share'),input=el('textarea');input.value=formatPair(CONFIG);input.readOnly=true;input.rows=2;input.setAttribute('aria-label','Secret pairing code');
  share.append(el('p',null,'Share privately with your partner. Anyone who gets this code can access and replace the encrypted shared copy. The trip passphrase is separately required to decrypt it.'),input);
  body.append(share);
 }
 body.append(button('Disconnect this phone',()=>{void forget()},'noux-sync-danger'));
 body.append(el('p','noux-sync-fine','Encrypted backups remain on each device. Clearing browser storage can delete this phone’s pairing; keep the pairing code somewhere private. Changes made offline sync when internet is restored. If both phones change the same field simultaneously, the latest timestamp wins.'));
 return body;
}
function render(){
 if(!PANEL)return;
 const inner=PANEL.querySelector('.noux-sync-inner');
 if(!inner)return;
 inner.replaceChildren(heading(),CONFIG?connectedScreen():initScreen());
 updateStatus();
}
function open(){
 if(!PANEL)return;
 OPEN=true;PANEL.hidden=false;document.body.classList.add('noux-sync-open');render();
 PANEL.querySelector('.noux-sync-close')?.focus();
}
function close(){OPEN=false;if(PANEL)PANEL.hidden=true;DISPLAY_CODE=false;document.body.classList.remove('noux-sync-open')}
function mount(){
 if(PANEL)return;
 PANEL=el('section','noux-sync-modal');PANEL.id='noux-sync-panel';PANEL.hidden=true;
 PANEL.setAttribute('role','dialog');PANEL.setAttribute('aria-modal','true');PANEL.setAttribute('aria-label','Shared private trip synchronisation');
 const inner=el('div','noux-sync-inner');PANEL.append(inner);
 document.body.append(PANEL);
 // Shared sync is accessed from native Trip Settings, not a permanent floating button.
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&OPEN)close()});
 updateStatus();
}
async function install({key}={}){
 if(READY)return true;
 if(!key||!crypto?.subtle||!window.NOUX_SYNC_CORE)return false;
 KEY=key;CORE=window.NOUX_SYNC_CORE;
 DEVICE=makeId(12); // reloaded below if encrypted metadata exists
 try{
  CONFIG=await locallyRead(PAIR_KEY,AAD_PAIR);
  CACHE=await locallyRead(CACHE_KEY,AAD_CACHE);
  if(CONFIG&&!PAIR_RE.test(formatPair(CONFIG)))throw Error('Stored pairing code invalid');
  if(CACHE?.device)DEVICE=CACHE.device;
  if(CACHE&&CONFIG&&CACHE.room!==CONFIG.room)CACHE=null;
 }catch(_){
  // An unreadable pairing must not erase ciphertext or any local itinerary.
  CONFIG=null;CACHE=null;ERROR='Stored pairing is unreadable. Import the code again; your existing local data is untouched.';
 }
 mount();READY=true;
 if(CONFIG)void refresh();
 POLL_TIMER=setInterval(()=>{if(CONFIG)void refresh()},POLL_MS);
 window.addEventListener('online',queueRefresh);
 window.addEventListener('focus',queueRefresh);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueRefresh()});
 document.addEventListener('noux:local-change',queueRefresh);
 document.addEventListener('noux:replan',queueRefresh);
 window.addEventListener('storage',ev=>{if(ev.key&&ev.key!==PAIR_KEY&&ev.key!==CACHE_KEY)queueRefresh()});
 return true;
}
window.NOUX_SYNC={install,refresh,open,close,getStatus:()=>({paired:!!CONFIG,text:statusText(),importChanged:IMPORT_CHANGED,ready:READY}),version:'2026.11.21-settings',serviceUrl};
})();
