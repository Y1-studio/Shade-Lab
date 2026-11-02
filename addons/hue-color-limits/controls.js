function hueLimitControls(api){
  U.editor(api,{...HueLimits,title:'Hue color limits',prepare:true,pickerShape:'square',pickerSurface:true,
    help:'Use the original cutout in the existing square. Moving on the hue wheel changes the square’s hue and selects the matching RGB / CMY cutout. Apply opens the square view.',
    fields(f){
      f.lock('square-lock','Square points',()=>f.config.squareLocked!==false,v=>f.config.squareLocked=v);
      f.lock('wheel-lock','Wheel points',()=>f.config.wheelLocked!==false,v=>f.config.wheelLocked=v);
      f.note('Locked points move together; each square point adjusts to its own hue limit. Unlock either control to move its points individually. Picking a color uses the separate lock beside Pick screen.');
      f.note('RGB / CMY area locks. Choose the colors to lock:');
      for(const id of U.roles(f.ball))f.check('role-'+id,E.roleName(f.ball,id),()=>f.config.roles.includes(id),on=>{f.config.roles=f.config.roles.filter(x=>x!==id);if(on)f.config.roles.push(id);});
      f.note('Uses the six cutouts and nearest-primary hue sectors from your selected reference. Existing custom areas and line guides also apply.');
    }
  });
  const status=U.make('p',{id:'hue-color-limits-membership',class:'hint','aria-live':'polite'}),reference=U.make('p',{id:'hue-color-limits-reference',class:'hint',hidden:''});api.mount('tools').append(status);api.mount('view').append(reference);api.onCleanup(()=>{HueLimits.clear();ReferenceSquare.clear();});
  api.subscribe(state=>{
    const b=state.project.balls.find(b=>b.id===state.activeBallId),view=state.project.pickerShape||'triangle',governing=S.state(b)?.active||view,c=S.get(b,api.id,governing);
    reference.hidden=true;if(!c){status.textContent='';return;}
    try{HueLimits.check(c,b);const colors=E.resolve(b);status.textContent=(c.enabled?'Locked':'Guide only')+' · '+c.roles.map(id=>E.roleName(b,id)+' '+Math.round(colors[id][0])+'° ('+HueLimits.family(colors[id][0])+')').join(' · ');if(view==='square'&&!state.activeColorTarget&&ReferenceSquare.get(b,view)){const h=colors[state.activeRoleId]?.[0]??colors.base[0],rgb=ReferenceSquare.rgb(h,1,1),hex='#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();reference.hidden=false;reference.textContent=HueLimits.family(h)+' area · Pure RGB '+rgb.join(', ')+' · '+hex;}}
    catch(error){status.textContent='Suspended · '+error.message;}
  });
}
