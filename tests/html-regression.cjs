// HTML-only regression checks. Runs production scripts against a simulated DOM.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const before = process.argv.includes('--before');
const portable = process.argv.includes('--portable');
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

function launch(saved, options = {}) {
  const html = options.html || fs.readFileSync(path.join(root, portable ? 'Shade Lab.html' : 'web/index.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://shade-lab.test/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, errors = [], frames = new Map();
  if (options.db) w.indexedDB = options.db;
  w.structuredClone = structuredClone;
  w.TextEncoder = TextEncoder;
  let nextFrame = 0;
  w.addEventListener('error', event => { errors.push(event.error || event.message); event.preventDefault(); });
  w.requestAnimationFrame = fn => { const id = ++nextFrame; frames.set(id, fn); return id; };
  w.cancelAnimationFrame = id => frames.delete(id);
  w.HTMLCanvasElement.prototype.getContext = function () {
    if (!this._context) this._context = new Proxy({
      canvas: this, draws: 0,
      measureText(text) { return { width: String(text).length * 7 }; },
      drawImage() { this.draws++; },
      createImageData(width, height) { return { data: new Uint8ClampedArray(width * height * 4) }; },
      getImageData() { return { data: new Uint8ClampedArray([1, 0, 0, 255]) }; }
    }, { get(target, key) { return key in target ? target[key] : () => {}; } });
    return this._context;
  };
  w.HTMLCanvasElement.prototype.toBlob = function (fn) { fn(new w.Blob(['png'], { type: 'image/png' })); };
  w.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,iVBORw0KGgo=';
  if (options.realCanvas) {
    const { createCanvas, Image } = require('@napi-rs/canvas');
    const native = el => {
      if (!el._native) el._native = createCanvas(Math.max(1, el.width), Math.max(1, el.height));
      if (el._native.width !== Math.max(1, el.width)) el._native.width = Math.max(1, el.width);
      if (el._native.height !== Math.max(1, el.height)) el._native.height = Math.max(1, el.height);
      return el._native;
    };
    w.HTMLCanvasElement.prototype.getContext = function () {
      const ctx = native(this).getContext('2d');
      return new Proxy(ctx, {
        get(target, key) {
          if (key === 'drawImage') return (source, ...args) => target.drawImage(source instanceof w.HTMLCanvasElement ? native(source) : source, ...args);
          const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
        }, set(target, key, value) { target[key] = value; return true; }
      });
    };
    w.HTMLCanvasElement.prototype.toDataURL = function () { return native(this).toDataURL('image/png'); };
    w.HTMLCanvasElement.prototype.toBlob = function (fn) { fn(new w.Blob([native(this).toBuffer('image/png')], { type: 'image/png' })); };
    w.Image = Image;
  }
  w.HTMLElement.prototype.setPointerCapture = () => {};
  w.HTMLElement.prototype.releasePointerCapture = () => {};
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; };
  w.URL.createObjectURL = () => 'blob:qa';
  w.URL.revokeObjectURL = () => {};
  w.HTMLAnchorElement.prototype.click = () => {};
  const picks = [];
  w.EyeDropper = class { async open() { return { sRGBHex: picks.shift() || '#010000' }; } };
  if (saved) w.localStorage.setItem('shadelab-v1', saved);
  const bundledScripts = portable ? [...w.document.querySelectorAll('script')].map(el => el.textContent) : [];
  if (portable) {
    assert.equal(bundledScripts.length, 8, 'portable file must contain the six core scripts, add-on host, and add-on bundle');
    assert.equal(w.document.querySelectorAll('script[src], link[rel="stylesheet"]').length, 0, 'portable file must work without external script or style files');
  }
  for (const [index, name] of (before ? ['engine', 'render', 'app'] : ['engine', 'assets', 'render', 'studio', 'collection', 'addons', 'bundle', 'app']).entries()) {
    const source = before ? path.join(__dirname, 'fixtures', name + '-before-fix.txt') : path.join(root, name === 'bundle' ? 'addons' : 'web', name + '.js');
    const script = portable ? bundledScripts[index] : name === 'bundle' && options.addonBundle !== undefined ? options.addonBundle : fs.readFileSync(source, 'utf8');
    w.eval(script + (name === 'app' ? '\nwindow.__testModel=()=>JSON.parse(JSON.stringify(project));' : ''));
  }
  const $ = id => w.document.getElementById(id);
  function flush() {
    for (let round = 0; frames.size && round < 20; round++) {
      const batch = [...frames.values()]; frames.clear(); batch.forEach(fn => fn(w.performance.now()));
    }
    assert.equal(frames.size, 0, 'render loop must settle');
  }
  function event(id, name, props = {}) {
    const el = typeof id === 'string' ? $(id) : id;
    const e = new w.Event(name, { bubbles: true });
    for (const [key, value] of Object.entries(props)) Object.defineProperty(e, key, { value });
    el.dispatchEvent(e); flush();
  }
  function set(id, value, name = 'change') { $(id).value = value; event(id, name); }
  function click(id) { $(id).click(); flush(); if (id === 'add-ball' && !before) { $('new-create').click(); flush(); } }
  const model = () => JSON.parse(JSON.stringify(w.__testModel()));
  return { w, $, picks, errors, flush, event, set, click, model, close: () => Promise.resolve(w.ShadeReady).finally(() => dom.window.close()) };
}

test('screen picks cannot poison the project with floating-point saturation', async t => {
  for (const hex of ['#ff0000', '#010000', '#000001', '#000200', '#fefffe', '#123456']) {
    t.picks.push(hex); await t.$('eyedropper').onclick(); t.flush();
    assert.equal(t.$('hex').value.toUpperCase(), hex.toUpperCase());
    t.click('add-ball');
  }
  assert.equal(t.model().balls.length, 8, 'adding balls must still work after repeated screen picks');
  for (const sample of t.model().samples) assert.ok(sample[1] <= 100);
});

test('a rejected slider edit leaves the previous color and every other control usable', t => {
  t.set('selected-role', 'highlight');
  t.$('expression-fields').querySelector('[data-channel="L"]').value = '50 / H';
  t.click('apply-formulas');
  t.set('selected-role', 'base');
  const prior = t.model().balls[0].base;
  t.event('slider-H', 'pointerdown'); t.set('slider-H', '0', 'input'); t.event('slider-H', 'change');
  assert.deepEqual(t.model().balls[0].base, prior, 'invalid arithmetic must roll back the edit');
  t.click('add-ball'); assert.equal(t.model().balls.length, 3);
  assert.equal(t.errors.length, 0, 'no uncaught render errors');
});

test('committing a number does not remove the control that the next click targets', t => {
  const target = t.$('gallery').querySelector('.swatch');
  const check = t.$('analysis-roles').querySelector('input');
  t.set('number-S', '60');
  assert.ok(target.isConnected, 'swatch must survive blur/change processing');
  assert.ok(check.isConnected, 'checkbox must survive blur/change processing');
  target.click(); t.flush();
});

test('dragging one ball reuses previews and leaves other balls unpainted', t => {
  for (let i = 0; i < 30; i++) t.click('add-ball');
  const canvas = t.$('gallery').querySelector('canvas'), context = canvas.getContext('2d'), draws = context.draws;
  t.event('slider-H', 'pointerdown');
  for (let i = 0; i < 40; i++) t.set('slider-H', String(i * 7), 'input');
  t.event('slider-H', 'change');
  assert.equal(t.$('gallery').querySelector('canvas'), canvas, 'gallery canvas identity must be stable');
  assert.equal(context.draws, draws, 'unchanged ball previews must not be repainted');
  assert.equal(t.errors.length, 0);
});

test('old saved rounding errors recover without dropping balls or samples', t => {
  const data = t.model(); data.balls.push({ ...structuredClone(data.balls[0]), id: 'saved-third', name: 'Keep my study' });
  data.samples = [[0, 100.00000000000036, 0.19607843137254902]];
  const restored = launch(JSON.stringify(data));
  try {
    assert.equal(restored.model().balls.length, 3);
    assert.equal(restored.model().balls[2].name, 'Keep my study');
    assert.equal(restored.model().samples[0][1], 100);
    restored.click('add-ball'); assert.equal(restored.model().balls.length, 4);
  } finally { restored.close(); }
});

test('rejected locked color pick is not half-applied to samples or the ball', async t => {
  t.click('color-pick-lock');
  t.set('selected-role', 'highlight');
  t.$('expression-fields').querySelector('[data-channel="L"]').value = '50 / H';
  t.click('apply-formulas'); t.set('selected-role', 'base');
  const prior = t.model();
  t.picks.push('#ff0000'); await t.$('eyedropper').onclick(); t.flush();
  assert.deepEqual(t.model(), prior);
  t.click('add-ball'); assert.equal(t.model().balls.length, 3);
});

test('samples, selection and ball count survive Undo and Redo together', async t => {
  t.picks.push('#123456'); await t.$('eyedropper').onclick(); t.flush();
  assert.equal(t.model().samples.length, 1);
  t.click('undo'); assert.equal(t.model().samples?.length || 0, 0);
  t.click('redo'); assert.equal(t.model().samples.length, 1);
  t.click('sample-study'); assert.equal(t.model().balls.length, 3);
  t.click('undo'); assert.equal(t.model().balls.length, 2);
  t.click('redo'); assert.equal(t.model().balls.length, 3);
  assert.equal(t.errors.length, 0);
});

test('an interrupted wheel gesture cannot keep changing the next ball', t => {
  t.$('wheel').getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 320 });
  t.event('wheel', 'pointerdown', { button: 0, pointerId: 1, clientX: 302, clientY: 160 });
  assert.equal(t.w.document.body.classList.contains('dragging'), true);
  t.click('add-ball');
  const prior = t.model();
  t.event('wheel', 'pointermove', { pointerId: 1, clientX: 160, clientY: 302 });
  assert.deepEqual(t.model(), prior, 'moving the pointer after switching balls must not edit the new ball');
  assert.equal(t.w.document.body.classList.contains('dragging'), false);
});

test('screen picker cancellation and repeated requests always restore the button', async t => {
  let cancel, opened = 0;
  t.w.EyeDropper = class { open() { opened++; return new Promise((resolve, reject) => { cancel = reject; }); } };
  const pending = t.$('eyedropper').onclick();
  assert.equal(t.$('eyedropper').disabled, true);
  await t.$('eyedropper').onclick();
  assert.equal(opened, 1, 'only one picker may be open');
  cancel(new t.w.DOMException('Cancelled', 'AbortError'));
  await pending;
  assert.equal(t.$('eyedropper').disabled, false);
  t.w.EyeDropper = class { async open() { return { sRGBHex: '#123456' }; } };
  await t.$('eyedropper').onclick(); t.flush();
  assert.equal(t.$('hex').value, '#123456');
});

test('full browser storage warns without blocking editing or sampling', async t => {
  t.w.ShadeStudio.save = async () => { throw Error('Automatic saving is unavailable or full. Editing still works; use Save project.'); };
  t.click('add-ball');
  t.event(t.w, 'pagehide');
  await Promise.resolve();
  assert.match(t.$('status').textContent, /Editing still works/);
  t.picks.push('#010000'); await t.$('eyedropper').onclick(); t.flush();
  assert.equal(t.$('hex').value, '#010000');
  t.click('add-ball'); assert.equal(t.model().balls.length, 4);
  assert.equal(t.errors.length, 0);
});

test('unrecoverable saved data remains available as a backup instead of being overwritten', t => {
  const data = t.model(); data.balls[0].base[1] = 101;
  const raw = JSON.stringify(data), restored = launch(raw);
  try {
    assert.equal(restored.$('recover-session').hidden, false);
    restored.click('add-ball'); restored.event(restored.w, 'pagehide');
    assert.equal(restored.w.localStorage.getItem('shadelab-v1'), raw);
    assert.equal(restored.errors.length, 0);
  } finally { restored.close(); }
});

test('sustained editing, sampling, checkboxes, export and reloading stay usable', async t => {
  for (let i = 0; i < 75; i++) {
    t.click('add-ball');
    t.set('number-H', String((i * 29) % 360));
    t.set('number-S', String(20 + i % 70));
    t.set('selected-role', 'shadow');
    t.picks.push(i % 2 ? '#010000' : '#498db2');
    await t.$('eyedropper').onclick(); t.flush();
    const check = t.$('analysis-roles').querySelector('input');
    check.click(); t.flush(); check.click(); t.flush();
    t.set('selected-role', 'base');
  }
  assert.equal(t.model().balls.length, 77);
  assert.equal(t.model().samples.length, 75);
  t.click('export'); t.click('download-png');
  assert.match(t.$('status').textContent, /PNG exported/);
  assert.equal(t.errors.length, 0);
  const restored = launch(JSON.stringify(t.model()));
  try {
    restored.click('add-ball'); assert.equal(restored.model().balls.length, 78);
    restored.picks.push('#000001'); await restored.$('eyedropper').onclick(); restored.flush();
    assert.equal(restored.$('hex').value, '#000001');
  } finally { restored.close(); }
});

test('overlapping project imports keep the latest request and suppress stale errors',async t=>{
 t.w.ShadeStudio.save=async()=>{};
 const choose=file=>Object.defineProperty(t.$('json-file'),'files',{configurable:true,value:[file]});
 let release;const delayed=new Promise(resolve=>release=resolve),old=t.model(),latest=t.model();old.name='Old request';latest.name='Latest request';
 choose({name:'old.json',text:()=>delayed});const pending=t.$('json-file').onchange();
 choose({name:'latest.json',text:async()=>JSON.stringify(latest)});await t.$('json-file').onchange();release(JSON.stringify(old));await pending;
 assert.equal(t.model().name,'Latest request');assert.match(t.$('status').textContent,/latest.json/);
 let reject;const failed=new Promise((_,r)=>reject=r);choose({name:'failed.json',text:()=>failed});const earlier=t.$('json-file').onchange();
 choose({name:'latest.json',text:async()=>JSON.stringify(latest)});await t.$('json-file').onchange();reject(Error('Old read failed'));await earlier;
 assert.equal(t.model().name,'Latest request');assert.match(t.$('status').textContent,/latest.json/);assert.equal(t.errors.length,0);
});
test('overlapping reference decodes keep the newest image and release every bitmap',async t=>{
 const requests=new Map(),closed=[];t.w.createImageBitmap=file=>new Promise(resolve=>requests.set(file.name,resolve));
 const choose=name=>{Object.defineProperty(t.$('image-file'),'files',{configurable:true,value:[{name}]});t.$('image-file').onchange();};
 const bitmap=(name,width)=>({width,height:width,close:()=>closed.push(name)});
 choose('old');choose('latest');requests.get('latest')(bitmap('latest',30));await new Promise(r=>setImmediate(r));
 requests.get('old')(bitmap('old',10));await new Promise(r=>setImmediate(r));
 assert.equal(t.$('reference').width,30);assert.deepEqual(closed.sort(),['latest','old']);assert.equal(t.errors.length,0);
});

module.exports = { launch };
if (require.main === module) (async () => {
  let failed = 0;
  for (const { name, fn } of tests) {
    const t = launch(); const start = performance.now();
    try { await t.w.ShadeReady; await fn(t); console.log('PASS', name, `(${Math.round(performance.now() - start)} ms)`); }
    catch (error) { failed++; console.log('FAIL', name, '\n ', error.message); }
    finally { t.close(); }
  }
  console.log(`${tests.length - failed}/${tests.length} passed${before ? ' against the original build' : portable ? ' in the standalone HTML' : ''}`);
  process.exitCode = failed ? 1 : 0;
})();
