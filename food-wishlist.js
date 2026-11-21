/* NOUX Food wishlist: public restaurant suggestions, merged into existing private
   wishlist after decryption. No new tabs, local storage writes or itinerary edits. */
(function(){
  'use strict';
  if(window.NOUX_FOOD_WISHLIST)return;

  // The existing private wishlist schema is [title, category, preferredDay, priority].
  // An empty preferredDay keeps these ideas flexible, never a fixed reservation.
  const picks=[
    {name:"Shake Shack · ShackBurger & fries",aliases:["shake shack"],must:true},
    {name:"375° Chicken 'n Fries · Lemon Pepper tenders",aliases:["375","375 chicken"],must:false},
    {name:"Liberty Bagels · everything bagel",aliases:["liberty bagel","liberty"],must:false},
    {name:"Katz's Delicatessen · pastrami",aliases:["katz"],must:true},
    {name:"Russ & Daughters · smoked salmon bagel",aliases:["russ"],must:false},
    {name:"Joe's Pizza · NYC slice",aliases:["joe's pizza","joes pizza","joe s pizza"],must:true},
    {name:"L'Industrie Pizzeria · burrata slice",aliases:["l'industrie","industrie"],must:true},
    {name:"Los Tacos No. 1 · adobada",aliases:["los tacos"],must:false},
    {name:"Lobster Place · lobster roll",aliases:["lobster place"],must:false},
    {name:"Aqua Boil · Lemon Pepper seafood",aliases:["aqua boil"],must:false},
    {name:"Mable's Smokehouse · brisket & ribs",aliases:["mable"],must:false},
    {name:"Levain Bakery · chocolate chip cookie",aliases:["levain"],must:false},
    {name:"Magnolia Bakery · banana pudding",aliases:["magnolia"],must:false}
  ];
  function normal(s){
    return String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  }
  function contains(title,alias){
    return (' '+normal(title)+' ').includes(' '+normal(alias)+' ');
  }
  function install(){
    const data=window.NYC_DATA;
    if(!data||!Array.isArray(data.WISHES))return {ready:false,added:0,existing:0};
    let added=0,existing=0;
    for(const pick of picks){
      const found=data.WISHES.some(row=>Array.isArray(row)&&pick.aliases.some(a=>contains(row[0],a)));
      if(found){existing++;continue}
      data.WISHES.push([pick.name,'food','',pick.must?'core':'choice']);
      added++;
    }
    return {ready:true,added,existing,total:picks.length};
  }
  window.NOUX_FOOD_WISHLIST={install,count:picks.length};
})();