const assert=require('node:assert/strict');
const {launch}=require('./html-regression.cjs');
const tests=[],test=(name,fn,options={})=>tests.push({name,fn,options});
const plain=x=>JSON.parse(JSON.stringify(x));
const close=(a,b,epsilon=1e-7)=>assert.ok(Math.abs(a-b)<=epsilon, a+' differs from '+b);
const view=t=>{t.$('wheel').getBoundingClientRect=()=>({left:0,top:0,width:320,height:320});};
const event=(t,type,x,y,pointerId=1)=>t.event('wheel',type,{button:0,pointerId,clientX:x,clientY:y});
const marker=(t,id,kind)=>t.w.ShadeRender.drawWheel(t.$('wheel'),t.model().balls[0],id,[],t.model().pickerShape||'triangle').find(m=>m.id===id&&m.kind===kind);
test('square mapping is HSV, preserves HSL colors, and clamps to the CSP corners',t=>{
 const E=t.w.Shade;
 for(const s of [0,12,50,100])for(const l of [0,33,50,100]){const p=E.squarePoint([357,s,l]),c=E.squareColor(...p,357);close(c[0],357);if(l<100)close(c[1],s);close(c[2],l);assert.equal(E.toHex(c),E.toHex([357,s,l]));}
 assert.deepEqual(plain(E.squareColor(400,-100,370)),[10,100,50]);assert.equal(E.pickerContains(85,85,'square'),true);assert.equal(E.pickerContains(85,85,'triangle'),false);
});
test('free plane movement keeps every other color fixed, including descendants of Base',t=>{
 const E=t.w.Shade,b=E.defaultBall();b.strength=2;b.roles[1].source='highlight';const before=E.resolve(b);
 E.movePickerColor(b,'base','plane',[b.base[0],42,61],true);
 const after=E.resolve(b);assert.equal(b.strength,1);assert.deepEqual(plain(after.base),[354,42,61]);for(const r of b.roles)assert.deepEqual(plain(after[r.id]),plain(before[r.id]));
 const prior=plain(after);E.movePickerColor(b,'highlight','plane',[0,65,70],true);const later=E.resolve(b);assert.equal(later.highlight[0],prior.highlight[0]);for(const id of Object.keys(prior).filter(id=>id!=='highlight'))assert.deepEqual(plain(later[id]),prior[id]);
});
test('wheel unlock moves one hue and relocking rotates all hues across zero',t=>{
 const E=t.w.Shade,b=E.defaultBall(),before=E.resolve(b);
 E.movePickerColor(b,'base','hue',[5,0,0],true);const free=E.resolve(b);for(const r of b.roles)assert.deepEqual(plain(free[r.id]),plain(before[r.id]));assert.deepEqual(plain(free.base),[5,75,45]);
 E.movePickerColor(b,'highlight','hue',[free.highlight[0]+20,0,0],false);
 const after=E.resolve(b);for(const id of Object.keys(free)){close(E.difference(free[id],after[id]).H,20);assert.deepEqual(plain(after[id].slice(1)),plain(free[id].slice(1)));}
});
test('locked triangle and square preserve point arrangement and stop together at edges',t=>{
 const E=t.w.Shade;
 for(const shape of ['triangle','square']){
  const b=E.defaultBall(),before=E.resolve(b),p=E.pickerPoint(before.base,shape);
  E.movePickerColor(b,'base','plane',E.pickerColor(p[0]+6,p[1]-4,354,shape),false,shape);
  const after=E.resolve(b);for(const id of Object.keys(before)){const q=E.pickerPoint(after[id],shape),old=E.pickerPoint(before[id],shape);close(q[0]-old[0],6,1.7);close(q[1]-old[1],-4,1);close(after[id][0],before[id][0]);}
  const edgeBefore=E.resolve(b);E.movePickerColor(b,'base','plane',[354,100,99],false,shape);const edgeAfter=E.resolve(b),origin=E.pickerPoint(edgeBefore.base,shape),end=E.pickerPoint(edgeAfter.base,shape);
  for(const id of Object.keys(edgeBefore)){const a=E.pickerPoint(edgeBefore[id],shape),z=E.pickerPoint(edgeAfter[id],shape);close(z[0]-a[0],end[0]-origin[0],1.7);close(z[1]-a[1],end[1]-origin[1],1);assert.ok(edgeAfter[id][1]>=0&&edgeAfter[id][1]<=100);assert.ok(edgeAfter[id][2]>=0&&edgeAfter[id][2]<=100);}
 }
});
test('arrangement captures advanced rules safely and retains RGB model and sources',t=>{
 const E=t.w.Shade,b=E.defaultBall();const r=b.roles[0];E.setRule(r,'formula');r.expressions.S='sqrt(S-50)';E.validateBall(b);
 const prior=E.resolve(b);E.movePickerColor(b,'base','plane',[354,20,45],true);assert.deepEqual(plain(E.resolve(b).highlight),plain(prior.highlight));assert.equal(r.model,'HSL');
 const rgb=b.roles[1];rgb.model='RGB';E.setRule(rgb,'offset',{R:-15,G:5,B:10});const colors=E.resolve(b);
 E.movePickerColor(b,'highlight','hue',[90,0,0],true);assert.equal(b.roles[1].model,'RGB');assert.equal(E.toHex(E.resolve(b).shadow),E.toHex(colors.shadow));
 const saved=plain(b);assert.throws(()=>E.movePickerColor(b,'base','plane',[NaN,30,30],true));assert.deepEqual(plain(b),saved);
});
test('shape and independent lock controls survive Undo, project reload, and type copies',async t=>{
 const prior=t.model().balls,checkbox=t.$('free-plane'),canvas=t.$('gallery').querySelector('canvas'),draws=canvas.getContext('2d').draws;t.set('picker-shape','square');t.click('free-plane');assert.equal(canvas.getContext('2d').draws,draws,'view/lock changes do not repaint the ball');assert.equal(t.$('free-hue').checked,false);assert.equal(t.$('free-plane'),checkbox);assert.match(t.$('free-plane-label').textContent,/square/);
 assert.deepEqual(t.model().balls.map(b=>b.base),prior.map(b=>b.base));const expected=t.model();t.click('undo');assert.equal(t.$('free-plane').checked,false);t.click('redo');assert.deepEqual(t.model(),expected);
 const reloaded=launch(JSON.stringify(expected));try{await reloaded.w.ShadeReady;assert.equal(reloaded.$('picker-shape').value,'square');assert.equal(reloaded.$('free-plane').checked,true);assert.equal(reloaded.$('free-hue').checked,false);}finally{await reloaded.close();}
 const E=t.w.Shade,type=E.normalizeDocument({schema:'shadelab.ball-type',version:2,id:'locks',name:'Locks',ball:expected.balls[0]});assert.deepEqual(plain(type.ball.pickerFree),{plane:false,hue:false,planeByShape:{square:true,triangle:false}});assert.equal(E.planeFree(type.ball,'square'),true);assert.equal(E.planeFree(type.ball,'triangle'),false);
});
test('marker clicks are neutral; free drags are atomic and preserve active controls',t=>{
 view(t);t.set('strength','2','input');t.event('strength','change');t.click('free-plane');const m=marker(t,'base','plane'),before=t.model(),checkbox=t.$('free-plane');
 event(t,'pointerdown',m.x+1,m.y+1);event(t,'pointerup',m.x+1,m.y+1);assert.deepEqual(t.model(),before);
 const colors=t.w.Shade.resolve(before.balls[0]);event(t,'pointerdown',m.x,m.y);event(t,'pointermove',m.x-6,m.y-8);event(t,'pointerup',m.x-6,m.y-8);
 const after=t.model();assert.notDeepEqual(after,before);for(const r of after.balls[0].roles)assert.deepEqual(plain(t.w.Shade.resolve(after.balls[0])[r.id]),plain(colors[r.id]));assert.equal(t.$('free-plane'),checkbox);
 t.click('undo');assert.deepEqual(t.model(),before);t.click('redo');assert.deepEqual(t.model(),after);
});
test('cancelled drags and foreign pointers cannot leave partial arrangements',t=>{
 view(t);t.click('free-hue');const m=marker(t,'base','hue'),before=t.model();
 event(t,'pointerdown',m.x,m.y);event(t,'pointermove',302,160,2);assert.deepEqual(t.model(),before);event(t,'pointermove',302,160);assert.notDeepEqual(t.model(),before);event(t,'pointercancel',302,160);assert.deepEqual(t.model(),before);event(t,'pointermove',160,302);assert.deepEqual(t.model(),before);
});
test('square pixels and plotted markers use the square geometry',t=>{
 const E=t.w.Shade,R=t.w.ShadeRender,c=t.w.document.createElement('canvas');c.width=c.height=640;const b=E.defaultBall('Square',[0,100,50]);
 const markers=R.drawWheel(c,b,'base',[],'square'),p=c.getContext('2d');
 const pixel=(x,y)=>[...p.getImageData(x*2,y*2,1,1).data];assert.ok(pixel(85,85).slice(0,3).every(v=>v>248));assert.ok(pixel(90,235).slice(0,3).every(v=>v<5));const grey=pixel(85,160);assert.ok(Math.max(...grey.slice(0,3))-Math.min(...grey.slice(0,3))<5);
 const marker=markers.find(m=>m.kind==='plane'&&m.id==='base');assert.equal(marker.x,236);assert.equal(marker.y,84);assert.equal(pixel(90,160)[3],255);
},{realCanvas:true});

(async()=>{let failed=0;for(const {name,fn,options}of tests){const t=launch(undefined,options);try{await t.w.ShadeReady;await fn(t);assert.equal(t.errors.length,0,'uncaught UI error');console.log('PASS',name);}catch(error){failed++;console.log('FAIL',name,'\n',error.stack);}finally{await t.close();}}console.log(`${tests.length-failed}/${tests.length} picker checks passed`);process.exitCode=failed?1:0;})();
