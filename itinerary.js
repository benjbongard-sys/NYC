window.NYC_PLAN = (function(){
 const D=window.NYC_DATA;
 const ev=(id,start,end,title,place,detail,kind='experience',status='proposed')=>({id,start,end,title,place,detail,kind,status});
 const day=(day,choices)=>{
 const c={...D.DEFAULT,...(choices||{})}; let p=[];
 if(day==='mon'){
  p=[ev('landing','10:55','12:30','JFK arrival · immigration & bags','jfk','Flight arrival 10:55. Border/baggage duration is an allowance, not a guarantee.','logistics','arranged'),
     ev('transfer','12:30','14:00','Shared transfer to Midtown','sanctuary','Shared transfer timing unconfirmed; if delayed, skip optional lunch/walk.','travel','arranged'),
     ev('drop','14:00','14:25','Bag drop · quick refresh','sanctuary','Do not depend on early room access.','logistics','arranged'),
     ev('lunch','14:25','14:50','Quick lunch near hotel','sanctuary','Convenient, light and flexible, no prepaid table.','food'),
     ev('topier','14:50','15:20','Travel to the boarding pier','pier','Pier 78 is a working hypothesis from operator guidance. Use the voucher’s exact pier and boarding cutoff.','travel','verify'),
     ev('board','15:20','16:00','Boarding buffer','pier','Boarding and gate deadlines from Lyna’s confirmation take precedence.','logistics','verify'),
     ev('cruise','16:00','18:00','Golden-hour NYC cruise','pier','BOOKED BY LYNA · 16:00. Approx. 2 hours; route and terminal still to verify on voucher.','highlight','booked'),
     ev('reset','18:00','19:15','Back to hotel · dress and rest','sanctuary','Travel time depends on pier; preserve downtime.','recovery'),
     ev('dinner','19:20','20:35','First New York dinner near Midtown','sanctuary','Unhurried, no non-refundable arrival-day bookings.','food')];
  if(c.c1==='stcloud')p.push(ev('drinks','20:45','21:40','St. Cloud · first rooftop toast','stcloud','Close to the hotel; indoor/outdoor setup and weather may alter the view.','cocktail'));
  if(c.c1==='nubeluz')p.push(ev('drinks','20:50','22:00','Nubeluz · refined skyline cocktails','nubeluz','Elegant dress code; table availability and bar spend are not guaranteed.','cocktail'));
  if(c.c1==='rest')p.push(ev('sleep','20:45','21:30','Night off · recharge for the week','sanctuary','A deliberate luxury: rest after the transatlantic flight.','recovery'));
 }
 if(day==='tue'){
  p=[ev('breakfast','08:45','09:45','Breakfast and travel','sanctuary','Go gently; museum reservation controls exact start.','food')];
  if(c.c6==='butterflies') p.push(ev('museum','10:15','12:05','AMNH · Butterfly Vivarium','amnh','Check timed vivarium admission and separate museum ticket.','museum','ticket-to-check'));
  if(c.c6==='guggenheim') p.push(ev('museum','10:20','12:10','Guggenheim · spiral of modern art','guggenheim','Replaces Butterfly Vivarium, not added to it.','museum','ticket-to-check'));
  if(c.c6==='chelsea') p.push(ev('museum','10:30','12:15','Chelsea galleries · two exhibitions','chelsea','Choose two: Jason Moran, Mildred Thompson, Ouattara Watts, Carrington/Vicuña. Gallery Thanksgiving-week hours need verifying.','art','hours-to-check'));
  if(c.c6==='chelsea'){
    p.push(ev('lunch','12:25','13:20','Lunch in Chelsea','chelseamarket','Keep walking distances compact.','food'));
    p.push(ev('park','13:25','14:35','High Line or Whitney exterior','highline','A short open-air break if the weather cooperates.','walk'));
    p.push(ev('books','15:00','16:00','Albertine Books · a world of stories','albertine','French-language bookshop. Opening hours should be checked for 24 November.','culture'));
  }else{
    p.push(ev('lunch','12:15','13:10','Upper West Side lunch','amnh','Warm lunch before the park.','food'));
    p.push(ev('park','13:20','14:10','Oak Bridge in Central Park','oak','Quiet autumn walk and photos; weather-flexible.','walk'));
    p.push(ev('books','14:30','15:40','Albertine Books · celestial ceiling','albertine','A treasured stop for literature and design; Villa Albertine is not a public-tour commitment.','culture'));
  }
  p.push(ev('reset','16:10','18:15','Back to hotel · reset','sanctuary','Rest and change before evening music.','recovery'));
  if(c.c2==='bluenote')p.push(ev('music','19:05','21:45','Reuben James at Blue Note · 20:00 show','bluenote','Book the specific concert. Cover charge plus $20 minimum per person; no refunds. Arrive before showtime.','music','ticket-to-check'));
  if(c.c2==='jazzgallery')p.push(ev('music','18:45','21:00','Becca Stevens & Gretchen Parlato · 19:00','jazzgallery','Intimate jazz; seating and ticket tiers subject to checkout.','music','ticket-to-check'));
  if(c.c2==='agency')p.push(ev('music','18:30','20:20','Rude Movements · Agency of Record','agency','Funk, reggae, dub, house & jazz vinyl. This is a listening/cocktail session, not a club.','music'));
  if(c.c2==='rest')p.push(ev('music','19:00','21:00','Dinner and an easy night','sanctuary','Relaxed alternative to a ticketed show.','recovery'));
 }
 if(day==='wed'){
  p=[ev('late','09:15','10:05','Breakfast · gentle start','sanctuary','No forced early ticket.','food'),
     ev('library','10:15','11:30','NYPL · Rose Reading Room and historic halls','nypl','Public entry and visitor access subject to library rules.','culture'),
     ev('snfl','11:35','12:15','Stavros Niarchos Library · 455 Fifth','snfl','Different building from the main library. Rooftop access subject to hours.','culture'),
     ev('lunch','12:35','13:45','Golden Diner · lunch','golden','Queue dependent; switch to nearby option if wait is excessive.','food'),
     ev('vintage','14:30','16:15','Williamsburg vintage & independent shops','thrift','Compact circuit: one of Lyna’s original priorities.','shopping'),
     ev('domino','16:20','17:10','Domino Park · Manhattan waterfront views','domino','Golden-hour mood; weather dependent.','walk'),
     ev('hotel','18:05','21:10','Return · dinner · get ready','sanctuary','A real preparation window before dancing.','recovery')];
  if(c.c3==='louie') p.push(ev('night','22:00','02:00','Louie Vega · Flashback (extended house)','superior','Superior Ingredients THE ROOM, not The Roof. Ticket tier/fees and 21+ entry to verify.','club','ticket-to-check'));
  if(c.c3==='soul') p.push(ev('night','22:00','02:00','Soul in the Horn · Natasha Diggs + guests','chocolate','Soul, funk, disco, global rhythms, house. Ends as late as 05:00; choose our own departure. 21+.','club','ticket-to-check'));
  if(c.c3==='lyra') p.push(ev('night','22:00','01:30','LYRA · Magic Hour rooftop','magic','House/afro zone advertised; exact DJ, zone view and winter roof access remain unverified.','club','unverified'));
  if(c.c3==='somewhere') p.push(ev('night','22:00','01:30','Somewhere Nowhere · Thanksgiving Eve','somewhere','Panoramic venue, but event music and rooftop room not sufficiently verified.','club','unverified'));
  if(c.c3==='rest')p.push(ev('night','21:15','22:30','A quieter evening','sanctuary','Give Thursday your full energy.','recovery'));
 }
 if(day==='thu'){
  const late=c.c3!=='rest';
  p=[ev('slow',late?'10:45':'09:45',late?'11:40':'10:40',late?'Sleep in · breakfast':'Breakfast and an easy morning','sanctuary',late?'Recovery after the Wednesday club. No forced 09:00 departure.':'Flexible morning; Thanksgiving opening hours vary.','recovery')];
  if(c.c5==='highline'){
    p.push(ev('highline','12:00','13:00','High Line · a west-side walk','highline','Outdoor walk; check holiday access.','walk'));
    p.push(ev('lunch','13:10','14:05','Chelsea Market area · lunch','chelseamarket','Thanksgiving opening is not guaranteed. Have a nearby fallback.','food','hours-to-check'));
    p.push(ev('view','14:35','16:00','Edge · skyline from above','edge','Only if operating on Thanksgiving and time-slot ticket available.','view','ticket-to-check'));
  }else if(c.c5==='mercer'){
    p.push(ev('art','11:50','13:15','Mercer Labs · immersive art','mercer','Check Thanksgiving hours and entry slot before purchase.','art','hours-to-check'));
    p.push(ev('lunch','13:40','14:45','Brooklyn Heights · dumplings','din','Din Soup Dumplings: exact branch and Thanksgiving service not confirmed.','food','hours-to-check'));
    p.push(ev('walk','15:00','16:00','DUMBO · Brooklyn Bridge views','dumbo','Waterfront promenade, weather dependent.','walk'));
  }else{
    p.push(ev('open','12:30','14:10','Unstructured city time','sanctuary','Brunch, a small walk or time together.','recovery'));
    p.push(ev('chill','14:15','16:00','Coffee · relax · change','sanctuary','Keep the evening special.','recovery'));
  }
  p.push(ev('reset','16:15','17:40','Hotel reset · dress for the evening','sanctuary','If the daytime location is far, this may require more travel.','recovery'));
  if(c.c7==='river')p.push(ev('dinner','18:15','20:05','The River Café · Thanksgiving dinner','river','Special occasion, but Thanksgiving opening, price and reservation are NOT confirmed.','dinner','unverified'));
  else if(c.c4==='westmorales')p.push(ev('dinner','20:15','21:20','Dinner in Williamsburg','westlight','Choose a restaurant confirmed open on Thanksgiving.','dinner','hours-to-check'));
  else if(c.c4==='lebain')p.push(ev('dinner','19:00','20:20','Dinner in Meatpacking','lebain','Choose a Thanksgiving-open restaurant near the club.','dinner','hours-to-check'));
  else if(c.c4==='boogie')p.push(ev('dinner','17:45','18:55','Early Thanksgiving dinner near Flatiron','boogie','Do not book a tight, non-refundable meal on this uncertain event.','dinner','hours-to-check'));
  else p.push(ev('dinner','19:00','20:15','Thanksgiving dinner at a confirmed venue','sanctuary','Reserve only once the chosen restaurant is confirmed open.','dinner','hours-to-check'));
  if(c.c4==='lebain')p.push(ev('night','22:00','01:30','Le Bain · Thanksgiving club night','lebain','Indoor dancefloor; skyline through windows. Rooftop terrace access and final DJ lineup not fully verified.','club','unverified'));
  if(c.c4==='westmorales'){
    p.push(ev('rooftop','18:35','20:05','Westlight · skyline cocktails','westlight','A SEPARATE cocktail bar. Check Thanksgiving hours, table with view and any minimum spend.','cocktail','hours-to-check'));
    p.push(ev('night','22:10','01:30','David Morales at Refuge','refuge','Real soulful/vocal house, no skyline. Tickets previously listed $25–35 plus potential fees, final sale.','club','ticket-to-check'));
  }
  if(c.c4==='morales')p.push(ev('night','22:00','01:30','David Morales at Refuge','refuge','Serious house music in a sound-focused club; no panoramic view.','club','ticket-to-check'));
  if(c.c4==='boogie')p.push(ev('night','19:30','22:45','230 Fifth · Boogie Nights','boogie','Recurring Thursday listing; no named DJ, style/dancefloor setup and Thanksgiving operation unverified.','club','unverified'));
  if(c.c4==='rest')p.push(ev('night','20:30','22:00','An evening for two · no club','sanctuary','A delicious, restful night together.','recovery'));
 }
 if(day==='fri'){
  // Friday follows the big Thursday evening: preserve sleep instead of scheduling a forced early start.
  const afterClub=['lebain','westmorales','morales','boogie'].includes(c.c4);
  p=[ev('breakfast',afterClub?'09:45':'08:45',afterClub?'10:15':'09:35','Breakfast · pack and check out','sanctuary','Flight home 21:30 from JFK, shared pickup time UNKNOWN. After a late club, sleep in and skip sightseeing if needed.','logistics','arranged'),
    ev('luggage',afterClub?'10:15':'09:35',afterClub?'10:35':'10:00','Check out · store bags if permitted','sanctuary','Confirm hotel check-out and luggage-storage policies.','logistics')];
  if(c.c8==='rockefeller')p.push(ev('walk',afterClub?'10:45':'10:15','11:25','Rockefeller Center · optional Midtown stroll','rockefeller','Only if rested and the pickup time permits. No timed ticket.','walk'));
  if(c.c8==='grand')p.push(ev('walk',afterClub?'10:45':'10:15','11:25','Grand Central Terminal · optional architectural finale','grand','Only if the confirmed transfer pickup permits it.','culture'));
  if(c.c8==='rest')p.push(ev('walk',afterClub?'10:40':'10:00','11:30','Coffee and no rush','sanctuary','No extra travel commitments.','recovery'));
  p.push(ev('pickup','12:00','13:00','Return towards hotel · pickup buffer','sanctuary','This is a PROVISIONAL placeholder only; adjust when the shared transfer operator confirms pickup time.','logistics','verify'));
 }
  return [...p].sort((a,b)=>a.start.localeCompare(b.start));
 };
 function mins(s){const [h,m]=s.split(':').map(Number);return h*60+m}
 function km(a,b){if(!a||!b)return null;let dlat=(b.lat-a.lat)*Math.PI/180, dlon=(b.lng-a.lng)*Math.PI/180;let h=Math.sin(dlat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dlon/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))}
 function legs(events){const result=[];let prev=null;for(const e of events){const place=D.P[e.place]||null; if(prev&&place&&prev.place&&prev.place!==e.place){const d=km(D.P[prev.place],place);if(d>0.55){const mode=d<1.15?'walking':'transit',est=mode==='walking'?Math.round(d*1.3/4.5*60):Math.min(60,Math.round(12+d/19*60));const slack=mins(e.start)-mins(prev.end);result.push({from:prev,to:e,km:d,mode,estimate:est,slack,warning:slack<est?'tight':'ok'});}}prev=e; }return result}
 function routeUrl(from,to,mode){if(!from||!to)return ''; const p=new URLSearchParams({api:'1',origin:D.P[from]?.address||from,destination:D.P[to]?.address||to,travelmode:mode||'transit'});return 'https://www.google.com/maps/dir/?'+p.toString()}
 function findConflicts(c){let list=[];if(c.c7==='river'&&c.c4==='boogie')list.push('River Café at 18:15 overlaps Boogie Nights at 19:30. Choose one or change dinner.');if(c.c7==='river'&&c.c4==='westmorales')list.push('River Café plus Westlight plus David Morales is a rushed three-venue Thanksgiving night. Prefer one dinner and one music venue.');if(c.c7==='river'&&c.c4==='lebain')list.push('River Café → Le Bain crosses the river late; allow a generous transfer.');if(c.c3!=='rest'&&c.c5==='mercer')list.push('Wednesday may finish late. Mercer Labs cannot be guaranteed early on Thanksgiving; start after rest and verify opening.');if(c.c4==='lebain')list.push('Le Bain outdoor rooftop access and the Thanksgiving DJ line-up remain unconfirmed; do not assume dancing with direct skyline from the roof.');return list}
 return {day,legs,routeUrl,findConflicts,mins,km};
})();