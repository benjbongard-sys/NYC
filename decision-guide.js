/* NOUX Choices Passport: a lightweight, optional guide to actual Decisions.
 * No duplicate itinerary, GO mode, weather, tickets, or floating launcher.
 * Mounts outside React; answers are changed ONLY via native Decision controls.
 */
(function(){
'use strict';
if(window.NOUX_DECISION_GUIDE)return;
const JOURNAL='noux_choice_journal_v2';
const ORDER={mon:0,tue:1,wed:2,thu:3,fri:4};
let ROOT=null,OPEN=false,READY=false,WHO='Lyna',INDEX=0,STATUS='';
const el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=String(txt);return x};
const button=(txt,fn,cls)=>{const x=el('button',cls||'',txt);x.type='button';x.addEventListener('click',fn);return x};
function read(){try{return JSON.parse(localStorage.getItem(JOURNAL)||'{}')||{}}catch(_){return {}}}
function save(change){
 try{
  const doc=read();
  change(doc);
  localStorage.setItem(JOURNAL,JSON.stringify(doc));
  document.dispatchEvent(new CustomEvent('noux:local-change',{detail:{source:'choices-guide'}}));
  return true;
 }catch(_){STATUS='Your browser could not save this review. The itinerary has not changed.';return false}
}
function decisions(){
 const data=window.NYC_DATA;
 return (Array.isArray(data?.CHOICES)?data.CHOICES:[])
 .filter(c=>c&&typeof c.id==='string'&&Array.isArray(c.options))
 .sort((a,b)=>(ORDER[a.day]??9)-(ORDER[b.day]??9)||cId(a).localeCompare(cId(b)));
}
function cId(c){return String(c.id||'')}
function chosen(){
 const out={...window.NYC_DATA?.DEFAULT};
 try{
  const keys=Object.keys(localStorage).filter(k=>/^nyc_lyna_trip_v\d+$/.test(k))
   .sort((a,b)=>Number(b.split('_v').pop())-Number(a.split('_v').pop()));
  const state=keys.length?JSON.parse(localStorage.getItem(keys[0])||'{}'):{};
  if(state?.choices&&typeof state.choices==='object')Object.assign(out,state.choices);
 }catch(_){}
 return out;
}
function progress(){
 const j=read();
 return j.nouxPassport?.[WHO]||{reviewed:{},deferred:{}};
}
function stamp(id,mode){
 save(j=>{
  j.nouxPassport??={};
  const p=j.nouxPassport[WHO]??={reviewed:{},deferred:{}};
  p.reviewed??={};p.deferred??={};
  if(mode==='reviewed'){p.reviewed[id]=Date.now();delete p.deferred[id]}
  else{p.deferred[id]=Date.now();delete p.reviewed[id]}
 });
}
function nativeChoice(choice,option){
 // Opening the real Decisions UI avoids writing a second state structure.
 const nav=Array.from(document.querySelectorAll('.topbar .mainnav button'))
  .find(x=>/decisions/i.test(x.textContent||''));
 if(!nav){STATUS='The original Decisions tab is unavailable; no choice was changed.';render();return}
 nav.click();
 close();
 setTimeout(()=>{
  const node=document.getElementById('decision-'+choice.id);
  const names=Array.from(node?.querySelectorAll('.choice-row')||[]);
  const norm=x=>String(x||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const label=norm(option[1]||option[0]);
  const match=names.find(x=>norm(x.textContent).startsWith(label))||
    names.find(x=>norm(x.textContent).includes(label));
  if(!match)return;
  match.click();
  stamp('choice:'+choice.id,'reviewed');
  INDEX=Math.min(decisions().length-1,INDEX+1);
  node?.scrollIntoView?.({behavior:'smooth',block:'center'});
 },150);
}
function render(){
 if(!ROOT||!OPEN)return;
 const d=decisions(),p=progress(),index=Math.min(INDEX,Math.max(0,d.length-1));
 const box=ROOT.querySelector('.noux-guide-content');if(!box)return;
 const head=el('div','noux-guide-head'),title=el('div');
 title.append(el('small','noux-guide-eyebrow','NOUX · YOUR DECISIONS'),el('h2',null,'Choose your New York'));
 title.append(el('p',null,'A short guided look at the real choices. No extra tabs or duplicate plans.'));
 head.append(title,button('× Close',close,'noux-guide-secondary'));
 const controls=el('div','noux-guide-top');
 const who=el('select','noux-guide-select');
 ['Lyna','Benjamin'].forEach(k=>{const op=el('option',null,k);op.value=k;who.append(op)});
 who.value=WHO;who.setAttribute('aria-label','Person reviewing choices');who.addEventListener('change',()=>{WHO=who.value;INDEX=0;render()});
 controls.append(el('strong',null,'Reviewing as'),who);
 const done=d.filter(x=>p.reviewed?.['choice:'+x.id]).length;
 const progressBar=el('div','noux-guide-progress'),bar=el('span');bar.style.width=d.length?Math.round(100*done/d.length)+'%':'0%';progressBar.append(bar);
 const body=el('div','noux-guide-body');
 if(!d.length){body.append(el('p',null,'Open Decisions to explore the trip. No private choices were found in this session.'))}
 else {
  const c=d[index],selected=chosen()[c.id]||'';
  body.append(el('p','noux-guide-counter','CHOICE '+(index+1)+' OF '+d.length+' · '+done+' REVIEWED'));
  body.append(el('h3',null,c.title||'Your next decision'));
  body.append(el('p','noux-guide-description',c.desc||'Select what matters most to you. You can always change it later.'));
  const options=el('div','noux-guide-options');
  for(const opt of c.options){
   if(!Array.isArray(opt))continue;
   const row=el('div','noux-guide-option'),copy=el('div');
   copy.append(el('strong',null,opt[1]||opt[0]));
   if(opt[2])copy.append(el('small',null,opt[2]));
   if(selected===opt[0])copy.append(el('em',null,'Currently selected'));
   row.append(copy,button('Choose',()=>nativeChoice(c,opt),'noux-guide-primary'));options.append(row);
  }
  body.append(options);
  const status=p.reviewed?.['choice:'+c.id]?'Reviewed':p.deferred?.['choice:'+c.id]?'Postponed':'Not reviewed';
  body.append(el('p','noux-guide-hint',status+' · Choosing uses the original Decisions card, not a second saved answer.'));
  const actions=el('div','noux-guide-actions');
  actions.append(button('Previous',()=>{INDEX=Math.max(0,index-1);render()},'noux-guide-secondary'));
  actions.append(button('Decide later',()=>{stamp('choice:'+c.id,'deferred');INDEX=Math.min(d.length-1,index+1);render()},'noux-guide-secondary'));
  actions.append(button('Reviewed',()=>{stamp('choice:'+c.id,'reviewed');INDEX=Math.min(d.length-1,index+1);render()},'noux-guide-primary'));
  if(index<d.length-1)actions.append(button('Next',()=>{INDEX=index+1;render()},'noux-guide-secondary'));
  body.append(actions);
  const pending=d.filter(x=>p.deferred?.['choice:'+x.id]);
  if(pending.length){
   const group=el('div','noux-guide-pending');
   group.append(el('strong',null,'Still to decide · '+pending.length));
   pending.forEach(c=>group.append(button(c.title||c.id,()=>{INDEX=d.findIndex(x=>x.id===c.id);render()},'noux-guide-chip')));
   body.append(group);
  }
 }
 if(STATUS)body.append(el('p','noux-guide-hint',STATUS));
 box.replaceChildren(head,controls,progressBar,body);
}
function open(){
 if(!READY)return false;
 ROOT.hidden=false;OPEN=true;document.body.classList.add('noux-guide-open');render();
 ROOT.querySelector('.noux-guide-secondary')?.focus();
 return true;
}
function close(){OPEN=false;if(ROOT)ROOT.hidden=true;document.body.classList.remove('noux-guide-open')}
function install(){
 if(READY)return true;
 if(!window.NYC_DATA||!Array.isArray(window.NYC_DATA.CHOICES))return false;
 ROOT=el('section','noux-guide-modal');ROOT.id='noux-decision-guide';ROOT.hidden=true;
 ROOT.setAttribute('role','dialog');ROOT.setAttribute('aria-modal','true');ROOT.setAttribute('aria-label','Guided itinerary decisions');
 ROOT.append(el('div','noux-guide-content'));document.body.append(ROOT);
 document.addEventListener('keydown',e=>{if(OPEN&&e.key==='Escape')close()});
 READY=true;return true;
}
window.NOUX_DECISION_GUIDE={install,open,decisions,version:'2026.11.21-slim1'};
})();