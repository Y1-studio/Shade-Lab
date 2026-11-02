// Build the optional portable example from the same paths used by the guide.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),{createCanvas}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'../..'),context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'web/engine.js'),'utf8'),context);
const art=vm.runInContext(fs.readFileSync(path.join(__dirname,'reference-ball.js'),'utf8')+';TutorialReferenceBall',context),E=context.Shade;
function build(){
 const ball=E.defaultBall('Green reference — custom layers',E.hexHsl(art.colors.base));ball.roles=ball.roles.filter(r=>['highlight','shadow'].includes(r.id));for(const r of ball.roles)E.setRule(r,'offset',E.difference(ball.base,E.hexHsl(art.colors[r.id]),r.model));ball.mode='custom';ball.softness=0;
 const assets={},layers=['base','shadow','highlight','outline'].map(role=>{const canvas=createCanvas(300,300);art.layer(canvas.getContext('2d'),role);const data=canvas.toDataURL('image/png'),assetId='png_'+crypto.createHash('sha256').update(data).digest('hex');assets[assetId]={data,width:300,height:300};return{id:'reference-'+role,name:role==='outline'?'Fixed outline':role,kind:role==='outline'?'overlay':'mask',...(role==='outline'?{}:{role}),assetId,x:150,y:150,width:300,height:300,rotation:0,opacity:1,flipX:false,flipY:false,visible:true,blur:false};});
 ball.id='tutorial-reference-ball';ball.design={width:300,height:300,layers};const result={schema:'shadelab.ball-type',version:3,id:'tutorial-reference-type',name:'Green reference — custom layers',ball,assets};E.validateDocument(result);return result;
}
if(require.main===module){const file=path.join(root,'examples/green-reference-ball.json');fs.writeFileSync(file,JSON.stringify(build(),null,2)+'\n');console.log('Built examples/green-reference-ball.json');}
module.exports={build};
