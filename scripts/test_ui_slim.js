/* NOUX no-clutter release contract. Keeps encrypted trip and React navigation intact. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html'),sw=read('sw.js'),unlock=read('unlock.js');
const sync=read('sync.js'),departure=read('departure-kit.js');
const food=read('food-guide.js'),explorer=read('explorer.js');
const guide=read('decision-guide.js'),settings=read('trip-settings-tools.js');
const workflow=read('.github/workflows/pages.yml');
assert(!html.includes('travel-companion.js'),'Retired Travel Companion must not be loaded');
assert(!sw.includes('travel-companion.js'),'Offline pack must not reload retired UI');
assert(!workflow.match(/cp index\.html[^\n]*travel-companion\.js/),'Do not publish retired UI');
for(const file of ['decision-guide.js','trip-settings-tools.js']){
 assert(html.includes(file+'?v='),'New module included before unlock: '+file);
 assert(sw.includes(file+'?v='),'Encrypted offline pack includes new module: '+file);
 assert(workflow.includes(file),'GitHub Pages publishes new module: '+file);
}
assert(html.indexOf('decision-guide.js')<html.indexOf('unlock.js'),'Decision helper available at unlock');
assert(html.indexOf('trip-settings-tools.js')<html.indexOf('unlock.js'),'Trip Settings helper available at unlock');
assert(unlock.includes('NOUX_DECISION_GUIDE.install()')&&unlock.includes('NOUX_TRIP_TOOLS.install()'),'Install after React first paint');
assert(!unlock.includes('NOUX_COMPANION.install()'),'Retired companion no longer installed');
assert(!sync.includes('document.body.append(LAUNCHER)'),'Shared Sync has no permanent floating control');
assert(!departure.includes('document.body.append(LAUNCHER)'),'Packing and gifts has no permanent floating control');
assert(!food.includes('document.body.append(LAUNCHER)'),'Food hours has no permanent floating control');
assert(!guide.includes('noux-guide-launcher'),'Guided Decisions has no permanent floating control');
assert(!explorer.includes('NOUX_COMPANION'),'Explorer does not advertise duplicate Travel Companion');
assert(explorer.includes('Guide our decisions')&&explorer.includes('NOUX_DECISION_GUIDE.open()'),'Guided decision affordance inside existing Explore');
assert(settings.includes('nativeSettings()')&&settings.includes('modal-overlay > .modal'),'Shared tools appear only with native Trip Settings');
assert(settings.includes('window.NOUX_SYNC.open()')&&settings.includes('window.NOUX_DEPARTURE?.open?.()'),'Settings reuses existing functional modules');
assert(guide.includes("const JOURNAL='noux_choice_journal_v2'"),'Guided progress retains old sync key');
assert(sync.includes("PAIR_KEY='noux_sync_pair_aes_v1'")&&departure.includes("STORAGE='noux_departure_checklists_aes_v1'"),'Existing encrypted pairing and checklist keys preserved');
assert(!guide.includes("nyc_lyna_trip_v6',JSON.stringify")&&!guide.includes('NOUX_SYNC.refresh()'),'Guide does not create a second preference model');
console.log('NOUX slim UI PASS: one Explore launcher, native Settings sync, contextual decisions, no duplicate dashboards or data migrations.');
