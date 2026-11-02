const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { IDBFactory } = require('fake-indexeddb');
const { launch } = require('./html-regression.cjs');
const tests=[];
const test=(name,fn,options={})=>tests.push({name,fn,options});
const plain=v=>JSON.parse(JSON.stringify(v));
const field=(t,label)=>t.w.document.querySelector(`[aria-label="${label}"]`);
const input=(t,node,value)=>{node.value=value;t.event(node,'change');};
const newDraft=t=>{t.$('add-ball').click();t.flush();};
const pick=async(t,hex)=>{t.picks.push(hex);await t.$('eyedropper').onclick();t.flush();};
const row=(t,id)=>t.$('new-regions').querySelector(`[data-region="${id}"]`);
const rowAction=(t,id,label)=>[...row(t,id).querySelectorAll('button')].find(n=>n.textContent===label).click();

test('all six measured palettes save real offsets and sample at 1x',async t=>{
 const samples=[['#71F56B','#349294'],['#FFF5D4','#F3A38D'],['#DB4A29','#89284C'],['#758BC9','#1F1C42'],['#3A536E','#191726'],['#F284FF','#6D4AAE']];
 for(const [i,type] of t.w.ShadeStudio.builtins.slice(1).entries()){
  t.set('type-select',type.id);t.click('add-ball');
  for(const [j,id] of ['highlight','shadow'].entries()){
  t.set('selected-role',id);t.set('strength','2','input');t.event('strength','change');
  const expected=type.ball.roles.find(r=>r.id===id).rule.amounts;await pick(t,samples[i][j]);
  const b=t.model().balls.at(-1),r=b.roles.find(r=>r.id===id);assert.equal(b.strength,1);assert.equal(r.rule.kind,'offset');
  for(const c of ['H','S','L']){assert.ok(Math.abs(r.rule.amounts[c]-expected[c])<1e-9,`${type.name} ${id} ${c}`);assert.ok(Math.abs(Number(field(t,c+' amount').value)-expected[c])<.006,`${type.name} ${id} visible ${c}`);}
  assert.notEqual(t.$('amount-controls').textContent,'');assert.match(t.$('measured-differences').textContent,/Current movement from Base at 1×/);
  }
 }
});
test('hue wrapping and non-base source measurements use the chosen source',t=>{
 const E=t.w.Shade,b=E.defaultBall('Wrap',[348,70,50]);E.sampleColor(b,'highlight',[11,80,60]);assert.equal(b.roles[0].rule.amounts.H,23);
 b.roles[1].source='highlight';E.sampleColor(b,'shadow',[350,60,40]);assert.deepEqual(plain(b.roles[1].rule.amounts),{H:-21,S:-20,L:-20});
});
test('percentage and advanced rules are distinct and legacy expressions are preserved',t=>{
 const E=t.w.Shade,b=E.defaultBall();E.setRule(b.roles[1],'percent',{H:0,S:-5,L:10});const cs=E.resolve(b);assert.equal(cs.shadow[1],71);assert.equal(cs.shadow[2],50);
 const old=JSON.parse(fs.readFileSync(path.join(__dirname,'../examples/rgb-cool-shadow.json'),'utf8'));const copy=E.normalizeDocument(old);assert.deepEqual(plain(copy.roles.map(r=>r.expressions)),old.roles.map(r=>r.expressions));assert.ok(copy.roles.every(r=>r.rule.kind==='formula'));
 t.set('selected-role','shadow');t.set('relationship-mode','formula');field(t,'H formula').value='H-13*t';t.click('apply-formulas');assert.equal(t.model().balls[0].roles[1].rule.kind,'formula');assert.notEqual(Number(field(t,'H amount').value),0);
});
test('sampling cancellation at 3x leaves strength and every color intact',async t=>{
 t.set('strength','3','input');t.event('strength','change');const prior=t.model();t.w.EyeDropper=class{async open(){throw new t.w.DOMException('Cancel','AbortError');}};
 await t.$('eyedropper').onclick();assert.deepEqual(t.model(),prior);
});
test('group sampling retains captured offsets',t=>{
 const E=t.w.Shade,b=E.defaultBall('Group',[150,50,50]);E.lockOffsets(b);b.groupMove=true;const rules=plain(b.roles);const colors=E.resolve(b);E.sampleColor(b,'shadow',[colors.shadow[0]+8,colors.shadow[1]+3,colors.shadow[2]+2]);assert.deepEqual(plain(b.roles),rules);assert.deepEqual(plain(b.base),[158,53,52]);
});
test('creation cancellation is atomic and optional regions start disabled',t=>{
 const prior=t.model();newDraft(t);assert.equal(t.$('new-rim').checked,false);assert.equal(t.$('new-bounce').checked,false);assert.equal(t.$('new-regions').children.length,3);
 input(t,field(t,'Shadow S amount'),-24);t.click('new-cancel');assert.deepEqual(t.model(),prior);
});
test('sampling draft holds sampled colors when Base changes and requires missing colors',t=>{
 newDraft(t);t.set('new-method','sample');assert.equal(t.$('new-create').disabled,true);
 input(t,field(t,'Base HEX'),'#41DB9D');input(t,field(t,'Shadow HEX'),'#349294');const shadow=field(t,'Shadow HEX').value;
 input(t,field(t,'Base HEX'),'#83DDAC');assert.equal(field(t,'Shadow HEX').value,shadow);assert.equal(t.$('new-create').disabled,true);
 rowAction(t,'highlight','Guess');t.flush();assert.equal(row(t,'highlight').querySelector('.sample-state').textContent,'Guessed');
 t.click('new-create');const b=t.model().balls.at(-1);assert.equal(b.roles.length,2);assert.equal(b.roles[1].rule.kind,'offset');assert.equal(b.strength,1);
});
test('different base applies the saved movements and named extra regions work',t=>{
 t.set('type-select','builtin-0');newDraft(t);t.$('new-examples').click();t.flush();assert.equal(t.$('new-create').disabled,true);
 input(t,field(t,'Base HEX'),'#A09040');assert.equal(t.$('new-method').value,'manual');const delta=Number(field(t,'Shadow S amount').value);
 t.click('new-add-role');const added=t.$('new-regions').lastElementChild;input(t,added.querySelector('.region-name'),'Glint');t.click('new-create');const b=t.model().balls.at(-1);assert.equal(b.roles.at(-1).name,'Glint');assert.ok(Math.abs(b.roles[1].rule.amounts.S-delta)<.001);
});
test('layer edits cancel cleanly; apply, transform, overlay, visibility, and undo are retained',async t=>{
 const before=t.model();await t.$('edit-layers').onclick();t.flush();assert.equal(t.$('layers-dialog').open,true);t.set('layer-x','600');t.click('layers-cancel');assert.deepEqual(t.model(),before);
 await t.$('edit-layers').onclick();t.flush();t.set('layer-kind','overlay');t.set('layer-opacity','45');t.set('layer-rotation','32');t.$('layer-flipX').click();t.flush();t.click('layer-copy');t.click('layer-down');t.click('layers-undo');t.click('layers-redo');t.click('layers-apply');
 const b=t.model().balls[0],l=b.design.layers.find(l=>l.kind==='overlay');assert.equal(b.mode,'custom');assert.equal(l.opacity,.45);assert.equal(l.rotation,32);assert.equal(l.flipX,true);assert.equal(b.design.layers.length,4);
 t.click('undo');assert.equal(t.model().balls[0].mode,'cel');t.click('redo');assert.equal(t.model().balls[0].mode,'custom');assert.equal(t.errors.length,0);
},{realCanvas:true});
test('PNG masks tint only alpha; overlays preserve RGB; custom geometry exports transparent pixels',async t=>{
 const E=t.w.Shade,A=t.w.ShadeAssets,R=t.w.ShadeRender,c=t.w.document.createElement('canvas');c.width=c.height=20;const p=c.getContext('2d');p.fillStyle='rgba(255,0,0,0.5)';p.fillRect(2,2,8,8);const id=await A.put(c.toDataURL(),20,20);
 const b=E.defaultBall('Mask',[120,100,50]);b.mode='custom';b.design={width:20,height:20,layers:[{id:'test',assetId:id,name:'Test',kind:'mask',role:'base',x:10,y:10,width:20,height:20,rotation:0,opacity:1,flipX:false,flipY:false,visible:true}]};
 p.clearRect(0,0,20,20);R.designCanvas(p,0,0,20,20,b,E.resolve(b));let pixel=[...p.getImageData(5,5,1,1).data];assert.deepEqual(pixel.slice(0,3),[0,255,0]);assert.ok(pixel[3]>=126&&pixel[3]<=129);assert.equal(p.getImageData(0,0,1,1).data[3],0);
 b.design.layers[0].kind='overlay';p.clearRect(0,0,20,20);R.designCanvas(p,0,0,20,20,b,E.resolve(b));pixel=[...p.getImageData(5,5,1,1).data];assert.deepEqual(pixel.slice(0,3),[255,0,0]);
 const exported=R.exportCanvas([b],'balls',1024,'transparent',false);assert.equal(exported.getContext('2d').getImageData(0,0,1,1).data[3],0);
 assert.equal(await A.put(A.record(id).data,20,20),id,'identical PNGs share an asset');
},{realCanvas:true});
test('project and ball type files embed assets, round-trip, and preserve independent copies',async t=>{
 await t.$('edit-layers').onclick();t.flush();t.click('layers-apply');t.click('save-type');t.$('type-name').value='Custom saved';await t.$('type-save').onclick();t.flush();
 const S=t.w.ShadeStudio,A=t.w.ShadeAssets,type=S.getLibrary().at(-1);assert.equal(type.name,'Custom saved');const portable=A.portable(type);assert.ok(Object.keys(portable.assets).length>=4);assert.ok(!JSON.stringify(t.model()).includes('base64'));
 const restored=await A.prepareDocument(portable);assert.deepEqual(plain(restored),plain(type));t.click('add-ball');const original=plain(t.model().balls[0]);t.set('number-H','123');assert.deepEqual(t.model().balls[0],original);assert.equal(S.getLibrary().at(-1).ball.base[0],original.base[0]);
 t.click('save-type');await t.$('type-update').onclick();t.flush();assert.deepEqual(t.model().balls[0],original);assert.equal(S.getLibrary().at(-1).ball.base[0],123);
 const project=A.portable(t.model());const loaded=await A.prepareDocument(project);assert.deepEqual(plain(loaded),t.model());
 t.click('remove-type');assert.equal(S.getLibrary().length,7);t.click('undo');assert.equal(S.getLibrary().length,8);
},{realCanvas:true});
test('IndexedDB saves assets and library together',async t=>{
 const S=t.w.ShadeStudio,A=t.w.ShadeAssets;
 await t.$('edit-layers').onclick();t.click('layers-apply');t.click('save-type');await t.$('type-save').onclick();
 await S.save(t.model());const loaded=await A.load();assert.deepEqual(plain(loaded.project),t.model());assert.equal(loaded.library.entries.length,8);
 const ids=t.w.Shade.assetIds([loaded.project,loaded.library]);assert.ok(ids.length>=4);assert.ok(ids.every(id=>!!A.image(id)));
},{realCanvas:true,db:new IDBFactory()});
test('version-1 localStorage migrates without changing the original saved text',async t=>{
 const legacy=t.model();legacy.version=1;for(const b of legacy.balls)for(const r of b.roles)delete r.rule;
 const raw=JSON.stringify(legacy),db=new IDBFactory(),restored=launch(raw,{db});
 try{await restored.w.ShadeReady;assert.equal(restored.model().version,3);assert.equal(restored.w.localStorage.getItem('shadelab-v1'),raw);await restored.w.ShadeStudio.save(restored.model());const fresh=launch(undefined,{db});try{await fresh.w.ShadeReady;assert.deepEqual(fresh.model(),restored.model());}finally{await fresh.close();}}finally{await restored.close();}
});
test('batch PNG import aligns matching canvases, fits other sizes, and replacement preserves transforms',async t=>{
 const makeFile=(name,width,height)=>{const c=t.w.document.createElement('canvas');c.width=width;c.height=height;c.getContext('2d').fillRect(0,0,width,height);const bytes=Buffer.from(c.toDataURL().split(',')[1],'base64');const f=new t.w.File([bytes],name,{type:'image/png'});f.arrayBuffer=async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);return f;};
 await t.$('edit-layers').onclick();t.click('layers-blank');const files=[makeFile('Base.png',100,80),makeFile('Shadow.png',100,80),makeFile('Detail.png',200,160)];Object.defineProperty(t.$('layers-files'),'files',{configurable:true,value:files});await t.$('layers-files').onchange();t.flush();
 assert.equal(t.$('layer-list').children.length,3);t.set('layer-rotation','30');t.set('layer-x','60');const replacement=makeFile('new-detail.png',50,50);Object.defineProperty(t.$('layer-replace-file'),'files',{configurable:true,value:[replacement]});await t.$('layer-replace-file').onchange();t.click('layers-apply');
 const d=t.model().balls[0].design;assert.equal(d.width,100);assert.equal(d.height,80);assert.equal(d.layers[0].x,50);assert.equal(d.layers[1].x,50);assert.equal(d.layers[2].width,100);assert.equal(d.layers[2].rotation,30);assert.equal(d.layers[2].x,60);assert.equal(t.w.ShadeAssets.record(d.layers[2].assetId).width,50);
},{realCanvas:true});
test('dragging a PNG layer commits one undo and pointer cancellation rolls it back',async t=>{
 await t.$('edit-layers').onclick();t.$('layer-preview').getBoundingClientRect=()=>({left:0,top:0,width:768,height:768});
 const x=Number(t.$('layer-x').value);t.event('layer-preview','pointerdown',{button:0,pointerId:7,clientX:150,clientY:150});t.event('layer-preview','pointermove',{pointerId:7,clientX:180,clientY:190});t.event('layer-preview','pointerup');assert.ok(Number(t.$('layer-x').value)>x);t.click('layers-undo');assert.equal(Number(t.$('layer-x').value),x);
 t.event('layer-preview','pointerdown',{button:0,pointerId:8,clientX:150,clientY:150});t.event('layer-preview','pointermove',{pointerId:8,clientX:240,clientY:240});t.event('layer-preview','pointercancel');assert.equal(Number(t.$('layer-x').value),x);t.click('layers-cancel');
},{realCanvas:true});
test('missing assets, malformed PNGs, and bad transforms reject without touching the project',async t=>{
 const prior=t.model(),A=t.w.ShadeAssets,E=t.w.Shade;
 await assert.rejects(A.prepareDocument({schema:'shadelab.ball-type',version:2,id:'bad',name:'Broken',ball:{...E.defaultBall(),mode:'custom',design:{width:20,height:20,layers:[{id:'layer',assetId:'missing',name:'Missing',kind:'mask',role:'base',x:10,y:10,width:20,height:20,rotation:0,opacity:1,flipX:false,flipY:false,visible:true}]}}}),/Missing embedded/);
 await assert.rejects(A.importRecords({bad:{data:'data:image/png;base64,AAAA',width:2,height:2}}));assert.deepEqual(t.model(),prior);
},{realCanvas:true});

test('applying measured amounts to a 2x advanced rule does not multiply the fitted movement again',t=>{
 t.set('selected-role','shadow');t.set('relationship-mode','formula');t.set('strength','2','input');t.event('strength','change');
 const amounts=Object.fromEntries(['H','S','L'].map(c=>[c,Number(field(t,c+' amount').value)]));if(t.$('sl-link').checked)t.$('sl-link').click();t.click('apply-amounts');
 const b=t.model().balls[0];assert.equal(b.strength,1);for(const c of ['H','S','L'])assert.equal(b.roles[1].rule.amounts[c],amounts[c]);
});
test('forty balls reuse PNG assets through extended editing and JSON/IndexedDB recovery',async t=>{
 await t.$('edit-layers').onclick();t.click('layers-apply');t.click('save-type');await t.$('type-save').onclick();
 const A=t.w.ShadeAssets,S=t.w.ShadeStudio,assetCount=Object.keys(A.portable([t.model(),S.getLibrary()]).assets).length;
 for(let i=0;i<40;i++){
  t.click('add-ball');const checkbox=t.$('group-move'),picker=t.$('eyedropper');t.set('selected-role','shadow');await pick(t,['#349294','#89284C','#191726'][i%3]);
  checkbox.click();t.flush();checkbox.click();t.flush();t.click('undo');t.click('redo');
  assert.equal(t.$('group-move'),checkbox);assert.equal(t.$('eyedropper'),picker);
 }
 assert.equal(t.model().balls.length,42);const portable=A.portable(t.model());assert.equal(Object.keys(A.portable([t.model(),S.getLibrary()]).assets).length,assetCount);assert.ok(!JSON.stringify(t.model()).includes('base64'));
 await S.save(t.model());const loaded=await A.load();assert.deepEqual(plain(loaded.project),t.model());assert.deepEqual(plain(await A.prepareDocument(portable)),t.model());
},{realCanvas:true,db:new IDBFactory()});

(async()=>{let failed=0;for(const {name,fn,options} of tests){const t=launch(undefined,options);try{await t.w.ShadeReady;await fn(t);assert.equal(t.errors.length,0,'uncaught UI error');console.log('PASS',name);}catch(e){failed++;console.log('FAIL',name,'\n',e.stack);}finally{await t.close();}}console.log(`${tests.length-failed}/${tests.length} v2 checks passed`);process.exitCode=failed?1:0;})();
