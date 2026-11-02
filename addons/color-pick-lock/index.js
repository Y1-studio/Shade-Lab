const E=globalThis.Shade,key='color-pick-lock';
const locked=ball=>ball.addons?.[key]?.version===1&&ball.addons[key].locked===true;
function edit(ball,request,next){
  if(request.kind!=='sample'||request.source!=='picker')return false;
  const group=locked(ball);
  next(ball,{...request,group,free:!group,independent:!group});
  return true;
}
function activate(api){
  const mount=api.mount('colorPick'),button=document.createElement('button');
  button.id='color-pick-lock';button.type='button';mount.append(button);
  api.on(button,'click',()=>{const id=api.getState().activeBallId;api.updateProject(project=>{const ball=project.balls.find(b=>b.id===id);ball.addons??={};ball.addons[key]={version:1,locked:!locked(ball)};},'Color picking lock changed');});
  api.subscribe(state=>{const ball=state.project.balls.find(b=>b.id===state.activeBallId),on=locked(ball);button.textContent=on?'🔒':'🔓';button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',on?'Unlock color picking: change only the selected color':'Lock color picking: move linked colors together');button.title=on?'Picking locked: move linked colors together':'Picking unlocked: change only the selected color';button.disabled=!!state.activeColorTarget;});
}
const addon={engine:{editOrder:-150,edit},activate};
