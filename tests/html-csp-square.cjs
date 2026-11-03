const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {launch}=require('./html-regression.cjs');
const reference=require('./fixtures/csp-square-reference.json');
const tests=[],test=(name,fn)=>tests.push({name,fn}),plain=x=>JSON.parse(JSON.stringify(x));
const close=(a,b,eps=1e-7)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
test('all six CSP hues match fresh live interior pixel samples',t=>{
 const E=t.w.Shade,{left,top,side}=reference.bounds;
 for(const item of reference.hues)reference.points.forEach(([x,y],i)=>{
  const color=E.squareColor(84+152*(x-left)/side,84+152*(y-top)/side,item.hue),rgb=E.hslRgb(color).map(Math.round);
  rgb.forEach((v,ch)=>assert.ok(Math.abs(v-item.rgb[i][ch])<=reference.toleranceBytes,`${item.name} sample ${i}, channel ${ch}: ${v} != ${item.rgb[i][ch]}`));
 });
});
test('HSV square corners, center and black-edge saturation match the CSP mapping',t=>{
 const E=t.w.Shade,pure=['#FF0000','#FFFF00','#00FF00','#00FFFF','#0000FF','#FF00FF'];
 reference.hues.forEach(({hue},i)=>{
  assert.equal(E.toHex(E.squareColor(84,84,hue)),'#FFFFFF');assert.equal(E.toHex(E.squareColor(236,84,hue)),pure[i]);
  assert.equal(E.toHex(E.squareColor(84,236,hue)),'#000000');assert.equal(E.toHex(E.squareColor(236,236,hue)),'#000000');
  assert.deepEqual(plain(E.squarePoint([hue,100,50])),[236,84]);
 });
 E.hslRgb(E.squareColor(160,160,0)).forEach((v,i)=>close(v,[127.5,63.75,63.75][i]));
 for(const x of [84,160,236]){const c=E.squareColor(x,236,123),p=E.squarePoint(c);close(p[0],x);close(p[1],236);close(c[0],123);}
});
test('rendered square has a saturated upper-right corner across all six hues',t=>{
 const E=t.w.Shade,R=t.w.ShadeRender,{createCanvas}=require('@napi-rs/canvas'),proof=createCanvas(900,205),ctx=proof.getContext('2d');ctx.fillStyle='#1b2027';ctx.fillRect(0,0,900,205);
 reference.hues.forEach(({name,hue},i)=>{
  const c=t.w.document.createElement('canvas');c.width=c.height=640;const b=E.defaultBall(name,[hue,100,50]);
  R.drawWheel(c,b,'base',[],'square',null,{markers:false,tools:false});const rgb=[...c.getContext('2d').getImageData(468,174,1,1).data].slice(0,3);
  assert.ok(Math.max(...rgb)>245, name+' maximum');assert.ok(Math.min(...rgb)<12,name+' upper-right must not be white');
  ctx.drawImage(c._native,168,168,304,304,i*150+10,35,130,130);ctx.fillStyle='#edf2f7';ctx.font='16px sans-serif';ctx.fillText(name+' '+hue+'°',i*150+10,22);
 });
 ctx.font='14px sans-serif';ctx.fillText('Shade Lab: corrected HSV square, rendered by the production picker',10,193);
 const folder=path.join(__dirname,'artifacts/csp-square');fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'corrected-six-hues.png'),proof.toBuffer('image/png'));
});
test('switching view and reloading never rewrites HSL recipes or saved tool coordinates',async t=>{
 const E=t.w.Shade,S=t.w.ShadeAddons.service('surface-tools'),b=t.model().balls[0],line=t.w.ShadeAddons.providers('surface').find(p=>p.id==='line-guides'),c=line.initial(b,'square');c.origin=[.3,.5];c.distances={highlight:.1,shadow:-.1};S.put(b,'line-guides','square',c);S.prepare(b,'square');
 const saved=t.model();saved.balls[0]=b;saved.pickerShape='square';const colors=plain(E.resolve(b)),config=plain(b.addons);
 const r=launch(JSON.stringify(saved),{realCanvas:true});try{await r.w.ShadeReady;assert.deepEqual(plain(r.w.Shade.resolve(r.model().balls[0])),colors);assert.deepEqual(r.model().balls[0].addons,config);r.set('picker-shape','triangle');r.set('picker-shape','square');assert.deepEqual(plain(r.w.Shade.resolve(r.model().balls[0])),colors);assert.deepEqual(r.model().balls[0].addons,config);}finally{await r.close();}
});
test('legacy HSL tool points and rendered guides project onto the same HSV pixels',t=>{
 const E=t.w.Shade,S=t.w.ShadeAddons.service('surface-tools'),G=S.Geo;
 for(const p of [[.2,.3],[.8,.7],[1,.5],[0,1]]){const color=G.color(p,200,'square'),a=G.canvas(p,'square'),b=E.squarePoint(color);a.forEach((v,i)=>close(v,b[i]));const back=G.uncanvas(a,'square');back.forEach((v,i)=>close(v,p[i]));}
 const a=[.2,.3],b=[.8,.7],edge=G.displayEdge(a,b,'square');assert.ok(edge.length>2,'HSL line must be sampled rather than drawn as a false HSV chord');
 for(const p of edge){const q=G.uncanvas(p,'square');close(G.cross(G.sub(q,a),G.sub(b,a)),0,1e-6);}
});
test('locked square drags preserve the visible HSV arrangement without HSL rounding drift',t=>{
 const E=t.w.Shade,b=E.defaultBall(),before=E.resolve(b),p=E.squarePoint(before.base);
 E.movePickerColor(b,'base','plane',E.squareColor(p[0]-5,p[1]+4,b.base[0]),false,'square');
 const after=E.resolve(b);for(const id of Object.keys(before)){const a=E.squarePoint(before[id]),z=E.squarePoint(after[id]);close(z[0]-a[0],-5);close(z[1]-a[1],4);}
});
test('legacy area masks cover the correct HSL colors in the HSV raster',t=>{
 const E=t.w.Shade,R=t.w.ShadeRender,S=t.w.ShadeAddons.service('surface-tools'),A=t.w.ShadeAddons.providers('surface').find(p=>p.id==='color-areas');
 for(const {hue}of reference.hues){
  const b=E.defaultBall('Area',[hue,40,50]);b.roles=[];const raw=E.clone(b),c=A.initial(b,'square');c.enabled=true;c.rect=[.2,.2,.4,.5];S.put(b,A.id,'square',c);S.prepare(b,'square');
  const canvases=[raw,b].map(ball=>{const canvas=t.w.document.createElement('canvas');canvas.width=canvas.height=640;R.drawWheel(canvas,ball,'base',[],'square',null,{markers:false});return canvas;});
  const sample=(color,i)=>{const p=E.squarePoint(color);return [...canvases[i].getContext('2d').getImageData(Math.round(p[0]*2),Math.round(p[1]*2),1,1).data];};
  // Retain the existing mask compositing; only verify its coordinate projection.
  const sum=p=>p.slice(0,3).reduce((a,v)=>a+v,0),insideRatio=sum(sample([hue,40,45],1))/sum(sample([hue,40,45],0)),outsideRatio=sum(sample([hue,90,70],1))/sum(sample([hue,90,70],0));
  assert.ok(insideRatio>outsideRatio+.25,hue+' allowed and excluded colors must retain their existing mask membership');
 }
});
(async()=>{let failed=0;for(const {name,fn}of tests){const t=launch(undefined,{realCanvas:true});try{await t.w.ShadeReady;await fn(t);assert.equal(t.errors.length,0,t.errors.join('\n'));console.log('PASS',name);}catch(e){failed++;console.log('FAIL',name,'\n',e.stack);}finally{await t.close();}}console.log(`${tests.length-failed}/${tests.length} CSP square checks passed${process.argv.includes('--portable')?' (standalone)':''}`);process.exitCode=failed?1:0;})();
