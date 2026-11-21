/* Public synthetic test: additive Food wishes only, never decrypt private data. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('food-wishlist.js','utf8');
assert(!/private\.vault|NOUX_PASSPHRASE|Sanctuary Hotel|132 W 47th|localStorage\.setItem|fetch\(/.test(source));
function load(data){
  const w={NYC_DATA:data};
  vm.runInNewContext(source,{window:w},{filename:'food-wishlist.js'});
  return w.NOUX_FOOD_WISHLIST;
}
const original=[
  ["Shake Shack · Madison Square Park","food","tue","choice"],
  ["Katz's Delicatessen","food","wed","core"],
  ["Joe’s Pizza","food","tue","choice"],
  ["MoMA","art","tue","core"]
];
const data={WISHES:original.map(x=>x.slice()),P:{museum:{name:"Test"}},DEFAULT:{choice:"keep"}};
const food=load(data),first=food.install();
assert.equal(first.ready,true);
assert.equal(first.total,13);
assert.equal(first.existing,3);
assert.equal(first.added,10);
assert.equal(data.WISHES.length,14);
assert.equal(JSON.stringify(data.WISHES.slice(0,4)),JSON.stringify(original),"Existing wishes unchanged");
assert.equal(JSON.stringify(data.P),JSON.stringify({museum:{name:"Test"}}),"Places unchanged");
assert.equal(data.DEFAULT.choice,"keep","Trip choices unchanged");
assert.equal(data.WISHES.filter(x=>x[1]==="food").length,13);
assert.equal(data.WISHES.filter(x=>x[1]==="food"&&x[3]==="core").length,2,
 "Previously existing Joe's priority preserved; other Must Try priorities set correctly");
assert.equal(data.WISHES.filter(x=>x[1]==="food"&&x[2]==="").length,10,
 "New wishes must not force a particular day");
const second=food.install();
assert.equal(second.added,0,"Repeated unlock must not duplicate");
assert.equal(data.WISHES.length,14);
const clean={WISHES:[]};
assert.equal(load(clean).install().added,13);
assert.equal(clean.WISHES.filter(x=>x[3]==="core").length,4);
assert(clean.WISHES.every(x=>Array.isArray(x)&&x.length===4&&x[1]==="food"&&x[2]===""),
 "All new suggestions use native Food category and flexible time");
assert.equal(load({}).install().ready,false,"Unknown private schema must be left untouched");
console.log("Food wishlist PASS: 13 curated stops, existing items preserved, deduplication, flexible days.");