/* All times shown in America/New_York. Proposed itinerary, not confirmations. */
window.NYC_DATA = (function () {
 const P = {
  sanctuary:{name:'Sanctuary Hotel',area:'Midtown',address:'132 W 47th St, New York, NY 10036, USA',lat:40.7595,lng:-73.9831,photo:'hotel',station:'times',kind:'hotel'},
  jfk:{name:'JFK Airport',area:'Queens',address:'John F Kennedy International Airport, Queens, New York, USA',lat:40.6413,lng:-73.7781,kind:'airport'},
  pier:{name:'Cruise boarding pier · voucher to verify',area:'Hudson River',address:'Pier 78, 455 12th Ave, New York, NY 10018, USA',lat:40.7604,lng:-74.0047,photo:'cruise',station:'times',kind:'cruise'},
  stcloud:{name:'St. Cloud at The Knickerbocker',area:'Times Square',address:'6 Times Square, New York, NY 10036, USA',lat:40.7545,lng:-73.9860,photo:'stcloud',station:'times',kind:'cocktails',url:'https://www.theknickerbocker.com/st-cloud-rooftop/'},
  nubeluz:{name:'Nubeluz',area:'NoMad',address:'25 W 28th St, New York, NY 10001, USA',lat:40.7457,lng:-73.9860,photo:'nubeluz',station:'herald',kind:'cocktails',url:'https://www.nubeluzbyjose.com/location/nubeluz/'},
  skylark:{name:'The Skylark',area:'Garment District',address:'200 W 39th St, New York, NY 10018, USA',lat:40.7544,lng:-73.9888,photo:'skyline',station:'times',kind:'cocktails'},
  times:{name:'Times Square',area:'Midtown',address:'Times Square, New York, NY, USA',lat:40.7580,lng:-73.9855,photo:'times',station:'times',kind:'sight'},
  amnh:{name:'American Museum of Natural History · Butterfly Vivarium',area:'Upper West Side',address:'200 Central Park West, New York, NY 10024, USA',lat:40.7813,lng:-73.9740,photo:'butterfly',station:'museum',kind:'museum',url:'https://www.amnh.org/exhibitions/permanent/butterfly-vivarium'},
  oak:{name:'Oak Bridge, Central Park',area:'Central Park',address:'Oak Bridge, Central Park, New York, NY, USA',lat:40.7780,lng:-73.9726,photo:'oak',kind:'park'},
  albertine:{name:'Albertine Books · Villa Albertine',area:'Upper East Side',address:'972 5th Ave, New York, NY 10075, USA',lat:40.7757,lng:-73.9647,photo:'albertine',station:'museum',kind:'bookshop',url:'https://www.albertine.com/'},
  guggenheim:{name:'Solomon R. Guggenheim Museum',area:'Upper East Side',address:'1071 5th Ave, New York, NY 10128, USA',lat:40.7830,lng:-73.9590,photo:'guggenheim',kind:'museum'},
  met:{name:'The Metropolitan Museum of Art',area:'Upper East Side',address:'1000 5th Ave, New York, NY 10028, USA',lat:40.7794,lng:-73.9632,photo:'met',kind:'museum'},
  bluenote:{name:'Blue Note Jazz Club',area:'Greenwich Village',address:'131 W 3rd St, New York, NY 10012, USA',lat:40.7309,lng:-74.0001,photo:'bluenote',station:'west4',kind:'jazz',url:'https://www.bluenotejazz.com/nyc/'},
  jazzgallery:{name:'The Jazz Gallery',area:'NoMad',address:'1158 Broadway, New York, NY 10001, USA',lat:40.7449,lng:-73.9882,photo:'jazz',station:'herald',kind:'jazz',url:'https://jazzgallery.org/calendar'},
  agency:{name:'Agency of Record',area:'Midtown East',address:'118 E 40th St, New York, NY 10016, USA',lat:40.7507,lng:-73.9763,photo:'agency',station:'grand',kind:'vinyl',url:'https://www.agency-of-record.com/dj-schedule'},
  nypl:{name:'New York Public Library · 476 Fifth',area:'Bryant Park',address:'476 5th Ave, New York, NY 10018, USA',lat:40.7532,lng:-73.9822,photo:'nypl',station:'bryant',kind:'library'},
  snfl:{name:'Stavros Niarchos Foundation Library · 455 Fifth',area:'Midtown',address:'455 5th Ave, New York, NY 10016, USA',lat:40.7526,lng:-73.9817,photo:'nypl',station:'bryant',kind:'library'},
  golden:{name:'Golden Diner',area:'Two Bridges',address:'123 Madison St, New York, NY 10002, USA',lat:40.7130,lng:-73.9913,photo:'diner',station:'essex',kind:'food'},
  thrift:{name:'Williamsburg vintage circuit',area:'Williamsburg',address:'Bedford Avenue, Williamsburg, Brooklyn, NY, USA',lat:40.7154,lng:-73.9590,photo:'williamsburg',station:'bedford',kind:'vintage'},
  domino:{name:'Domino Park',area:'Williamsburg',address:'15 River St, Brooklyn, NY 11249, USA',lat:40.7142,lng:-73.9677,photo:'domino',station:'bedford',kind:'park'},
  westlight:{name:'Westlight · The William Vale',area:'Williamsburg',address:'111 N 12th St, Brooklyn, NY 11249, USA',lat:40.7215,lng:-73.9598,photo:'westlight',station:'bedford',kind:'rooftop',url:'https://www.westlightnyc.com/'},
  watertower:{name:'The Water Tower · Arlo Williamsburg',area:'Williamsburg',address:'96 Wythe Ave, Brooklyn, NY 11249, USA',lat:40.7210,lng:-73.9587,photo:'watertower',station:'bedford',kind:'rooftop',url:'https://arlohotels.com/williamsburg/eat-and-drink/water-tower/'},
  superior:{name:'Superior Ingredients · THE ROOM',area:'Williamsburg',address:'74 Wythe Ave, Brooklyn, NY 11249, USA',lat:40.7221,lng:-73.9582,photo:'superior',station:'bedford',kind:'club',url:'https://www.si-bk.com/shows'},
  chocolate:{name:'The Chocolate Factory',area:'East Williamsburg',address:'70 Scott Ave, Brooklyn, NY 11237, USA',lat:40.7087,lng:-73.9229,photo:'soul',station:'morgan',kind:'club',url:'https://soulinthehorn.com/events/'},
  magic:{name:'Magic Hour · LYRA',area:'Midtown',address:'485 7th Ave, New York, NY 10018, USA',lat:40.7527,lng:-73.9898,photo:'magic',station:'herald',kind:'club',url:'https://posh.vip/e/lyra-rooftop-party-112526'},
  somewhere:{name:'Somewhere Nowhere',area:'Chelsea',address:'112 W 25th St, New York, NY 10001, USA',lat:40.7434,lng:-73.9931,photo:'somewhere',station:'23st',kind:'club',url:'https://www.somewherenowherenyc.com/'},
  chelsea:{name:'Chelsea galleries',area:'Chelsea',address:'531 W 24th St, New York, NY 10011, USA',lat:40.7497,lng:-74.0043,photo:'gallery',station:'23st',kind:'art'},
  highline:{name:'High Line',area:'Chelsea / Meatpacking',address:'High Line, New York, NY 10014, USA',lat:40.7475,lng:-74.0048,photo:'highline',station:'14st',kind:'park'},
  chelseamarket:{name:'Chelsea Market',area:'Chelsea',address:'75 9th Ave, New York, NY 10011, USA',lat:40.7423,lng:-74.0061,photo:'chelsea',station:'14st',kind:'food'},
  edge:{name:'Edge Observatory',area:'Hudson Yards',address:'30 Hudson Yards, New York, NY 10001, USA',lat:40.7541,lng:-74.0016,photo:'edge',station:'hudson',kind:'view',url:'https://www.edgenyc.com/'},
  mercer:{name:'Mercer Labs',area:'Financial District',address:'21 Dey St, New York, NY 10007, USA',lat:40.7112,lng:-74.0102,photo:'mercer',station:'fulton',kind:'art',url:'https://mercerlabs.com/'},
  din:{name:'Din Soup Dumplings',area:'Brooklyn Heights',address:'Brooklyn Heights, Brooklyn, NY, USA',lat:40.6967,lng:-73.9920,photo:'food',station:'borough',kind:'food'},
  dumbo:{name:'DUMBO waterfront',area:'DUMBO',address:'Washington St, Brooklyn, NY 11201, USA',lat:40.7033,lng:-73.9895,photo:'dumbo',station:'york',kind:'park'},
  river:{name:'The River Café',area:'DUMBO',address:'1 Water St, Brooklyn, NY 11201, USA',lat:40.7036,lng:-73.9946,photo:'river',station:'high',kind:'dinner',url:'https://rivercafe.com/'},
  lebain:{name:'Le Bain · The Standard High Line',area:'Meatpacking',address:'444 W 13th St, New York, NY 10014, USA',lat:40.7404,lng:-74.0085,photo:'lebain',station:'14st',kind:'club',url:'https://www.lebainnewyork.com/'},
  refuge:{name:'Refuge · David Morales',area:'East Williamsburg',address:'366 Ten Eyck St, Brooklyn, NY 11206, USA',lat:40.7095,lng:-73.9348,photo:'morales',station:'morgan',kind:'club',url:'https://www.eventbrite.com/e/refuge-thanksgiving-david-morales-tickets-2004619260170'},
  boogie:{name:'230 Fifth Rooftop · Boogie Nights',area:'Flatiron',address:'230 5th Ave, New York, NY 10001, USA',lat:40.7438,lng:-73.9894,photo:'rooftop',station:'herald',kind:'club'},
  grand:{name:'Grand Central Terminal',area:'Midtown East',address:'89 E 42nd St, New York, NY 10017, USA',lat:40.7527,lng:-73.9772,photo:'grandcentral',station:'grand',kind:'sight'},
  rockefeller:{name:'Rockefeller Center',area:'Midtown',address:'45 Rockefeller Plaza, New York, NY 10111, USA',lat:40.7588,lng:-73.9787,photo:'rockefeller',station:'rockefeller',kind:'sight'},
  library:{name:'Midtown bookshop & coffee',area:'Midtown',address:'476 5th Ave, New York, NY 10018, USA',lat:40.7532,lng:-73.9822,photo:'nypl',station:'bryant',kind:'bookshop'}
 };
 const STATIONS={
  times:{label:'Times Sq–42 St',codes:['R16','127','A27'],feeds:['nqrw','1234567','ace']},
  herald:{label:'34 St–Herald Sq',codes:['R17','D17'],feeds:['nqrw','bdfm']},
  rockefeller:{label:'47–50 Sts–Rockefeller Ctr',codes:['D15'],feeds:['bdfm']},
  bryant:{label:'42 St–Bryant Park',codes:['D16'],feeds:['bdfm']},
  bedford:{label:'Bedford Av (L)',codes:['L08'],feeds:['l']},
  morgan:{label:'Morgan Av (L)',codes:['L15'],feeds:['l']},
  museum:{label:'81 St–Museum of Natural History',codes:['A21'],feeds:['ace']},
  west4:{label:'W 4 St–Washington Sq',codes:['A32','D20'],feeds:['ace','bdfm']},
  grand:{label:'Grand Central–42 St',codes:['631'],feeds:['1234567']},
  essex:{label:'Delancey St–Essex St',codes:['M18','F15'],feeds:['jz','bdfm']},
  '23st':{label:'23 St (C/E)',codes:['A30'],feeds:['ace']},
  '14st':{label:'14 St–8 Av',codes:['A31','L01'],feeds:['ace','l']},
  fulton:{label:'Fulton St',codes:['A38','M22','418'],feeds:['ace','jz','1234567']},
  borough:{label:'Borough Hall',codes:['232','423'],feeds:['1234567']},
  york:{label:'York St',codes:['F18'],feeds:['bdfm']},
  high:{label:'High St–Brooklyn Bridge',codes:['A40'],feeds:['ace']},
  hudson:{label:'34 St–Hudson Yards',codes:['726'],feeds:['1234567']}
 };
 const CHOICES = [
  {id:'c1',day:'mon',title:'Monday · A first toast or an early night?',desc:'Keep the first evening gentle after the flight and the booked cruise.',options:[['rest','A slow dinner & early night','Quiet luxury · recommended after travel'],['stcloud','St. Cloud rooftop','Near the hotel · illuminated Midtown'],['nubeluz','Nubeluz','Elegant Ritz-Carlton cocktail lounge']]},
  {id:'c2',day:'tue',title:'Tuesday · Our first soundtrack?',desc:'Choose one performance rather than rushing from show to show.',options:[['bluenote','Reuben James · Blue Note','Jazz / soul / funk · 20:00'],['jazzgallery','Becca Stevens + Gretchen Parlato','Intimate vocal jazz · 19:00'],['agency','Rude Movements · vinyl','Funk / dub / house · 18:00–22:00'],['rest','Relaxed dinner, no show','More time to explore']]},
  {id:'c3',day:'wed',title:'Wednesday · What kind of dancefloor?',desc:'Two strong music-first choices, plus view-led alternatives not fully verified.',options:[['louie','Louie Vega · Flashback','Classic soulful NYC house · The Room, NO rooftop'],['soul','Soul in the Horn · Natasha Diggs','Soul / funk / disco / house · Chocolate Factory'],['lyra','LYRA · Magic Hour','Afro/tech-house zone advertised; skyline from that room unverified'],['somewhere','Somewhere Nowhere','Fashion crowd + views; music/roof access unverified'],['rest','No club / rest','Protect Thursday']]},
  {id:'c4',day:'thu',title:'Thursday · THE big night?',desc:'Prioritise real music and a genuinely visible skyline; no booking is implied.',options:[['lebain','Le Bain Thanksgiving','One venue; dancefloor + windows; roof access unconfirmed'],['westmorales','Westlight → David Morales','Polished Manhattan panorama THEN soulful house at Refuge'],['morales','David Morales at Refuge','Strongest house; no skyline'],['boogie','230 Fifth · Boogie Nights','Disco rooftop listing; DJ and Thanksgiving exception uncertain'],['rest','Thanksgiving dinner & rest','A calm alternative']]},
  {id:'c5',day:'thu',title:'Thursday · The daytime chapter',desc:'Leave time to recover after Wednesday night.',options:[['highline','High Line + Chelsea + Edge','West side · the classic skyline route'],['mercer','Mercer Labs + DUMBO','Immersive art + waterfront and dumplings'],['rest','Free day / late start','No timed ticket required']]},
  {id:'c6',day:'tue',title:'Tuesday · Butterflies or an art swap?',desc:'Do not force three major museums in a single morning.',options:[['butterflies','AMNH Butterfly Vivarium','Original priority · timed entry may be required'],['guggenheim','Guggenheim + art','Replace the AMNH morning'],['chelsea','Chelsea gallery trail','Art and spiritual abstraction (best as an alternative)']]},
  {id:'c7',day:'thu',title:'Thursday · The River Café?',desc:'Thanksgiving service/pricing and evening transfer require direct confirmation.',options:[['standard','Flexible dinner near evening venue','Recommended if Le Bain chosen'],['river','The River Café · special dinner','DUMBO · splurge, Thanksgiving availability unverified']]},
  {id:'c8',day:'fri',title:'Friday · Before our return transfer',desc:'Nothing ticketed close to the pickup. Leave all luggage ready.',options:[['rockefeller','Rockefeller Center & coffee','Easy, near hotel'],['grand','Grand Central terminal','Classic NYC close to Midtown'],['rest','Breakfast, pack & breathe','Safest when pickup time remains unknown']]}
 ];
 const DEFAULT={c1:'rest',c2:'bluenote',c3:'soul',c4:'lebain',c5:'highline',c6:'butterflies',c7:'standard',c8:'rockefeller'};
 const WISHES = [
 ['Butterfly Vivarium · AMNH','science','tue','core'],['Oak Bridge · Central Park','walk','tue','core'],['Albertine Books · Villa Albertine','culture','tue','core'],['NYPL Stephen A. Schwarzman Building','culture','wed','core'],['Stavros Niarchos Foundation Library','culture','wed','core'],['Golden Diner','food','wed','core'],['Williamsburg vintage & thrift','vintage','wed','core'],['Domino Park','walk','wed','core'],['The River Café','food','thu','choice'],['Mercer Labs','art','thu','choice'],['Edge · Hudson Yards','view','thu','choice'],['High Line + Chelsea Market','walk','thu','choice'],['Guggenheim Museum','art','tue','swap'],['The Met','art','tue','swap'],['MoMA / Whitney','art','tue','swap'],['Jason Moran · STACKS','art','tue','swap'],['Mildred Thompson · Cosmos Calling','art','tue','swap'],['Ouattara Watts at Karma','art','tue','swap'],['Carrington & Cecilia Vicuña','art','tue','swap'],['Public Records listening space','vinyl','wed','watch'],['Soul in the Horn','house','wed','choice'],['Louie Vega','house','wed','choice'],['David Morales','house','thu','choice'],['Le Bain','house','thu','choice'],['The Water Tower','view','thu','watch'],['The Roof at Superior Ingredients','view','thu','watch'],['Westlight','view','thu','choice'],['Nubeluz','view','mon','choice'],['St. Cloud','view','mon','choice'],['The Skylark','view','mon','swap'],['Grand Banks oysters','food','thu','watch'],['Golden-hour cruise','booked','mon','booked'],['Rockefeller Center','walk','fri','choice'],['Grand Central Terminal','culture','fri','choice'],['Rough Trade / vinyl','vinyl','wed','swap'],['The Backroom','cocktail','wed','swap'],['Bar Yakuni','cocktail','wed','swap'],['Hudson VU Rooftop','view','mon','watch'],['Brooklyn Bridge + DUMBO','walk','thu','choice'],['New York authors & bookshops','culture','tue','core'],['Soul, jazz, disco & afro-house','music','wed','core'],['Emerging Algerian artists','art','tue','watch']
 ];
 const DATES={mon:'2026-11-23',tue:'2026-11-24',wed:'2026-11-25',thu:'2026-11-26',fri:'2026-11-27'};
 const DAYS=[['mon','MONDAY','23 NOV','The first skyline'],['tue','TUESDAY','24 NOV','Butterflies & music'],['wed','WEDNESDAY','25 NOV','Books, Brooklyn & groove'],['thu','THURSDAY','26 NOV','The big night'],['fri','FRIDAY','27 NOV','Last looks']];
 return {P,STATIONS,CHOICES,DEFAULT,WISHES,DATES,DAYS};
})();