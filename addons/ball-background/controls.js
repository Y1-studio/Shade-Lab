function backgroundControls(api){
  const B=BallBackground,cards=new Map();
  const make=(tag,attrs={},text)=>{const n=document.createElement(tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;};
  const panel=api.mount('actions'),hint=make('p',{id:'bg-status',class:'hint'}),back=make('button',{id:'bg-back',type:'button'},'Back to ball colors');panel.append(hint,back);panel.hidden=true;
  api.on(back,'click',()=>api.selectColorTarget(null));
  const isEditing=(state,id)=>state.activeBallId===id&&state.activeColorTarget?.addonId===api.id&&state.activeColorTarget?.id==='background';
  api.onBallCard(({ball,slot,selection})=>{
    let item=cards.get(ball.id);if(item&&item.panel.parentElement!==slot){item.offs.forEach(off=>off());item.panel.remove();cards.delete(ball.id);item=null;}
    if(!item){const p=make('span',{'data-shade-addon':api.id,class:'bg-card-controls'}),edit=make('button',{type:'button',class:'bg-card-edit','data-background-ball':ball.id}),dot=make('span',{class:'bg-card-dot','aria-hidden':'true'}),text=make('span',{'aria-hidden':'true'},'▧'),show=make('button',{type:'button',class:'bg-card-toggle',title:'Hide or show saved background'}),clear=make('button',{type:'button',class:'bg-card-clear',title:'Clear background'},'×');
      show.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path class="bg-eye-slash" d="m3 3 18 18"/></svg>';
      edit.append(dot,text);p.append(edit,show,clear);slot.append(p);
      const id=ball.id,offs=[];offs.push(api.on(p,'click',e=>e.stopPropagation()));offs.push(api.on(edit,'click',()=>{const state=api.getState();api.selectColorTarget(isEditing(state,id)?null:'background',id);}));
      offs.push(api.on(show,'click',()=>api.updateProject(project=>{const b=project.balls.find(b=>b.id===id),c=b&&B.config(b);if(c)B.put(b,c.hex,!c.enabled,c.hue);},'Background visibility changed')));
      offs.push(api.on(clear,'click',()=>api.updateProject(project=>{const b=project.balls.find(b=>b.id===id);if(b?.addons)delete b.addons[B.key];},'Ball background cleared')));
      item={panel:p,edit,dot,text,show,clear,offs};cards.set(id,item);
    }
    const c=B.config(ball),active=isEditing(selection,ball.id),saved=ball.addons?.[B.key]!==undefined;item.panel.dataset.backgroundVisible=String(!!c?.enabled);item.edit.setAttribute('aria-label',(active?'Editing':'Edit')+' background for '+ball.name);item.edit.setAttribute('aria-pressed',String(active));item.edit.title=active?'Editing background with the main picker. Click to return to ball colors.':'Edit this background with the main color wheel and square';item.dot.style.background=c?.hex||'transparent';item.show.hidden=!c;item.show.setAttribute('aria-pressed',String(!!c?.enabled));item.show.querySelector('.bg-eye-slash').style.display=c?.enabled?'none':'';item.show.title=(c?.enabled?'Hide':'Show')+' background for '+ball.name;item.show.setAttribute('aria-label',item.show.title);item.clear.hidden=!saved;item.clear.setAttribute('aria-label','Clear background for '+ball.name);
  });
  function update(state){const active=state.activeColorTarget?.addonId===api.id,b=state.project.balls.find(b=>b.id===state.activeBallId);panel.hidden=!active;hint.textContent=active?'Editing '+(b?.name||'ball')+' background with the main picker. Ball colors and filters stay unchanged.':'';const live=new Set(state.project.balls.map(b=>b.id));for(const [id,item]of cards)if(!live.has(id)){item.offs.forEach(off=>off());item.panel.remove();cards.delete(id);}}
  api.onCleanup(()=>{for(const item of cards.values()){item.offs.forEach(off=>off());item.panel.remove();}cards.clear();});update(api.getState());api.subscribe(update);
}
