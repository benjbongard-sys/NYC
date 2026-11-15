/* NOUX Venue Resolver
 * Published code contains public venue facts only. It reads private stops AFTER
 * client-side decryption. Never publishes trip selections, bookings or passphrase.
 */
(()=>{
'use strict';
if(window.NOUX_VENUES)return;
const V={
 langans:{name:"Langan's · Irish-American dinner",area:"Theater District",address:"114 W 47th St, New York, NY 10036, USA",lat:40.7592,lng:-73.9825,kind:"restaurant",url:"https://www.langansnyc.com/location/langans/"},
 tacos43:{name:"Los Tacos No. 1 · Times Square",area:"Times Square",address:"229 W 43rd St, New York, NY 10036, USA",lat:40.7573,lng:-73.9872,kind:"restaurant",url:"https://www.lostacos1.com/location/los-tacos-times-square/"},
 tacosChelsea:{name:"Los Tacos No. 1 · Chelsea Market",area:"Chelsea",address:"75 9th Ave, New York, NY 10011, USA",lat:40.7423,lng:-74.0061,kind:"restaurant",url:"https://www.lostacos1.com/locations/"},
 hudsonplaza:{name:"Hudson Yards Public Square · Vessel exterior",area:"Hudson Yards",address:"20 Hudson Yards, New York, NY 10001, USA",lat:40.7544,lng:-74.0006,kind:"sight",url:"https://www.hudsonyardsnewyork.com/"},
 breads:{name:"Breads Bakery · Rockefeller Center",area:"Rockefeller Center",address:"1230 6th Ave, New York, NY 10020, USA",lat:40.7590,lng:-73.9804,kind:"bakery",url:"https://restaurants.breadsbakery.com/en/bakery/new-york/"},
 dailyuws:{name:"Daily Provisions · Upper West Side",area:"Upper West Side",address:"375 Amsterdam Ave, New York, NY 10024, USA",lat:40.7836,lng:-73.9792,kind:"restaurant",url:"https://www.dailyprovisions.co/location/daily-provisions-upper-west-side/"},
 santmadison:{name:"Sant Ambroeus Madison",area:"Upper East Side",address:"1000 Madison Ave, New York, NY 10075, USA",lat:40.7745,lng:-73.9642,kind:"restaurant",url:"https://www.santambroeus.com/pages/locations"},
 culture38:{name:"Culture Espresso · Bryant Park",area:"Garment District",address:"72 W 38th St, New York, NY 10018, USA",lat:40.7509,lng:-73.9857,kind:"cafe",url:"https://www.cultureespresso.com/"},
 ceccDumbo:{name:"Cecconi's DUMBO",area:"DUMBO",address:"55 Water St, Brooklyn, NY 11201, USA",lat:40.7037,lng:-73.9886,kind:"restaurant",url:"https://www.cecconisrestaurants.com/dumbo/"},
 ciSiamo:{name:"Ci Siamo · Thanksgiving",area:"Manhattan West",address:"440 W 33rd St, New York, NY 10001, USA",lat:40.7529,lng:-74.0019,kind:"restaurant",url:"https://www.cisiamo.com/menus/"},
 kru:{name:"KRU · Thai Thanksgiving",area:"North Williamsburg",address:"190 N 14th St, Brooklyn, NY 11249, USA",lat:40.7229,lng:-73.9585,kind:"restaurant",url:"https://www.krubrooklyn.com/"},
 smithnomad:{name:"The Smith NoMad · Thanksgiving",area:"NoMad",address:"1150 Broadway, New York, NY 10001, USA",lat:40.7443,lng:-73.9890,kind:"restaurant",url:"https://thesmithrestaurant.com/location/nomad/"},
 manhatta:{name:"Manhatta · 60th-floor Thanksgiving",area:"Financial District",address:"28 Liberty St, New York, NY 10005, USA",lat:40.7070,lng:-74.0093,kind:"restaurant",url:"https://www.manhattarestaurant.com/"},
 thenines:{name:"The Nines · piano, cocktails & supper",area:"NoHo",address:"9 Great Jones St, New York, NY 10012, USA",lat:40.7265,lng:-73.9925,kind:"restaurant",url:"https://www.ninesnyc.com/"},
 washSq:{name:"Washington Square Park",area:"Greenwich Village",address:"Washington Square Park, New York, NY 10012, USA",lat:40.7308,lng:-73.9973,kind:"park",url:"https://www.nycgovparks.org/parks/washington-square-park"},
 madSq:{name:"Madison Square Park",area:"Flatiron",address:"Madison Square Park, New York, NY 10010, USA",lat:40.7424,lng:-73.9876,kind:"park",url:"https://madisonsquarepark.org/"},
 eataly:{name:"Eataly NYC Flatiron",area:"Flatiron",address:"200 5th Ave, New York, NY 10010, USA",lat:40.7416,lng:-73.9896,kind:"restaurant",url:"https://www.eataly.com/us_en/stores/nyc-flatiron"},
 bryantwinter:{name:"Bryant Park Winter Village · festive lights",area:"Midtown",address:"Bryant Park, New York, NY 10018, USA",lat:40.7536,lng:-73.9832,kind:"park",url:"https://bryantpark.org/activities/bank-of-america-winter-village-at-bryant-park"},
 stpatrick:{name:"St. Patrick's Cathedral",area:"Midtown",address:"5th Ave and E 50th St, New York, NY 10022, USA",lat:40.7584,lng:-73.9755,kind:"sight",url:"https://saintpatrickscathedral.org/"},
 brooklynpark:{name:"Brooklyn Bridge Park · Pier 1 promenade",area:"DUMBO",address:"Brooklyn Bridge Park Pier 1, Brooklyn, NY 11201, USA",lat:40.7018,lng:-73.9963,kind:"park",url:"https://brooklynbridgepark.org/"},
 bkheights:{name:"Brooklyn Heights Promenade",area:"Brooklyn Heights",address:"Montague St and Pierrepont Pl, Brooklyn, NY 11201, USA",lat:40.6969,lng:-73.9967,kind:"park",url:"https://www.nycgovparks.org/parks/brooklyn-heights-promenade"},
 meatpacking:{name:"Gansevoort Plaza · Meatpacking District",area:"Meatpacking",address:"Gansevoort St and 9th Ave, New York, NY 10014, USA",lat:40.7399,lng:-74.0052,kind:"sight",url:"https://www.meatpacking-district.com/"},
 zwirner:{name:"David Zwirner · Yoshitomo Nara exhibition",area:"Chelsea",address:"537 W 20th St, New York, NY 10011, USA",lat:40.7468,lng:-74.0062,kind:"gallery",url:"https://www.davidzwirner.com/exhibitions/2026/yoshitomo-nara"},
 pace:{name:"Pace Gallery · Li Hei Di / Lucas Samaras",area:"Chelsea",address:"540 W 25th St, New York, NY 10001, USA",lat:40.7492,lng:-74.0056,kind:"gallery",url:"https://www.pacegallery.com/galleries/new-york/"},
 gramercy:{name:"Gramercy Tavern · Thanksgiving",area:"Flatiron",address:"42 E 20th St, New York, NY 10003, USA",lat:40.7390,lng:-73.9889,kind:"restaurant",url:"https://www.gramercytavern.com/"},
 pier57roof:{name:"Pier 57 Rooftop Park",area:"Meatpacking / Chelsea",address:"25 11th Ave, New York, NY 10011, USA",lat:40.7430,lng:-74.0104,kind:"park",url:"https://pier57nyc.com/rooftop/"},
 littleisland:{name:"Little Island · Pier 55",area:"Meatpacking",address:"Pier 55, Hudson River Park, New York, NY 10014, USA",lat:40.7413,lng:-74.0103,kind:"park",url:"https://littleisland.org/rules-faq/"},
 oysterbar:{name:"Grand Central Oyster Bar",area:"Grand Central",address:"89 E 42nd St, Lower Level, New York, NY 10017, USA",lat:40.7527,lng:-73.9772,kind:"restaurant",url:"https://www.oysterbarny.com/"},
 maisonpremiere:{name:"Maison Premiere · oysters & cocktails",area:"Williamsburg",address:"298 Bedford Ave, Brooklyn, NY 11249, USA",lat:40.7139,lng:-73.9612,kind:"restaurant",url:"https://maisonpremiere.com/"},
 joespizza:{name:"Joe's Pizza · Carmine Street",area:"Greenwich Village",address:"7 Carmine St, New York, NY 10014, USA",lat:40.7301,lng:-74.0023,kind:"restaurant",url:"https://www.joespizzanyc.com/"}
};
const m=t=>{const a=String(t||'').split(':').map(Number);return a.length===2&&a.every(Number.isFinite)?a[0]*60+a[1]:NaN};
function end(e){let a=m(e.start),b=m(e.end);return b<a?b+1440:b}
function clone(e){return Object.assign({},e)}
const fixed=e=>['booked','arranged','confirmed'].includes(String(e.status||'').toLowerCase())||
 /cruise|flight|airport|pickup|transfer|boarding|luggage|macy's thanksgiving day parade/i.test(e.title||'')&&['travel','logistics','highlight'].includes(e.kind);
function assign(e,place,title,detail,kind,status){
 if(fixed(e)&&!['breakfast'].includes(e.id))return e;
 let o=Object.assign({},e,{place,title,detail});
 if(kind)o.kind=kind;
 if(status)o.status=status;
 return o;
}
function restyleOptions(D){
 const labels={
 c1:{rest:["Langan's dinner + Bryant Park by night","114 W 47th St · dinner near the hotel, then a named outdoor experience"],stcloud:["Langan's dinner → St. Cloud rooftop","Dinner at 114 W 47th followed by a Midtown skyline toast"],nubeluz:["Langan's dinner → Nubeluz cocktails","Named first-night dinner, then the NoMad skyline lounge"]},
 c2:{rest:["The Nines · supper-club piano and cocktails","9 Great Jones St · intimate live-music alternative, not an empty night"]},
 c3:{rest:["Westlight · skyline cocktails","111 N 12th St, Brooklyn · no hotel-only evening"]},
 c4:{rest:["Thanksgiving dining → Bryant Park Winter Village","Named holiday restaurant and Midtown evening lights"]},
 c5:{rest:["Brooklyn Bridge Park + Brooklyn Heights","DUMBO waterfront and promenade, not free time"],highline:["High Line + Chelsea Market + Edge","Named lunch stop at Chelsea Market; holiday opening must be checked"],mercer:["Mercer Labs → Cecconi's DUMBO → waterfront","Lunch at 55 Water St; holiday booking still required"]},
 c7:{standard:["Named Thanksgiving dinner near our evening venue","Ci Siamo $155 / KRU $55 / The Smith $88 depending on chosen night"],river:["The River Café · Thanksgiving $255 pp","1 Water St, Brooklyn · dress code, 1–8pm service; table not booked"]},
 c8:{rest:["St. Patrick's Cathedral & Fifth Avenue","A real Midtown walk before returning for the JFK transfer"]}
 };
 for(const card of D.CHOICES||[]){
  const options=labels[card.id];
  if(!options)continue;
  card.options=card.options.map(row=>{let x=options[row[0]];return x?[row[0],x[0],x[1]]:row});
  if(card.id==='c1')card.desc="The first evening has an actual dinner reservation target: Langan's, beside the hotel. No unspecified 'slow night'.";
  if(card.id==='c5')card.desc="Choose a fully mapped daytime circuit. Thursday holiday opening is not the same as regular opening.";
  if(card.id==='c7')card.desc="Thanksgiving menus are published for these venues, but a booking is not confirmed.";
  if(card.id==='c8')card.desc="See specific nearby sights before the provisional airport collection time.";
 }
}
function gapFree(evs,start,finish){
 return evs.every(e=>{const a=m(e.start),b=end(e);return !(start<b&&finish>a)});
}
function optional(evs,id,start,endTime,place,title,detail,kind='walk',status='proposed'){
 const a=m(start),b=m(endTime);
 if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a||!gapFree(evs,a,b)||evs.some(e=>e.id===id))return false;
 evs.push({id,start,end:endTime,title,place,detail,kind,status});return true;
}
function resolve(day,events,selections,D){
 const c=Object.assign({},D.DEFAULT||{},selections||{});
 let p=events.map(clone);
 p=p.map(e=>{
  const id=e.id||'',text=String(e.title||'').toLowerCase();
  if(day==='mon'){
   if(id==='lunch'||/quick lunch near hotel/.test(text))return assign(e,'tacos43',"Los Tacos No. 1 · Midtown taco lunch","229 W 43rd St; quick standing-counter tacos. Published Monday opening 11am–midnight. Watch the cruise boarding deadline.",'food','proposed');
   if(id==='dinner'||/first new york dinner/.test(text))return assign(e,'langans',"Langan's · first New York dinner","114 W 47th St, beside the hotel. Irish-American brasserie; Monday kitchen until 10pm. Table not yet reserved.",'food','unverified');
   if(id==='reset')return Object.assign(assign(e,'hudsonplaza','Hudson Yards Public Square · Vessel exterior','Walk and exterior photos after the cruise; do not return to the hotel. Exact transfer depends on the confirmed cruise pier.','walk','proposed'),{start:'18:05',end:'18:48'});
   if(id==='sleep')return assign(e,'bryantwinter','Bryant Park Winter Village · lights and rink','Outdoor winter village and illuminated rink; holiday stalls may already be closing. No hotel rest stop.','walk','proposed');
   if(id==='drinks'&&c.c1==='nubeluz')return Object.assign({},e,{start:'21:05',end:'22:15'});
   if(id.startsWith('explore_walk_'))return assign(e,'hudsonplaza','Hudson Yards Plaza · Vessel exterior','A specific West Side stop following the boat cruise. No timed entry or inside-Vessel ticket assumed.','walk','proposed');
  }
  if(day==='tue'){
   if(id==='breakfast')return Object.assign(assign(e,'breads','Breads Bakery · Rockefeller Center breakfast','1230 Sixth Avenue. Grab coffee and babka before the museum circuit; leave time for the subway.','food','proposed'),{end:'09:25'});
   if(id==='lunch'){
    const type=c.c6;
    if(type==='chelsea')return assign(e,'tacosChelsea','Los Tacos No. 1 · Chelsea Market','75 Ninth Avenue. A named counter-service lunch inside Chelsea Market.','food','proposed');
    if(type==='guggenheim')return assign(e,'santmadison','Sant Ambroeus Madison · Italian lunch','1000 Madison Ave, between Guggenheim and Albertine. Dining table not reserved.','food','unverified');
    return assign(e,'dailyuws','Daily Provisions · Upper West Side lunch','375 Amsterdam Avenue at West 78th, a short walk from the AMNH; sandwiches, bakery and quick lunch.','food','proposed');
   }
   if(id==='museum'&&c.c6==='chelsea')return Object.assign(assign(e,'zwirner','David Zwirner · Yoshitomo Nara','537 W 20th St: Yoshitomo Nara exhibition, 5 Nov–12 Dec 2026. Tuesday opening 10am–6pm.','art','proposed'),{start:'10:30',end:'11:20'});
   if(id==='park'&&c.c6==='chelsea'&&/high line/.test(text))return assign(e,'highline','High Line · Chelsea gallery walk','Specific elevated-park segment from Chelsea Market towards W 20th St; weather permitting.','walk','proposed');
   if(id==='reset'){
    if(c.c2==='agency')return Object.assign(assign(e,'oysterbar','Grand Central Oyster Bar · pre-vinyl oysters','Lower level, 89 E 42nd St. An iconic New York raw bar before Agency of Record; reserve or use counter.','food','unverified'),{start:'16:50',end:'17:55'});
    if(c.c2==='jazzgallery')return Object.assign(assign(e,'eataly','Eataly Flatiron · aperitivo and early bite','200 Fifth Avenue; convenient before The Jazz Gallery in NoMad.','food','proposed'),{start:'17:00',end:'18:00'});
    return Object.assign(assign(e,'washSq','Washington Square Park · Village walk','The arch and Greenwich Village before a classic Joe’s Pizza slice and Blue Note. No hotel break.','walk','proposed'),{start:'16:10',end:'17:05'});
   }
   if(id==='music'&&c.c2==='rest')return assign(e,'thenines','The Nines · piano, cocktails and supper','9 Great Jones St in NoHo. Elegant live-music supper-club choice; programme and reservations require verification.','music','unverified');
   if(id.startsWith('explore_tue_joespizza')&&c.c2==='agency')return assign(e,'oysterbar','Grand Central Oyster Bar · before the vinyl set','89 E 42nd St, lower level; oysters close to Agency of Record. Reserve or use the raw-bar counter.','food','unverified');
   if(id.startsWith('explore_tue_joespizza')&&c.c2==='jazzgallery')return assign(e,'eataly','Eataly Flatiron · quick pre-jazz bite','200 Fifth Ave, near The Jazz Gallery; open on regular Tuesdays.','food','proposed');
   if(id.startsWith('explore_walk_'))return assign(e,'washSq','Washington Square Park · evening Village stroll','A named walk around Washington Square Arch, rather than unspecific city wandering.','walk','proposed');
  }
  if(day==='wed'){
   if(id==='late'||id==='breakfast')return assign(e,'culture38','Culture Espresso · coffee and cookies','72 W 38th St, then walk to the two libraries on Fifth Avenue. Weekday opening 7am–7pm.','food','proposed');
   if(id==='hotel'||/return .? dinner .? get ready/i.test(text))return Object.assign(assign(e,'maisonpremiere','Maison Premiere · oysters and cocktails','298 Bedford Ave, Williamsburg. A true oyster bar, not a return to the hotel. Table not booked.','food','unverified'),{start:'18:05',end:'19:20'});
   if(id==='night'&&c.c3==='rest')return Object.assign(assign(e,'westlight','Westlight · Manhattan skyline cocktails','111 N 12th St, Williamsburg. A panoramic drinks option, not a house DJ booking.','cocktail','hours-to-check'),{start:'21:40',end:'23:00'});
   if(id.startsWith('explore_walk_'))return assign(e,'domino','Domino Park · Williamsburg waterfront circuit','Follow the East River waterfront to see Manhattan from a different perspective.','walk','proposed');
  }
  if(day==='thu'){
   if(id==='slow'||id==='breakfast')return assign(e,'breads','Breads Bakery · coffee before exploring','1230 Sixth Avenue. If this slot conflicts with the early Thanksgiving parade, the parade takes priority.','food','proposed');
   if(id==='lunch'){
    if(c.c5==='mercer')return assign(e,'ceccDumbo',"Cecconi's DUMBO · waterfront lunch","55 Water St, Brooklyn. The restaurant is listed for Thanksgiving, but a table or special-menu availability is not confirmed.",'food','unverified');
    return assign(e,'tacosChelsea','Los Tacos No. 1 · Chelsea Market','75 Ninth Avenue. Quick named lunch. IMPORTANT: Thanksgiving operating hours are unconfirmed, so do not rely on this stop without checking.', 'food','hours-to-check');
   }
   if(id==='open')return assign(e,'brooklynpark','Brooklyn Bridge Park · Pier 1 skyline','Walk the public East River shoreline below Brooklyn Bridge. A planned visit, not free time.','walk','proposed');
   if(id==='chill')return assign(e,'bkheights','Brooklyn Heights Promenade','Walk the promenade for lower-Manhattan skyline views; no ticket needed.','walk','proposed');
   if(id==='reset'){
    if(c.c7==='river')return Object.assign(assign(e,'brooklynpark','Brooklyn Bridge Park · approach to River Café','Arrive in DUMBO and walk the Brooklyn Bridge shoreline before dinner. Travel from Manhattan must be allowed.','walk','proposed'),{start:'17:05',end:'17:45'});
    if(['westmorales','morales'].includes(c.c4))return Object.assign(assign(e,'westlight','Wythe Avenue · Williamsburg skyline circuit','Explore the block around the William Vale, then Westlight or Refuge. Allow transit time from Manhattan.','walk','proposed'),{start:'17:05',end:'18:05'});
    if(c.c4==='boogie')return Object.assign(assign(e,'madSq','Madison Square Park · Flatiron architecture','A short city walk before the early Thanksgiving table at The Smith.','walk','proposed'),{start:'16:15',end:'16:45'});
    return Object.assign(assign(e,'hudsonplaza','Hudson Yards Plaza · Vessel exterior','Explore the plaza and Manhattan West instead of travelling back to the hotel.','walk','proposed'),{start:'16:15',end:'17:35'});
   }
   if(id==='dinner'){
    if(c.c7==='river')return assign(e,'river','The River Café · Thanksgiving dinner','1 Water St, Brooklyn. Official Thanksgiving 2026 menu $255 per person, service 1–8pm. Jacket and collared shirt required for gentlemen; reservation NOT confirmed.','dinner','unverified');
    if(['westmorales','morales'].includes(c.c4))return Object.assign(assign(e,'kru','KRU · Thai Thanksgiving dinner','190 N 14th St, Williamsburg. Official special Thanksgiving menu $55 per person, dinner advertised 5:30–9:30pm. Reserve a table; allow travel to Refuge.','dinner','unverified'),{start:c.c4==='westmorales'?'20:15':'19:00',end:c.c4==='westmorales'?'21:30':'20:30'});
    if(c.c4==='boogie')return Object.assign(assign(e,'smithnomad','The Smith NoMad · Thanksgiving dinner','1150 Broadway at 27th St. Thanksgiving three-course menu $88 per adult, 12–9pm; a table is not booked. Walk to 230 Fifth afterwards.','dinner','unverified'),{start:'17:30',end:'19:15'});
    if(c.c4==='rest')return Object.assign(assign(e,'manhatta','Manhatta · Thanksgiving with a skyline','60th floor, 28 Liberty St. Thanksgiving four-course menu $225 per person. Allow two hours; booking not confirmed.','dinner','unverified'),{start:'18:00',end:'20:00'});
    return Object.assign(assign(e,'ciSiamo','Ci Siamo · Thanksgiving dinner','440 W 33rd St, Manhattan West. Official Thanksgiving three-course menu $155 per person. No reservation confirmed.','dinner','unverified'),{start:'18:15',end:'20:00'});
   }
   if(id==='rooftop'&&c.c7==='river')return Object.assign(e,{__skipVenueResolver:true});
   if(id==='night'&&c.c4==='boogie'&&c.c7==='river')return Object.assign({},e,{start:'20:35',end:'22:45',detail:(e.detail||'')+' River Café dinner runs later: arrive only if late entry is permitted.'});
   if(id==='night'&&c.c4==='rest')return Object.assign(assign(e,'bryantwinter','Bryant Park Winter Village · ice-rink lights','Rink open during the November holiday season, generally until midnight; shops may close earlier. Walking visit, not a ticketed skate session.','walk','proposed'),{start:'20:45',end:'22:00'});
   if(id.startsWith('explore_walk_')){
    if(e.place==='edge')return assign(e,'hudsonplaza','Hudson Yards Plaza · Vessel exterior','Explore the actual Hudson Yards public plaza before the next venue.','walk','proposed');
    if(e.place==='littleisland')return assign(e,'pier57roof','Pier 57 Rooftop Park · Hudson views','25 11th Ave, next to Little Island. Public roof is normally open daily 6am–1am; weather may affect access.','walk','proposed');
    if(e.place==='lebain')return assign(e,'meatpacking','Gansevoort Plaza · Meatpacking District','Walk a specific nightlife district before Le Bain; no invented show or rooftop access.','walk','proposed');
   }
  }
  if(day==='fri'){
   if(id==='breakfast')return assign(e,'breads','Breads Bakery · Rockefeller Center breakfast','1230 Sixth Avenue. Pack before leaving the room, then grab coffee and pastries near the hotel. Check out and store bags afterwards.','logistics',e.status);
   if(id==='pickup')return Object.assign({},e,{title:'Return to hotel · JFK pickup time unconfirmed',detail:'Meet the shared transfer at the confirmed hotel pickup point. The displayed window is provisional, NOT a confirmed collection time; voucher/operator instructions override this.',status:'verify'});
   if(id==='walk'&&c.c8==='rest')return assign(e,'stpatrick',"St. Patrick's Cathedral · Fifth Avenue","Specific Midtown cathedral stop before returning for luggage and the JFK transfer.",'culture','proposed');
  }
  return e;
 });
 p=p.filter(e=>!e.__skipVenueResolver);
 const add=(id,start,finish,place,title,detail,kind,status)=>optional(p,id,start,finish,place,title,detail,kind,status);
 if(day==='mon'&&c.c1==='rest')add('venue_mon_evening','20:50','21:35','bryantwinter','Bryant Park Winter Village · festive night walk','A final outdoor New York stop after dinner; no hotel early-night placeholder.','walk','proposed');
 if(day==='tue'&&c.c6==='chelsea'){
  // Second actual exhibition with venue and exact address, only when the alternative is selected.
  add('venue_tue_pace','11:25','12:10','pace','Pace Gallery · Li Hei Di / Lucas Samaras','540 W 25th St; the 2026 exhibitions are listed by the gallery. Free entry during normal Tuesday hours.','art','proposed');
 }
 if(day==='tue'&&c.c2==='bluenote'){
  if(!p.some(e=>e.place==='joespizza'))add('venue_tue_pizza','17:15','18:00','joespizza',"Joe's Pizza · Carmine Street","7 Carmine St; a proper New York slice before the 20:00 Blue Note performance.",'food','proposed');
 }
 if(day==='thu'&&c.c5==='rest'){
  add('venue_thu_dumbo','12:30','14:10','brooklynpark','Brooklyn Bridge Park · DUMBO panorama','A defined public waterfront route after the parade.','walk','proposed');
  add('venue_thu_heights','14:15','16:00','bkheights','Brooklyn Heights Promenade · Manhattan views','Walk the promenade before Thanksgiving dinner and the night programme.','walk','proposed');
 }
 if(day==='thu'&&c.c4==='rest')add('venue_thu_lights','20:45','22:00','bryantwinter','Bryant Park Winter Village · festive lights','Named evening destination with rink and festive lights.','walk','proposed');
 if(day==='fri'&&c.c8==='rest')add('venue_fri_cathedral','10:40','11:30','stpatrick',"St. Patrick's Cathedral · Fifth Avenue",'Close to the hotel; return for luggage and the operator-confirmed transfer.','culture','proposed');
 p.sort((a,b)=>m(a.start)-m(b.start));
 // Never introduce overlaps with protected stops: skip only generated venue_* suggestions.
 for(let i=1;i<p.length;i++){
  if(end(p[i-1])>m(p[i].start)){
   const prev=p[i-1],cur=p[i];
   if(String(cur.id).startsWith('venue_')||String(cur.id).startsWith('explore_walk_')){p.splice(i,1);i--;continue}
   if(String(prev.id).startsWith('venue_')||String(prev.id).startsWith('explore_walk_')){p.splice(i-1,1);i=Math.max(0,i-2);continue}
  }
 }
 return p;
}
function install(){
 const D=window.NYC_DATA,P=window.NYC_PLAN;
 if(!D||!D.P||!P||typeof P.day!=='function')return false;
 if(P.__venueResolved)return true;
 for(const [k,v] of Object.entries(V))if(!D.P[k])D.P[k]=Object.assign({},v);
 restyleOptions(D);
 const prior=P.day.bind(P);
 P.day=function(day,choices){
  let base=prior(day,choices);
  try{return resolve(day,base,choices,D)}catch(_){return base}
 };
 P.__venueResolved=true;
 return true;
}
window.NOUX_VENUES={install,version:'2026-11-15',catalog:V};
})();