const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {IDBFactory}=require('fake-indexeddb');
const {launch}=require('./html-regression.cjs');
const tests=[],test=(name,fn)=>tests.push({name,fn}),plain=v=>JSON.parse(JSON.stringify(v));
const field=(t,label)=>t.w.document.querySelector(`[aria-label="${label}"]`);
const row=(t,id)=>t.$('new-regions').querySelector(`[data-region="${id}"]`);
const action=(t,id,text)=>[...row(t,id).querySelectorAll('button')].find(n=>n.textContent===text);
const open=t=>{t.$('add-ball').click();t.flush();};
const input=(t,label,value)=>{const n=field(t,label);n.focus();n.value=value;t.event(n,'input');};
const preview=t=>t.$('new-preview').toDataURL();
function png(t,name='region.png',width=64,height=64,draw){
 const c=t.w.document.createElement('canvas');c.width=width;c.height=height;const p=c.getContext('2d');p.fillStyle='#e217a1';if(draw)draw(p,width,height);else p.fillRect(width/4,height/4,width/2,height/2);
 const bytes=Buffer.from(c.toDataURL().split(',')[1],'base64'),file=new t.w.File([bytes],name,{type:'image/png'});file.arrayBuffer=async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);return file;
}
function upload(t,id,file){action(t,id,'Upload PNG').onclick();Object.defineProperty(t.$('new-region-file'),'files',{configurable:true,value:file?[file]:[]});return Promise.resolve(t.$('new-region-file').onchange()).then(()=>t.flush());}
async function customType(t){
 const E=t.w.Shade,A=t.w.ShadeAssets,b=E.defaultBall('Layered',[120,100,50]);b.mode='custom';b.design=await t.w.ShadeStudio.starter(b,'cel');
 const a=await A.fromFile(png(t,'overlay.png')),overlay={...b.design.layers[0],id:'overlay_mid',assetId:a.id,kind:'overlay',opacity:.35};delete overlay.clip;delete overlay.blur;
 b.design.layers.splice(2,0,overlay,{...b.design.layers[1],id:'base_second',x:400,opacity:.5});
 const type={schema:'shadelab.ball-type',version:3,id:'layered_type',name:'Layered type',ball:b};t.w.ShadeStudio.importType(type);t.flush();return plain(type);
}
test('every default and a custom recipe immediately replace the full draft and preview',async t=>{
 const custom=await customType(t),S=t.w.ShadeStudio,types=plain(S.getLibrary());
 for(const type of types){open(t);t.$('new-name').value='My entered name';t.set('new-recipe',type.id);
  assert.equal(field(t,'Base HEX').value,t.w.Shade.toHex(type.ball.base));const expected=t.w.document.createElement('canvas');expected.width=380;expected.height=300;t.w.ShadeRender.ballCanvas(expected,type.ball,1);assert.equal(preview(t),expected.toDataURL(),type.name+' preview');
  assert.equal(t.$('new-name').value,'My entered name');assert.equal(t.$('new-method').value,'manual');assert.equal(t.$('new-examples').checked,true);t.click('new-create');const b=t.model().balls.at(-1);assert.equal(b.name,'My entered name');assert.deepEqual(b.base,type.ball.base);assert.deepEqual(b.roles,type.ball.roles);assert.equal(b.mode,type.ball.mode);assert.deepEqual(b.design,type.ball.design);
 }
 assert.equal(custom.ball.mode,'custom');
});
test('switching type drops old uploads and samples while preserving the edit destination',async t=>{
 open(t);input(t,'Base HEX','#223344');await upload(t,'shadow',png(t));t.set('new-recipe','builtin-1');assert.equal(row(t,'shadow').querySelector('.sample-state').textContent,'Example');t.click('new-create');assert.equal(t.model().balls.at(-1).mode,'cel');assert.equal(t.model().samples.length,0);
 const S=t.w.ShadeStudio,library=plain(S.getLibraryState());t.set('type-select','builtin-classic');t.click('edit-type');t.set('new-recipe','builtin-2');t.$('new-name').value='Reworked Classic';await t.$('new-create').onclick();t.flush();assert.equal(S.getLibrary().length,library.entries.length);const changed=S.getLibrary().find(x=>x.id==='builtin-classic');assert.equal(changed.name,'Reworked Classic');assert.deepEqual(plain(changed.ball.base),library.entries.find(x=>x.id==='builtin-2').ball.base);assert.deepEqual(plain(S.getLibrary().find(x=>x.id==='builtin-2')),library.entries.find(x=>x.id==='builtin-2'));t.click('undo');assert.deepEqual(plain(S.getLibraryState()),library);
});
test('a type that cannot resolve at 1x leaves the current draft or project intact',t=>{
 const E=t.w.Shade,b=E.defaultBall();b.strength=2;b.roles[0].expressions.L='L / (t - 1)';E.setRule(b.roles[0],'formula');t.w.ShadeStudio.importType({schema:'shadelab.ball-type',version:3,id:'bad_at_one',name:'Invalid at one',ball:b});t.set('type-select','builtin-classic');open(t);const before=preview(t),project=t.model();t.set('new-recipe','bad_at_one');assert.equal(t.$('new-recipe').value,'builtin-classic');assert.equal(preview(t),before);assert.match(t.$('new-error').textContent,/1×/);t.click('new-cancel');t.set('type-select','bad_at_one');open(t);assert.equal(t.$('new-dialog').open,false);assert.deepEqual(t.model(),project);assert.match(t.$('status').textContent,/1×/);
});
test('valid typing, Guess, screen picks and softness redraw without blur',async t=>{
 open(t);let old=preview(t);input(t,'Base HEX','#2255AA');assert.notEqual(preview(t),old);old=preview(t);input(t,'Shadow L amount','-35');assert.notEqual(preview(t),old);old=preview(t);
 const color=field(t,'Highlight color');color.focus();color.value='#ffffcc';t.event(color,'input');assert.notEqual(preview(t),old);old=preview(t);action(t,'highlight','Guess').click();t.flush();assert.notEqual(preview(t),old);old=preview(t);t.picks.push('#000066');await action(t,'shadow','Pick screen').onclick();t.flush();assert.notEqual(preview(t),old);t.click('new-cancel');
 t.click('edit-type');old=preview(t);t.set('new-softness','75','input');assert.notEqual(preview(t),old);
});
test('incomplete inputs retain the last valid preview and cannot be silently committed',t=>{
 open(t);input(t,'Base HEX','#2255AA');const valid=preview(t);input(t,'Base HEX','#22');assert.equal(preview(t),valid);assert.equal(t.$('new-create').disabled,true);assert.equal(field(t,'Base HEX').getAttribute('aria-invalid'),'true');input(t,'Base HEX','#2255AA');assert.equal(t.$('new-create').disabled,false);
 const before=preview(t);input(t,'Shadow S amount','');assert.equal(preview(t),before);assert.equal(t.$('new-create').disabled,true);input(t,'Shadow S amount','-20');assert.equal(t.$('new-create').disabled,false);assert.notEqual(preview(t),before);
 input(t,'Base HEX','#2');action(t,'base','Guess').click();t.flush();assert.equal(t.$('new-create').disabled,false);assert.equal(field(t,'Base HEX').getAttribute('aria-invalid'),null);
});
test('a previously entered value can be entered again after another color control changes it',t=>{
 open(t);input(t,'Base HEX','#115599');const original=preview(t);const color=field(t,'Base color');color.value='#33aa44';t.event(color,'input');assert.notEqual(preview(t),original);input(t,'Base HEX','#115599');assert.equal(preview(t),original);
});
test('built-in mask conversion shares geometry and keeps normal/soft previews aligned',async t=>{
 for(const mode of ['cel','rim'])for(const softness of [0,50]){
  const b=t.w.Shade.defaultBall();b.mode=mode;b.softness=softness;const draw=ball=>{const c=t.w.document.createElement('canvas');c.width=c.height=384;t.w.ShadeRender.ballCanvas(c,ball);return c;},before=draw(b);b.design=await t.w.ShadeStudio.starter(b,mode);b.mode='custom';const after=draw(b),a=before.getContext('2d').getImageData(0,0,384,384).data,z=after.getContext('2d').getImageData(0,0,384,384).data;
  let error=0,over8=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-z[i]);error+=d;if(d>8)over8++;}assert.ok(error/a.length<1,'mean channel difference stays below one level');assert.ok(over8/a.length<.01,'at least 99% of channels remain within antialiasing tolerance');
  if(mode==='rim'&&softness===50){fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});for(const [name,c]of [['before',before],['after',after]])fs.writeFileSync(path.join(__dirname,`artifacts/new-ball-geometry-${name}.png`),Buffer.from(c.toDataURL().split(',')[1],'base64'));}
 }
});
test('all region rows upload tinted masks with full-canvas proportional placement',async t=>{
 open(t);t.$('new-rim').click();t.$('new-bounce').click();t.click('new-add-role');const ids=[...t.$('new-regions').children].map(n=>n.dataset.region),colors={};for(const id of ids){const name=row(t,id).querySelector('.region-name').value;colors[id]=field(t,name+' HEX').value;await upload(t,id,png(t,id+'.png',80,40));}
 t.click('new-create');const b=t.model().balls.at(-1);assert.equal(b.mode,'custom');assert.equal(b.design.layers.length,ids.length);
 for(const id of ids){const ls=b.design.layers.filter(l=>l.kind==='mask'&&l.role===id);assert.equal(ls.length,1);const l=ls[0];assert.equal(l.width,1024);assert.equal(l.height,512);assert.equal(l.x,512);assert.equal(l.y,512);assert.equal(l.clip,undefined);assert.equal(l.rotation,0);assert.equal(l.opacity,1);
  const c=t.w.document.createElement('canvas');c.width=c.height=200;t.w.ShadeRender.designCanvas(c.getContext('2d'),0,0,200,200,{...b,design:{...b.design,layers:[l]}},t.w.Shade.resolve(b));const px=[...c.getContext('2d').getImageData(100,100,1,1).data];assert.equal('#'+px.slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase(),colors[id]);assert.equal(c.getContext('2d').getImageData(0,0,1,1).data[3],0);
 }
});
test('replacement collapses matching masks at the topmost position and preserves overlays',async t=>{
 const type=await customType(t);open(t);t.set('new-recipe',type.id);const before=preview(t);await upload(t,'base',png(t,'first.png'));assert.notEqual(preview(t),before);await upload(t,'base',png(t,'second.png',50,50,(p,w,h)=>p.fillRect(0,0,w/2,h)));t.click('new-create');const b=t.model().balls.at(-1),ls=b.design.layers;
 assert.deepEqual(ls.map(l=>l.kind==='mask'&&l.role==='base'?'new_base':l.id),[type.ball.design.layers[0].id,'overlay_mid','new_base',type.ball.design.layers.at(-1).id]);for(const l of ls.filter(l=>l.role!=='base'||l.kind==='overlay'))assert.deepEqual(l,type.ball.design.layers.find(x=>x.id===l.id));
});
test('new shape preview, sampling requirements and canceled drafts remain independent',async t=>{
 const before=t.model(),library=plain(t.w.ShadeStudio.getLibraryState());open(t);t.set('new-method','sample');const old=preview(t);await upload(t,'highlight',png(t,'highlight.png',64,64,(p,w,h)=>p.fillRect(w/2,0,w/2,h/2)));assert.notEqual(preview(t),old);assert.equal(t.$('new-create').disabled,true);assert.equal(field(t,'Base HEX').value,'');t.click('new-cancel');assert.deepEqual(t.model(),before);assert.deepEqual(plain(t.w.ShadeStudio.getLibraryState()),library);
});
test('file-picker cancellation and invalid, oversized or corrupt PNGs change no draft data',async t=>{
 open(t);const old=preview(t);await upload(t,'base',null);assert.equal(preview(t),old);
 const invalid=new t.w.File(['invalid'],'bad.jpg',{type:'image/jpeg'});invalid.arrayBuffer=async()=>new Uint8Array(25).buffer;await upload(t,'base',invalid);assert.match(t.$('new-error').textContent,/PNG/);assert.equal(preview(t),old);
 const large=png(t);Object.defineProperty(large,'size',{value:33*1024*1024});await upload(t,'base',large);assert.match(t.$('new-error').textContent,/32 MB/);assert.equal(preview(t),old);
 const dimensions=png(t),bytes=new Uint8Array(await dimensions.arrayBuffer());new DataView(bytes.buffer).setUint32(16,5000);new DataView(bytes.buffer).setUint32(20,5000);dimensions.arrayBuffer=async()=>bytes.buffer;await upload(t,'base',dimensions);assert.match(t.$('new-error').textContent,/16 megapixels/);assert.equal(preview(t),old);
 const bad=png(t),raw=new Uint8Array(await bad.arrayBuffer());bad.arrayBuffer=async()=>raw.slice(0,24).buffer;await upload(t,'base',bad);assert.match(t.$('new-error').textContent,/PNG/);assert.equal(preview(t),old);assert.equal(t.$('new-create').disabled,false);t.click('new-create');assert.equal(t.model().balls.at(-1).mode,'cel');
});
test('pending uploads block commit and parallel regions merge without losing either shape',async t=>{
 open(t);const A=t.w.ShadeAssets,original=A.fromFile,release=[];A.fromFile=file=>new Promise(resolve=>release.push(()=>resolve(original(file))));const first=upload(t,'base',png(t,'base.png')),second=upload(t,'highlight',png(t,'highlight.png',32,64));assert.equal(t.$('new-create').disabled,true);release[1]();await second;assert.equal(t.$('new-create').disabled,true);release[0]();await first;assert.equal(t.$('new-create').disabled,false);t.click('new-create');const b=t.model().balls.at(-1);assert.equal(b.design.layers.filter(l=>l.role==='base').length,1);assert.equal(b.design.layers.filter(l=>l.role==='highlight').length,1);assert.equal(b.design.layers.find(l=>l.role==='highlight').width,512);
});
test('recipe switches and closure discard stale uploads and reclaim unreferenced assets',async t=>{
 const A=t.w.ShadeAssets,original=A.fromFile;let resume,added;A.fromFile=file=>new Promise(resolve=>resume=async()=>{added=await original(file);resolve(added);});open(t);const pending=upload(t,'base',png(t));t.set('new-recipe','builtin-4');const current=preview(t);await resume();await pending;assert.equal(preview(t),current);assert.equal(A.record(added.id),undefined);assert.equal(t.$('new-create').disabled,false);
 const pending2=upload(t,'base',png(t));t.click('new-cancel');await resume();await pending2;assert.equal(t.$('new-dialog').open,false);assert.equal(A.record(added.id),undefined);assert.equal(t.model().balls.length,2);
});
test('removing a region during upload prevents its delayed shape from reappearing',async t=>{
 const A=t.w.ShadeAssets,original=A.fromFile;let resume;A.fromFile=file=>new Promise(resolve=>resume=()=>resolve(original(file)));
 for(const reenable of [false,true]){open(t);t.$('new-rim').click();t.flush();const pending=upload(t,'rim',png(t));t.$('new-rim').click();t.flush();if(reenable){t.$('new-rim').click();t.flush();}resume();await pending;assert.equal(!!row(t,'rim'),reenable);t.click('new-create');assert.equal(t.model().balls.at(-1).mode,'cel');assert.equal(t.model().balls.at(-1).roles.some(r=>r.id==='rim'),reenable);}
});
test('created and saved types retain uploaded shapes through undo and portable reload',async t=>{
 open(t);await upload(t,'shadow',png(t));t.click('new-create');const saved=t.model(),A=t.w.ShadeAssets;const portable=A.portable(saved);t.click('undo');assert.equal(t.model().balls.length,2);t.click('redo');assert.deepEqual(t.model(),saved);assert.deepEqual(plain(await A.prepareDocument(portable)),saved);
 t.click('edit-type');await upload(t,'base',png(t,'base.png',128,64));await t.$('new-create').onclick();t.flush();const S=t.w.ShadeStudio,type=plain(S.getLibrary()[0]);assert.equal(type.ball.mode,'custom');assert.deepEqual(plain(await A.prepareDocument(A.portable(type))),type);await S.save(t.model());const fresh=launch(undefined,{realCanvas:true,db:t.w.indexedDB});try{await fresh.w.ShadeReady;assert.deepEqual(plain(fresh.w.ShadeStudio.getLibrary()[0]),type);assert.deepEqual(fresh.model(),saved);}finally{await fresh.close();}
});
test('removed image sampler cannot intercept dialog paste, while workspace paste still works',async t=>{
 let decodes=0;t.w.createImageBitmap=async()=>{decodes++;throw Error('Test decoder');};open(t);assert.equal(t.$('new-reference'),null);assert.equal(t.$('new-image-role'),null);t.event(t.w.document,'paste',{clipboardData:{items:[{type:'image/png',getAsFile:()=>png(t)}]}});assert.equal(decodes,0);t.click('new-cancel');t.event(t.w.document,'paste',{clipboardData:{items:[{type:'image/png',getAsFile:()=>png(t)}]}});assert.equal(decodes,1);
});

(async()=>{let failed=0;for(const {name,fn}of tests){const t=launch(undefined,{realCanvas:true,db:new IDBFactory()});try{await t.w.ShadeReady;await fn(t);assert.equal(t.errors.length,0,'uncaught UI error');console.log('PASS',name);}catch(e){failed++;console.log('FAIL',name,'\n',e.stack);}finally{await t.close();}}console.log(`${tests.length-failed}/${tests.length} New ball checks passed`);process.exitCode=failed?1:0;})();
