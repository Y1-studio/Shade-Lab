const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../../..'),out=path.join(root,'tests/artifacts/studio-layout');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--disable-gpu']});
 try{
  for(const portable of [false,true]){
   const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],network=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
   await page.goto(pathToFileURL(path.join(root,portable?'Shade Lab.html':'web/index.html')).href+'?qa');await page.evaluate(()=>ShadeReady);
   assert.equal(await page.locator('#sl-analysis').getAttribute('open'),'');
   assert.equal(await page.locator('#temperature-visible').isChecked(),true);
   await page.screenshot({path:path.join(out,`${portable?'portable':'source'}-balls.png`),fullPage:true});
   await page.locator('#select-all').click();
   const selected=await page.locator('.ball-selection input:checked').count();
   // Artwork selection must preserve the checked collection.
   const sphere=page.locator('#gallery .ball-card>canvas').first();await sphere.scrollIntoViewIfNeeded();const box=await sphere.boundingBox();
   await page.mouse.click(box.x+box.width*.48,box.y+box.height*.43);
   assert.equal(await page.locator('#sl-panel-body').isVisible(),false);
   await sphere.dblclick({position:{x:box.width*.48,y:box.height*.43}});
   await page.locator('#sl-panel-title').filter({hasText:'Shading recipe'}).waitFor();
   assert.equal(await page.locator('#sl-analysis').isVisible(),true);assert.equal(await page.locator('#graph').isVisible(),true);
   assert.equal(await page.locator('.ball-selection input:checked').count(),selected);
   await page.locator('#sl-panel-close').click();
   await page.locator('#gallery .bg-card-edit').first().click();
   assert.equal(await page.locator('#sl-panel-title').textContent(),'Background');
   await page.locator('#hex').fill('#224466');await page.locator('#hex').press('Tab');
   assert.equal(await page.locator('#sl-background .bg-card-clear').isVisible(),true);
   await page.locator('#sl-panel-close').click();
   await page.locator('#sl-tools-open').click();await page.locator('#harmony-edit').click();
   assert.equal(await page.locator('#harmony-dialog').evaluate(el=>el.matches(':modal')),false);
   assert.equal(await page.locator('#wheel').isVisible(),true);
   await page.screenshot({path:path.join(out,`${portable?'portable':'source'}-tool.png`),fullPage:true});
   await page.keyboard.press('Escape');assert.equal(await page.locator('#harmony-dialog').getAttribute('open'),null);
   await page.locator('#fl-open').click();await page.locator('#fl-settings-open').click();
   assert.equal(await page.locator('.fl-heading #fl-apply').isVisible(),true);
   assert.equal(await page.locator('#fl-angle').inputValue(),'132');assert.equal(await page.locator('#fl-split').inputValue(),'50');
   assert.equal(await page.locator('#wheel').isVisible(),true);
   await page.screenshot({path:path.join(out,`${portable?'portable':'source'}-filter.png`),fullPage:true});
   await page.locator('#fl-settings-close').click();await page.locator('#fl-close').click();
   await page.locator('#hex').fill('#123456');await page.locator('#hex').press('Tab');
   await page.locator('#sl-history-tab').click();await page.getByRole('button',{name:'Use #123456',exact:true}).waitFor();
   await page.locator('#sl-reference-tab').click();assert.equal(await page.locator('#reference-empty').isVisible(),true);
   await page.locator('#fl-balls-tab').click();
   for(const width of [1440,1024,768,390]){
    await page.setViewportSize({width,height:1000});await page.locator('#sl-recipe-open').click();
    assert.equal(await page.locator('#graph').isVisible(),true);
    await page.locator('#sl-panel-body').evaluate(el=>{el.scrollTop=el.scrollHeight;});
    assert.equal(await page.locator('#sl-analysis').getAttribute('open'),'');
    await page.screenshot({path:path.join(out,`${portable?'portable':'source'}-${width}.png`),fullPage:true});
    const bounds=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth,wheel:document.querySelector('#wheel').getBoundingClientRect().toJSON()}));
    assert.ok(bounds.width<=bounds.viewport+2,`horizontal overflow ${width}: ${bounds.width}`);
    assert.ok(bounds.wheel.width>100);await page.locator('#sl-panel-close').click();
   }
   await page.setViewportSize({width:1440,height:1000});await page.locator('#sl-recipe-open').click();await page.locator('#sl-analysis>summary').click();assert.equal(await page.locator('#graph').isVisible(),false);await page.locator('#sl-panel-close').click();await page.locator('#sl-tools-open').click();assert.equal(await page.locator('#graph').isVisible(),false);await page.locator('#sl-analysis>summary').click();assert.equal(await page.locator('#graph').isVisible(),true);await page.locator('#sl-panel-close').click();
   assert.deepEqual(errors,[]);assert.deepEqual(network,[]);await page.close();
   console.log(`PASS ${portable?'portable':'source'} real-browser tabs, sphere selection, side tools, filter settings, history, 4 viewport widths, offline`);
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
