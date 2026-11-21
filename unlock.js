/* Encrypted-at-rest planner. The secret is neither in GitHub nor sent to a server. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const screen=$('lock-screen'),form=$('unlock-form'),input=$('unlock-pass'),button=$('unlock-submit'),msg=$('unlock-message'),bar=$('unlock-bar');
 const enc=new TextEncoder(),dec=new TextDecoder();
 const b64=s=>Uint8Array.from(atob(s),x=>x.charCodeAt(0));
 let unlocked=false,attempts=0;
 // A separate compatibility boot keeps the core encrypted planner available if
 // a nonessential enrichment crashes React. It never clears saved choices.
 const basicMode=(()=>{
  try{return new URLSearchParams(location.search).get('basic')==='1'||sessionStorage.getItem('noux_basic_mode')==='1'}catch(_){return false}
 })();
 window.NYC_BASE=new URL('./',location.href).href;
 function recovery(message){
  if(document.getElementById('noux-recovery'))return;
  const wrap=document.createElement('section');wrap.id='noux-recovery';
  wrap.setAttribute('role','alert');wrap.style.cssText='position:fixed;inset:0;z-index:6000;display:grid;place-items:center;background:#101722;padding:20px;color:#f6ecdf;font-family:system-ui,sans-serif';
  const card=document.createElement('div');card.style.cssText='max-width:520px;width:100%;padding:34px;background:#202938;border:1px solid #987d5d;border-radius:18px;box-shadow:0 25px 65px #0008';
  const title=document.createElement('h2');title.textContent='Your New York is still here';title.style.cssText='font:400 32px Georgia,serif;margin:0 0 14px';
  const copy=document.createElement('p');copy.textContent=message||'The encrypted itinerary opened, but the visual planner could not start. Your saved choices have not been cleared.';copy.style.cssText='line-height:1.7;color:#c5c8d0';
  const action=document.createElement('button');action.textContent='Reopen the basic itinerary';action.style.cssText='margin-top:17px;padding:14px 18px;background:#e2c398;border:0;border-radius:9px;color:#17202b;font-weight:750;cursor:pointer;min-height:48px';
  action.onclick=()=>{try{sessionStorage.setItem('noux_basic_mode','1')}catch(_){}const u=new URL(location.href);u.searchParams.set('basic','1');location.assign(u.href)};
  const note=document.createElement('p');note.textContent='You will enter your private passphrase again. No trip data, packing checks or preferences are erased.';note.style.cssText='margin-top:18px;font-size:12px;color:#abb9c3';
  card.append(title,copy,action,note);wrap.append(card);document.body.append(wrap);
 }
 function healthy(){
  const root=$('root');return !!(root&&!root.hidden&&root.childElementCount>0&&root.textContent.trim().length>40);
 }
 const stars=$('lock-stars');
 for(let i=0;i<50;i++){const star=document.createElement('i');star.style.setProperty('--x',`${(i*71+13)%98}%`);star.style.setProperty('--y',`${(i*41+19)%84}%`);star.style.setProperty('--delay',`${(i%15)*-.23}s`);star.style.setProperty('--size',`${i%9===0?3:1}px`);stars.appendChild(star)}
 $('toggle-visibility').addEventListener('click',()=>{input.type=input.type==='password'?'text':'password';input.focus()});
 const mark=(text,status='')=>{msg.textContent=text;msg.dataset.status=status};
 async function derive(password,salt,rounds){
  const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:rounds,hash:'SHA-256'},key,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 }
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(unlocked||!input.value||!crypto?.subtle)return;
  button.disabled=true;input.disabled=true;document.body.classList.add('unlock-thinking');mark('Opening our New York…');bar.style.width='34%';
  const password=input.value;input.value='';
  try{
   if(location.protocol==='file:')throw Error('Open the online NOUX link to continue.');
   const r=await fetch('./assets/private.vault.json',{cache:'no-store'});if(!r.ok)throw Error('Our New York could not open just now. Please try again.');
   const vault=await r.json();
   const key=await derive(password,b64(vault.salt),vault.iterations);
   bar.style.width='72%';
   const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(vault.iv),additionalData:enc.encode('NOUX-NYC-PRIVATE-V1')},key,b64(vault.ct));
   const scripts=JSON.parse(dec.decode(plain));
   if(!scripts['data.js']||!scripts['app.js'])throw Error('Something went wrong. Try refreshing the page.');
   unlocked=true;mark('Welcome. The city is opening…','success');bar.style.width='100%';
   screen.classList.add('unlocked');
   await new Promise(resolve=>setTimeout(resolve,1050));
   // The 100th annual parade is public civic-event data; personal travel remains inside the vault.
   function attachCentennialParade(){
    const data=window.NYC_DATA, planner=window.NYC_PLAN;
    if(!data || !data.P || !planner || typeof planner.day!=='function' || planner.__centennialParade)return;
    const areaPoint=data.P.rockefeller || data.P.times;
    if(!areaPoint)return;
    data.P.centennial_parade={
     ...areaPoint,
     name:"100th Macy's Thanksgiving Day Parade",
     area:'Midtown Manhattan',
     address:'Sixth Avenue near Rockefeller Center, New York, NY, USA',
     kind:'event'
    };
    const dayBefore=planner.day;
    planner.day=function(day,choices){
     const events=dayBefore.call(this,day,choices);
     if(day!=='thu' || !Array.isArray(events) || events.some(e=>/macy.{0,20}parade|thanksgiving.{0,20}parade/i.test(String(e.title||''))))return events;
     // Replace only conflicting optional early-Thursday plans, never confirmed bookings.
     const retained=events.filter(e=>{
      const start=String(e.start||''), end=String(e.end||'');
      if(!start || !end || start>='11:30' || end<='09:15')return true;
      return ['booked','arranged','confirmed'].includes(String(e.status||'').toLowerCase());
     });
     const parade=[
      {id:'centennial_parade_walk',start:'09:15',end:'09:40',title:'Walk to Sixth Avenue · join the Thanksgiving crowds',place:'centennial_parade',detail:'Aim for public viewing near West 52nd Street from 09:40. Arriving after the first crowds means no kerbside/front-row view is guaranteed. Follow NYPD barriers; walking routes may be restricted.',kind:'travel',status:'proposed'},
      {id:'centennial_parade_2026',start:'09:40',end:'11:15',title:"100th Macy's Thanksgiving Day Parade",place:'centennial_parade',detail:'The parade starts at 08:30 on the Upper West Side. Near Rockefeller Center the lead floats usually pass after 09:30, with more arriving throughout the morning. Shorter relaxed viewing; sightlines and exact timings are not guaranteed.',kind:'highlight',status:'public-event'}
     ];
     return retained.concat(parade).sort((a,b)=>String(a.start||'').localeCompare(String(b.start||'')));
    };
    planner.__centennialParade=true;
   }
   // Errors in the visual app must never leave an unexplained blue screen.
   let visualError=false;
   const onVisualError=()=>{visualError=true};
   window.addEventListener('error',onVisualError);
   window.addEventListener('unhandledrejection',onVisualError);
   // Execute vetted, encrypted first-party bundles in the required dependency order.
   for(const name of ['data.js','itinerary.js','mta.js','routeplanner.js','photo-sources.js','custom-stops.js','app.js']){
    if(!scripts[name])throw Error('Unable to open a part of our itinerary: '+name);
    const el=document.createElement('script');el.textContent=scripts[name]+`\n//# sourceURL=noux-private-${name}`;document.head.appendChild(el);
    if(name==='data.js'){try{window.NOUX_FOOD_WISHLIST?.install()}catch(_){/* optional food additions must never break unlock */}}
     if(name==='itinerary.js')attachCentennialParade();
    if(name==='custom-stops.js'&&!basicMode){
     // The stable venue/explorer layers can initialise here; choices, route
     // auditing and subway enhancements must not mutate state before React's
     // initial render. In basic mode, boot the decrypted private app alone.
     if(window.NOUX_EXPLORER){try{window.NOUX_EXPLORER.install()}catch(_){}}
     if(window.NOUX_VENUES){try{window.NOUX_VENUES.install()}catch(_){}}
    }
   }
   $('root').hidden=false;screen.style.display='none';
   // First confirm that the unmodified React app has actually painted.
   await new Promise(resolve=>setTimeout(resolve,700));
   if(!healthy()||visualError){
    recovery('The encrypted itinerary unlocked, but the visual planner did not finish opening. Try the basic itinerary; your personal data remains intact.');
   }else{
    if(!basicMode){
     // Progressive enhancement *after* the first React paint. A bad extension
     // must never prevent the core planner from mounting.
     try{window.NOUX_CHOICES?.install()}catch(_){}
     try{window.NOUX_DAY_AUDIT?.install()}catch(_){}
     try{window.NOUX_SUBWAY?.install()}catch(_){}
     // Do not force immediate React tab toggles during startup. Decisions refresh
     // naturally when the visitor opens the itinerary or changes a selection.
    }
    // Encrypted checklist is a sibling of React's root, not a child of its nav.
    if(window.NOUX_DEPARTURE){try{await window.NOUX_DEPARTURE.install({key})}catch(_){}}
    // Nonessential sync attaches outside React. Connectivity failure can never
    // prevent the private site from opening or clear saved local state.
    if(window.NOUX_SYNC){try{await window.NOUX_SYNC.install({key})}catch(_){}}
    // Catch a delayed render failure and offer an intact basic fallback.
    setTimeout(()=>{if(!healthy())recovery('The interactive page stopped rendering. Reopen the basic itinerary; your saved plans and checklist remain intact.')},1200);
   }
   window.removeEventListener('error',onVisualError);
   window.removeEventListener('unhandledrejection',onVisualError);
   // The password is never persisted, logged or placed in the URL.
  }catch(error){
   unlocked=false;attempts++;bar.style.width='0%';button.disabled=false;input.disabled=false;
   document.body.classList.remove('unlock-thinking');screen.classList.remove('unlocked');
   const wrong=error.name==='OperationError';mark(wrong?'That passphrase did not open our journey. Try again.':(error.message||'Unable to open this itinerary.'),'error');
   screen.classList.remove('shake');void screen.offsetWidth;screen.classList.add('shake');
   if(wrong&&attempts>=6)mark('Several incorrect attempts. Check the exact private passphrase.','error');
   input.focus();
  }
 });
})();