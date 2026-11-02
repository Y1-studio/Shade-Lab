const assert = require('node:assert/strict');
const {launch} = require('../../../tests/html-regression.cjs');
const tests = [], test = (name, fn) => tests.push({name, fn});
const plain = value => JSON.parse(JSON.stringify(value));
const toggle = t => { t.$('tools-panel').querySelector('summary').click(); t.flush(); };

test('only the requested tools collapse; swap and grayscale stay outside', t => {
  const panel = t.$('tools-panel'), before = t.model();
  assert.equal(panel.open, false);
  assert.deepEqual([...t.$('picker-tools').children].map(el => el.dataset.shadeAddon), ['wheel-harmonies', 'surface-tools', 'color-areas', 'hue-color-limits', 'line-guides', 'ball-comparison']);
  for (const id of ['wheel-swap', 'picker-grayscale-wheel', 'picker-grayscale-surface', 'eyedropper']) assert.equal(panel.contains(t.$(id)), false, id);
  assert.equal(t.$('eyedropper').closest('.hex-row').nextElementSibling, t.$('picker-actions'));
  assert.ok(t.$('picker-actions').contains(t.$('wheel-swap')));
  toggle(t); assert.equal(panel.open, true);
  toggle(t); assert.equal(panel.open, false);
  assert.deepEqual(t.model(), before); assert.equal(t.$('undo').disabled, true);
});

test('collapse preserves a configured harmony and edits, swap and Undo still work', t => {
  toggle(t); t.click('harmony-edit'); t.set('harmony-mode', 'triadic'); t.click('harmony-apply');
  const E = t.w.Shade, before = t.model(), colors = plain(E.resolve(before.balls[0]));
  assert.equal(t.$('tools-panel').open, true, 'renders must preserve expansion');
  toggle(t); assert.equal(t.$('tools-panel').open, false);
  assert.deepEqual(t.model(), before); assert.deepEqual(plain(E.resolve(t.model().balls[0])), colors);
  t.click('wheel-swap');
  const after = E.resolve(t.model().balls[0]);
  assert.equal(after.highlight[0], colors.shadow[0]); assert.equal(after.shadow[0], colors.highlight[0]);
  t.click('undo'); assert.deepEqual(t.model(), before);
  t.click('picker-grayscale-wheel'); assert.equal(t.$('picker-grayscale-wheel').checked, true);
  assert.equal(t.$('tools-panel').open, false);
  toggle(t); t.click('harmony-edit'); assert.equal(t.$('harmony-dialog').open, true); t.click('harmony-cancel');
});

test('layout disable and re-enable retain tool nodes, handlers and positions', t => {
  const host = t.w.ShadeAddons, slot = t.$('picker-tools'), edit = t.$('harmony-edit'), before = t.model();
  for (let i = 0; i < 2; i++) {
    host.disable('tool-panel');
    assert.equal(t.$('tools-panel'), null); assert.equal(slot.parentElement.classList.contains('picker-panel'), true);
    assert.equal(slot.previousElementSibling, t.$('picker-view')); assert.equal(t.$('harmony-edit'), edit);
    t.click('harmony-edit'); assert.equal(t.$('harmony-dialog').open, true); t.click('harmony-cancel');
    host.enable('tool-panel');
    assert.equal(t.w.document.querySelectorAll('#tools-panel').length, 1);
    assert.equal(t.$('tools-panel').contains(slot), true); assert.equal(t.$('harmony-edit'), edit);
  }
  assert.deepEqual(t.model(), before); assert.equal(t.$('undo').disabled, true);
  t.click('wheel-swap'); t.click('undo'); assert.deepEqual(t.model(), before);
});

if (require.main === module) (async () => {
  let failed = 0;
  for (const {name, fn} of tests) {
    const t = launch(undefined, {realCanvas: true});
    try { await t.w.ShadeReady;t.w.ShadeAddons.disable('studio-layout'); await fn(t); assert.equal(t.errors.length, 0, t.errors.join('\n')); console.log('PASS', name); }
    catch (e) { failed++; console.log('FAIL', name, '\n', e.stack); }
    finally { await t.close(); }
  }
  console.log(`${tests.length - failed}/${tests.length} tool-panel checks passed`); process.exitCode = failed ? 1 : 0;
})();
