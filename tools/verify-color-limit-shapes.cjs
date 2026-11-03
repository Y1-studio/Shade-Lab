// Compare the six native hue-limit squares with a preserved pre-fix portable app.
process.argv.push('--portable');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {launch}=require('../tests/html-regression.cjs');
const root=path.resolve(__dirname,'..'),baseline=process.argv.slice(2).find(x=>!x.startsWith('--'))||path.join(root,'backups/20261103-before-csp-square/Shade Lab.html');
const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
(async()=>{
 const old=launch(undefined,{html:fs.readFileSync(baseline,'utf8'),realCanvas:true}),current=launch(undefined,{realCanvas:true}),results=[];
 try{
  await old.w.ShadeReady;await current.w.ShadeReady;
  for(const hue of [0,60,120,180,240,300]){
   const renders=[old,current].map(t=>{const E=t.w.Shade,S=t.w.ShadeAddons.service('surface-tools'),P=t.w.ShadeAddons.providers('surface').find(p=>p.id==='hue-color-limits'),b=E.defaultBall('Preserved shape',[hue,60,45]),c=P.initial(b,'square');S.put(b,P.id,'square',c);S.prepare(b,'square');const canvas=t.w.document.createElement('canvas');canvas.width=canvas.height=640;t.w.ShadeRender.drawWheel(canvas,b,'base',[],'square',null,{markers:false});return canvas._native.toBuffer('image/png');});
   assert.ok(renders[0].equals(renders[1]),'Hue-limit rendering changed at '+hue+'°');results.push({hue,sha256:digest(renders[1]),identical:true});console.log('PASS preserved hue-limit shape '+hue+'° (identical PNG bytes)');
  }
  const folder=path.join(root,'tests/output/csp-square');fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'preserved-color-limits.json'),JSON.stringify({baselineSHA256:digest(fs.readFileSync(baseline)),appSHA256:digest(fs.readFileSync(path.join(root,'Shade Lab.html'))),results},null,2)+'\n');
 }finally{await old.close();await current.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
