const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { IDBFactory } = require('fake-indexeddb');
const { launch } = require('./html-regression.cjs');
const { buildAddons } = require('../tools/build-addons.cjs');
const { bundleApp } = require('../tools/bundle-app.cjs');
const root = path.resolve(__dirname, '..'), portable = process.argv.includes('--portable');
const plain = value => JSON.parse(JSON.stringify(value));
const tests = [], test = (name, fn) => tests.push({ name, fn });
const tempRoot = fs.mkdtempSync(path.join(__dirname, 'addon-fixture-'));

const feature = `
const addon = {
 activate(api) {
  window.fixtureApi = api; window.activationNames = [...(window.activationNames || []), api.getState().project.name];
  const panel = api.mount('picker'), button = document.createElement('button'), output = document.createElement('output');
  button.id = 'fixture-save'; output.id = 'fixture-output'; button.textContent = literal;
  panel.append(button, output); window.detachedButton = button;
  api.on(button, 'click', () => api.setData({version: 1, count: increment(api.getData()?.count || 0)}, 'Add-on setting saved'));
  api.subscribe(state => {
   window.lastAddonState = state;
   if (window.failListener) throw Error('listener broke');
   if (window.loopListener) api.setData({version: 1, count: 10});
   output.value = String(state.project.addons?.[api.id]?.count || 0);
  });
  api.onCleanup(() => { window.cleanupCalls = (window.cleanupCalls || 0) + 1; });
  if (window.failActivate) throw Error('activation broke');
 }
};`;
function fixture(entries = [{path: 'feature', enabled: true}]) {
  const folder = fs.mkdtempSync(path.join(tempRoot, 'packages-'));
  fs.mkdirSync(path.join(folder, 'feature'));
  fs.writeFileSync(path.join(folder, 'registry.json'), JSON.stringify({version: 1, addons: entries}));
  fs.writeFileSync(path.join(folder, 'feature/addon.json'), JSON.stringify({id: 'test-addon', name: 'Test add-on', version: '1.0', apiVersion: 1, scripts: ['math.js', 'index.js'], styles: ['style.css']}));
  fs.writeFileSync(path.join(folder, 'feature/math.js'), `const increment = value => value + 1; const literal = ${JSON.stringify("</script> $& $` $'")};`);
  fs.writeFileSync(path.join(folder, 'feature/index.js'), feature);
  fs.writeFileSync(path.join(folder, 'feature/style.css'), '[data-shade-addon="test-addon"] { padding: 7px; }');
  return folder;
}
async function open(bundle, fn, options = {}) {
  const opts = {...options, addonBundle: bundle};
  if (portable && bundle !== undefined) opts.html = bundleApp(root, bundle);
  const t = launch(undefined, opts);
  try { await t.w.ShadeReady; await fn(t); assert.equal(t.errors.length, 0, 'uncaught app error'); }
  finally { await t.close(); }
}
const built = () => buildAddons(fixture());

test('empty registry leaves the existing app and project unchanged; template stays uninstalled', async () => {
  await open(buildAddons(fixture([])), t => {
    assert.deepEqual(plain(t.w.ShadeAddons.list()), []);
    assert.equal(t.w.document.querySelector('[data-shade-addon]'), null);
    assert.equal(t.model().addons, undefined);
    assert.equal(t.$('undo').disabled, true);
    t.set('number-H', '100'); assert.equal(t.model().balls[0].base[0], 100);
    t.click('undo'); assert.notEqual(t.model().balls[0].base[0], 100);
  });
});
test('ordered package scripts and styles load offline without changing HTML-looking strings', async () => {
  await open(built(), t => {
    assert.equal(t.w.ShadeAddons.list()[0].state, 'active');
    assert.equal(t.$('fixture-save').textContent, '</script> $& $` $\'');
    assert.equal(t.w.document.querySelectorAll('style[data-shade-addon="test-addon"]').length, 1);
    assert.equal(t.$('fixture-output').value, '0');
    assert.equal(t.$('addon-test-addon-picker').parentElement.classList.contains('picker-panel'), true);
  });
});
test('add-on edits use the normal Undo/Redo and saved data namespace', async () => {
  await open(built(), t => {
    const before = t.model(); t.click('fixture-save');
    assert.deepEqual(t.model().addons, {'test-addon': {version: 1, count: 1}});
    assert.equal(t.$('fixture-output').value, '1');
    t.click('undo'); assert.deepEqual(t.model(), before); assert.equal(t.$('fixture-output').value, '0');
    t.click('redo'); assert.equal(t.$('fixture-output').value, '1');
  });
});
test('snapshots and retained edit drafts cannot mutate the live project', async () => {
  await open(built(), t => {
    const before = t.model(); t.w.fixtureApi.getState().project.balls.length = 0;
    assert.deepEqual(t.model(), before);
    t.w.eval(`fixtureApi.updateProject(draft => { window.keptDraft = draft; draft.balls[0].name = 'Add-on edit'; }); keptDraft.balls[0].name = 'Leaked edit';`);
    assert.equal(t.model().balls[0].name, 'Add-on edit'); t.click('undo'); assert.deepEqual(t.model(), before);
  });
});
test('invalid and asynchronous edits roll back without poisoning the app', async () => {
  await open(built(), async t => {
    const before = t.model();
    assert.equal(t.w.eval(`fixtureApi.updateProject(draft => { draft.balls = []; })`), false);
    assert.equal(t.w.eval(`fixtureApi.updateProject(async draft => { draft.name = 'no'; await Promise.resolve(); draft.balls = []; })`), false);
    await Promise.resolve(); assert.deepEqual(t.model(), before);
    assert.equal(t.w.eval(`fixtureApi.updateProject(draft => { draft.addons = {bad: Infinity}; })`), false);
    assert.deepEqual(t.model(), before); assert.equal(t.$('undo').disabled, true);
    t.click('fixture-save'); assert.equal(t.model().addons['test-addon'].count, 1);
  });
});
test('notifications follow core color changes and selection; returned state is detached', async () => {
  await open(built(), t => {
    t.set('number-H', '93'); assert.equal(t.w.lastAddonState.project.balls[0].base[0], 93);
    t.click('select-all'); assert.equal(t.w.lastAddonState.selectedBallIds.length, 2);
    t.set('selected-role', 'shadow'); assert.equal(t.w.lastAddonState.activeRoleId, 'shadow');
    t.w.lastAddonState.project.balls[0].name = 'not stored'; assert.notEqual(t.model().balls[0].name, 'not stored');
  });
});
test('disable removes panels, styles, listeners and resources while retaining data', async () => {
  await open(built(), t => {
    t.click('fixture-save'); const before = t.model(), old = t.w.fixtureApi;
    t.w.ShadeAddons.disable('test-addon');
    assert.equal(t.w.document.querySelector('[data-shade-addon]'), null);
    assert.equal(old.signal.aborted, true); assert.equal(t.w.cleanupCalls, 1);
    t.w.detachedButton.click(); assert.deepEqual(t.model(), before);
    assert.throws(() => old.getState(), /stopped/);
    assert.equal(t.w.ShadeAddons.enable('test-addon'), true);
    assert.equal(t.$('fixture-output').value, '1');
    t.click('fixture-save'); assert.equal(t.model().addons['test-addon'].count, 2);
    t.w.ShadeAddons.enable('test-addon'); assert.equal(t.w.document.querySelectorAll('#fixture-save').length, 1);
  });
});
test('installed disabled packages stay dormant until enabled for the session', async () => {
  await open(buildAddons(fixture([{path: 'feature', enabled: false}])), t => {
    assert.equal(t.w.fixtureApi, undefined); assert.equal(t.w.ShadeAddons.list()[0].state, 'disabled');
    assert.equal(t.w.document.querySelector('[data-shade-addon]'), null);
    t.w.ShadeAddons.enable('test-addon'); assert.ok(t.$('fixture-save'));
  });
});
test('activation failures clean partially mounted UI and leave core editing available', async () => {
  await open('window.failActivate = true;\n' + built(), t => {
    assert.equal(t.w.ShadeAddons.list()[0].state, 'failed'); assert.equal(t.w.cleanupCalls, 1);
    assert.equal(t.w.document.querySelector('[data-shade-addon]'), null);
    assert.equal(t.model().addons, undefined);
    assert.match(t.$('status').textContent, /activation broke/);
    t.set('number-H', '77'); assert.equal(t.model().balls[0].base[0], 77);
  });
});
test('listener failures and recursive edits stop only the affected add-on', async () => {
  for (const flag of ['failListener', 'loopListener']) await open(built(), t => {
    t.w[flag] = true; t.set('number-H', '75');
    assert.equal(t.w.ShadeAddons.list()[0].state, 'failed');
    assert.equal(t.model().balls[0].base[0], 75); assert.equal(t.model().addons, undefined);
    assert.equal(t.w.document.querySelector('[data-shade-addon]'), null);
    t.click('undo'); assert.notEqual(t.model().balls[0].base[0], 75);
  });
});
test('one broken package does not stop another package or the core', async () => {
  const dir = fixture([{path: 'broken', enabled: true}, {path: 'feature', enabled: true}]);
  fs.mkdirSync(path.join(dir, 'broken'));
  fs.writeFileSync(path.join(dir, 'broken/addon.json'), JSON.stringify({id: 'broken-addon', name: 'Broken', version: '1', apiVersion: 1, scripts: ['index.js']}));
  fs.writeFileSync(path.join(dir, 'broken/index.js'), `throw Error('broken module'); const addon = {};`);
  await open(buildAddons(dir), t => {
    assert.deepEqual(plain(t.w.ShadeAddons.list()).map(item => item.state), ['failed', 'active']);
    t.click('fixture-save'); assert.equal(t.model().addons['test-addon'].count, 1);
  });
});
test('data survives portable import, disabled add-ons, and IndexedDB reload before activation', async () => {
  const db = new IDBFactory(), bundle = built();
  await open(bundle, async t => {
    t.click('fixture-save'); t.w.fixtureApi.updateProject(draft => { draft.name = 'Saved add-on project'; });
    const saved = t.model(), A = t.w.ShadeAssets;
    assert.deepEqual(plain(await A.prepareDocument(A.portable(saved))), saved);
    await t.w.ShadeStudio.save(saved);
    await open(bundle, fresh => {
      assert.deepEqual(fresh.model(), saved); assert.equal(fresh.w.activationNames[0], 'Saved add-on project');
      assert.equal(fresh.$('fixture-output').value, '1');
    }, {db});
    await open('', fresh => { assert.deepEqual(fresh.model(), saved); }, {db});
  }, {db});
});
test('template can be installed without core edits', async () => {
  const dir = fixture([{path: 'template', enabled: true}]);
  fs.cpSync(path.join(root, 'addons/_template'), path.join(dir, 'template'), {recursive: true});
  await open(buildAddons(dir), t => {
    const panel = t.$('addon-example-addon-picker'); assert.ok(panel);
    panel.querySelector('button').click(); assert.equal(t.model().addons['example-addon'].count, 1);
  });
});
test('build rejects missing files, incompatible versions, duplicate IDs, syntax errors and external CSS', () => {
  const edits = [
    dir => fs.unlinkSync(path.join(dir, 'feature/index.js')),
    dir => { const p = path.join(dir, 'feature/addon.json'), m = JSON.parse(fs.readFileSync(p)); m.apiVersion = 2; fs.writeFileSync(p, JSON.stringify(m)); },
    dir => fs.writeFileSync(path.join(dir, 'registry.json'), JSON.stringify({version: 1, addons: [{path: 'feature', enabled: true}, {path: 'feature', enabled: true}]})),
    dir => fs.writeFileSync(path.join(dir, 'feature/index.js'), 'const addon = {{{'),
    dir => fs.writeFileSync(path.join(dir, 'feature/style.css'), '@import "https://example.test/style.css";'),
    dir => fs.writeFileSync(path.join(dir, 'feature/style.css'), '.example { background: url(image.png); }')
  ];
  for (const edit of edits) { const dir = fixture(); edit(dir); assert.throws(() => buildAddons(dir)); }
});
test('build rejects paths outside each add-on folder', () => {
  const dir = fixture(), manifest = path.join(dir, 'feature/addon.json'), meta = JSON.parse(fs.readFileSync(manifest));
  fs.writeFileSync(path.join(dir, 'outside.js'), 'const addon = {};');
  meta.scripts = ['../outside.js']; fs.writeFileSync(manifest, JSON.stringify(meta));
  assert.throws(() => buildAddons(dir), /leaves its folder/);
});

(async () => {
  let failed = 0;
  try {
    for (const {name, fn} of tests) {
      try { await fn(); console.log('PASS', name); }
      catch (error) { failed++; console.log('FAIL', name, '\n', error.stack); }
    }
  } finally {
    // Only remove the exact temporary fixture directory created by this process, inside tests/.
    const resolved = fs.realpathSync(tempRoot), base = fs.realpathSync(__dirname);
    if (path.dirname(resolved) !== base || !path.basename(resolved).startsWith('addon-fixture-')) throw Error('Unexpected fixture cleanup path.');
    fs.rmSync(resolved, {recursive: true});
  }
  console.log(`${tests.length - failed}/${tests.length} add-on checks passed (${portable ? 'standalone' : 'source'})`);
  process.exitCode = failed ? 1 : 0;
})();
