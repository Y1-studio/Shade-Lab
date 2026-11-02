const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {IDBFactory} = require('fake-indexeddb');
const {launch} = require('../../../tests/html-regression.cjs');
const plain = value => JSON.parse(JSON.stringify(value));
const close = (a, b, epsilon=1e-7) => assert.ok(Math.abs(a-b)<epsilon, `${a} differs from ${b}`);
const tests = [], test = (name, fn) => tests.push({name, fn});
const config = ball => ball.addons?.['wheel-harmonies'];
const active = t => t.model().balls[0];
function apply(t, mode='triadic', accent=false) {
  t.click('harmony-edit'); t.set('harmony-mode', mode);
  if (accent) t.click('harmony-accent');
  assert.equal(t.$('harmony-apply').disabled, false, t.$('harmony-error').textContent);
  t.click('harmony-apply'); assert.equal(t.$('harmony-dialog').open, false);
}
function toggle(t, id) { t.$(id).click(); t.flush(); }
function pointer(t, type, x, y, pointerId=1) { t.event('wheel',type,{button:0,pointerId,clientX:x,clientY:y}); }
function wheelDrag(t, id, hue, cancel=false) {
  t.$('wheel').getBoundingClientRect=()=>({left:0,top:0,width:320,height:320});
  t.set('selected-role',id);
  const m=t.w.ShadeRender.drawWheel(t.$('wheel'),active(t),id,[],t.model().pickerShape||'triangle').find(m=>m.id===id&&m.kind==='hue');
  pointer(t,'pointerdown',m.x,m.y); const r=Math.hypot(m.x-160,m.y-160), angle=t.w.Shade.wheelAngle(hue);
  pointer(t,'pointermove',160+Math.cos(angle)*r,160+Math.sin(angle)*r);
  pointer(t,cancel?'pointercancel':'pointerup',160+Math.cos(angle)*r,160+Math.sin(angle)*r);
}

test('package starts without changing existing balls or enabling a tool', t => {
  assert.equal(t.w.ShadeAddons.list().find(x=>x.id==='wheel-harmonies').state,'active');
  assert.equal(config(active(t)),undefined); assert.equal(t.$('harmony-edit').textContent,'Add hue harmony');
  assert.equal(t.$('harmony-enabled').parentElement.parentElement.hidden,true); assert.equal(t.$('undo').disabled,true);
});
test('all six geometries wrap at zero and preserve recipe S/L at every strength', t => {
  const E=t.w.Shade;
  const cases={analogous:[-30,30],triadic:[120,240],split:[150,210],complementary:[180,180],monochromatic:[0,0],tetradic:[90,180]};
  t.set('number-H','359'); const original=active(t).roles;
  for(const [mode,positions]of Object.entries(cases)){
    apply(t,mode,mode==='tetradic');const b=active(t);
    assert.deepEqual(b.roles.slice(0,original.length),original);
    for(const strength of [0,.5,1,2,3]){
      const raw=E.resolveRecipe(b,strength),cs=E.resolve(b,strength);
      close(cs.highlight[0],E.wrap(359+positions[0]));close(cs.shadow[0],E.wrap(359+positions[1]));
      for(const id of Object.keys(raw))assert.deepEqual(plain(cs[id].slice(1)),plain(raw[id].slice(1)));
      if(mode==='tetradic'){const id=Object.keys(config(b).assignments).find(id=>config(b).assignments[id]===3);close(cs[id][0],269);}
    }
    t.click('harmony-remove');
  }
});
test('Apply is one Undo step and Cancel/Escape discard every draft change', t => {
  const before=t.model();apply(t);const saved=t.model();t.click('undo');assert.deepEqual(t.model(),before);t.click('redo');assert.deepEqual(t.model(),saved);
  t.click('harmony-edit');t.set('harmony-mode','tetradic');t.click('harmony-accent');t.set('harmony-base','120','input');
  assert.deepEqual(t.model(),saved);t.click('harmony-cancel');assert.deepEqual(t.model(),saved);
  t.click('harmony-edit');t.set('harmony-mode','complementary');t.event('harmony-dialog','keydown',{key:'Escape'});assert.equal(t.$('harmony-dialog').open,false);assert.deepEqual(t.model(),saved);
});
test('tetradic requires four positions, supports an existing fourth role and a draft Accent', t => {
  t.click('harmony-edit');t.set('harmony-mode','tetradic');assert.equal(t.$('harmony-apply').disabled,true);
  t.set('harmony-role-rim','3');assert.equal(t.$('harmony-apply').disabled,false);t.click('harmony-apply');assert.equal(active(t).roles.length,4);
  t.click('harmony-edit');t.set('harmony-mode','tetradic');t.click('harmony-accent');const before=t.model();assert.equal(active(t).roles.length,4);t.click('harmony-cancel');assert.deepEqual(t.model(),before);
  apply(t,'tetradic',true);const b=active(t),id=b.roles.at(-1).id;assert.equal(b.roles.at(-1).name,'Accent');assert.deepEqual(plain(t.w.Shade.resolve(b)[id].slice(1)),b.base.slice(1));assert.equal(b.design,undefined);
  t.click('undo');assert.equal(active(t).roles.length,4);t.click('redo');assert.equal(active(t).roles.length,5);
});
test('additional named colors can share positions; missing targets block Apply', t => {
  t.set('selected-role','bounce');t.set('role-name','Warm edge');t.click('harmony-edit');t.set('harmony-mode','triadic');
  t.set('harmony-role-bounce','1');t.set('harmony-role-highlight','');assert.equal(t.$('harmony-apply').disabled,false);t.click('harmony-apply');
  const b=active(t),raw=t.w.Shade.resolveRecipe(b),cs=t.w.Shade.resolve(b);assert.deepEqual(plain(cs.highlight),plain(raw.highlight));close(cs.bounce[0],114);
  t.click('harmony-edit');t.set('harmony-role-shadow','');assert.equal(t.$('harmony-apply').disabled,true);t.click('harmony-cancel');
});
test('spread and swap change assignments in the preview without baking recipes', t => {
  const before=active(t).roles;t.click('harmony-edit');t.set('harmony-mode','split');t.set('harmony-spread','45','input');t.click('harmony-swap');t.click('harmony-apply');
  const b=active(t),cs=t.w.Shade.resolve(b);close(cs.highlight[0],219);close(cs.shadow[0],129);assert.deepEqual(b.roles,before);
  for(const [mode,spread]of [['analogous',1],['split',89],['tetradic',179]]){t.click('harmony-edit');t.set('harmony-mode',mode);if(mode==='tetradic')t.set('harmony-role-rim','3');t.set('harmony-spread',String(spread),'input');assert.equal(t.$('harmony-apply').disabled,false);t.click('harmony-cancel');}
});
test('incomplete and out-of-range fields keep the last valid preview and cannot commit', t => {
  t.click('harmony-edit');const png=t.$('harmony-ball').toDataURL();
  for(const value of ['', '0', '90', '-2']){t.set('harmony-spread',value,'input');assert.equal(t.$('harmony-apply').disabled,true);assert.equal(t.$('harmony-ball').toDataURL(),png);}
  t.set('harmony-spread','40','input');assert.equal(t.$('harmony-apply').disabled,false);
  t.set('harmony-base','','input');assert.equal(t.$('harmony-apply').disabled,true);t.click('harmony-cancel');assert.equal(config(active(t)),undefined);
});
test('Enable and Show guide are independent; Remove and Undo restore exact recipes', t => {
  const raw=t.w.Shade.resolveRecipe(active(t));apply(t);const constrained=plain(t.w.Shade.resolve(active(t))),rules=active(t).roles;
  toggle(t,'harmony-visible');assert.deepEqual(plain(t.w.Shade.resolve(active(t))),constrained);assert.equal(t.$('free-hue').disabled,true);
  toggle(t,'harmony-enabled');assert.deepEqual(plain(t.w.Shade.resolve(active(t))),plain(raw));assert.equal(t.$('free-hue').disabled,false);assert.equal(config(active(t)).visible,false);
  toggle(t,'harmony-visible');assert.deepEqual(plain(t.w.Shade.resolve(active(t))),plain(raw));toggle(t,'harmony-enabled');
  const saved=t.model();t.click('harmony-remove');assert.equal(config(active(t)),undefined);assert.deepEqual(active(t).roles,rules);t.click('undo');assert.deepEqual(t.model(),saved);
});
test('Base and assigned hue drags rotate the anchor without rewriting formulas or strength', t => {
  apply(t);t.set('strength','2','input');t.event('strength','change');const before=active(t),rules=before.roles;
  wheelDrag(t,'highlight',130);const b=active(t),cs=t.w.Shade.resolve(b);close(b.base[0],10);close(cs.shadow[0],250);assert.deepEqual(b.roles,rules);assert.equal(b.strength,2);
  t.click('undo');assert.deepEqual(active(t),before);t.click('redo');assert.deepEqual(active(t),b);
  wheelDrag(t,'base',359);close(t.w.Shade.resolve(active(t)).highlight[0],119);
});
test('pointer cancellation restores the complete constrained ball and creates no Undo entry', t => {
  apply(t,'analogous');const before=t.model();wheelDrag(t,'shadow',150,true);assert.deepEqual(t.model(),before);
  t.click('undo');assert.equal(config(active(t)),undefined);
});
test('HSL hue input rotates assigned points and unassigned colors remain editable', t => {
  apply(t);const rules=active(t).roles;t.set('selected-role','shadow');t.set('number-H','10');close(active(t).base[0],130);assert.deepEqual(active(t).roles,rules);
  t.set('selected-role','bounce');t.set('number-H','20');const cs=t.w.Shade.resolve(active(t));close(cs.bounce[0],20);close(cs.highlight[0],250);close(cs.shadow[0],10);
});
test('HEX, screen picks and samples obey the same harmony and keep raw samples', async t => {
  apply(t,'complementary');t.set('selected-role','highlight');t.set('hex','#00FF00');close(t.w.Shade.resolve(active(t)).highlight[0],120);close(active(t).base[0],300);
  t.picks.push('#0000FF');await t.$('eyedropper').onclick();t.flush();close(t.w.Shade.resolve(active(t)).highlight[0],240);close(active(t).base[0],60);
  assert.deepEqual(t.model().samples.at(-1),[240,100,50]);assert.equal(active(t).strength,1);
});
test('saturation/lightness and plane editing preserve enforced hue relationships', t => {
  apply(t,'split');t.set('selected-role','highlight');t.set('number-S','42');close(t.w.Shade.resolve(active(t)).highlight[1],42);
  const E=t.w.Shade,b=E.clone(active(t));E.movePickerColor(b,'highlight','plane',[0,55,65],true,'square');const cs=E.resolve(b);close(cs.highlight[0],E.wrap(b.base[0]+150));close(cs.shadow[0],E.wrap(b.base[0]+210));close(cs.highlight[1],55);close(cs.highlight[2],65);
});
test('advanced RGB/CMYK recipes remain intact through harmony changes and pure hue edits', t => {
  const E=t.w.Shade;
  for(const model of ['RGB','CMYK']){
    const b=E.defaultBall();b.roles[0].model=model;E.setRule(b.roles[0],'formula');b.roles[0].expressions=Object.fromEntries(E.CHANNELS[model].map(c=>[c,c]));
    b.addons={'wheel-harmonies':{version:1,mode:'triadic',spread:30,enabled:true,visible:true,assignments:{highlight:1,shadow:2}}};
    const before=plain(b.roles);E.movePickerColor(b,'highlight','hue',[20,0,0]);assert.deepEqual(plain(b.roles),before);const cs=E.resolve(b);E.editColor(b,'shadow',[30,...cs.shadow.slice(1)]);assert.deepEqual(plain(b.roles),before);
  }
});
test('underlying formula errors reject an anchor move atomically', t => {
  const E=t.w.Shade,b=E.clone(active(t));b.base[0]=20;b.roles[0].expressions={H:'H',S:'50 / H',L:'L'};E.setRule(b.roles[0],'formula');b.addons={'wheel-harmonies':{version:1,mode:'triadic',spread:30,enabled:true,visible:true,assignments:{highlight:1,shadow:2}}};const before=plain(b);
  assert.throws(()=>E.movePickerColor(b,'base','hue',[0,0,0]),/finite/);assert.deepEqual(plain(b),before);
});
test('missing or malformed saved settings suspend without discarding the project', t => {
  const E=t.w.Shade,b=E.clone(active(t)),raw=plain(E.resolveRecipe(b));
  for(const settings of [{version:2}, {version:1,mode:'triadic',enabled:true,visible:true,assignments:{missing:1,shadow:2}}]){b.addons={'wheel-harmonies':settings};assert.deepEqual(plain(E.resolve(b)),raw);E.validateBall(b);}
  const doc=t.model();doc.balls[0]=b;assert.deepEqual(plain(E.normalizeDocument(doc)).balls[0].addons,b.addons);
});
test('deleting an assigned role suspends the tool; Undo restores it', t => {
  apply(t);t.set('selected-role','highlight');t.click('delete-role');assert.match(t.$('harmony-summary').textContent,/Suspended/);assert.equal(t.$('free-hue').disabled,false);t.click('undo');assert.equal(t.$('free-hue').disabled,true);
});
test('selection changes close draft previews without applying to another ball', t => {
  const before=t.model();t.click('harmony-edit');t.set('harmony-base','100','input');
  t.$('gallery').children[1].click();t.flush();assert.equal(t.$('harmony-dialog').open,false);assert.deepEqual(t.model(),before);
});
test('duplicate balls retain independent settings; type/new-ball and JSON round trips retain harmony', async t => {
  apply(t,'tetradic',true);const b=active(t),E=t.w.Shade;
  t.click('duplicate-selected');const copy=t.model().balls.find(x=>x.id!==b.id&&x.name.includes(b.name));assert.ok(copy);assert.deepEqual(config(copy),config(b));assert.notEqual(copy.id,b.id);
  t.click('save-type');t.set('type-name','Harmony type');await t.$('type-save').onclick();t.flush();
  const type=plain(t.w.ShadeStudio.getLibrary().at(-1));assert.deepEqual(config(type.ball),config(b));
  t.click('add-ball');const created=t.model().balls.at(-1);assert.deepEqual(config(created),config(b));assert.deepEqual(plain(E.resolve(created)),plain(E.resolve({...type.ball,strength:1})));
  const A=t.w.ShadeAssets,saved=t.model();assert.deepEqual(plain(await A.prepareDocument(A.portable(saved))),saved);assert.deepEqual(plain(await A.prepareDocument(A.portable(type))),type);
});
test('reload activates saved settings before first completed render and preserves the type library', async t => {
  apply(t);const saved=t.model();await t.w.ShadeStudio.save(saved);
  const fresh=launch(undefined,{db:t.w.indexedDB,realCanvas:true});
  try{await fresh.w.ShadeReady;assert.deepEqual(fresh.model(),saved);assert.equal(fresh.$('free-hue').disabled,true);close(fresh.w.Shade.resolve(active(fresh)).highlight[0],114);}
  finally{await fresh.close();}
});
test('disabling the package releases hooks and panels; reenabling restores saved effects', async t => {
  apply(t);t.click('save-type');t.set('type-name','Enable/disable preview');await t.$('type-save').onclick();t.flush();
  const before=t.model(),E=t.w.Shade,cs=plain(E.resolve(active(t))),thumbnail=t.$('type-thumbnail').src;
  t.w.ShadeAddons.disable('wheel-harmonies');assert.equal(t.$('harmony-dialog'),null);assert.equal(t.$('free-hue').disabled,false);assert.deepEqual(plain(E.resolve(active(t))),plain(E.resolveRecipe(active(t))));assert.deepEqual(t.model(),before);
  assert.notEqual(t.$('type-thumbnail').src,thumbnail);
  t.w.ShadeAddons.enable('wheel-harmonies');assert.deepEqual(plain(E.resolve(active(t))),cs);assert.equal(t.$('free-hue').disabled,true);assert.equal(t.$('type-thumbnail').src,thumbnail);
});
test('wheel, previews, comparison cache and exported PNG strips use constrained colors', t => {
  const E=t.w.Shade,R=t.w.ShadeRender,before=t.$('comparison-gallery').querySelector('canvas').toDataURL();apply(t);
  const b=active(t),cs=E.resolve(b);assert.notEqual(t.$('comparison-gallery').querySelector('canvas').toDataURL(),before);
  const m=R.drawWheel(t.$('wheel'),b,'highlight',[]).find(x=>x.id==='highlight'&&x.kind==='hue');close(E.wheelHue(m.x,m.y),cs.highlight[0]);
  const canvas=R.exportCanvas([b],'strips',1000,'transparent',false),pixel=canvas.getContext('2d').getImageData(270,125,1,1).data;
  assert.deepEqual([...pixel].slice(0,3),plain(E.hslRgb(cs.highlight).map(Math.round)));assert.equal(pixel[3],255);
  const shown=t.$('wheel').toDataURL(),comparison=t.$('comparison-gallery').querySelector('canvas').toDataURL();
  toggle(t,'harmony-visible');assert.equal(t.$('comparison-gallery').querySelector('canvas').toDataURL(),comparison);assert.notEqual(t.$('wheel').toDataURL(),shown);
  const dir=path.resolve(__dirname,'../../../tests/artifacts');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'part2-harmony-wheel.png'),Buffer.from(shown.split(',')[1],'base64'));
});
test('fixed 90/270 temperature guide and independent square/triangle selection survive harmonies', t => {
  assert.equal(t.$('temperature-visible').checked,true);toggle(t,'temperature-visible');toggle(t,'temperature-visible');apply(t,'analogous');t.set('picker-shape','square');wheelDrag(t,'shadow',120);
  assert.deepEqual(t.model().temperatureGuide,{visible:true,start:90,end:270});assert.equal(t.model().pickerShape,'square');t.set('picker-shape','triangle');assert.deepEqual(t.model().temperatureGuide,{visible:true,start:90,end:270});
});

require('./interactions.cjs')({test,assert,plain,close,active});
(async()=>{let failed=0;for(const {name,fn}of tests){const t=launch(undefined,{realCanvas:true,db:new IDBFactory()});try{await t.w.ShadeReady;await fn(t);assert.equal(t.errors.length,0,'uncaught UI error');console.log('PASS',name);}catch(error){failed++;console.log('FAIL',name,'\n',error.stack);}finally{await t.close();}}console.log(`${tests.length-failed}/${tests.length} harmony checks passed`);process.exitCode=failed?1:0;})();
