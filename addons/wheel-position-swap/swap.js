const E=globalThis.Shade;
const Swap=(()=>{
  const key='wheel-position-swap',other=id=>id==='highlight'?'shadow':id==='shadow'?'highlight':null;
  const available=ball=>['highlight','shadow'].every(id=>ball.roles.some(r=>r.id===id));
  const enabled=ball=>ball.addons?.[key]?.version===1&&ball.addons[key].flipped===true&&available(ball);
  function resolve(ball,colors){if(enabled(ball)){const h=colors.highlight[0];colors.highlight[0]=colors.shadow[0];colors.shadow[0]=h;}return colors;}
  function edit(ball,request,next){
    if(!enabled(ball)||!other(request.id)||request.kind==='plane')return false;
    const {id,target,kind}=request,current=E.resolve(ball)[id],hueAllowed=!request.channels||request.channels.includes('H');
    if(hueAllowed&&Math.abs(E.wrap(target[0]-current[0]+180)-180)>1e-8){const mapped=other(id),raw=E.resolveBefore(ball,ball.strength,key);next(ball,{...request,id:mapped,kind:'hue',target:[target[0],...raw[mapped].slice(1)]});}
    if(kind==='hue')return true;
    const raw=E.resolveBefore(ball,ball.strength,key);
    next(ball,{...request,channels:['S','L'],target:[raw[id][0],target[1],target[2]]});return true;
  }
  function flip(ball){if(!available(ball))throw Error('This ball needs Highlight and Shadow regions.');const trial=E.clone(ball);trial.addons??={};trial.addons[key]={version:1,flipped:!enabled(ball)};E.checkExtensions(trial);const state=trial.addons['surface-tools'];if(state?.active)state.accepted=E.resolveThrough(trial,trial.strength,'surface-tools');Object.assign(ball,trial);return ball;}
  return{key,other,available,enabled,resolve,edit,flip};
})();
