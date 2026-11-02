const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {IDBFactory} = require('fake-indexeddb');
const {launch} = require('../../../tests/html-regression.cjs');
const tests = [], test = (name, fn) => tests.push({name, fn});
const plain = value => JSON.parse(JSON.stringify(value));
const data = canvas => canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
const toggle = (t, key) => t.click('picker-grayscale-' + key);
const ball = t => t.model().balls[0];
const ring = (x, y) => (x + .5 - 320) ** 2 + (y + .5 - 320) ** 2 >= 248 ** 2;
function grayscale(pixels, predicate = () => true) {
  let visible = 0;
  for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] > 10 && predicate((i / 4) % 640, Math.floor(i / 4 / 640))) {
    visible++;
    if (pixels[i] !== pixels[i + 1] || pixels[i + 1] !== pixels[i + 2]) return false;
  }
  assert.ok(visible > 0, 'must inspect visible pixels'); return true;
}
function pixelsMatch(a, b, predicate) {
  for (let i = 0; i < a.length; i += 4) if (a[i + 3] === 255 && predicate((i / 4) % 640, Math.floor(i / 4 / 640))) {
    assert.deepEqual([...b.slice(i, i + 4)], [...a.slice(i, i + 4)], 'changed unrelated pixel at ' + i / 4);
  }
}
test('starts in color with no saved data, ball changes or Undo entry', t => {
  assert.equal(t.w.ShadeAddons.list().find(p => p.id === 'picker-grayscale').state, 'active');
  assert.equal(t.model().addons, undefined); assert.equal(t.$('undo').disabled, true);
  assert.equal(t.$('picker-grayscale-wheel').checked, false); assert.equal(t.$('picker-grayscale-surface').checked, false);
  assert.equal(grayscale(data(t.$('wheel')), ring), false); assert.equal(grayscale(data(t.$('wheel')), (x,y) => !ring(x,y)), false);
});
test('wheel filter changes only ring pixels, including their marker fills', t => {
  t.set('picker-shape', 'square'); const before = data(t.$('wheel')), project = t.model();
  toggle(t, 'wheel'); const after = data(t.$('wheel'));
  assert.equal(grayscale(after, ring), true); assert.equal(grayscale(after, (x,y) => !ring(x,y)), false);
  pixelsMatch(before, after, (x,y) => !ring(x,y)); assert.deepEqual(t.model().balls, project.balls);
  for (let i = 3; i < before.length; i += 4) assert.equal(after[i], before[i], 'alpha changed');
});
test('surface filter covers square and triangle while retaining ring colors', t => {
  toggle(t, 'surface');
  for (const shape of ['square', 'triangle']) {
    t.set('picker-shape', shape); const after = data(t.$('wheel'));
    assert.equal(grayscale(after, (x,y) => !ring(x,y)), true); assert.equal(grayscale(after, ring), false);
    toggle(t, 'surface'); const before = data(t.$('wheel')); toggle(t, 'surface');
    pixelsMatch(before, data(t.$('wheel')), ring);
  }
});
test('both filters produce weighted grayscale and turning them off restores every pixel', t => {
  const before = data(t.$('wheel')), png = t.$('wheel').toDataURL();
  toggle(t, 'wheel'); toggle(t, 'surface'); const after = data(t.$('wheel'));
  assert.equal(grayscale(after), true);
  for (let i = 0; i < before.length; i += 4) if (before[i + 3] === 255) {
    const expected = Math.floor((299 * before[i] + 587 * before[i + 1] + 114 * before[i + 2]) / 1000);
    assert.equal(after[i], expected); assert.equal(after[i + 3], before[i + 3]);
  }
  const out = path.resolve(__dirname, '../../../tests/artifacts'); fs.mkdirSync(out, {recursive: true});
  fs.writeFileSync(path.join(out, 'picker-grayscale-triangle.png'), t.$('wheel')._native.toBuffer('image/png'));
  toggle(t, 'wheel'); toggle(t, 'surface'); assert.equal(t.$('wheel').toDataURL(), png);
  t.set('picker-shape', 'square'); toggle(t, 'surface');
  fs.writeFileSync(path.join(out, 'picker-grayscale-square-only.png'), t.$('wheel')._native.toBuffer('image/png'));
});
test('each setting is one Undo step and does not rewrite any ball or color', t => {
  const before = t.model(), colors = plain(t.w.Shade.resolve(ball(t))), png = t.$('wheel').toDataURL();
  toggle(t, 'wheel'); const wheelOnly = t.model(); toggle(t, 'surface');
  assert.deepEqual(plain(t.w.Shade.resolve(ball(t))), colors); assert.deepEqual(t.model().balls, before.balls);
  t.click('undo'); assert.deepEqual(t.model(), wheelOnly); assert.equal(t.$('picker-grayscale-surface').checked, false);
  t.click('undo'); assert.deepEqual(t.model(), before); assert.equal(t.$('wheel').toDataURL(), png);
  t.click('redo'); t.click('redo'); assert.equal(grayscale(data(t.$('wheel'))), true);
});
test('all tool editor pickers honor the filters and ball previews remain colored', t => {
  toggle(t, 'wheel'); toggle(t, 'surface');
  for (const id of ['harmony', 'color-areas', 'line-guides']) {
    t.click(id + '-edit'); const canvas = t.$(id + '-wheel'); assert.equal(grayscale(data(canvas)), true, id);
    const preview = [...t.$(id + '-dialog').querySelectorAll('canvas')].find(c => c !== canvas);
    assert.equal(grayscale(data(preview)), false, 'artwork must stay colored'); t.click(id + '-cancel');
  }
});
test('gallery, comparison, color readouts and exported PNGs are unaffected', t => {
  const E = t.w.Shade, R = t.w.ShadeRender, before = ball(t), hex = t.$('hex').value;
  const gallery = t.$('gallery').querySelector('canvas').toDataURL();
  const png = R.exportCanvas([before], 'both', 1024, 'transparent', false).toDataURL();
  t.click('select-all'); t.click('compare-balls'); const comparison = t.$('compare-wheel').toDataURL(); t.click('compare-close');
  toggle(t, 'wheel'); toggle(t, 'surface');
  assert.deepEqual(ball(t), before); assert.equal(t.$('hex').value, hex);
  assert.deepEqual(plain(E.resolve(ball(t))), plain(E.resolve(before)));
  assert.equal(t.$('gallery').querySelector('canvas').toDataURL(), gallery);
  assert.equal(R.exportCanvas([ball(t)], 'both', 1024, 'transparent', false).toDataURL(), png);
  t.click('compare-balls'); assert.equal(t.$('compare-wheel').toDataURL(), comparison);
});
test('dragging and hue wrapping still edit the actual colors under the filter', t => {
  toggle(t, 'wheel'); toggle(t, 'surface'); t.click('harmony-edit'); t.set('harmony-mode','triadic'); t.click('harmony-apply');
  const E = t.w.Shade, R = t.w.ShadeRender, canvas = t.$('wheel');
  canvas.getBoundingClientRect = () => ({left:0,top:0,width:320,height:320});
  t.set('number-H', '359'); const m = R.drawWheel(canvas, ball(t), 'base', [], 'triangle').find(p => p.id === 'base' && p.kind === 'hue');
  const pointer = (type,x,y) => t.event(canvas,type,{button:0,pointerId:3,clientX:x,clientY:y});
  pointer('pointerdown',m.x,m.y); const a = E.wheelAngle(4), r = Math.hypot(m.x-160,m.y-160);
  pointer('pointermove',160+r*Math.cos(a),160+r*Math.sin(a)); pointer('pointerup',160+r*Math.cos(a),160+r*Math.sin(a));
  assert.ok(Math.abs(E.resolve(ball(t)).base[0]-4)<1e-6); assert.equal(grayscale(data(canvas)),true);
  const before = t.model(); t.click('harmony-edit'); t.set('harmony-active','highlight');
  const shape = t.model().pickerShape || 'triangle', p = E.pickerPoint(E.resolve(ball(t)).highlight,shape), dialogCanvas = t.$('harmony-wheel');
  dialogCanvas.getBoundingClientRect = canvas.getBoundingClientRect;
  t.event(dialogCanvas,'pointerdown',{button:0,pointerId:4,clientX:p[0],clientY:p[1]});
  t.event(dialogCanvas,'pointermove',{pointerId:4,clientX:p[0]+8,clientY:p[1]+6});
  t.event(dialogCanvas,'pointercancel',{pointerId:4}); t.click('harmony-cancel'); assert.deepEqual(t.model(),before);
});
test('project JSON and local saving restore filters before ShadeReady completes', async t => {
  toggle(t,'wheel'); toggle(t,'surface'); const saved=t.model();
  const doc=t.w.Shade.normalizeDocument(plain(saved)); assert.deepEqual(plain(doc.addons),saved.addons);
  await t.w.ShadeStudio.save(saved);
  for(const restored of [launch(JSON.stringify(saved),{realCanvas:true}),launch(undefined,{realCanvas:true,db:t.w.indexedDB})]) {
    try {await restored.w.ShadeReady; assert.deepEqual(restored.model(),saved); assert.equal(restored.$('picker-grayscale-wheel').checked,true); assert.equal(restored.$('picker-grayscale-surface').checked,true); assert.equal(grayscale(data(restored.$('wheel'))),true);}
    finally {await restored.close();}
  }
});
test('disable releases controls and filter; reenable restores saved settings', t => {
  const png=t.$('wheel').toDataURL(); toggle(t,'wheel'); toggle(t,'surface'); const saved=t.model();
  t.w.ShadeAddons.disable('picker-grayscale'); t.flush(); assert.equal(t.$('picker-grayscale-wheel'),null); assert.equal(t.$('wheel').toDataURL(),png); assert.deepEqual(t.model(),saved);
  t.w.ShadeAddons.enable('picker-grayscale'); t.flush(); assert.equal(grayscale(data(t.$('wheel'))),true); assert.deepEqual(t.model(),saved);
  assert.equal(t.w.document.querySelectorAll('#picker-grayscale-wheel').length,1);
});
test('unknown settings stay stored and inactive until explicitly changed', async t => {
  const saved=t.model(); saved.addons={'picker-grayscale':{version:99,wheel:true,surface:true,note:'retain'}};
  const restored=launch(JSON.stringify(saved),{realCanvas:true});
  try {await restored.w.ShadeReady; assert.deepEqual(restored.model().addons,saved.addons); assert.equal(grayscale(data(restored.$('wheel'))),false); assert.equal(restored.$('picker-grayscale-wheel').checked,false); toggle(restored,'wheel'); assert.deepEqual(restored.model().addons['picker-grayscale'],{version:1,wheel:true,surface:false});restored.click('undo');assert.deepEqual(restored.model().addons,saved.addons);}
  finally {await restored.close();}
});
test('fixed temperature guideline and independent artwork grayscale remain intact', t => {
  assert.equal(t.$('temperature-visible').checked,true);t.click('temperature-visible');t.click('temperature-visible'); const guide=plain(t.model().temperatureGuide); toggle(t,'wheel'); toggle(t,'surface');
  assert.deepEqual(guide,{visible:true,start:90,end:270});assert.deepEqual(t.model().temperatureGuide,guide);
  t.click('selection-gray'); const b=ball(t); assert.equal(b.grayscale,true); toggle(t,'wheel'); toggle(t,'surface');
  assert.equal(ball(t).grayscale,true); assert.equal(grayscale(data(t.$('wheel'))),false); assert.deepEqual(t.model().temperatureGuide,guide);
});
(async()=>{let failed=0;for(const {name,fn}of tests){const t=launch(undefined,{realCanvas:true,db:new IDBFactory()});try{await t.w.ShadeReady;await fn(t);assert.equal(t.errors.length,0,t.errors.join('\n'));console.log('PASS',name);}catch(error){failed++;console.log('FAIL',name,'\n',error.stack);}finally{await t.close();}}console.log(`${tests.length-failed}/${tests.length} picker grayscale checks passed`);process.exitCode=failed?1:0;})();
