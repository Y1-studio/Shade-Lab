// Compose fresh live CSP palette captures beside the production portable renderer.
const path=require('node:path'),fs=require('node:fs'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const captures=path.resolve(process.argv[2]||'../tmp/csp-desktop-capture');
process.argv.push('--portable');
const {launch}=require('../tests/html-regression.cjs'),reference=require('../tests/fixtures/csp-square-reference.json');
(async()=>{const t=launch(undefined,{realCanvas:true});try{await t.w.ShadeReady;const proof=createCanvas(1200,420),ctx=proof.getContext('2d');ctx.fillStyle='#1b2027';ctx.fillRect(0,0,1200,420);ctx.fillStyle='#edf2f7';ctx.font='bold 18px sans-serif';ctx.fillText('CSP — fresh desktop captures',15,24);ctx.fillText('Shade Lab — corrected portable app',15,232);
 for(const [i,item]of reference.hues.entries()){const source=await loadImage(path.join(captures,item.name.toLowerCase()+'-main.png')),x=i*200+25;ctx.drawImage(source,96,1006,102,102,x,40,150,150);const c=t.w.document.createElement('canvas');c.width=c.height=640;const b=t.w.Shade.defaultBall(item.name,[item.hue,100,50]);b.roles=[];t.w.ShadeRender.drawWheel(c,b,'base',[],'square',null,{markers:false,tools:false});ctx.drawImage(c._native,168,168,304,304,x,248,150,150);ctx.font='14px sans-serif';ctx.fillText(item.name+' '+item.hue+'°',x,207);}
 const folder=path.resolve(__dirname,'../tests/artifacts/csp-square');fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'live-csp-vs-shade-lab.png'),proof.toBuffer('image/png'));console.log(path.join(folder,'live-csp-vs-shade-lab.png'));
 }finally{await t.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
