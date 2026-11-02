function swapControls(api){
  const panel=api.mount('actions'),hint=document.createElement('p'),button=document.createElement('button');
  hint.className='hint';hint.id='wheel-swap-status';
  button.type='button';button.id='wheel-swap';button.textContent='⇄';
  button.title='Swap Highlight and Shadow positions on the hue wheel';
  button.setAttribute('aria-label',button.title);button.setAttribute('aria-describedby','wheel-swap-status');
  const actions=document.createElement('div');actions.className='actions';actions.append(button);panel.append(actions,hint);
  function targets(state){return state.project.balls.filter(b=>state.selectedBallIds.length?state.selectedBallIds.includes(b.id):b.id===state.activeBallId);}
  function render(state=api.getState()){const balls=targets(state),ready=balls.length&&balls.every(Swap.available);button.disabled=!ready;hint.textContent=ready?'Highlight ↔ Shadow hues · '+balls.filter(Swap.enabled).length+' of '+balls.length+' flipped. Saturation and lightness stay unchanged.':'Choose balls that contain both Highlight and Shadow.';}
  api.on(button,'click',()=>{const ids=targets(api.getState()).map(b=>b.id);api.updateProject(project=>{for(const b of project.balls)if(ids.includes(b.id))Swap.flip(b);},'Highlight / Shadow hue positions swapped');});api.subscribe(render);
}
