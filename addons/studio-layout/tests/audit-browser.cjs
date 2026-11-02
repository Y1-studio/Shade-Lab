// Real-browser audit: use disposable browser contexts, never the user's saves.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../../..'),out=path.join(root,'tests/artifacts/studio-audit');fs.mkdirSync(out,{recursive:true});
const cases=[],test=(name,fn,options={})=>cases.push({name,fn,options});
const model=page=>page.evaluate(()=>JSON.parse(JSON.stringify(project)));
async function eventually(check){const end=Date.now()+4000;while(Date.now()<end){if(await check())return;await new Promise(resolve=>setTimeout(resolve,50));}throw Error('Timed out waiting for committed browser storage');}
const input=async(page,id,value)=>{const n=page.locator('#'+id);await n.fill(value);await n.press('Tab');};
const download=async(page,id)=>{const pending=page.waitForEvent('download');await page.locator('#'+id).click();const d=await pending;return fs.readFileSync(await d.path());};
const upload=async(page,data)=>page.locator('#json-file').setInputFiles({name:'audit.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
test('recipe edits, formula errors, JSON download/open and Undo remain usable',async page=>{
 await page.locator('#gallery .swatch[aria-label="Highlight"]').first().dblclick();
 await input(page,'ball-name','Audit recipe');await input(page,'role-name','Audit highlight');
 await page.locator('#rule-model').selectOption('RGB');await page.locator('#rule-model').selectOption('HSL');
 const before=await model(page);await input(page,'hex','invalid');assert.deepEqual(await model(page),before);
 await input(page,'hex','#345678');const saved=JSON.parse((await download(page,'save-project')).toString());assert.equal(saved.balls[0].name,'Audit recipe');
 await input(page,'ball-name','Changed after saving');await upload(page,saved);await page.waitForFunction(()=>document.querySelector('#ball-name').value==='Audit recipe');
 assert.deepEqual((await model(page)).balls,saved.balls);
 await page.locator('#undo').click();assert.equal((await model(page)).balls[0].name,'Changed after saving');
 await page.locator('#redo').click();assert.equal((await model(page)).balls[0].name,'Audit recipe');
 const stable=await model(page);await upload(page,{schema:'shadelab.project',version:3,balls:[]});await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Could not open'));assert.deepEqual(await model(page),stable);
});
for(const [width,height]of [[390,640],[320,568],[844,390]])test(`all side-panel controls reachable at ${width}x${height}`,async page=>{
 await page.setViewportSize({width,height});await page.locator('#sl-recipe-open').click();
 await input(page,'ball-name','Small viewport');
 await page.locator('#relationship-list .relationship').nth(1).click();
 await page.locator('#rule-source').selectOption('base');await page.locator('#apply-amounts').click();
 const formula=JSON.parse((await download(page,'save-preset')).toString());assert.equal(formula.schema,'shadelab.formula');
 await page.locator('#sl-panel-close').click();await page.locator('#sl-settings-open').click();
 await page.locator('#picker-shape').selectOption('square');assert.equal((await model(page)).pickerShape,'square');
 await page.locator('#free-plane').check();await page.locator('#free-hue').check();await page.locator('#group-move').check();
 await page.locator('#sl-panel-close').click();await page.locator('[data-sl-strength]').first().click();const before=(await model(page)).balls[0].strength;await page.locator('#strength').focus();await page.locator('#strength').press('ArrowRight');assert.ok((await model(page)).balls[0].strength>before);
});
test('Escape closes the top native dialog before the underlying recipe',async page=>{
 await page.locator('#sl-recipe-open').click();await page.locator('#edit-layers').click();await page.locator('#layers-dialog').waitFor();
 await page.keyboard.press('Escape');assert.equal(await page.locator('#layers-dialog').getAttribute('open'),null);assert.equal(await page.locator('#sl-panel-body').isVisible(),true);
 await page.locator('#add-ball').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#new-dialog').getAttribute('open'),null);
});
test('color history cannot reuse a stale selection after another project is opened',async page=>{
 await input(page,'hex','#123456');await page.locator('#sl-history-tab').click();await page.getByRole('button',{name:'Use #123456',exact:true}).click();
 const next=await model(page);delete next.addons;next.samples=[];next.name='Different project';await upload(page,next);
 await page.locator('#sl-history-tab').click();assert.equal(await page.locator('#sl-history-ball').isEnabled(),false);assert.equal(await page.locator('#sl-history-region').isEnabled(),false);
});
test('History swatch keeps its selected appearance after an intervening edit',async page=>{
 await input(page,'hex','#112233');await input(page,'hex','#445566');await page.locator('#sl-history-tab').click();
 await page.getByRole('button',{name:'Use #112233',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Use #112233',exact:true}).getAttribute('aria-pressed'),'true');
 await page.locator('#sl-analysis>summary').click();assert.equal(await page.getByRole('button',{name:'Use #112233',exact:true}).getAttribute('aria-pressed'),'true');
});
test('Filter Lab saves and reloads editable studies through the settings panel',async page=>{
 await page.locator('#select-all').click();await page.locator('#fl-open').click();await input(page,'fl-paint-hex','#449966');await page.locator('#fl-opacity').fill('42');await page.locator('#fl-opacity').dispatchEvent('input');
 await page.locator('#fl-settings-open').click();await input(page,'fl-study-name','Audit filter');await page.locator('#fl-save-study').click();
 await page.locator('#fl-study').selectOption({label:'Audit filter'});await page.locator('#fl-load-study').click();assert.equal(await page.locator('#fl-opacity').inputValue(),'42');
 await page.locator('#fl-settings-close').click();await page.locator('#fl-apply').click();assert.equal((await model(page)).balls[0].addons['blend-filters'].comparison.angle,132);
});
test('project replacement closes an old detached filter session',async page=>{
 const next=await model(page);next.name='Replacement';next.balls[0].name='Replacement ball';
 await page.locator('#fl-open').click();await input(page,'fl-paint-hex','#5544AA');await upload(page,next);await page.waitForFunction(()=>document.querySelector('#project-title').textContent==='Replacement');
 assert.equal(await page.locator('#fl-dialog').getAttribute('open'),null);assert.equal(await page.locator('#fl-balls-tab').getAttribute('aria-selected'),'true');
});
test('real local saves retain project, custom PNG layers and type library after reload',async page=>{
 await page.locator('#sl-recipe-open').click();await input(page,'ball-name','Persisted study');await input(page,'hex','#336699');
 await page.locator('#edit-layers').click();await page.locator('#layers-apply').click();
 await page.locator('#sl-panel-close').click();await page.locator('#save-type').click();await input(page,'type-name','Persisted type');await page.locator('#type-save').click();await page.locator('#type-dialog').waitFor({state:'hidden'});
 const expected=await model(page);await eventually(()=>page.evaluate(async()=>{const saved=await ShadeStudio.load();return saved.project?.balls[0]?.name==='Persisted study'&&saved.project?.balls[0]?.mode==='custom'&&saved.library?.entries?.some(v=>v.name==='Persisted type');}));
 await page.reload();await page.evaluate(()=>ShadeReady);assert.deepEqual(await model(page),expected);assert.ok((await page.locator('#type-select').textContent()).includes('Persisted type'));
 const data=JSON.parse((await download(page,'save-project')).toString());assert.ok(Object.keys(data.assets).length>0);
},{persist:true});
test('navigation warns while a local save is pending and canceling preserves edits',async page=>{
 await page.evaluate(()=>{const save=ShadeStudio.save;let release;const gate=new Promise(resolve=>release=resolve);window.releaseAuditSave=release;ShadeStudio.save=async project=>{await gate;return save(project);};});
 await page.locator('#sl-recipe-open').click();await input(page,'ball-name','Pending save stays here');
 let warned=false;page.once('dialog',async dialog=>{warned=dialog.type()==='beforeunload';await dialog.dismiss();});
 await page.reload({timeout:2000}).catch(()=>{});assert.equal(warned,true);assert.equal((await model(page)).balls[0].name,'Pending save stays here');
 await page.evaluate(()=>window.releaseAuditSave());await eventually(()=>page.evaluate(()=>!unsavedEdits));
 await page.reload();await page.evaluate(()=>ShadeReady);assert.equal((await model(page)).balls[0].name,'Pending save stays here');
},{persist:true});
test('formula and PNG downloads contain usable data',async page=>{
 await page.locator('#sl-recipe-open').click();const formula=JSON.parse((await download(page,'save-preset')).toString());assert.equal(formula.schema,'shadelab.formula');
 await page.locator('#export').click();const png=await download(page,'download-png');assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);assert.ok(png.length>1000);
});
test('reference image sampling, grayscale icons and history work together',async page=>{
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=8;c.getContext('2d').fillStyle='#12AB34';c.getContext('2d').fillRect(0,0,8,8);return c.toDataURL().split(',')[1];});
 await page.locator('#sl-reference-tab').click();await page.locator('#image-file').setInputFiles({name:'reference.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 await page.locator('#reference').waitFor({state:'visible'});await page.locator('#reference').click({position:{x:2,y:2}});assert.equal((await page.locator('#hex').inputValue()).toUpperCase(),'#12AB34');
 await page.locator('#picker-grayscale-wheel').check();await page.locator('#picker-grayscale-surface').check();assert.equal((await page.locator('#hex').inputValue()).toUpperCase(),'#12AB34');
 await page.locator('#sl-history-tab').click();assert.equal(await page.getByRole('button',{name:'Use #12AB34',exact:true}).isVisible(),true);
});
test('an idle older tab cannot overwrite a newer local save when hidden or closed',async page=>{
 const other=await page.context().newPage();await other.goto(page.url());await other.evaluate(()=>ShadeReady);
 await page.locator('#sl-recipe-open').click();await input(page,'ball-name','Newer tab work');await eventually(()=>page.evaluate(()=>!unsavedEdits));
 await other.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await other.close();
 assert.equal(await page.evaluate(async()=>(await ShadeStudio.load()).project.balls[0].name),'Newer tab work');
},{persist:true});
test('a stale edited tab retains a JSON escape hatch without overwriting another tab',async page=>{
 const other=await page.context().newPage();await other.goto(page.url());await other.evaluate(()=>ShadeReady);
 await page.locator('#sl-recipe-open').click();await input(page,'ball-name','First tab committed');await eventually(()=>page.evaluate(()=>!unsavedEdits));
 await other.locator('#sl-recipe-open').click();await input(other,'ball-name','Second tab unsaved');
 await eventually(()=>other.evaluate(()=>document.querySelector('#status').textContent.includes('Another Shade Lab tab')));
 assert.equal(await page.evaluate(async()=>(await ShadeStudio.load()).project.balls[0].name),'First tab committed');
 const saved=JSON.parse((await download(other,'save-project')).toString());assert.equal(saved.balls[0].name,'Second tab unsaved');await other.close();
},{persist:true});
test('every installed tool editor has reachable Apply and Cancel controls',async page=>{
 for(const id of ['harmony','color-areas','line-guides']){
  const before=await model(page);await page.locator('#sl-tools-open').click();await page.locator('#'+id+'-edit').click();await page.locator('#'+id+'-cancel').click();assert.deepEqual(await model(page),before);
  await page.locator('#sl-tools-open').click();await page.locator('#'+id+'-edit').click();await page.locator('#'+id+'-apply').click();await page.locator('#undo').click();assert.deepEqual(await model(page),before);
 }
 await page.locator('#select-all').click();await page.locator('#sl-tools-open').click();await page.locator('#compare-balls').click();assert.ok(await page.locator('#compare-table tbody tr').count()>2);await page.locator('#compare-close').click();
});
test('background hide, restore, clear and Undo operate on the intended ball',async page=>{
 await page.locator('#gallery .bg-card-edit').first().click();await input(page,'hex','#228844');const before=await model(page);
 await page.locator('#sl-background .bg-card-toggle').click();assert.equal((await model(page)).balls[0].addons['ball-background'].enabled,false);
 await page.locator('#sl-background .bg-card-toggle').click();await page.locator('#sl-background .bg-card-clear').click();assert.equal((await model(page)).balls[0].addons?.['ball-background'],undefined);
 await page.locator('#undo').click();assert.deepEqual(await model(page),before);await page.locator('#sl-panel-close').click();
});
(async()=>{const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--disable-gpu']});const results=[];
 try{for(const portable of [false,true])for(const {name,fn,options}of cases.filter(t=>!process.env.AUDIT_CASE||t.name.includes(process.env.AUDIT_CASE))){const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true}),page=await context.newPage(),errors=[];page.setDefaultTimeout(4000);page.on('pageerror',e=>errors.push(e.message));
  try{await page.goto(pathToFileURL(path.join(root,portable?'Shade Lab.html':'web/index.html')).href+(options.persist?'':'?qa'));await page.evaluate(()=>ShadeReady);await fn(page);assert.deepEqual(errors,[]);if(name.includes('reachable at'))await page.screenshot({path:path.join(out,`passed-${portable?'portable':'source'}-${page.viewportSize().width}x${page.viewportSize().height}.png`)});results.push({mode:portable?'portable':'source',name,pass:true});console.log('PASS',portable?'portable':'source',name);}
  catch(error){const id=results.length;await page.screenshot({path:path.join(out,`failure-${id}.png`),fullPage:true}).catch(()=>{});results.push({mode:portable?'portable':'source',name,pass:false,error:error.message,errors});console.log('FAIL',portable?'portable':'source',name,error.message);}
  finally{await context.close();}}
 }finally{await browser.close();}fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(`${results.filter(r=>r.pass).length}/${results.length} browser audit checks passed`);process.exitCode=results.some(r=>!r.pass)?1:0;
})();
