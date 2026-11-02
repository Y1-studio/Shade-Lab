const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../../..'),out=path.join(root,'tests/artifacts/hue-color-limits');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.goto(pathToFileURL(path.join(root,process.argv.includes('--portable')?'Shade Lab.html':'web/index.html')).href);await page.evaluate(()=>ShadeReady);
 const result=await page.evaluate(()=>{
  const E=Shade,S=ShadeAddons.service('surface-tools'),G=S.Geo,P=ShadeAddons.providers('surface').find(p=>p.id==='hue-color-limits'),b=E.clone(project.balls[0]);b.base=G.fromHSV([.4,.7],0);b.strength=1;
  b.roles.forEach((r,i)=>E.setRule(r,'offset',E.difference(b.base,G.fromHSV([.4,.7],(i+1)*60),r.model)));
  const config=P.initial(b,'square');config.squareLocked=false;S.put(b,P.id,'square',config);S.prepare(b,'square');
  const samples={},measure=(name,fn,n=40)=>{const times=[];for(let i=0;i<n;i++){const start=performance.now();fn(i);times.push(performance.now()-start);}times.sort((a,b)=>a-b);samples[name]={median:times[Math.floor(n*.5)],p95:times[Math.floor(n*.95)],max:times.at(-1)};};
  const ids=['base',...b.roles.map(r=>r.id)],view=E.pickerSurface(b,'square');
  measure('inside',i=>{const id=ids[i%ids.length],c=E.resolve(b)[id],p=[84+152*(.25+.12*Math.sin(i)),84+152*(.25+.1*Math.cos(i))];E.movePickerColor(b,id,'plane',view.color(...p,c[0]),true,'square',p);});
  measure('outside',i=>{const id=ids[i%ids.length],c=E.resolve(b)[id],p=[300+i,30-i];E.movePickerColor(b,id,'plane',view.color(...p,c[0]),true,'square',p);});
  S.get(b,P.id,'square').squareLocked=true;const origin=E.resolve(b);measure('linked',i=>{const id=ids[i%ids.length],p=i%2?[400,-100]:[145,130];E.movePickerColor(b,id,'plane',view.color(...p,origin[id][0]),false,'square',p,true,origin);});
  S.get(b,P.id,'square').squareLocked=false;measure('hue',i=>{const c=E.resolve(b).base;E.movePickerColor(b,'base','hue',[(i*17)%360,...c.slice(1)],false,'square');},24);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=640;
  measure('draw',i=>ShadeRender.drawWheel(canvas,b,ids[i%ids.length],[],'square'),30);
  const ownValid=ids.every(id=>G.inside(G.hsv(E.resolve(b)[id]),P.profile(E.resolve(b)[id][0]))),A=ShadeAddons.providers('surface').find(p=>p.id==='color-areas'),area=A.initial(b,'square');area.enabled=true;area.rect=[.05,.1,.9,.8];S.put(b,A.id,'square',area);S.prepare(b,'square');
  measure('jointInside',i=>{const id=ids[i%ids.length],c=E.resolve(b)[id],p=[84+152*(.3+.1*Math.sin(i)),84+152*(.25+.05*Math.cos(i))];E.movePickerColor(b,id,'plane',view.color(...p,c[0]),true,'square',p);},24);
  return{samples,polygons:[0,60,120,180,240,300].map(h=>[h,P.polygon(h,'square').length]),ownValid,valid:ids.every(id=>S.contains(S.collect(b,'square').area,id,E.resolve(b)[id],'square'))};
 });
 const name=process.argv.includes('--baseline')?'drag-performance-before.json':process.argv.includes('--portable')?'drag-performance-portable.json':'drag-performance-after.json';fs.writeFileSync(path.join(out,name),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(!process.argv.includes('--baseline')){assert.equal(result.valid,true);assert.equal(result.ownValid,true);for(const name of Object.keys(result.samples))assert.ok(result.samples[name].p95<50,`${name} exceeded the drag budget: ${result.samples[name].p95} ms`);}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
