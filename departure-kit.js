/* NOUX private departure checklist. UI is public; owner responses stay encrypted
   using the existing locally-derived itinerary key after successful unlock.
   No passphrase, itinerary payload or browser state is sent to a server. */
(function(){
'use strict';
if(window.NOUX_DEPARTURE)return;
const STORAGE='noux_departure_checklists_aes_v1';
const AAD=new TextEncoder().encode('NOUX-DEPARTURE-CHECKLIST-V1');
const PACK=[
 ['documents','Documents','Passport, ESTA and entry papers','both','Use the same passport as the ESTA; keep travel documents accessible'],
 ['boarding','Documents','Flight booking and boarding pass','both','Airline check-in and terminal details, ideally available offline'],
 ['insurance','Documents','Travel insurance and emergency contacts','both','Save confirmation and important telephone numbers offline'],
 ['wallet','Documents','Payment cards, cash and identification','both','Keep a second payment method separately'],
 ['phone','Electronics','Phone and charging cable','both','Charge before leaving; check roaming settings'],
 ['powerbank','Electronics','Power bank and earbuds','both','Carry lithium batteries in cabin baggage'],
 ['usb','Electronics','USB-C, USB-A and charging adapters','both','Collect all US adapters and power-delivery cables'],
 ['laptop','Electronics','Laptop or tablet and charger','both','If brought, take out of hotel room and charge ahead'],
 ['medication','Essentials','Prescription medicines and essentials','both','Keep essential medicines in hand luggage'],
 ['weather','Essentials','Warm layers, comfortable shoes and coat','both','Cold New York mornings and evening rooftops'],
 ['toiletries','Essentials','Toiletries and liquids packed properly','both','Cabin liquid rules apply; put large containers in checked luggage'],
 ['special','Essentials','Personal washbag and accessories','both','Hairbrush, glasses, grooming items, jewellery and cosmetics'],
 ['evening','Clothing','Dinner/club outfit and outerwear','both','Do not leave night-out clothing in the wardrobe'],
 ['wash','Clothing','All clothing, socks, sleepwear and laundry','both','Check closet, drawers and laundry bag'],
 ['purchases','Final hotel sweep','All NYC souvenirs and gifts packed','both','Check souvenirs list and weigh bags'],
 ['safe','Final hotel sweep','Room safe, bedside drawers, bathroom and sockets','both','Search each storage space and behind power outlets'],
 ['bags','Final hotel sweep','Hotel luggage storage claim / bag tags','both','Collect every bag before the coach'],
 ['coach','Final hotel sweep','Meet group guide in hotel lobby before coach','both','Aim to be ready by 16:45 for the approximately 17:00 transfer']
].map(x=>({id:x[0],group:x[1],title:x[2],owner:x[3],note:x[4]}));
const SHOPS=[
 {id:'zabarscoffee',name:"Zabar's coffee beans or sealed coffee tin",category:'Food',day:'tue',dayText:'Tuesday 24 · Upper West Side',shop:"Zabar's",address:'2245 Broadway, New York, NY 10024, USA',url:'https://www.zabars.com/directions.html',note:'Buy when already near AMNH and Zabar’s breakfast. Choose unopened, shelf-stable products.'},
 {id:'zabarstote',name:"Zabar's NYC tote / classic deli keepsake",category:'Gifts',day:'tue',dayText:'Tuesday 24 · same Zabar’s stop',shop:"Zabar's",address:'2245 Broadway, New York, NY 10024, USA',url:'https://www.zabars.com/directions.html',note:'Same shop as coffee. No additional neighbourhood transfer.'},
 {id:'levainfresh',name:'Levain cookies or cookie tin for the journey home',category:'Food',day:'fri',dayText:'Friday 27 · close to hotel',shop:'Levain Bakery · The Nook at Marriott Marquis',address:'1535 Broadway, 8th Floor, New York, NY 10036, USA',url:'https://levainbakery.com/pages/the-nook-by-levain',note:'Current Levain pop-up lists cookies, cookie tin and tote. Marriott also confirms the 2026 residency; published daily closing hours differ (17:00 vs 19:00), so buy before 17:00.'},
 {id:'nypltote',name:'NYPL library-card tote, notebook or lion gift',category:'Gifts',day:'wed',dayText:'Wednesday 25 · library visit',shop:'The New York Public Library Shop',address:'476 Fifth Avenue, New York, NY 10018, USA',url:'https://shop.nypl.org/pages/visit-us',note:'Wednesday 25 is an EARLY CLOSURE. Buy during the planned morning library visit; store closed Thursday and Friday.'},
 {id:'momagift',name:'MoMA design object, postcard or small art gift',category:'Gifts',day:'wed',dayText:'Wednesday 25 · by MoMA',shop:'MoMA Design Store',address:'44 West 53rd Street, New York, NY 10019, USA',url:'https://store.moma.org/pages/stores',note:'Opposite MoMA. Best immediately around the museum visit; Friday Midtown fallback is also possible.'},
 {id:'traderjoes',name:"Trader Joe's seasoning, snacks or NYC tote",category:'Food',day:'tue',dayText:'Tuesday 24 · optional Chelsea detour',shop:"Trader Joe's · Chelsea",address:'675 Sixth Avenue, New York, NY 10010, USA',url:'https://locations.traderjoes.com/ny/new-york/543/',note:'Optional 15–25-minute detour from the Chelsea art route. Select sealed, shelf-stable foods; no meat or cheese for import to France.'},
 {id:'transit',name:'NYC subway-themed souvenir / MTA collectible',category:'Gifts',day:'fri',dayText:'Friday 27 · inside Grand Central',shop:'New York Transit Museum Gallery & Store',address:'89 East 42nd Street, Shuttle Passage, New York, NY 10017, USA',url:'https://shop.nytransitmuseum.org/pages/hours-locations',note:'Same terminal as your Friday Grand Central visit. Published Mon–Fri 10:00–19:30, closed Thanksgiving Day.'},
 {id:'holiday',name:'Local artisan gift or NYC Christmas ornament',category:'Gifts',day:'fri',dayText:'Friday 27 · Grand Central Holiday Fair',shop:'Grand Central Holiday Fair · Vanderbilt Hall',address:'89 East 42nd Street, New York, NY 10017, USA',url:'https://grandcentralterminal.com/event/2026-holiday-fair/',note:'2026 official fair is 9 Nov–24 Dec, Monday–Saturday 10:00–19:00, closed Thanksgiving. Jewellery, art prints and ornaments.'},
 {id:'book',name:'Special-edition book, Strand tote or printed NYC map',category:'Books & arts',day:'wed',dayText:'Wednesday 25 · optional NoHo / Union Square',shop:'Strand Bookstore',address:'828 Broadway, New York, NY 10003, USA',url:'https://www.strandbooks.com/',note:'Only add if the selected Wednesday route passes nearby. Do not cross Manhattan solely for a tote.'},
 {id:'candy',name:'Personalised M&M’s / sweets for family',category:'Food',day:'fri',dayText:'Friday 27 · next to Times Square',shop:"M&M'S New York",address:'1600 Broadway, New York, NY 10019, USA',url:'https://www.mms.com/en-us/explore/mms-stores/new-york',note:'Near the hotel area and easy to combine with the final luggage return. Keep sealed for travel.'},
 {id:'photo',name:'A postcard or small print of the NYC skyline',category:'Gifts',day:'fri',dayText:'Friday 27 · Grand Central souvenir shops',shop:'Grand Central Gift Shop',address:'89 East 42nd Street, New York, NY 10017, USA',url:'https://grandcentralterminal.com/',note:'Small, luggage-friendly keepsake. Buy in the existing Grand Central shopping window.'},
 {id:'vinyl',name:'A distinctive NYC vinyl record or music keepsake',category:'Books & arts',day:'fri',dayText:'Friday 27 · Rockefeller / Midtown option',shop:'Rough Trade Below',address:'30 Rockefeller Plaza, New York, NY 10112, USA',url:'https://www.roughtrade.com/en-us/stores/below',note:'Only if this matches the chosen Friday Midtown route; avoid a separate long detour.'}
];
const PEOPLE=['Benjamin','Lyna'];
let KEY=null,STATE=null,SAVING=Promise.resolve(),OPEN=false,SECTION='packing',FILTER='all',EDIT=null,ROOT=null,MOUNTED=false,NOTE='',NAVOBS=null,LAUNCHER=null;
const el=(tag,cls,text)=>{const v=document.createElement(tag);if(cls)v.className=cls;if(text!==undefined)v.textContent=String(text);return v};
const btn=(title,fn,cls)=>{const x=el('button',cls||'',title);x.type='button';x.addEventListener('click',fn);return x};
const B64=x=>btoa(String.fromCharCode.apply(null,Array.from(x)));
const FROM=s=>Uint8Array.from(atob(s),x=>x.charCodeAt(0));
const blank=()=>({version:1,check:{},items:SHOPS.map(x=>Object.assign({bought:false,packed:false,recipient:'',custom:false},x)),updatedAt:null});
function normalise(v){
 const result=v&&typeof v==='object'&& !Array.isArray(v)?v:blank();
 if(!result.check||typeof result.check!=='object'||Array.isArray(result.check))result.check={};
 if(!Array.isArray(result.items))result.items=[];
 const ids=new Set(result.items.map(x=>x&&x.id).filter(Boolean));
 SHOPS.forEach(x=>{if(!ids.has(x.id))result.items.push(Object.assign({bought:false,packed:false,recipient:'',custom:false},x))});
 result.items=result.items.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string').slice(0,300);
 result.version=1;
 return result;
}
async function decodeBox(raw){
 const x=typeof raw==='string'?JSON.parse(raw):raw;
 if(!x||x.format!=='noux-checklist-aes-v1'||typeof x.ct!=='string'||typeof x.iv!=='string')throw Error('Not a valid encrypted NOUX checklist');
 const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:FROM(x.iv),additionalData:AAD},KEY,FROM(x.ct));
 return normalise(JSON.parse(new TextDecoder().decode(plain)));
}
function save(){
 if(!STATE||!KEY)return Promise.resolve();
 STATE.updatedAt=new Date().toISOString();
 try{document.dispatchEvent(new CustomEvent('noux:local-change',{detail:{source:'departure'}}))}catch(_){}
 const snapshot=JSON.stringify(STATE);
 SAVING=SAVING.catch(()=>{}).then(async()=>{
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:AAD},KEY,new TextEncoder().encode(snapshot));
  localStorage.setItem(STORAGE,JSON.stringify({format:'noux-checklist-aes-v1',iv:B64(iv),ct:B64(new Uint8Array(ct))}));
  NOTE='Saved encrypted on this device · '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  updateNote();
 }).catch(err=>{NOTE='Could not save to this browser. Export a backup before leaving this page.';updateNote()});
 return SAVING;
}
function updateNote(){const x=ROOT&&ROOT.querySelector('.noux-departure-save-note');if(x)x.textContent=NOTE}
function checked(key,value){STATE.check[key]=Boolean(value);void save();render()}
function checkbox(value,onChange,description){
 const w=el('label','noux-departure-check'),input=el('input');input.type='checkbox';input.checked=Boolean(value);
 input.setAttribute('aria-label',description);input.addEventListener('change',()=>onChange(input.checked));w.append(input,el('span',null,description));return w;
}
function option(v,values){const select=el('select');values.forEach(([key,title])=>{const o=el('option',null,title);o.value=key;if(v===key)o.selected=true;select.append(o)});return select}
function head(){
 const bar=el('div','noux-departure-head');
 const left=el('div');left.append(el('small','noux-departure-eyebrow','NOUX · PRIVATE COLLECTION'),el('h2',null,'Departure & bring home'),el('p',null,'Everything ready, nothing left behind.'));
 bar.append(left,btn('× Close',close,'noux-departure-close'));return bar;
}
function progressLabel(){
 const counts=PEOPLE.map(name=>{
  const relevant=PACK.filter(x=>x.owner==='both'||x.owner===name);
  const n=relevant.filter(x=>STATE.check[name+':'+x.id]).length;
  return name+' '+n+'/'+relevant.length;
 });
 const bought=STATE.items.filter(x=>x.bought).length, packed=STATE.items.filter(x=>x.packed).length;
 return counts.join(' · ')+' · Gifts bought '+bought+'/'+STATE.items.length+' · packed '+packed+'/'+STATE.items.length;
}
function topInfo(){
 const block=el('div','noux-departure-travel');
 block.append(el('strong',null,'FRIDAY · LAST DAY'),el('p',null,'Hotel breakfast 07:00–10:00 daily. Check out before 12:00; hotel stores luggage. Group coach around 17:00: be back and ready by 16:45. Airport: JFK Terminal 1. French-speaking guide assists at airport.'));
 const caution=el('p','noux-departure-caution','This is your group transfer, not a separately booked private car. Exact boarding details from the guide take precedence.');
 block.append(caution);
 // Flight identity and actual flight departure are taken only from the
 // decrypted itinerary. Never place personal booking references in public JS.
 try{
  const plan=window.NYC_PLAN,choices=(window.NYC_DATA&&window.NYC_DATA.DEFAULT)||{};
  const rows=plan&&typeof plan.day==='function'?plan.day('fri',choices):[];
  const flight=Array.isArray(rows)&&rows.find(x=>x.id==='flight'||(/flight|vol air france/i.test(String(x.title||''))&&x.kind==='flight'));
  if(flight){
   const text=[flight.start,flight.title].filter(Boolean).join(' · ');
   block.append(el('p','noux-departure-flight','Return flight from encrypted itinerary: '+text));
  }
 }catch(_){}
 return block;
}
function packingView(){
 const grid=el('div','noux-departure-packgrid');
 const legend=el('div','noux-departure-legend');
 legend.append(el('span',null,'Item'),el('span',null,'Benjamin'),el('span',null,'Lyna'));grid.append(legend);
 let last='';
 PACK.forEach(task=>{
  if(last!==task.group){grid.append(el('h3','noux-departure-group',task.group));last=task.group}
  const row=el('div','noux-departure-packrow');
  const info=el('div','noux-departure-pack-copy');info.append(el('b',null,task.title),el('small',null,task.note));row.append(info);
  PEOPLE.forEach(person=>{
   const cell=el('div','noux-departure-pack-check');
   if(task.owner==='both'||task.owner===person)cell.append(checkbox(STATE.check[person+':'+task.id],v=>checked(person+':'+task.id,v),person+' · '+task.title));
   else cell.append(el('span',null,'—'));
   row.append(cell);
  });
  grid.append(row);
 });
 const completed=el('p','noux-departure-save-note',NOTE);
 const controls=el('div','noux-departure-actions');
 controls.append(btn('Export encrypted backup',exportFile,'noux-departure-action'));
 const importBtn=btn('Import from another device',()=>document.getElementById('noux-departure-import').click(),'noux-departure-action');
 controls.append(importBtn);
 const note=el('p','noux-departure-fine','Ticks are independently saved for Benjamin and Lyna, encrypted with the itinerary passphrase. To move them to another device, export the encrypted file and import it there after unlocking this same itinerary. This is not automatic cloud sync.');
 return [grid,completed,controls,note];
}
function shopItem(row){
 const wrap=el('article','noux-departure-shop');
 const line=el('div','noux-departure-shop-top'),title=el('div');
 title.append(el('small','noux-departure-tag',row.category||'Custom'),el('h3',null,row.name));
 if(row.recipient)title.append(el('small',null,'For: '+row.recipient));
 line.append(title,el('span','noux-departure-day',row.dayText||'Flexible'));
 wrap.append(line);
 const info=el('p','noux-departure-shop-note',row.note||'Added during the trip.');wrap.append(info);
 if(row.shop)wrap.append(el('p','noux-departure-shop-address',row.shop+(row.address?' · '+row.address:'')));
 const actions=el('div','noux-departure-shop-actions');
 actions.append(checkbox(row.bought,v=>{row.bought=v;save();render()},'Bought'));
 actions.append(checkbox(row.packed,v=>{row.packed=v;save();render()},'Packed'));
 if(row.url&&/^https:\/\//i.test(row.url)){const site=el('a','noux-departure-link','Official shop');site.href=row.url;site.target='_blank';site.rel='noopener noreferrer';actions.append(site)}
 if(row.address){const link=el('a','noux-departure-link','Directions');link.href='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(row.address);link.target='_blank';link.rel='noopener noreferrer';actions.append(link)}
 actions.append(btn('Find shops live',()=>findLiveShops(row.name,row.day,row.shop),'noux-departure-tiny'));
 actions.append(btn('Edit',()=>{EDIT=row.id;render()},'noux-departure-tiny'));
 if(row.custom)actions.append(btn('Remove',()=>{STATE.items=STATE.items.filter(x=>x.id!==row.id);EDIT=null;save();render()},'noux-departure-tiny'));
 wrap.append(actions);return wrap;
}
function routeArea(day){
 const wanted=day||'fri';
 const areas={
  mon:'Times Square Midtown Manhattan New York',
  tue:'Chelsea or Upper West Side Manhattan New York',
  wed:'SoHo or Meatpacking Manhattan New York',
  thu:'Meatpacking or Chelsea Manhattan New York',
  fri:'Times Square or Grand Central Manhattan New York',
  any:'Midtown Manhattan New York'
 };
 return areas[wanted]||areas.any;
}
function recommendedDay(title,store){
 const t=String(title+' '+(store||'')).toLowerCase();
 if(/zabar|upper west|amnh|butterfl|coffee bean|bagel/.test(t))return 'tue';
 if(/nypl|public library|moma|museum|art print|book|strand|whitney|brooklyn|vintage|soho/.test(t))return 'wed';
 if(/chelsea|high line|trader joe|seasoning|spice|vinyl/.test(t))return 'tue';
 if(/le bain|meatpacking|rooftop/.test(t))return 'thu';
 return 'fri'; // Final shopping cluster is near the Midtown hotel.
}
function findLiveShops(item,day,shop){
 const title=String(item||'').trim();if(!title){NOTE='Enter the item you want to find first.';updateNote();return}
 const area=routeArea(day||recommendedDay(title,shop));
 const query=title+' '+(String(shop||'').trim()||'shop')+' near '+area;
 const url='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query);
 // This opens fresh Google Maps results and current publicly displayed opening
 // information on user click, not a stock guarantee or autonomous web search.
 const opened=window.open(url,'_blank','noopener,noreferrer');
 if(!opened){NOTE='Allow the shop search popup or open Google Maps separately.';updateNote()}
}
function makeForm(){
 const record=EDIT?STATE.items.find(x=>x.id===EDIT):null;
 const form=el('form','noux-departure-add');
 form.append(el('h3',null,record?'Edit an item':'Add an item on the fly'));
 const fields=el('div','noux-departure-add-fields');
 const name=el('input');name.placeholder='Item or gift (required)';name.required=true;name.maxLength=180;name.value=record?record.name:'';
 const recipient=el('input');recipient.placeholder='Recipient (optional)';recipient.maxLength=80;recipient.value=record?(record.recipient||''):'';
 const day=option(record?record.day:'any',[['any','Flexible day'],['mon','Monday 23'],['tue','Tuesday 24'],['wed','Wednesday 25'],['thu','Thursday 26'],['fri','Friday 27']]);
 const shop=el('input');shop.placeholder='Preferred shop (optional)';shop.maxLength=150;shop.value=record?(record.shop||''):'';
 const url=el('input');url.placeholder='Official shop URL (optional, https://)';url.maxLength=500;url.value=record?(record.url||''):'';
 fields.append(name,recipient,day,shop,url);form.append(fields);
 const discovery=el('div','noux-departure-add-discovery');
 discovery.append(btn('Suggest best day',()=>{
  const suggested=recommendedDay(name.value,shop.value);
  day.value=suggested;Array.from(day.children).forEach(opt=>opt.selected=opt.value===suggested);
  NOTE='Suggested '+(day.selectedOptions[0]?.textContent||suggested)+' based on the current itinerary. Check the actual shop before travelling.';updateNote();
 },'noux-departure-action'));
 discovery.append(btn('Find shops live',()=>findLiveShops(name.value,day.value,shop.value),'noux-departure-action'));
 discovery.append(el('small',null,'Live Google Maps shop search opens in a new tab. Recommendations are route-based, not verified inventory or reservations.'));
 form.append(discovery);
 const actions=el('div','noux-departure-actions');
 const submit=el('button','noux-departure-primary',record?'Save changes':'+ Add to souvenirs');submit.type='submit';actions.append(submit);
 if(record)actions.append(btn('Cancel',()=>{EDIT=null;render()},'noux-departure-action'));
 form.append(actions);
 form.addEventListener('submit',e=>{
  e.preventDefault();const title=name.value.trim();if(!title)return;
  const website=url.value.trim();if(website&&!/^https:\/\//i.test(website)){NOTE='Use an HTTPS link, or leave the URL empty.';updateNote();return}
  const formatted=day.selectedOptions[0]?.textContent||'Flexible day';
  if(record){Object.assign(record,{name:title,recipient:recipient.value.trim(),day:day.value,dayText:formatted,shop:shop.value.trim(),url:website})}
  else STATE.items.push({id:'custom-'+Date.now()+'-'+Math.floor(Math.random()*10000),name:title,category:'Personal addition',day:day.value,dayText:formatted,shop:shop.value.trim(),address:'',url:website,note:'Custom souvenir / item. Check shop hours before travelling.',recipient:recipient.value.trim(),bought:false,packed:false,custom:true});
  EDIT=null;save();render();
 });return form;
}
function souvenirsView(){
 const holder=el('div');
 const summary=el('p','noux-departure-help','Curated shop suggestions were checked against official listings. Suggested days match existing neighbourhood routes, not confirmed inventory. Always recheck holiday hours before travelling.');
 const chips=el('div','noux-departure-filter');
 [['all','All days'],['mon','Monday'],['tue','Tuesday'],['wed','Wednesday'],['thu','Thursday'],['fri','Friday'],['any','Flexible']].forEach(([id,title])=>chips.append(btn(title,()=>{FILTER=id;render()},'noux-departure-filter-btn'+(FILTER===id?' selected':''))));
 holder.append(summary,chips);
 const shown=STATE.items.filter(x=>FILTER==='all'||x.day===FILTER);
 const cards=el('div','noux-departure-shopgrid');
 if(!shown.length)cards.append(el('p',null,'No items for this day. Add one below.'));
 shown.sort((a,b)=>Number(a.packed)-Number(b.packed)||Number(a.bought)-Number(b.bought)).forEach(r=>cards.append(shopItem(r)));
 holder.append(cards,makeForm());
 const rules=el('div','noux-departure-rules');
 rules.append(el('b',null,'France return: customs & food'));
 rules.append(el('p',null,'From the US, do not bring meat, charcuterie, cheese or other dairy. Choose sealed, shelf-stable snacks, coffee, sweets or permitted food products; check ingredient exceptions and customs requirements. Over the applicable tax-free allowance (€430 per adult travelling by air), declare the relevant purchases; one expensive item cannot use combined travellers’ allowances.'));
 const gov=el('a','noux-departure-link','Official French customs guidance');gov.href='https://www.douane.gouv.fr/actualites/voyage-letranger-quels-aliments-peut-transporter-dans-sa-valise';gov.target='_blank';gov.rel='noopener noreferrer';rules.append(gov);holder.append(rules);
 const controls=el('div','noux-departure-actions');controls.append(btn('Export encrypted checklist',exportFile,'noux-departure-action'),btn('Import a checklist',()=>document.getElementById('noux-departure-import').click(),'noux-departure-action'));holder.append(controls,el('p','noux-departure-save-note',NOTE));
 return [holder];
}
function render(){
 if(!ROOT||!STATE)return;
 const scroll=ROOT.querySelector('.noux-departure-scroll');
 if(!scroll)return;
 const headRow=head(),hero=topInfo(),status=el('p','noux-departure-progress',progressLabel());
 const nav=el('div','noux-departure-sections');
 nav.append(btn('Departure checklist',()=>{SECTION='packing';render()},SECTION==='packing'?'chosen':''));
 nav.append(btn('Bring home from NYC',()=>{SECTION='souvenirs';render()},SECTION==='souvenirs'?'chosen':''));
 scroll.replaceChildren(headRow,hero,status,nav,...(SECTION==='packing'?packingView():souvenirsView()));
}
function open(){
 if(!STATE)return;
 OPEN=true;ROOT.hidden=false;document.body.classList.add('noux-departure-open');render();
 const closeButton=ROOT.querySelector('.noux-departure-close');if(closeButton)closeButton.focus();
}
function close(){OPEN=false;if(ROOT)ROOT.hidden=true;document.body.classList.remove('noux-departure-open')}
function mount(){
 if(MOUNTED)return;
 ROOT=el('section','noux-departure-modal');ROOT.id='noux-departure-modal';ROOT.setAttribute('role','dialog');ROOT.setAttribute('aria-modal','true');ROOT.setAttribute('aria-label','Departure and bring-home checklists');ROOT.hidden=true;
 const scroll=el('div','noux-departure-scroll');ROOT.append(scroll);document.body.append(ROOT);
 const file=el('input');file.type='file';file.id='noux-departure-import';file.accept='.json,application/json';file.hidden=true;
 file.addEventListener('change',async()=>{
  const upload=file.files&&file.files[0];if(!upload)return;
  try{
   if(upload.size>2e6)throw Error('File too large for a checklist');
   const imported=await decodeBox(await upload.text());
   STATE=normalise(imported);await save();NOTE='Encrypted checklist imported successfully';render();
  }catch(err){NOTE='Import rejected: wrong passphrase, corrupted file or invalid format.';render()}
  file.value='';
 });
 document.body.append(file);
 // Packing & gifts is reachable from Trip Settings; no permanent floating control.
 // Render the launcher outside React's managed #root subtree. Modifying
 // .mainnav directly can break React reconciliation during its first update.
 // The launcher remains visible on both desktop and mobile.
 document.addEventListener('keydown',e=>{if(OPEN&&e.key==='Escape')close()});
 MOUNTED=true;
}
async function exportFile(){
 try{
  await SAVING;
  if(!localStorage.getItem(STORAGE))await save();
  const bytes=localStorage.getItem(STORAGE);
  if(!bytes)throw Error('No saved checklist yet');
  const blob=new Blob([bytes],{type:'application/json'}),url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='noux-departure-checklists.encrypted.json';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  NOTE='Encrypted file exported; transfer it privately to your other device.';updateNote();
 }catch(err){NOTE='Unable to export; check browser download permissions.';updateNote()}
}
async function getSharedSnapshot(){
 if(!STATE||!KEY)return null;
 await SAVING;
 return JSON.parse(JSON.stringify(STATE));
}
async function applySharedSnapshot(remote){
 if(!STATE||!KEY||!remote||typeof remote!=='object')return false;
 const candidate=normalise(JSON.parse(JSON.stringify(remote)));
 if(JSON.stringify(candidate)===JSON.stringify(STATE))return true;
 STATE=candidate;
 await save();
 if(OPEN)render();
 return true;
}
async function install(options){
 if(MOUNTED)return true;
 if(!options||!options.key||!crypto||!crypto.subtle)return false;
 KEY=options.key;
 try{
  const stored=localStorage.getItem(STORAGE);
  STATE=stored?await decodeBox(stored):blank();
  STATE=normalise(STATE);
  if(!stored)await save();
 }catch(err){
  // Never overwrite a ciphertext that we cannot decrypt, even if it was saved
  // by an earlier device or with a different key.
  KEY=null;STATE=null;return false;
 }
 mount();
 return true;
}
window.NOUX_DEPARTURE={install,open,close,whenSaved:()=>SAVING,getSharedSnapshot,applySharedSnapshot,version:'2026.11.21-settings'};
})();