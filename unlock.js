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
  button.disabled=true;input.disabled=true;document.body.classList.add('unlock-thinking');mark('Decrypting our private itinerary…');bar.style.width='34%';
  const password=input.value;input.value='';
  try{
   if(location.protocol==='file:')throw Error('For local files, run a small local web server or use the GitHub Pages link.');
   const r=await fetch('./assets/private.vault.json',{cache:'no-store'});if(!r.ok)throw Error('The encrypted itinerary is temporarily unavailable.');
   const vault=await r.json();
   const key=await derive(password,b64(vault.salt),vault.iterations);
   bar.style.width='72%';
   const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(vault.iv),additionalData:enc.encode('NOUX-NYC-PRIVATE-V1')},key,b64(vault.ct));
   const scripts=JSON.parse(dec.decode(plain));
   if(!scripts['data.js']||!scripts['app.js'])throw Error('Invalid encrypted package.');
   unlocked=true;mark('Welcome. The city is opening…','success');bar.style.width='100%';
   screen.classList.add('unlocked');
   await new Promise(resolve=>setTimeout(resolve,1050));
   // Execute vetted, encrypted first-party bundles in the required dependency order.
   for(const name of ['data.js','itinerary.js','mta.js','photo-sources.js','app.js']){
    if(!scripts[name])throw Error('Missing private module: '+name);
    const el=document.createElement('script');el.textContent=scripts[name]+`\n//# sourceURL=noux-private-${name}`;document.head.appendChild(el);
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