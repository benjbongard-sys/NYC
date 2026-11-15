/* Encrypted-at-rest planner. The secret is neither in GitHub nor sent to a server. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const screen=$('lock-screen'),form=$('unlock-form'),input=$('unlock-pass'),button=$('unlock-submit'),msg=$('unlock-message'),bar=$('unlock-bar');
 const enc=new TextEncoder(),dec=new TextDecoder();
 const b64=s=>Uint8Array.from(atob(s),x=>x.charCodeAt(0));
 let unlocked=false,attempts=0;
 window.NYC_BASE=new URL('./',location.href).href;
 const stars=$('lock-stars');
 for(let i=0;i<50;i++){const star=document.createElement('i');star.style.setProperty('--x',`${(i*71+13)%98}%`);star.style.setProperty('--y',`${(i*41+19)%84}%`);star.style.setProperty('--delay',`${(i%15)*-.23}s`);star.style.setProperty('--size',`${i%9===0?3:1}px`);stars.appendChild(star)}
 $('toggle-visibility').addEventListener('click',()=>{input.type=input.type==='password'?'text':'password';input.focus()});
 const mark=(text,status='')=>{msg.textContent=text;msg.dataset.status=status};
 async function derive(password,salt,rounds){
  const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:rounds,hash:'SHA-256'},key,{name:'AES-GCM',length:256},false,['decrypt']);
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
      if(!start || !end || start>='11:30' || end<='06:10')return true;
      return ['booked','arranged','confirmed'].includes(String(e.status||'').toLowerCase());
     });
     const parade=[
      {id:'centennial_parade_walk',start:'06:10',end:'06:35',title:'Walk to Sixth Avenue · get a viewing position',place:'centennial_parade',detail:'Choose a public viewing area around West 52nd Street. Barricades and NYPD directions take precedence. Early arrival is important.',kind:'travel',status:'proposed'},
      {id:'centennial_parade_2026',start:'06:35',end:'11:20',title:"100th Macy's Thanksgiving Day Parade",place:'centennial_parade',detail:'Thursday 26 November 2026. The parade officially begins at 08:30 on Central Park West, then follows Central Park South and Sixth Avenue towards Herald Square. Free public viewing; exact passage times at this location are not guaranteed.',kind:'highlight',status:'public-event'}
     ];
     return retained.concat(parade).sort((a,b)=>String(a.start||'').localeCompare(String(b.start||'')));
    };
    planner.__centennialParade=true;
   }
   // Execute vetted, encrypted first-party bundles in the required dependency order.
   for(const name of ['data.js','itinerary.js','mta.js','routeplanner.js','photo-sources.js','custom-stops.js','app.js']){
    if(!scripts[name])throw Error('Unable to open a part of our itinerary: '+name);
    const el=document.createElement('script');el.textContent=scripts[name]+`\n//# sourceURL=noux-private-${name}`;document.head.appendChild(el);
    if(name==='itinerary.js')attachCentennialParade();
    if(name==='custom-stops.js'){
     if(window.NOUX_EXPLORER){try{window.NOUX_EXPLORER.install()}catch(_){/* Keep the private trip available. */}}
     if(window.NOUX_VENUES){try{window.NOUX_VENUES.install()}catch(_){/* Never block decryption on a display enhancement. */}}
    }
   }
   $('root').hidden=false;screen.style.display='none';
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