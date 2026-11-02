const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {launch}=require('../../../tests/html-regression.cjs');
const tests=[],test=(name,fn)=>tests.push({name,fn}),plain=v=>JSON.parse(JSON.stringify(v));
const rows=t=>[...t.$('fl-grid').querySelectorAll('tbody tr')];
const chosen=t=>plain(t.w.ShadeCollection.chosen().map(b=>b.id));
const open=t=>t.click('fl-open'),config=b=>b.addons?.['blend-filters'];
const chooseRow=(t,index)=>{rows(t)[index].querySelector('[data-action="row"]').click();t.flush();};
const body=t=>t.model().balls;

test('fresh filter defaults are 132 degrees, half split and full opacity',t=>{
  open(t);assert.equal(t.$('fl-angle').value,'132');assert.equal(t.$('fl-split').value,'50');assert.equal(t.$('fl-opacity').value,'100');
  t.click('fl-apply');assert.equal(config(body(t)[0]).comparison.angle,132);assert.equal(config(body(t)[0]).comparison.split,.5);
});
test('all selected peers receive identical paint, mode and opacity after reopening an existing filter',t=>{
  open(t);t.set('fl-scope','same');t.set('fl-named-role','shadow');t.set('fl-angle','38','input');t.set('fl-split','23','input');t.set('fl-opacity','27','input');t.click('fl-apply');
  const before=t.model();t.click('select-all');const ids=chosen(t);open(t);assert.equal(t.$('fl-scope').value,'all');assert.deepEqual(chosen(t),ids);
  assert.equal(t.$('fl-angle').value,'132');assert.equal(t.$('fl-split').value,'50');
  t.set('fl-mode','screen');t.set('hex','#287BA5');t.set('fl-opacity','62.5','input');assert.deepEqual(chosen(t),ids);t.click('fl-apply');
  for(const b of body(t)){assert.deepEqual(Object.keys(config(b).roles).sort(),['base',...b.roles.map(r=>r.id)].sort());for(const c of Object.values(config(b).roles))assert.deepEqual(c,{enabled:true,mode:'screen',sourceRgb:[40,123,165],opacity:.625});}
  t.click('undo');assert.deepEqual(t.model(),before);t.click('redo');assert.ok(body(t).every(b=>config(b).roles.base.mode==='screen'));
});
test('expanding a reopened single-ball comparison gives new peers the same coverage',t=>{
  open(t);t.set('fl-scope','same');t.set('fl-named-role','shadow');t.click('fl-apply');open(t);assert.equal(t.$('fl-scope').value,'custom');t.click('select-all');assert.equal(t.$('fl-scope').value,'all');t.set('hex','#2566BA');t.click('fl-apply');
  for(const b of body(t)){assert.equal(Object.keys(config(b).roles).length,b.roles.length+1);assert.ok(Object.values(config(b).roles).every(c=>c.sourceRgb.join()==='37,102,186'));}
});
test('ball selector and column buttons keep the group, shared draft and active paint target',t=>{
  t.click('select-all');const before=t.model(),ids=chosen(t);open(t);t.set('hex','#4B98A2');t.set('fl-mode','overlay');t.set('fl-active-ball',ids[1]);
  assert.deepEqual(chosen(t),ids);assert.equal(t.$('selected-role').value,'addon:blend-filters:paint');assert.equal(t.$('fl-paint-hex').value,'#4B98A2');assert.match(t.$('fl-focus').textContent,/Midnight/);
  t.$('fl-grid').querySelector(`[data-action="ball"][data-ball="${ids[0]}"]`).click();t.flush();assert.equal(t.$('fl-active-ball').value,ids[0]);assert.deepEqual(chosen(t),ids);assert.deepEqual(t.model(),before);
  t.click('fl-apply');assert.ok(body(t).every(b=>config(b).roles.base.mode==='overlay'));
});
test('live gallery selection changes update targets; clear never silently filters the active ball',t=>{
  const before=t.model();open(t);t.click('select-all');assert.equal(t.$('fl-grid').querySelectorAll('tbody td').length,2);
  t.click('clear-selection');assert.equal(t.$('fl-grid').querySelectorAll('tbody td').length,0);t.click('fl-apply');assert.match(t.$('fl-status').textContent,/at least one/);assert.deepEqual(t.model(),before);
  t.click('select-all');t.set('fl-opacity','81','input');t.click('fl-apply');assert.ok(body(t).every(b=>config(b).roles.base.opacity===.81));
});
test('newly duplicated selected balls can receive a filter without stale or missing targets',t=>{
  open(t);t.click('duplicate-selected');assert.equal(body(t).length,3);assert.equal(t.$('fl-grid').querySelectorAll('tbody td').length,1);
  t.set('hex','#813FAC');t.click('fl-apply');assert.equal(body(t).filter(b=>config(b)?.roles.base).length,1);assert.equal(config(body(t)[1]).roles.base.sourceRgb.join(),[129,63,172].join());
});
test('main square and hue ring edit detached applied paint, keeping both selected balls',t=>{
  t.set('picker-shape','square');t.click('select-all');const before=t.model(),ids=chosen(t);open(t);t.set('hex','#3284BB');assert.equal(t.$('fl-paint').tagName,'BUTTON');
  t.$('wheel').getBoundingClientRect=()=>({left:0,top:0,width:320,height:320});
  t.event('wheel','pointerdown',{button:0,pointerId:1,clientX:84,clientY:236});t.event('wheel','pointermove',{pointerId:1,clientX:236,clientY:160});t.event('wheel','pointerup',{pointerId:1});
  assert.equal(t.$('fl-paint-hex').value,'#0099FF');assert.deepEqual(t.model(),before);assert.deepEqual(chosen(t),ids);
  t.event('wheel','pointerdown',{button:0,pointerId:2,clientX:t.w.Shade.wheelPoint(0)[0],clientY:t.w.Shade.wheelPoint(0)[1]});t.event('wheel','pointerup',{pointerId:2});assert.equal(t.$('fl-paint-hex').value,'#FF0000');assert.equal(t.$('hex').value,'#FF0000');
  t.click('fl-apply');assert.ok(body(t).every(b=>config(b).roles.base.sourceRgb.join()==='255,0,0'));t.click('undo');assert.deepEqual(t.model(),before);
});
test('canceling square drag restores all draft row settings and creates no Undo entry',t=>{
  t.set('picker-shape','square');open(t);t.click('fl-add-row');t.set('hex','#4B81AC');t.set('fl-opacity','64','input');const before=t.model(),image=rows(t)[1].querySelector('canvas').toDataURL();
  t.$('wheel').getBoundingClientRect=()=>({left:0,top:0,width:320,height:320});t.event('wheel','pointerdown',{button:0,pointerId:8,clientX:84,clientY:236});t.event('wheel','pointermove',{pointerId:8,clientX:236,clientY:160});assert.notEqual(t.$('fl-paint-hex').value,'#4B81AC');
  t.event('wheel','pointercancel',{pointerId:8});assert.equal(t.$('fl-paint-hex').value,'#4B81AC');assert.equal(t.$('fl-opacity').value,'64');assert.equal(rows(t)[1].querySelector('canvas').toDataURL(),image);assert.deepEqual(t.model(),before);
});
test('changing filter controls during a picker drag preserves the new value and ends that gesture',t=>{
  t.set('picker-shape','square');open(t);t.$('wheel').getBoundingClientRect=()=>({left:0,top:0,width:320,height:320});
  t.event('wheel','pointerdown',{button:0,pointerId:5,clientX:160,clientY:160});t.set('fl-opacity','42','input');assert.equal(t.$('fl-opacity').value,'42');const paint=t.$('fl-paint-hex').value;
  t.event('wheel','pointermove',{pointerId:5,clientX:236,clientY:160});assert.equal(t.$('fl-paint-hex').value,paint);t.set('fl-mode','screen');t.click('fl-apply');assert.equal(config(body(t)[0]).roles.base.opacity,.42);assert.equal(config(body(t)[0]).roles.base.mode,'screen');
});
test('main numeric channels and local HEX synchronize; gray retains the chosen hue',t=>{
  open(t);t.set('hex','#808080');t.set('number-H','120');assert.equal(t.$('number-H').value,'120');assert.equal(t.$('fl-paint-hex').value,'#808080');t.set('number-S','100');t.set('number-L','50');assert.equal(t.$('fl-paint-hex').value,'#00FF00');
  t.set('fl-paint-hex','#8437BA');assert.equal(t.$('hex').value,'#8437BA');t.set('color-model','RGB');t.set('number-R','18');t.set('number-G','52');t.set('number-B','86');assert.equal(t.$('fl-paint-hex').value,'#123456');
});
test('switching the inspected filter row routes the main picker to that row only',t=>{
  open(t);t.set('hex','#234567');t.click('fl-add-row');t.set('hex','#B37826');chooseRow(t,0);assert.equal(t.$('hex').value,'#234567');t.set('hex','#397B52');
  chooseRow(t,1);assert.equal(t.$('hex').value,'#B37826');chooseRow(t,0);assert.equal(t.$('fl-paint-hex').value,'#397B52');
});
test('compare toggle retains rows, selected settings and other manual alternatives without accumulating',t=>{
  const before=t.model();open(t);t.set('hex','#255D90');t.click('fl-add-row');t.set('fl-mode','screen');t.set('fl-opacity','47','input');t.click('fl-compare-all');assert.equal(rows(t).length,12);assert.equal(t.$('fl-compare-all').getAttribute('aria-pressed'),'true');assert.equal(t.$('fl-add-row').disabled,true);
  t.set('fl-mode','difference');t.set('fl-opacity','23','input');const ids=rows(t).map(n=>n.dataset.row);t.click('fl-compare-all');assert.equal(rows(t).length,2);assert.equal(t.$('fl-mode').value,'difference');assert.equal(t.$('fl-opacity').value,'23');
  for(let i=0;i<3;i++){t.click('fl-compare-all');assert.deepEqual(rows(t).map(n=>n.dataset.row),ids);t.set('fl-mode','difference');assert.equal(t.$('fl-opacity').value,'23');t.click('fl-compare-all');assert.equal(rows(t).length,2);}
  chooseRow(t,0);assert.equal(t.$('fl-mode').value,'multiply');assert.equal(t.$('fl-paint-hex').value,'#255D90');assert.deepEqual(t.model(),before);
});
test('mode selection in compare all selects a unique existing row; paint edits stay independent',t=>{
  open(t);t.click('fl-compare-all');t.set('fl-mode','difference');t.set('hex','#174A92');t.set('fl-opacity','39','input');assert.equal(rows(t).length,12);
  assert.equal(new Set(rows(t).map(r=>r.querySelector('[data-action="row"]').textContent)).size,12);chooseRow(t,0);assert.notEqual(t.$('hex').value,'#174A92');t.set('fl-mode','difference');assert.equal(t.$('hex').value,'#174A92');t.click('fl-apply');assert.equal(config(body(t)[0]).roles.base.mode,'difference');assert.equal(config(body(t)[0]).roles.base.opacity,.39);
});
test('saved studies preserve the toggle, cached settings and normal alternatives across reload',async t=>{
  open(t);t.click('fl-add-row');t.click('fl-compare-all');t.set('fl-mode','hard-light');t.set('hex','#327ABC');t.set('fl-opacity','51.5','input');t.set('fl-study-name','Toggled');t.click('fl-save-study');const data=t.model();assert.equal(data.addons['blend-filters'].studies[0].compareAll,true);
  const r=launch(JSON.stringify(data),{realCanvas:true});try{await r.w.ShadeReady;open(r);r.$('fl-study').selectedIndex=1;r.click('fl-load-study');assert.equal(rows(r).length,12);assert.equal(r.$('fl-compare-all').getAttribute('aria-pressed'),'true');r.set('fl-mode','hard-light');assert.equal(r.$('hex').value,'#327ABC');assert.equal(r.$('fl-opacity').value,'51.5');r.click('fl-compare-all');assert.equal(rows(r).length,2);r.click('fl-save-study');const s=r.model().addons['blend-filters'].studies.at(-1);assert.equal(s.compareAll,false);assert.equal(s.comparisonRows.length,12);r.click('fl-load-study');r.click('fl-compare-all');r.set('fl-mode','hard-light');assert.equal(r.$('fl-opacity').value,'51.5');}finally{await r.close();}
});
test('untargeted chips cannot continue editing or displaying stale inspection arrows',t=>{
  t.click('select-all');open(t);const chip=t.$('fl-grid').querySelector('[data-action="color"]');chip.click();t.flush();assert.equal(t.$('fl-original').disabled,false);
  const n=t.$('fl-targets').querySelector(`input[data-ball="${chip.dataset.ball}"]:not([data-role])`);n.checked=false;t.event(n,'change');assert.equal(t.$('fl-original').disabled,true);assert.equal(t.$('fl-original').value,'');assert.equal(t.$('fl-delta').textContent,'');
});
test('closing or disabling releases draft paint target and preserves group selection and original colors',t=>{
  t.click('select-all');const before=t.model(),ids=chosen(t);open(t);t.set('hex','#6D237B');t.click('fl-close');assert.deepEqual(t.model(),before);assert.deepEqual(chosen(t),ids);assert.equal(t.$('selected-role').value,'base');assert.ok(![...t.$('selected-role').options].some(n=>n.value==='addon:blend-filters:paint'));
  open(t);t.w.ShadeAddons.disable('blend-filters');assert.equal(t.$('selected-role').value,'base');assert.equal(t.$('fl-dialog'),null);t.w.ShadeAddons.enable('blend-filters');assert.equal(t.w.document.querySelectorAll('#fl-open').length,1);assert.deepEqual(t.model(),before);
});
test('invalid drafts cannot copy misleading values and malformed comparison caches are rejected',async t=>{
  open(t);t.set('fl-opacity','101','input');t.$('fl-copy-values').click();await new Promise(r=>setImmediate(r));assert.match(t.$('fl-status').textContent,/invalid preview/);assert.equal(t.$('fl-values').hidden,true);
  const s=t.w.ShadeAddons.service('blend-filters'),row=s.row(),study={id:'test',name:'Test',ballIds:[],rows:[row],split:.5,arrows:true,labels:true,comparisonRows:[row]};assert.throws(()=>s.checkStudy(study),/all-filter/);
});

(async()=>{let failed=0;for(const {name,fn}of tests){const t=launch(undefined,{realCanvas:true});try{await t.w.ShadeReady;await fn(t);assert.equal(t.errors.length,0,t.errors.join('\n'));assert.ok(!t.w.ShadeAddons.list().some(a=>a.state==='failed'));console.log('PASS',name);}catch(e){failed++;console.log('FAIL',name,'\n',e.stack);}finally{await t.close();}}console.log(`${tests.length-failed}/${tests.length} filter selection checks passed`);process.exitCode=failed?1:0;})();
