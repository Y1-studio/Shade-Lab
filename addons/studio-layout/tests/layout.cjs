const assert=require('node:assert/strict');
const {launch}=require('../../../tests/html-regression.cjs');
const tests=[],test=(name,fn)=>tests.push({name,fn}),plain=v=>JSON.parse(JSON.stringify(v));
const hist=t=>t.model().addons?.['studio-layout']?.colors||[];
test('startup keeps schema, recipes and Undo unchanged with visible analysis, guide and sliders',t=>{
 assert.equal(t.model().version,3);assert.equal(t.model().addons,undefined);assert.equal(t.$('undo').disabled,true);
 assert.equal(t.$('sl-analysis').open,true);assert.equal(t.$('sl-sliders').open,true);assert.equal(t.$('temperature-visible').checked,true);
 assert.equal(t.$('sliders').closest('details'),t.$('sl-sliders'));assert.ok(t.$('wheel-swap').parentElement.contains(t.$('sl-sliders')));
 assert.equal(t.$('wheel-swap-scope'),null);assert.equal(t.w.document.querySelector('.picked-section').hidden,true);
});
test('a sphere region hit uses drawing geometry and preserves all checked balls',t=>{
 t.click('select-all');const cards=t.$('gallery').querySelectorAll('.ball-card'),canvas=cards[1].querySelector('canvas');
 canvas.getBoundingClientRect=()=>({left:0,top:0,width:400,height:330});
 const expected=t.w.ShadeRender.ballHit(t.model().balls[1],400,330,200,160);
 t.event(canvas,'click',{clientX:200,clientY:160});
 assert.equal(t.$('selected-role').value,expected);assert.equal(t.$('sl-panel-body').hidden,true);
 t.event(canvas,'dblclick',{clientX:200,clientY:160});assert.equal(t.$('sl-panel-title').textContent,'Shading recipe');
 assert.equal(t.$('selection-count').textContent,'2 selected');assert.equal(t.$('sl-analysis').hidden,false);assert.equal(t.$('sl-analysis').open,true);
 t.event(canvas,'click',{clientX:220,clientY:180});assert.equal(t.$('sl-analysis').hidden,false);assert.equal(t.$('sl-analysis').open,true);
 t.click('sl-panel-close');assert.equal(t.$('sl-analysis').hidden,false);
});
test('opening a recipe from focused artwork or a swatch never marks a card as an expanded control',t=>{
 const cards=t.$('gallery').querySelectorAll('.ball-card'),canvas=cards[0].querySelector('canvas');canvas.getBoundingClientRect=()=>({left:0,top:0,width:400,height:330});cards[0].focus();t.event(canvas,'dblclick',{clientX:200,clientY:160});
 assert.equal(cards[0].hasAttribute('aria-expanded'),false);assert.equal(t.$('sl-panel-title').textContent,'Shading recipe');t.event(cards[1],'click');assert.equal(cards[0].classList.contains('active'),false);assert.equal(cards[1].classList.contains('active'),true);assert.equal(cards[0].hasAttribute('aria-expanded'),false);t.click('sl-panel-close');
 const swatch=cards[0].querySelector('.swatch');swatch.focus();t.event(swatch,'dblclick');assert.equal(swatch.hasAttribute('aria-expanded'),false);assert.equal(cards[0].hasAttribute('aria-expanded'),false);t.click('sl-panel-close');
});
test('panel opener expansion is restored on close, replacement and add-on cleanup',t=>{
 const recipe=t.$('sl-recipe-open'),tools=t.$('sl-tools-open'),edit=t.$('harmony-edit'),before=edit.getAttribute('aria-expanded');t.click('sl-recipe-open');assert.equal(recipe.getAttribute('aria-expanded'),'true');t.click('sl-tools-open');assert.equal(recipe.getAttribute('aria-expanded'),'false');assert.equal(tools.getAttribute('aria-expanded'),'true');edit.focus();t.click('harmony-edit');assert.equal(tools.getAttribute('aria-expanded'),'false');assert.equal(edit.getAttribute('aria-expanded'),'true');t.click('harmony-cancel');assert.equal(edit.getAttribute('aria-expanded'),before);t.click('sl-tools-open');edit.focus();t.click('harmony-edit');t.w.ShadeAddons.disable('studio-layout');assert.equal(edit.getAttribute('aria-expanded'),before);
});

test('all built-in sphere regions hit correctly without relying on their rendered colors',t=>{
 const R=t.w.ShadeRender,b=t.model().balls[0],f=R.ballFrame(400,330,b),hit=(x,y)=>R.ballHit(b,400,330,f.x+x*f.width,f.y+y*f.height);
 assert.equal(hit(.14,.08),null);assert.equal(hit(.23,.22),'highlight');assert.equal(hit(.45,.45),'base');assert.equal(hit(.85,.70),'shadow');assert.equal(hit(0,0),null);
});
test('custom PNG hit testing uses visible alpha, transforms and mask order, ignoring decorative RGB',async t=>{
 const E=t.w.Shade,R=t.w.ShadeRender,c=t.w.document.createElement('canvas');c.width=c.height=40;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,40,40);
 const opaque=await t.w.ShadeAssets.put(c.toDataURL(),40,40);ctx.clearRect(0,0,40,40);ctx.fillRect(0,0,20,40);const half=await t.w.ShadeAssets.put(c.toDataURL(),40,40);
 const b=E.defaultBall();b.mode='custom';const layer=(id,assetId,role,extra={})=>({id,assetId,role,kind:'mask',visible:true,opacity:1,x:20,y:20,width:40,height:40,rotation:0,flipX:false,flipY:false,clip:'none',...extra});
 b.design={width:40,height:40,layers:[layer('base',opaque,'base'),layer('top',half,'highlight'),layer('art',opaque,'shadow',{kind:'overlay'})]};
 const f=R.ballFrame(400,330,b),hit=(x,y)=>R.ballHit(b,400,330,f.x+x*f.width,f.y+y*f.height);
 assert.equal(hit(.25,.5),'highlight');assert.equal(hit(.75,.5),'base');b.design.layers[1].flipX=true;assert.equal(hit(.75,.5),'highlight');assert.equal(hit(.25,.5),'base');b.design.layers[1].visible=false;assert.equal(hit(.75,.5),'base');
});
test('background side actions return to their own ball when switching editors and closing',t=>{
 const cards=[...t.$('gallery').querySelectorAll('.ball-card')],first=cards[0].querySelector('.bg-card-edit'),second=cards[1].querySelector('.bg-card-edit');
 first.click();t.flush();t.set('hex','#224466');assert.ok(t.$('sl-background').querySelector('.bg-card-clear'));
 second.click();t.flush();t.set('hex','#442266');assert.ok(cards[0].querySelector('.bg-card-clear'));t.click('sl-panel-close');
 assert.ok(cards[1].querySelector('.bg-card-clear'));assert.equal(t.$('selected-role').value,'base');
 assert.equal(t.model().balls[0].addons['ball-background'].hex,'#224466');assert.equal(t.model().balls[1].addons['ball-background'].hex,'#442266');
});
test('recipe editing stays live and Undo retains checkbox selection',t=>{
 t.click('select-all');const swatch=t.$('gallery').querySelector('.swatch');swatch.click();t.flush();assert.equal(t.$('sl-panel-body').hidden,true);t.event(swatch,'dblclick');assert.equal(t.$('sl-panel-body').hidden,false);const before=t.model();
 t.set('ball-name','Live recipe');assert.equal(t.model().balls[0].name,'Live recipe');
 t.click('undo');assert.deepEqual(t.model(),before);assert.equal(t.$('selection-count').textContent,'2 selected');
});
test('side tool Cancel and panel Escape leave the project unchanged and restore analysis',t=>{
 const before=t.model();t.click('sl-tools-open');t.click('harmony-edit');t.set('harmony-mode','triadic');
 assert.equal(t.$('harmony-dialog').parentElement,t.$('sl-panel-body'));assert.equal(t.$('wheel-section').hidden,false);
 t.event(t.w.document,'keydown',{key:'Escape'});assert.equal(t.$('harmony-dialog').open,false);assert.deepEqual(t.model(),before);
 assert.equal(t.$('sl-analysis').hidden,false);t.click('sl-tools-open');t.click('harmony-edit');t.set('harmony-mode','triadic');t.click('harmony-apply');
 assert.ok(t.model().balls[0].addons['wheel-harmonies']);t.click('undo');assert.deepEqual(t.model(),before);
});
test('slider and analysis disclosures persist and undo without hiding the wheel',t=>{
 t.$('sl-sliders').querySelector('summary').click();t.flush();assert.equal(t.$('sl-sliders').open,false);assert.equal(t.$('wheel-section').hidden,false);
 t.click('undo');assert.equal(t.$('sl-sliders').open,true);t.$('sl-analysis').querySelector('summary').click();t.flush();assert.equal(t.$('sl-analysis').open,false);t.click('undo');assert.equal(t.$('sl-analysis').open,true);
});
test('graph stays open across all side panels and only its own header changes visibility',async t=>{
 const graph=t.$('sl-analysis'),summary=graph.querySelector('summary');
 for(const id of ['sl-recipe-open','sl-tools-open','sl-settings-open']){t.click(id);assert.equal(graph.hidden,false);assert.equal(graph.open,true);t.click('sl-panel-close');assert.equal(graph.open,true);}
 t.click('sl-recipe-open');summary.click();t.flush();assert.equal(graph.open,false);t.click('sl-panel-close');t.click('sl-tools-open');assert.equal(graph.open,false);
 summary.click();t.flush();assert.equal(graph.open,true);t.click('sl-panel-close');t.click('fl-open');t.click('fl-settings-open');assert.equal(graph.hidden,false);assert.equal(graph.open,true);t.click('fl-settings-close');assert.equal(graph.open,true);t.click('fl-close');
 summary.click();t.flush();const other=launch(JSON.stringify(t.model()));try{await other.w.ShadeReady;assert.equal(other.$('sl-analysis').open,false);other.$('sl-analysis').querySelector('summary').click();other.flush();assert.equal(other.$('sl-analysis').open,true);}finally{await other.close();}
});
test('strength and blend icons open their live controls and comparison previews',t=>{
 const card=t.$('gallery').querySelector('.ball-card');card.querySelector('[data-sl-strength]').click();t.flush();
 assert.ok(t.$('sl-panel-body').contains(t.$('strength')));assert.ok(t.$('sl-panel-body').contains(t.$('comparison-gallery')));
 t.set('strength','2','input');t.event('strength','change');assert.equal(t.model().balls[0].strength,2);t.click('undo');
 card.querySelector('[data-sl-blend]').click();t.flush();assert.ok(t.$('sl-panel-body').contains(t.$('softness')));
 t.set('softness','35','input');t.event('softness','change');assert.equal(t.model().balls[0].softness,35);
});
test('swap uses checked balls first and falls back to the focused ball',t=>{
 t.click('select-all');const before=t.model();t.click('wheel-swap');assert.ok(t.model().balls.every(b=>b.addons?.['wheel-position-swap']?.flipped));t.click('undo');assert.deepEqual(t.model(),before);
 t.click('clear-selection');t.click('wheel-swap');assert.equal(t.model().balls.filter(b=>b.addons?.['wheel-position-swap']?.flipped).length,1);
});
test('CSP hue coordinates invert across the wrap and agree with renderer markers',t=>{
 const E=t.w.Shade,R=t.w.ShadeRender;
 for(const hue of [0,1,60,90,120,180,240,270,300,359]){const p=E.wheelPoint(hue);assert.ok(Math.abs(E.wrap(E.wheelHue(...p)-hue+180)-180)<1e-8);}
 const red=E.wheelPoint(0);assert.ok(red[0]<160&&red[1]<160);
 const b=E.defaultBall('Red',[0,100,50]),m=R.drawWheel(t.$('wheel'),b,'base',[]).find(m=>m.kind==='hue'&&m.id==='base');
 assert.ok(Math.abs(E.wheelHue(m.x,m.y))<1e-8);
});
test('a committed gesture records one input color; cancellation and rejected input record none',t=>{
 t.event('slider-H','pointerdown');t.set('slider-H','100','input');t.set('slider-H','105','input');assert.equal(hist(t).length,0);t.event('slider-H','change');assert.equal(hist(t).length,1);
 const before=t.model();t.$('wheel').getBoundingClientRect=()=>({left:0,top:0,width:320,height:320});const p=t.w.Shade.wheelPoint(140);
 t.event('wheel','pointerdown',{button:0,pointerId:42,clientX:p[0],clientY:p[1]});t.event('wheel','pointercancel',{pointerId:42});assert.deepEqual(t.model(),before);
 t.set('hex','nothex');assert.deepEqual(t.model(),before);t.click('undo');assert.equal(hist(t).length,0);t.click('redo');assert.equal(hist(t).length,1);
});
test('history deduplicates, caps at 50, clears with Undo and preserves legacy samples',t=>{
 const legacy=t.model().samples;
 for(let i=0;i<54;i++)t.set('hex','#'+(0x102030+i*257).toString(16).padStart(6,'0'));
 assert.equal(hist(t).length,50);const latest=hist(t)[0];t.set('hex',t.w.Shade.toHex(latest));assert.equal(hist(t).length,50);
 t.click('sl-history-tab');assert.equal(t.$('sl-history-colors').querySelectorAll('button').length,50);
 t.click('sl-history-clear');assert.equal(hist(t).length,0);assert.deepEqual(t.model().samples,legacy);t.click('undo');assert.equal(hist(t).length,50);
});
test('history seeds legacy samples, persists with the project and makes balls and regions',async t=>{
 const project=t.model();project.samples=[[10,20,30],[60,70,50],[10,20,30]];const other=launch(JSON.stringify(project),{realCanvas:true});
 try{await other.w.ShadeReady;other.click('sl-history-tab');assert.equal(other.$('sl-history-colors').querySelectorAll('button').length,2);
 other.$('sl-history-colors').querySelector('button').click();other.flush();assert.equal(hist(other).length,2);other.click('sl-history-ball');assert.equal(other.model().balls.length,3);
 other.click('sl-history-tab');other.click('sl-history-region');assert.equal(other.model().balls.at(-1).roles.length,5);
 const reload=launch(JSON.stringify(other.model()));try{await reload.w.ShadeReady;assert.deepEqual(hist(reload),hist(other));}finally{await reload.close();}
 }finally{await other.close();}
});
test('Filter Lab exposes only three main fields and owns all extra settings',t=>{
 t.click('fl-open');const controls=t.$('fl-mode').closest('.fl-controls');assert.equal(controls.children.length,3);
 assert.ok(t.$('fl-apply').closest('.fl-heading'));
 assert.ok(t.$('fl-settings').contains(t.$('fl-angle')));assert.ok(t.$('fl-settings').contains(t.$('fl-main-arrows')));
 assert.equal(t.$('fl-angle').value,'132');assert.equal(t.$('fl-split').value,'50');assert.equal(t.$('fl-opacity').value,'100');
 t.click('fl-settings-open');assert.equal(t.$('sl-panel-title').textContent,'Filter Lab settings');assert.equal(t.$('fl-dialog').open,true);
 const before=t.model();t.set('fl-angle','145');t.click('fl-settings-close');t.click('fl-close');assert.deepEqual(t.model(),before);
});
test('Reference and History tabs close filter drafts and support keyboard tab navigation',t=>{
 t.click('fl-open');t.set('fl-paint-hex','#123456');const before=t.model();t.click('sl-reference-tab');assert.equal(t.$('fl-dialog').open,false);assert.equal(t.$('sl-reference').hidden,false);assert.deepEqual(t.model(),before);
 t.$('sl-reference-tab').focus();t.event(t.$('sl-reference-tab').parentElement,'keydown',{key:'ArrowRight'});assert.equal(t.$('sl-history').hidden,false);assert.equal(t.$('sl-history-tab').getAttribute('aria-selected'),'true');
});
test('filter paint and original input colors enter history only on a successful atomic Apply',t=>{
 const before=t.model();t.click('fl-open');t.set('fl-paint-hex','#113355');
 t.$('fl-grid').querySelector('[data-action="color"]').click();t.flush();t.set('fl-original','#345678');assert.equal(hist(t).length,0);
 t.click('fl-apply');const colors=hist(t).map(c=>t.w.Shade.toHex(c));assert.ok(colors.includes('#113355'));assert.ok(colors.includes('#345678'));
 t.click('undo');assert.deepEqual(t.model(),before);t.click('redo');assert.deepEqual(hist(t).map(c=>t.w.Shade.toHex(c)),colors);
});
test('explicit guide off preference is respected across reload',async t=>{
 t.click('temperature-visible');assert.equal(t.model().temperatureGuide.visible,false);
 const other=launch(JSON.stringify(t.model()));try{await other.w.ShadeReady;assert.equal(other.$('temperature-visible').checked,false);}finally{await other.close();}
});
test('layout disable/re-enable restores live nodes without duplicating controls or mutating colors',t=>{
 const before=t.model(),wheel=t.$('wheel'),name=t.$('ball-name');t.click('sl-tools-open');t.click('harmony-edit');
 t.w.ShadeAddons.disable('studio-layout');assert.equal(t.$('harmony-dialog').open,false);assert.equal(t.$('wheel'),wheel);assert.equal(t.$('ball-name'),name);assert.ok(t.w.document.querySelector('.inspector').contains(name));
 assert.equal(t.$('sl-analysis'),null);assert.deepEqual(t.model(),before);
 assert.equal(t.w.ShadeAddons.enable('studio-layout'),true);assert.equal(t.w.document.querySelectorAll('#sl-analysis').length,1);assert.equal(t.$('wheel'),wheel);assert.deepEqual(t.model(),before);
});
(async()=>{let failed=0;for(const {name,fn}of tests){const t=launch(undefined,{realCanvas:true});try{await t.w.ShadeReady;await fn(t);assert.deepEqual(t.errors,[]);console.log('PASS',name);}catch(e){failed++;console.error('FAIL',name,e.stack);}finally{await t.close();}}console.log(`${tests.length-failed}/${tests.length} studio layout checks passed`);process.exitCode=failed?1:0;})();
