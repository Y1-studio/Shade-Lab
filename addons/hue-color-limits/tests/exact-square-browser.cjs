const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../../..'),out=path.join(root,'tests/artifacts/hue-color-limits');fs.mkdirSync(out,{recursive:true});
const reference=fs.readFileSync(path.join(__dirname,'reference-visual.html'),'utf8'),results=[];
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});try{
  const context=await browser.newContext({viewport:{width:1000,height:900},deviceScaleFactor:2}),ref=await context.newPage();
  await ref.setContent('<style>:root{--foreground:rgb(26,28,31);--background:rgb(255,255,255);--border:rgba(26,28,31,.08)}</style>'+reference);
  await ref.evaluate(()=>{document.querySelector('.plots').style.gridTemplateColumns='207px';});await ref.waitForFunction(()=>document.querySelector('.plots canvas').width===414);
  for(const portable of [false,true]){
    const mode=portable?'portable':'source',page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.join(root,portable?'Shade Lab.html':'web/index.html')).href);await page.evaluate(()=>ShadeReady);
    await page.locator('#sl-tools-open').click();await page.locator('#hue-color-limits-edit').click();await page.locator('#hue-color-limits-apply').click();assert.equal(await page.locator('#picker-shape-label').textContent(),'HSV SQUARE');
    const entries=[['Red',0],['Yellow',60],['Green',120],['Cyan',180],['Blue',240],['Magenta',300]];
    for(let i=0;i<entries.length;i++){
      const [name,hue]=entries[i];await ref.getByRole('button',{name:i===0?'Blue · 240°':'Red · 0°',exact:true}).click();
      const expected=await ref.locator('.plot canvas').nth(i).evaluate(c=>[...c.getContext('2d').getImageData(86,24,304,304).data]);
      const actual=await page.evaluate(h=>{const b=Shade.clone(project.balls[0]),colors=Shade.resolve(b),canvas=document.createElement('canvas');canvas.width=canvas.height=640;const ctx=canvas.getContext('2d');ctx.setTransform(2,0,0,2,0,0);Shade.pickerSurface(b,'square').draw(ctx,{ball:b,colors,active:'base',hue:h,shape:'square'});return [...ctx.getImageData(168,168,304,304).data];},hue);
      let changed=0,maxDelta=0;for(let n=0;n<actual.length;n++){const delta=Math.abs(actual[n]-expected[n]);if(delta){changed++;maxDelta=Math.max(maxDelta,delta);}}
      assert.equal(changed,0,`${mode} ${name}: ${changed} changed channels; largest delta ${maxDelta}`);results.push({mode,case:`${name} square matches original reference pixel-for-pixel`,changedChannels:changed,maxDelta,pass:true});console.log('PASS',mode,name,'pixel-identical');
    }
    const identity=await page.evaluate(()=>{const b=project.balls[0],render=(shape,tools)=>{const c=document.createElement('canvas');c.width=c.height=640;ShadeRender.drawWheel(c,b,'base',[],shape,null,{tools,markers:false,connections:false});return c.getContext('2d').getImageData(0,0,640,640).data;},a=render('square',true),z=render('square',false),t=render('triangle',true),u=render('triangle',false);let ring=0,triangle=0;for(let y=0;y<640;y++)for(let x=0;x<640;x++){const r=Math.hypot(x/2-160,y/2-160);for(let c=0;c<4;c++){const i=(y*640+x)*4+c;if(r>130&&a[i]!==z[i])ring++;if(t[i]!==u[i])triangle++;}}return{ring,triangle};});
    assert.deepEqual(identity,{ring:0,triangle:0});results.push({mode,case:'outer hue wheel unchanged',changedChannels:identity.ring,pass:true},{mode,case:'entire triangle unchanged',changedChannels:identity.triangle,pass:true});assert.deepEqual(errors,[]);await page.close();
  }
  await context.close();
}finally{await browser.close();fs.writeFileSync(path.join(out,'exact-square-results.json'),JSON.stringify(results,null,2)+'\n');}})().catch(e=>{console.error(e);process.exitCode=1;});
