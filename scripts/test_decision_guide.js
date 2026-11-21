/* NOUX slim Decisions guide: synthetic regression only. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('decision-guide.js','utf8');
new vm.Script(code,{filename:'decision-guide.js'});
assert(!/NOUX_PASSPHRASE|private\.vault\.json|Sanctuary Hotel/.test(code),'No private data in public guide');
class Node{
 constructor(tag){this.tagName=tag;this.className='';this.id='';this._text='';this.children=[];this.listeners={};this.style={};this.attrs={};this.hidden=false;this.value='';this.classList={add(){},remove(){}}}
 set textContent(value){this._text=String(value)}
 get textContent(){return this._text+this.children.map(x=>x.textContent||'').join('')}
 append(...v){this.children.push(...v)}
 appendChild(v){this.append(v);return v}
 replaceChildren(...v){this.children=[];this.append(...v)}
 setAttribute(k,v){this.attrs[k]=v}
 addEventListener(k,f){this.listeners[k]=f}
 querySelector(s){return walk(this).find(x=>s.startsWith('.')?x.className.split(' ').includes(s.slice(1)):s.startsWith('#')?x.id===s.slice(1):x.tagName===s)||null}
 querySelectorAll(s){return walk(this).filter(x=>s.startsWith('.')?x.className.split(' ').includes(s.slice(1)):s.startsWith('#')?x.id===s.slice(1):x.tagName===s)}
 scrollIntoView(){}
 focus(){}
 click(){this.listeners.click?.()}
}
const walk=n=>[n,...n.children.flatMap(walk)];
const choices=[
 {id:'c1',day:'mon',title:'First evening',desc:'Dinner',options:[['rest','Quiet dinner','Nearby'],['rooftop','Rooftop dinner','Views']]},
 {id:'c6',day:'tue',title:'Cultural trail',options:[['butterflies','Butterfly Vivarium','Museum'],['all','Do all','Intensive']]},
 {id:'c9',day:'wed',title:'Wednesday afternoon',options:[['manhattan','Manhattan walk','Nearby'],['williamsburg','Williamsburg','Brooklyn']]}
];
const w={NYC_DATA:{CHOICES:choices,DEFAULT:{c1:'rest',c6:'butterflies',c9:'manhattan'}}};
const state={nyc_lyna_trip_v6:JSON.stringify({choices:{c1:'rest',c9:'williamsburg'}})};
const storage={getItem:k=>state[k]??null,setItem:(k,v)=>{state[k]=v}};
const body=new Node('body'),privateApp=new Node('main'),current=new Node('div');current.textContent='React-owned itinerary';privateApp.append(current);
let navCount=0,chosenCount=0,changes=0;
const native=new Node('div');native.id='decision-c1';
const option=new Node('button');option.className='choice-row';option.textContent='Rooftop dinner Views';option.addEventListener('click',()=>{chosenCount++});native.append(option);
const nav=new Node('button');nav.textContent='Decisions';nav.addEventListener('click',()=>{navCount++});
const doc={body,createElement:t=>new Node(t),
 getElementById:id=>id==='decision-c1'?native:id==='root'?privateApp:walk(body).find(x=>x.id===id)||null,
 querySelectorAll:sel=>sel==='.topbar .mainnav button'?[nav]:[],
 addEventListener(){},dispatchEvent(){changes++}};
const ctx={window:w,document:doc,localStorage:storage,Array,Object,JSON,Date,Math,String,Set,CustomEvent:class{},setTimeout:fn=>{fn();return 1}};
vm.runInNewContext(code,ctx,{filename:'decision-guide.js'});
const guide=w.NOUX_DECISION_GUIDE;
assert(guide.install());
assert.equal(guide.decisions().length,3,'All native decisions included');
assert.equal(privateApp.children.length,1,'React DOM untouched');
assert(!walk(body).some(x=>/launch|companion/i.test(x.className)),'No floating guide launcher');
assert(guide.open());
const panel=doc.getElementById('noux-decision-guide');
assert(panel&&!panel.hidden);
assert(panel.textContent.includes('First evening'),'First decision title shown');
assert(panel.textContent.includes('Currently selected'),'Existing choice shown');
walk(panel).find(x=>x.tagName==='button'&&x.textContent==='Decide later').click();
let journal=JSON.parse(storage.getItem('noux_choice_journal_v2'));
assert(journal.nouxPassport.Lyna.deferred['choice:c1'],'Lyna postponement persists');
assert(changes>0,'Review markers trigger shared sync');
const select=walk(panel).find(x=>x.tagName==='select');
select.value='Benjamin';select.listeners.change();
walk(panel).find(x=>x.tagName==='button'&&x.textContent==='Reviewed').click();
journal=JSON.parse(storage.getItem('noux_choice_journal_v2'));
assert(journal.nouxPassport.Benjamin.reviewed['choice:c1'],'Benjamin progress is independent');
assert(journal.nouxPassport.Lyna.deferred['choice:c1'],'Lyna pending decision retained');
select.value='Lyna';select.listeners.change();
walk(panel).filter(x=>x.tagName==='button'&&x.textContent==='Choose')[1].click();
assert.equal(navCount,1,'Guide opens native Decisions tab');
assert.equal(chosenCount,1,'Guide delegates through native option control');
assert(JSON.parse(storage.getItem('noux_choice_journal_v2')).nouxPassport.Lyna.reviewed['choice:c1'],'Selection stamps review');
assert.equal(privateApp.children.length,1,'Native React DOM unchanged after selection');
console.log('Decision guide PASS: original choices, independent stamps, deferred decisions and no duplicate UI.');
