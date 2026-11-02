const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {IDBFactory}=require('fake-indexeddb');
const {launch}=require('./html-regression.cjs');
const tests=[],test=(name,fn,options={})=>tests.push({name,fn,options});
const plain=v=>JSON.parse(JSON.stringify(v));
const cards=t=>[...t.$('gallery').children];
const choose=(t,i,props={})=>t.event(cards(t)[i],'click',props);
const chosen=t=>plain(t.w.ShadeCollection.state().selected);
const group=(t,name)=>{t.click('make-group');t.$('group-name').value=name;t.click('group-save');return t.model().groups.at(-1);};
const field=(t,label)=>t.w.document.querySelector(`[aria-label="${label}"]`);
const setField=(t,label,value)=>{const n=field(t,label);n.value=value;t.event(n,'change');};
const imageData=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
const isGray=d=>{let colored=0,visible=0;for(let i=0;i<d.length;i+=4)if(d[i+3]){visible++;if(d[i]!==d[i+1]||d[i+1]!==d[i+2])colored++;}return visible>0&&colored===0;};
const readBlob=(w,blob)=>new Promise((resolve,reject)=>{const reader=new w.FileReader();reader.onload=()=>resolve(Buffer.from(reader.result));reader.onerror=reject;reader.readAsArrayBuffer(blob);});
function clipboard(t,write){t.w.isSecureContext=true;t.w.ClipboardItem=class{static supports(type){return type==='image/png';}constructor(data){this.data=data;}};Object.defineProperty(t.w.navigator,'clipboard',{configurable:true,value:{write}});}

test('range selection, toggles and active editing are independent',t=>{
 t.click('add-ball');t.click('add-ball');choose(t,0);choose(t,2,{shiftKey:true});assert.equal(chosen(t).length,3);
 const before=t.model();t.set('number-H','81');const after=t.model();assert.equal(after.balls[2].base[0],81);assert.deepEqual(after.balls[0],before.balls[0]);assert.deepEqual(after.balls[1],before.balls[1]);
 choose(t,1,{ctrlKey:true});assert.deepEqual(chosen(t),[after.balls[0].id,after.balls[2].id]);
 cards(t)[3].querySelector('.ball-selection input').click();t.flush();assert.equal(chosen(t).length,3);
 t.click('clear-selection');assert.equal(chosen(t).length,0);assert.equal(t.$('copy-png').disabled,true);assert.equal(t.$('number-H').disabled,false);
 t.click('select-all');assert.equal(chosen(t).length,4);
});
test('saved groups support membership, rename, removal and undo',t=>{
 t.click('add-ball');choose(t,0);choose(t,1,{ctrlKey:true});const g=group(t,'Skin tones');assert.equal(g.memberIds.length,2);
 choose(t,2,{ctrlKey:true});assert.equal(t.$('ball-groups').value,g.id);t.click('group-add');assert.equal(t.model().groups[0].memberIds.length,3);
 choose(t,2);t.click('group-remove');assert.equal(t.model().groups[0].memberIds.length,2);
 t.click('rename-group');t.$('group-name').value='Lighting';t.click('group-save');assert.equal(t.model().groups[0].name,'Lighting');
 t.set('ball-groups',g.id);assert.equal(chosen(t).length,2);t.click('remove-selected');assert.equal(t.model().balls.length,1);assert.equal(t.model().groups[0].memberIds.length,0);
 t.click('undo');assert.equal(t.model().balls.length,3);assert.equal(t.model().groups[0].memberIds.length,2);
 t.click('delete-group');assert.equal(t.model().groups.length,0);assert.equal(t.model().balls.length,3);t.click('undo');assert.equal(t.model().groups[0].name,'Lighting');
 t.click('select-all');const before=t.model();t.click('remove-selected');assert.deepEqual(t.model(),before);assert.match(t.$('status').textContent,/at least one/);
});
test('group copies have independent IDs, recipes and preserved order',t=>{
 t.click('select-all');group(t,'Originals');const before=t.model();t.click('duplicate-group');const after=t.model();assert.equal(after.balls.length,4);assert.equal(new Set(after.balls.map(b=>b.id)).size,4);assert.equal(after.groups.length,2);assert.deepEqual(after.groups[1].memberIds,after.balls.slice(2).map(b=>b.id));
 t.set('number-H','111');assert.deepEqual(t.model().balls.slice(0,2),before.balls);t.click('undo');t.click('undo');assert.deepEqual(t.model(),before);
});
test('moving a nonadjacent selection preserves block order and undo',t=>{
 t.click('add-ball');t.click('add-ball');const ids=t.model().balls.map(b=>b.id);choose(t,0);choose(t,2,{ctrlKey:true});t.click('move-later');assert.deepEqual(t.model().balls.map(b=>b.id),[ids[1],ids[3],ids[0],ids[2]]);assert.equal(chosen(t).length,2);
 t.click('undo');assert.deepEqual(t.model().balls.map(b=>b.id),ids);t.click('redo');t.click('move-earlier');assert.deepEqual(t.model().balls.map(b=>b.id),[ids[1],ids[0],ids[2],ids[3]]);
});
test('gallery pointer drag commits once and Escape/cancellation commit nothing',t=>{
 t.click('add-ball');choose(t,0);const before=t.model(),target=cards(t)[2];target.getBoundingClientRect=()=>({left:200,width:100});t.w.document.elementFromPoint=()=>target;
 const start=()=>t.event(cards(t)[0].querySelector('.drag-handle'),'pointerdown',{button:0,pointerId:9,clientX:10,clientY:200});
 start();t.event(t.w.document,'pointermove',{pointerId:9,clientX:290,clientY:200});t.event(t.w.document,'keydown',{key:'Escape'});assert.deepEqual(t.model(),before);
 start();t.event(t.w.document,'pointermove',{pointerId:9,clientX:290,clientY:200});t.event(t.w.document,'pointercancel',{pointerId:9});assert.deepEqual(t.model(),before);
 start();t.event(t.w.document,'pointermove',{pointerId:9,clientX:290,clientY:200});t.event(t.w.document,'pointerup',{pointerId:9});assert.deepEqual(t.model().balls.map(b=>b.id),[before.balls[1].id,before.balls[2].id,before.balls[0].id]);t.click('undo');assert.deepEqual(t.model(),before);
});
test('grayscale filters previews and comparisons without changing color data',t=>{
 const before=t.model();cards(t)[0].querySelector('.ball-gray input').click();t.flush();const b=t.model().balls[0],original=before.balls[0];delete b.grayscale;assert.deepEqual(b,original);
 assert.equal(isGray(imageData(cards(t)[0].querySelector('canvas'))),true);assert.equal(isGray(imageData(t.$('comparison-gallery').querySelector('canvas'))),true);
 assert.equal(isGray(imageData(cards(t)[1].querySelector('canvas'))),false);t.click('select-all');assert.equal(t.$('selection-gray').indeterminate,true);t.$('selection-gray').click();t.flush();assert.ok(t.model().balls.every(b=>b.grayscale));
 t.$('selection-gray').click();t.flush();assert.ok(t.model().balls.every(b=>!b.grayscale));assert.deepEqual(t.model().balls.map(b=>b.base),before.balls.map(b=>b.base));
},{realCanvas:true});
test('grayscale includes colored overlays while original PNG export keeps color',async t=>{
 await t.$('edit-layers').onclick();t.click('layers-apply');const b=plain(t.model().balls[0]),A=t.w.ShadeAssets,R=t.w.ShadeRender,c=t.w.document.createElement('canvas');c.width=c.height=20;c.getContext('2d').fillStyle='#f01080';c.getContext('2d').fillRect(0,0,20,20);const id=await A.put(c.toDataURL(),20,20);b.design.layers.push({...b.design.layers[0],id:'overlay',assetId:id,kind:'overlay',opacity:.5});b.grayscale=true;
 const gray=R.exportCanvas([b],'both',1024,'transparent',false,[],true),original=R.exportCanvas([b],'both',1024,'transparent',false,[],false);assert.ok(isGray(imageData(gray)));assert.equal(isGray(imageData(original)),false);assert.equal(imageData(gray)[3],0);assert.equal(imageData(original)[3],0);
 fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});fs.writeFileSync(path.join(__dirname,'artifacts/part1-grayscale.png'),Buffer.from(gray.toDataURL().split(',')[1],'base64'));
},{realCanvas:true});
test('Copy PNG writes one transparent PNG from selected balls without mutating studies',async t=>{
 t.click('select-all');const before=t.model(),order=chosen(t);let copied,synchronous=false,returned=false;
 clipboard(t,async items=>{synchronous=!returned;assert.equal(items.length,1);assert.deepEqual(Object.keys(items[0].data),['image/png']);copied=await items[0].data['image/png'];});
 const pending=t.$('copy-png').onclick();returned=true;await pending;assert.equal(synchronous,true);assert.equal(copied.type,'image/png');assert.deepEqual(t.model(),before);assert.deepEqual(chosen(t),order);assert.match(t.$('copy-result').textContent,/PNG copied/);
 const bytes=await readBlob(t.w,copied),{loadImage,createCanvas}=require('@napi-rs/canvas'),img=await loadImage(bytes),c=createCanvas(img.width,img.height),p=c.getContext('2d');p.drawImage(img,0,0);assert.equal(img.width,2048);assert.equal(p.getImageData(0,0,1,1).data[3],0);assert.ok(p.getImageData(512,500,1,1).data[3]);assert.ok(p.getImageData(1536,500,1,1).data[3]);
 fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});fs.writeFileSync(path.join(__dirname,'artifacts/part1-copy.png'),bytes);
},{realCanvas:true});
test('clipboard refusal keeps a preview and Retry works without editing the project',async t=>{
 const before=t.model();clipboard(t,async()=>{throw new t.w.DOMException('Denied','NotAllowedError');});await t.$('copy-png').onclick();assert.match(t.$('copy-result').textContent,/denied/);assert.equal(t.$('copy-dialog').open,true);assert.ok(t.$('copy-preview').src.startsWith('blob:'));assert.equal(t.$('copy-png').disabled,false);
 clipboard(t,async items=>assert.equal((await items[0].data['image/png']).type,'image/png'));await t.$('copy-retry').onclick();assert.match(t.$('copy-result').textContent,/PNG copied/);assert.deepEqual(t.model(),before);
});
test('PNG copy defaults to displayed grayscale; original override and layouts work',async t=>{
 t.$('selection-gray').click();t.flush();const R=t.w.ShadeRender,actual=R.exportCanvas,seen=[];R.exportCanvas=(...args)=>{seen.push(args);return actual(...args);};clipboard(t,async()=>{});
 await t.$('copy-png').onclick();assert.equal(seen[0][6],true);t.click('copy-close');t.set('copy-kind','strips');t.set('copy-background','white');t.$('copy-original').checked=true;t.$('copy-labels').checked=true;await t.$('copy-png').onclick();assert.equal(seen[1][1],'strips');assert.equal(seen[1][3],'white');assert.equal(seen[1][4],true);assert.equal(seen[1][6],false);
});
test('the default type editor is transactional and preserves advanced rules',async t=>{
 const S=t.w.ShadeStudio,before=plain(S.getLibraryState()),project=t.model();t.click('edit-type');t.$('new-name').value='Edited Classic';setField(t,'Base HEX','#986432');t.click('new-cancel');assert.deepEqual(plain(S.getLibraryState()),before);assert.deepEqual(t.model(),project);
 t.click('edit-type');t.$('new-name').value='Edited Classic';const formula=field(t,'Shadow L formula');formula.value='L - 17*t';[...formula.closest('.creation-region').querySelectorAll('button')].find(n=>n.textContent==='Apply formulas').click();t.flush();await t.$('new-create').onclick();t.flush();const type=S.getLibrary()[0];assert.equal(type.name,'Edited Classic');assert.equal(type.ball.roles.find(r=>r.id==='shadow').expressions.L,'L - 17*t');assert.equal(type.ball.roles.find(r=>r.id==='shadow').rule.kind,'formula');assert.deepEqual(t.model(),project);
 t.click('add-ball');assert.equal(t.model().balls.at(-1).roles.find(r=>r.id==='shadow').expressions.L,'L - 17*t');t.click('undo');t.click('undo');assert.deepEqual(plain(S.getLibraryState()),before);
},{realCanvas:true});
test('type layer changes remain drafts until Save, and Save as new preserves the default',async t=>{
 const S=t.w.ShadeStudio,before=plain(S.getLibraryState());t.click('edit-type');await t.$('new-edit-layers').onclick();t.click('layers-apply');t.click('new-cancel');assert.deepEqual(plain(S.getLibraryState()),before);
 t.click('edit-type');await t.$('new-edit-layers').onclick();t.set('layer-opacity','55');t.click('layers-apply');t.$('new-name').value='Soft custom';await t.$('new-type-copy').onclick();t.flush();assert.equal(S.getLibrary().length,8);assert.deepEqual(plain(S.getLibrary()[0]),before.entries[0]);const added=S.getLibrary().at(-1);assert.equal(added.ball.mode,'custom');assert.ok(added.ball.design.layers.some(l=>l.opacity===.55));assert.equal(added.originDefaultId,undefined);
},{realCanvas:true});
test('removed defaults and a fully empty type library survive storage and can be restored',async t=>{
 const S=t.w.ShadeStudio,A=t.w.ShadeAssets;t.click('remove-type');assert.equal(S.getLibrary().some(t=>t.id==='builtin-classic'),false);await S.save(t.model());let saved=await A.load();S.setLibrary(saved.library);assert.equal(S.getLibrary().length,6);
 for(let i=0;i<6;i++)t.click('remove-type');assert.equal(S.getLibrary().length,0);await S.save(t.model());saved=await A.load();S.setLibrary(saved.library);assert.equal(S.getLibrary().length,0);assert.equal(t.$('edit-type').disabled,true);t.click('add-ball');assert.equal(t.model().balls.length,3);t.click('restore-types');assert.equal(S.getLibrary().length,7);t.click('undo');assert.equal(S.getLibrary().length,0);
},{db:new IDBFactory()});
test('new type creation works with an empty library and restores selected defaults explicitly',async t=>{
 const S=t.w.ShadeStudio;S.setLibrary({schema:'shadelab.library',version:3,seededDefaults:1,entries:[]});t.click('new-type');t.$('new-name').value='First type';await t.$('new-create').onclick();t.flush();assert.equal(S.getLibrary().length,1);assert.equal(S.getLibrary()[0].name,'First type');t.click('restore-types');t.set('type-select','builtin-0');t.click('edit-type');setField(t,'Base HEX','#abcdef');await t.$('new-create').onclick();t.click('restore-type');assert.deepEqual(plain(S.getLibrary().find(t=>t.id==='builtin-0').ball.base),plain(S.builtins[1].ball.base));
},{realCanvas:true});
test('type sources reject cycles and percentage rules can be edited directly',async t=>{
 t.click('edit-type');setField(t,'Highlight source','shadow');setField(t,'Shadow source','highlight');assert.match(t.$('new-error').textContent,/cycle/i);assert.equal(field(t,'Shadow source').value,'base');
 setField(t,'Shadow relationship mode','percent');setField(t,'Shadow L amount','-25');await t.$('new-create').onclick();t.flush();const role=t.w.ShadeStudio.getLibrary()[0].ball.roles.find(r=>r.id==='shadow');assert.equal(role.source,'base');assert.equal(role.rule.kind,'percent');assert.equal(role.rule.amounts.L,-25);
},{realCanvas:true});
test('a canceled type draft cannot reopen its asynchronously prepared layer editor',async t=>{
 const A=t.w.ShadeAssets,put=A.put,prior=plain(t.w.ShadeStudio.getLibraryState());let resume;A.put=async(...args)=>{if(!resume)await new Promise(resolve=>resume=resolve);return put(...args);};t.click('edit-type');const pending=t.$('new-edit-layers').onclick();t.click('new-cancel');resume();await pending;assert.equal(t.$('layers-dialog').open,false);assert.deepEqual(plain(t.w.ShadeStudio.getLibraryState()),prior);
},{realCanvas:true});
test('saved project flags and membership survive a fresh application session',async t=>{
 t.click('select-all');group(t,'Both');t.$('selection-gray').click();t.$('temperature-visible').click();t.flush();choose(t,1);t.click('move-earlier');const expected=t.model();await t.w.ShadeStudio.save(expected);const fresh=launch(undefined,{db:t.w.indexedDB});try{await fresh.w.ShadeReady;assert.deepEqual(fresh.model(),expected);fresh.set('ball-groups',expected.groups[0].id);assert.equal(chosen(fresh).length,2);}finally{await fresh.close();}
},{db:new IDBFactory()});
test('unavailable image clipboard offers the preview without false success',async t=>{
 t.w.isSecureContext=false;await t.$('copy-png').onclick();assert.match(t.$('copy-result').textContent,/unavailable/);assert.equal(t.$('copy-result').classList.contains('error'),true);assert.ok(t.$('copy-preview').src.startsWith('blob:'));assert.equal(t.$('copy-retry').disabled,false);
});
test('warm/cool guide is fixed at 90 and 270, masks the picker, and never moves with dragging',t=>{
 const before=t.model(),E=t.w.Shade,R=t.w.ShadeRender;assert.equal(t.$('temperature-visible').checked,true);t.$('temperature-visible').click();t.$('temperature-visible').click();t.flush();const expected={visible:true,start:90,end:270};assert.deepEqual(t.model().temperatureGuide,expected);assert.deepEqual(t.model().balls,before.balls);assert.equal(t.$('temperature-start'),null);assert.equal(t.$('temperature-end'),null);
 const legacy=t.model();legacy.temperatureGuide={visible:true,start:75,end:285};assert.deepEqual(plain(E.normalizeDocument(legacy).temperatureGuide),expected);
 for(const shape of ['triangle','square']){
  const make=g=>{const c=t.w.document.createElement('canvas');c.width=c.height=640;R.drawWheel(c,before.balls[0],'base',['base','highlight','shadow'],shape,g);return c;};
  const off=make({visible:false}),on=make(expected),stale=make({visible:true,start:20,end:140}),a=imageData(off),b=imageData(on);assert.deepEqual(imageData(stale),b,'legacy angles cannot rotate the guideline');assert.notDeepEqual(a,b,'the guideline is visible');
  for(let y=62;y<259;y++)for(let x=84;x<249;x++)if(E.pickerContains(x,y,shape)){const i=(y*2*640+x*2)*4;assert.deepEqual(b.slice(i,i+4),a.slice(i,i+4),'guide must not cover the color area');}
  fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});fs.writeFileSync(path.join(__dirname,`artifacts/part1-guide-${shape}.png`),Buffer.from(on.toDataURL().split(',')[1],'base64'));
 }
 t.$('wheel').getBoundingClientRect=()=>({left:0,top:0,width:320,height:320});t.event('wheel','pointerdown',{button:0,pointerId:12,clientX:314,clientY:160});t.event('wheel','pointermove',{pointerId:12,clientX:280,clientY:225});t.event('wheel','pointerup',{pointerId:12});assert.deepEqual(t.model().temperatureGuide,expected);assert.deepEqual(plain(t.w.ShadeCollection.guide()),expected);t.click('undo');assert.deepEqual(t.model().balls,before.balls);t.click('undo');t.click('undo');assert.deepEqual(t.model(),before);
},{realCanvas:true});
test('groups, order, grayscale and guide round-trip; malformed membership rejects',async t=>{
 t.click('add-ball');t.click('select-all');group(t,'All');t.$('selection-gray').click();t.$('temperature-visible').click();t.flush();choose(t,2);t.click('move-earlier');const doc=t.model(),E=t.w.Shade;assert.deepEqual(plain(await t.w.ShadeAssets.prepareDocument(t.w.ShadeAssets.portable(doc))),doc);
 const bad=plain(doc);bad.groups[0].memberIds.push('missing');assert.throws(()=>E.normalizeDocument(bad),/group/i);bad.groups[0].memberIds.pop();bad.groups.push(plain(bad.groups[0]));assert.throws(()=>E.normalizeDocument(bad),/group/i);bad.groups.pop();bad.balls[0].grayscale='yes';assert.throws(()=>E.normalizeDocument(bad),/grayscale/i);
});
test('large images are rejected cleanly and sample exports work with no selected balls',async t=>{
 const R=t.w.ShadeRender;assert.throws(()=>R.exportCanvas(Array(300).fill(t.model().balls[0]),'both',4096,'transparent',true),/too large/);t.picks.push('#abcdef');await t.$('eyedropper').onclick();t.click('clear-selection');t.set('export-scope','samples');t.click('download-png');assert.match(t.$('status').textContent,/PNG exported/);
});

(async()=>{let failed=0;for(const {name,fn,options}of tests){const t=launch(undefined,options);try{await t.w.ShadeReady;await fn(t);assert.equal(t.errors.length,0,'uncaught UI error');console.log('PASS',name);}catch(e){failed++;console.log('FAIL',name,'\n',e.stack);}finally{await t.close();}}console.log(`${tests.length-failed}/${tests.length} Part 1 checks passed`);process.exitCode=failed?1:0;})();
