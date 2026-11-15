/* NOUX Venue Guide: concrete, source-checked public venue data.
   Applied only AFTER the encrypted itinerary has been opened.
   No passphrase, individual booking, trip date or private itinerary plaintext lives here. */
(function(){
'use strict';
if(window.NOUX_VENUES)return;
const places={
 noux_langans:{name:"Langan's · Midtown restaurant",area:'Theatre District',address:'114 W 47th St, New York, NY 10036, USA',lat:40.7592,lng:-73.9825,kind:'restaurant',url:'https://www.langansnyc.com/location/langans/',note:'Monday kitchen confirmed until 22:00; bookings not assumed.'},
 noux_lostacos_times:{name:'Los Tacos No. 1 · Times Square',area:'Times Square',address:'229 W 43rd St, New York, NY 10036, USA',lat:40.7565,lng:-73.9884,kind:'restaurant',url:'https://www.lostacos1.com/location/los-tacos-times-square/'},
 noux_lostacos_chelsea:{name:'Los Tacos No. 1 · Chelsea Market',area:'Chelsea',address:'75 9th Ave, New York, NY 10011, USA',lat:40.7426,lng:-74.0061,kind:'restaurant',url:'https://www.lostacos1.com/locations/'},
 noux_daily_uws:{name:'Daily Provisions · Upper West Side',area:'Upper West Side',address:'375 Amsterdam Ave, New York, NY 10024, USA',lat:40.7818,lng:-73.9794,kind:'cafe',url:'https://www.dailyprovisions.co/location/daily-provisions-upper-west-side/'},
 noux_breads_rock:{name:'Breads Bakery · Rockefeller Center',area:'Rockefeller Center',address:'1230 Avenue of the Americas, New York, NY 10020, USA',lat:40.7591,lng:-73.9806,kind:'cafe',url:'https://restaurants.breadsbakery.com/en/bakery/our-locations/'},
 noux_culture:{name:'Culture Espresso · Bryant Park',area:'Bryant Park',address:'72 W 38th St, New York, NY 10018, USA',lat:40.7519,lng:-73.9844,kind:'cafe',url:'https://www.cultureespresso.com/locations-directory-feed'},
 noux_glass:{name:'Glass House Tavern',area:'Theatre District',address:'252 W 47th St, New York, NY 10036, USA',lat:40.7602,lng:-73.9864,kind:'restaurant',url:'https://glasshousetavern.com/contact/'},
 noux_gatsby:{name:"Gatsby's Landing · Times Square",area:'Bryant Park / Times Square',address:'120 W 44th St, New York, NY 10036, USA',lat:40.7561,lng:-73.9843,kind:'restaurant',url:'https://www.gatsbyslanding.com/gatsbys-landing-times-square'},
 noux_standard:{name:'The Standard Grill · Thanksgiving dinner',area:'Meatpacking',address:'848 Washington St, New York, NY 10014, USA',lat:40.7395,lng:-74.0079,kind:'restaurant',url:'https://www.standardhotels.com/new-york/happenings/thanksgiving-TSG-2026',note:'Thanksgiving 2026 three-course menu $125 per person, not booked.'},
 noux_lolas:{name:"Lola's Rooftop · Thanksgiving dinner",area:'Times Square',address:'132 W 47th St, New York, NY 10036, USA',lat:40.7595,lng:-73.9831,kind:'restaurant',url:'https://www.opentable.com/r/lolas-rooftop-new-york',note:'Thanksgiving 2026 $95 per person; specified 16:00, 18:00 and 20:00 seatings, prepaid.'},
 noux_pastis:{name:'Pastis · Meatpacking',area:'Meatpacking',address:'52 Gansevoort St, New York, NY 10014, USA',lat:40.7390,lng:-74.0062,kind:'restaurant',url:'https://pastisnyc.com/',note:'Thanksgiving menu advertised; lunch service and seating need confirmation.'},
 noux_timeout:{name:'Time Out Market · DUMBO',area:'DUMBO',address:'55 Water St, Brooklyn, NY 11201, USA',lat:40.7033,lng:-73.9913,kind:'restaurant',url:'https://www.timeoutmarket.com/newyork/',note:'2026 Thanksgiving opening of individual kitchens not confirmed.'},
 noux_barsusanne:{name:'Bar Susanne · oysters on the waterfront',area:'Williamsburg',address:'6 River St, Brooklyn, NY 11249, USA',lat:40.7134,lng:-73.9678,kind:'restaurant',note:'Confirm Thanksgiving-specific service before relying on this choice.'},
 noux_maison:{name:'Maison Premiere · oyster bar',area:'Williamsburg',address:'298 Bedford Ave, Brooklyn, NY 11249, USA',lat:40.7139,lng:-73.9612,kind:'restaurant',url:'https://maisonpremiere.com/'},
 noux_joe:{name:"Joe's Pizza · Carmine Street",area:'West Village',address:'7 Carmine St, New York, NY 10014, USA',lat:40.7302,lng:-74.0022,kind:'restaurant',url:'https://www.joespizzanyc.com/'},
 noux_rock:{name:'Rockefeller Center · Fifth Avenue',area:'Midtown',address:'45 Rockefeller Plaza, New York, NY 10111, USA',lat:40.7588,lng:-73.9787,kind:'walk',url:'https://www.rockefellercenter.com/'},
 noux_times:{name:'Times Square · Broadway & 47th Street',area:'Times Square',address:'Broadway and West 47th Street, New York, NY 10036, USA',lat:40.7593,lng:-73.9854,kind:'walk',url:'https://www.timessquarenyc.org/'},
 noux_bryant:{name:'Bryant Park · Winter Village',area:'Midtown',address:'Bryant Park, New York, NY 10018, USA',lat:40.7536,lng:-73.9832,kind:'walk',url:'https://bryantpark.org/'},
 noux_little:{name:'Little Island',area:'Meatpacking',address:'Pier 55, Hudson River Park, New York, NY 10014, USA',lat:40.7412,lng:-74.0104,kind:'park',url:'https://littleisland.org/rules-faq/'}
};
const treatments={
 mon:[
  {match:e=>e.id==='lunch'&&e.kind==='food',at:'noux_lostacos_times',title:'Los Tacos No. 1 · first New York tacos',detail:'229 W 43rd St. Quick counter-service lunch, about 25 minutes. If JFK immigration runs late, prioritise reaching the cruise boarding pier on time.'},
  {match:e=>e.id==='dinner'&&['food','dinner'].includes(e.kind),at:'noux_langans',title:"Dinner at Langan's · first NYC night",detail:'114 W 47th St, on the hotel block. Contemporary American cooking; Monday kitchen operates until 22:00. Target dinner only, not a reservation.'},
  {match:e=>e.id==='sleep'||/night off|early night/i.test(e.title),at:'noux_times',title:'Times Square lights · Broadway evening stroll',detail:'Broadway around 47th Street, then a walk past the theatre marquees. Entirely optional after the Langan’s dinner.',kind:'walk'},
  {match:e=>e.id==='reset'&&e.kind==='recovery',at:'noux_rock',title:'Midtown illuminated streets · Rockefeller Center',detail:'Walk through Rockefeller Center and Fifth Avenue en route to dinner. Keep travel from the booked cruise pier in mind.',kind:'walk'}
 ],
 tue:[
  {match:e=>e.id==='breakfast'&&e.kind==='food',at:'noux_breads_rock',title:'Breads Bakery · coffee and chocolate babka',detail:'1230 Sixth Avenue, close to Rockefeller Center. Quick breakfast; allow subway time to the morning museum.'},
  {match:e=>e.id==='lunch'&&/chelsea/i.test(e.title),at:'noux_lostacos_chelsea',title:'Los Tacos No. 1 · Chelsea Market lunch',detail:'75 Ninth Avenue. Fast tacos with time to explore Chelsea Market.'},
  {match:e=>e.id==='lunch'&&/upper west side/i.test(e.title),at:'noux_daily_uws',title:'Daily Provisions · Upper West Side lunch',detail:'375 Amsterdam Avenue near AMNH: sandwiches, salads or roast chicken. Published daily hours 07:00–21:00.'},
  {match:e=>e.id==='reset'&&e.kind==='recovery',at:'noux_rock',title:'Fifth Avenue & Rockefeller Center discoveries',detail:'Explore Fifth Avenue and Rockefeller Center before the evening performance. Check museum closing times and travel onward.',kind:'walk'},
  {match:e=>e.id==='music'&&e.kind==='recovery',at:'noux_glass',title:'Glass House Tavern · relaxed dinner',detail:'252 W 47th St. Real Midtown restaurant; an alternative to the ticketed jazz performance.',kind:'dinner'}
 ],
 wed:[
  {match:e=>e.id==='late'&&e.kind==='food',at:'noux_culture',title:'Culture Espresso · breakfast and cookies',detail:'72 W 38th St. Coffee and pastries before the New York Public Library.'},
  {match:e=>e.id==='hotel'&&e.kind==='recovery',at:'noux_maison',title:'Maison Premiere · Williamsburg oyster dinner',detail:'298 Bedford Avenue. Oyster bar and cocktails; reserve if choosing a dining-room table. The broad original time window is flexible.',kind:'dinner'},
  {match:e=>e.id==='night'&&e.kind==='recovery',at:'noux_rock',title:'Rockefeller Center by night · Midtown lights',detail:'Evening walk instead of a club; no hotel rest block.',kind:'walk'}
 ],
 thu:[
  {match:e=>e.id==='slow'&&e.kind==='recovery',at:'noux_breads_rock',title:'Breads Bakery · parade-morning breakfast',detail:'1230 Sixth Avenue. Obtain food before the parade if access permits; morning routes may be blocked. No café opening is assumed on Thanksgiving.',kind:'food'},
  {match:e=>e.id==='lunch'&&/chelsea market/i.test(e.title),at:'noux_pastis',title:'Pastis · Meatpacking Thanksgiving lunch',detail:'52 Gansevoort Street. Thanksgiving menu advertised; confirm the exact lunchtime seating before relying on it.',status:'hours-to-check'},
  {match:e=>e.id==='lunch'&&/brooklyn heights|dumpling/i.test(e.title),at:'noux_timeout',title:'Time Out Market · DUMBO food hall',detail:'55 Water Street, Brooklyn. Specific Thanksgiving opening and vendors still to verify.',status:'hours-to-check'},
  {match:e=>e.id==='open'||e.id==='chill',at:'noux_little',title:'Little Island · waterfront discovery',detail:'Pier 55 Hudson River Park. Open 06:00–21:00 in November unless weather intervenes; allow travel time.',kind:'walk'},
  {match:e=>e.id==='reset'&&e.kind==='recovery',at:'noux_rock',title:'Midtown holiday lights · transition toward dinner',detail:'Rockefeller Center and Fifth Avenue, if compatible with the evening venue. The transfer and clothing change are flexible.',kind:'walk'},
  {match:e=>e.id==='dinner'&&/williamsburg/i.test(e.title),at:'noux_barsusanne',title:'Bar Susanne · Williamsburg waterfront dinner',detail:'6 River Street, seafood and oysters near Domino Park. Thanksgiving opening not confirmed; request confirmation before making this the primary dinner.',status:'hours-to-check'},
  {match:e=>e.id==='dinner'&&/meatpacking/i.test(e.title),at:'noux_standard',title:'The Standard Grill · Thanksgiving feast',detail:'848 Washington Street, downstairs from The Standard High Line and Le Bain. Published 2026 three-course Thanksgiving menu, $125 per person. Reservation not made.',status:'ticket-to-check'},
  {match:e=>e.id==='dinner'&&/thanksgiving dinner at a confirmed venue/i.test(e.title),at:'noux_lolas',title:"Lola's Rooftop · Thanksgiving dinner",detail:'132 W 47th St, atop the Sanctuary Hotel. Published $95 prix-fixe for Thanksgiving 2026, prepaid with 16:00, 18:00 and 20:00 seatings. Plan requires choosing an available seating.',status:'ticket-to-check'},
  {match:e=>e.id==='night'&&e.kind==='recovery',at:'noux_times',title:'Thanksgiving lights · Broadway & Times Square',detail:'Evening stroll along the illuminated theatre district after dinner.',kind:'walk'}
 ],
 fri:[
  {match:e=>e.id==='walk'&&/coffee|no rush/i.test(e.title),at:'noux_breads_rock',title:'Breads Bakery · final coffee and babka',detail:'1230 Sixth Avenue, near Rockefeller Center. Return for bags in good time for the confirmed JFK pickup.',kind:'food'},
  {match:e=>e.id==='breakfast'&&e.kind==='food',at:'noux_breads_rock',title:'Breads Bakery · departure-day breakfast',detail:'1230 Sixth Avenue. Check out and luggage storage remain controlled by the hotel.'}
 ]
};
function setChoices(data){
 const byId=Object.fromEntries((data.CHOICES||[]).map(c=>[c.id,c]));
 function change(id,value,title,desc){const c=byId[id];const a=c&&c.options&&c.options.find(x=>x[0]===value);if(a){a[1]=title;if(desc)a[2]=desc}}
 change('c1','rest',"Langan's dinner + Times Square lights",'114 W 47th St · a specific restaurant plus an optional neon-lit walk');
 change('c1','stcloud',"Langan's → St. Cloud",'Dinner on W 47th, then rooftop at The Knickerbocker');
 change('c1','nubeluz',"Langan's → Nubeluz",'Dinner on W 47th, then cocktails at NoMad');
 change('c2','rest','Glass House Tavern · dinner','252 W 47th St · a real, relaxed restaurant rather than an empty evening');
 change('c3','rest','Rockefeller Center · evening walk','A named Midtown destination instead of an unplanned night');
 change('c4','rest',"Lola's Rooftop dinner + Times Square lights",'Thanksgiving $95 prix-fixe at 16:00/18:00/20:00, seating must be booked');
 change('c5','rest','Little Island + Meatpacking','Actual waterfront stop, holiday restaurant hours to verify');
 change('c8','rest','Breads Bakery · Rockefeller Center','Specific café and final stop before luggage pickup');
 (data.CHOICES||[]).forEach(c=>{
  if(c.id==='c1'){c.title='Monday · Where shall we eat and toast the city?';c.desc='A named dinner address is included in every choice. No hotel-rest filler.'}
  if(c.id==='c5')c.desc='Thanksgiving Parade is fixed in the morning; pick the afternoon neighbourhood.'
  if(c.id==='c8')c.desc='Named Midtown stops only. The verified airport-transfer pickup time always wins.'
 });
}
function isTravelLock(e){
 const s=String(e.status||'').toLowerCase(),k=String(e.kind||'').toLowerCase();
 return ['booked','arranged','confirmed'].includes(s)||k==='travel'||k==='logistics'||/cruise|airport|flight|pickup|boarding|parade/i.test(e.title||'');
}
function install(){
 const D=window.NYC_DATA,P=window.NYC_PLAN;
 if(!D||!D.P||!P||typeof P.day!=='function'||P.__nouxVenues)return false;
 Object.keys(places).forEach(k=>{if(!D.P[k])D.P[k]=places[k]});
 setChoices(D);
 const base=P.day.bind(P);
 P.day=function(day,choices){
  const rows=base(day,choices);
  if(!Array.isArray(rows))return rows;
  return rows.map(e=>{
   if(isTravelLock(e))return e;
   const rules=treatments[day]||[];
   const rule=rules.find(r=>r.match(e));
   if(!rule)return e;
   const p=D.P[rule.at];if(!p)return e;
   return {...e,place:rule.at,title:rule.title,detail:rule.detail,kind:rule.kind||e.kind,status:rule.status||e.status,venueResolved:true};
  });
 };
 P.__nouxVenues=true;
 return true;
}
window.NOUX_VENUES={install,version:'2026.11.15',catalog:places};
})();