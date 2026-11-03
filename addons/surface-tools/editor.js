// Detached, transactional editors shared by the installed surface tools.
const UI = (() => {
  const E=Surface.E,R=globalThis.ShadeRender;
  function make(tag,attrs={},text){const el=document.createElement(tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;}
  const button=(id,text)=>make('button',{id,type:'button'},text);
  const field=(text,el)=>{const label=make('label',{class:'field'},text);label.append(el);return label;};
  const roles=ball=>['base',...ball.roles.map(r=>r.id)];
  function path(ctx,points,shape,close=false){ctx.beginPath();if(!points.length)return;ctx.moveTo(...Geo.canvas(points[0],shape));for(let i=1;i<points.length+(close?1:0);i++)for(const p of Geo.displayEdge(points[i-1],points[i%points.length],shape).slice(1))ctx.lineTo(...p);if(close)ctx.closePath();}
  function stroke(ctx,points,shape,closed=false,color='#eaffff'){path(ctx,points,shape,closed);ctx.lineWidth=3;ctx.strokeStyle='#10212ccc';ctx.stroke();ctx.lineWidth=1.2;ctx.strokeStyle=color;ctx.stroke();}
  function clip(ctx,shape){if(shape==='square'){ctx.beginPath();ctx.rect(84,84,152,152);}else path(ctx,Geo.domain(shape),shape,true);ctx.clip();}
  const value=v=>typeof v==='function'?v():v;
  const replace=(target,source)=>{for(const k of Object.keys(target))delete target[k];Object.assign(target,E.clone(source));};
  function editor(api,spec){
    const id=api.id,panel=api.mount('tools'),edit=button(id+'-edit','Add '+spec.title.toLowerCase()),resume=button(id+'-resume','Resume in this view'),remove=button(id+'-remove','Remove from this view');
    const summary=make('p',{id:id+'-summary',class:'hint'}),actions=make('div',{class:'actions'});actions.append(edit,resume,remove);panel.append(make('h3',{},spec.title),summary,actions);
    const dialog=make('dialog',{id:id+'-dialog','data-shade-addon':'surface-tools','aria-labelledby':id+'-heading'}),fields=make('div',{class:'surface-fields',id:id+'-fields'});
    const wheel=make('canvas',{id:id+'-wheel',width:640,height:640,'aria-label':spec.title+' editable preview'}),ballCanvas=make('canvas',{width:320,height:280,'aria-label':'Ball preview'}),previews=make('div',{class:'surface-previews'});previews.append(wheel,ballCanvas);
    const active=make('select',{id:id+'-active'}),swatches=make('p',{id:id+'-colors',class:'surface-colors'}),error=make('p',{id:id+'-error',class:'error',role:'status'}),apply=button(id+'-apply','Apply'),cancel=button(id+'-cancel','Cancel'),fit=button(id+'-fit','Fit position to allowed area'),footer=make('div',{class:'actions'});apply.classList.add('accent');footer.append(apply,fit,cancel);
    const layout=make('div',{class:'surface-editor-layout'}),previewPanel=make('div',{class:'surface-preview-panel'});previewPanel.append(field('Selected color (also selects overlapping points)',active),previews,swatches);layout.append(fields,previewPanel);
    dialog.append(make('h2',{id:id+'-heading'},spec.title),make('p',{id:id+'-context',class:'hint'}),make('p',{class:'hint'},spec.help),layout,error,footer);document.body.append(dialog);api.onCleanup(()=>dialog.remove());
    let draft=null,applying=false,gesture=null,bindings=[];
    const current=s=>s.project.balls.find(b=>b.id===s.activeBallId);
    const close=()=>{draft=null;gesture=null;if(dialog.open)api.closeDialog(dialog);};
    function sync(except){for(const bind of bindings)bind(except);}
    function evaluate(config,fitPosition=false){
      const b=E.clone(draft.ball),c=E.clone(config);spec.check(c,b,draft.shape);Surface.put(b,id,draft.shape,c);
      if(c.enabled){Surface.activate(b,draft.shape);if(fitPosition||spec.prepare)Surface.prepare(b,draft.shape);else Surface.accept(b);}
      else if(Surface.state(b)?.active===draft.shape)Surface.accept(b);
      E.validateBall(b);E.checkExtensions(b);return b;
    }
    function publish(b,except){
      draft.ball=b;draft.candidate=b;replace(draft.config,Surface.get(b,id,draft.shape));
      const colors=E.resolve(b);draft.markers=R.drawWheel(wheel,b,draft.active,[],draft.shape,null,{surface:!!spec.pickerSurface});R.ballCanvas(ballCanvas,b);
      swatches.replaceChildren(...Object.entries(colors).map(([rid,color])=>{const el=make('span',{},E.roleName(b,rid)+' '+E.toHex(color));el.style.borderColor=E.toHex(color);return el;}));
      apply.disabled=false;error.textContent='';sync(except);
    }
    function preview(fitPosition=false,except){if(!draft)return;try{if(draft.invalidText.size)throw Error([...draft.invalidText.values()][0]);publish(evaluate(draft.config,fitPosition),except);}catch(failure){draft.candidate=null;apply.disabled=true;error.textContent=failure.message;}}
    function form(){
      fields.replaceChildren();bindings=[];draft.invalidText.clear();const ctx={ball:draft.ball,shape:draft.shape,config:draft.config,fields,
        number(name,label,get,set,min=-2,max=2,step=.1,cyclic=false){
          const input=make('input',{id:id+'-'+name,type:'number',step}),row=make('div',{class:'surface-number'}),down=button(id+'-'+name+'-down','−'),up=button(id+'-'+name+'-up','+');down.setAttribute('aria-label','Decrease '+label);up.setAttribute('aria-label','Increase '+label);row.append(input,down,up);fields.append(field(label,row));
          const limit=v=>cyclic?E.wrap(v):Math.max(value(min)??-Infinity,Math.min(value(max)??Infinity,v));
          bindings.push(except=>{if(except!==input)input.value=String(value(get));for(const [key,bound]of [['min',min],['max',max]]){const v=value(bound);if(v==null)input.removeAttribute(key);else input.setAttribute(key,v);}});
          const commit=()=>{if(!draft||!Number.isFinite(input.valueAsNumber))return;set(limit(input.valueAsNumber));preview();};
          input.addEventListener('input',()=>{set(cyclic?E.wrap(input.valueAsNumber):input.valueAsNumber);preview(false,input);});input.addEventListener('change',commit);input.addEventListener('blur',commit);
          const increment=sign=>{if(!draft)return;const n=Number.isFinite(input.valueAsNumber)?input.valueAsNumber:value(get);set(limit(Math.round((n+sign*step)*1e10)/1e10));preview();};
          down.addEventListener('click',()=>increment(-1));up.addEventListener('click',()=>increment(1));input.addEventListener('keydown',e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();increment(e.key==='ArrowUp'?1:-1);}else if(e.key==='Enter'){e.preventDefault();commit();}});return input;
        },
        select(name,label,get,options,set){const input=make('select',{id:id+'-'+name});for(const [v,text]of options)input.append(make('option',{value:v},text));bindings.push(()=>input.value=String(value(get)));input.addEventListener('change',()=>{set(input.value);form();preview();});fields.append(field(label,input));return input;},
        check(name,label,get,set){const input=make('input',{id:id+'-'+name,type:'checkbox'}),el=make('label',{class:'check'});bindings.push(()=>input.checked=value(get));el.append(input,document.createTextNode(label));fields.append(el);input.addEventListener('change',()=>{set(input.checked);preview();});return input;},
        text(name,label,get,set){const input=make('textarea',{id:id+'-'+name,rows:4}),row=field(label,input);bindings.push(except=>{if(except!==input)input.value=value(get);});row.classList.add('surface-wide');fields.append(row);input.addEventListener('input',()=>{try{set(input.value);draft.invalidText.delete(name);preview(false,input);}catch(failure){draft.invalidText.set(name,failure.message);draft.candidate=null;error.textContent=failure.message;apply.disabled=true;}});return input;},
        note(text){fields.append(make('p',{class:'hint surface-wide'},text));},
        lock(name,label,get,set){const b=button(id+'-'+name,''),syncLock=()=>{const locked=value(get);b.textContent=(locked?'🔒 ':'🔓 ')+label;b.setAttribute('aria-pressed',String(locked));b.title=locked?'Locked: move points together':'Unlocked: move only the chosen point';};bindings.push(syncLock);fields.append(b);b.addEventListener('click',()=>{set(!value(get));preview();});return b;},
        action(name,label,fn){const b=button(id+'-'+name,label);fields.append(b);b.addEventListener('click',()=>{try{fn();form();preview();}catch(failure){error.textContent=failure.message;apply.disabled=true;}});}
      };
      ctx.check('enabled','Constrain colors',()=>draft.config.enabled,v=>draft.config.enabled=v);ctx.check('visible','Show guide',()=>draft.config.visible,v=>draft.config.visible=v);spec.fields(ctx);sync();
    }
    function begin(resuming=false){const state=api.getState(),b=current(state);if(!b)return;const shape=spec.pickerShape||state.project.pickerShape||'triangle',saved=Surface.get(b,id,shape);let config;
      try{config=spec.forEditor&&saved?spec.forEditor(saved,b,shape):E.clone(saved);spec.check(config,b,shape);}catch{config=spec.initial(b,shape);}
      if(resuming)config.enabled=true;
      draft={ball:E.clone(b),original:JSON.stringify(b),shape,config,active:state.activeRoleId||'base',candidate:null,invalidText:new Map()};
      active.replaceChildren(...roles(b).map(rid=>make('option',{value:rid},E.roleName(b,rid))));active.value=draft.active;
      dialog.querySelector('#'+id+'-context').textContent='Editing '+shape+' settings. Apply makes this surface govern colors. Square and triangle keep separate settings.';
      form();preview(!saved||resuming);api.openDialog(dialog);
    }
    api.on(active,'change',()=>{draft.active=active.value;preview();});
    api.on(edit,'click',()=>begin());api.on(resume,'click',()=>begin(true));api.on(cancel,'click',close);api.on(dialog,'cancel',e=>{e.preventDefault();close();});api.on(dialog,'keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}});api.on(dialog,'close',()=>{if(!dialog.open){draft=null;gesture=null;}});
    api.on(fit,'click',()=>preview(true));
    api.on(apply,'click',()=>{if(!draft?.candidate||apply.disabled)return;const next=E.clone(draft.candidate),original=draft.original;applying=true;try{const ok=api.updateProject(project=>{const i=project.balls.findIndex(b=>b.id===next.id);if(i<0||JSON.stringify(project.balls[i])!==original)throw Error('The ball changed. Reopen this preview.');project.balls[i]=next;if(spec.pickerShape)project.pickerShape=spec.pickerShape;},spec.title+' applied');if(ok)close();}finally{applying=false;}});
    api.on(remove,'click',()=>{const state=api.getState(),shape=spec.pickerShape||state.project.pickerShape||'triangle';api.updateProject(project=>{const b=project.balls.find(b=>b.id===state.activeBallId);if(b?.addons?.[id]?.surfaces)delete b.addons[id].surfaces[shape];if(Surface.state(b)?.active===shape)try{Surface.accept(b);}catch{/* Invalid imported tools remain removable. */}},spec.title+' removed from '+shape);});
    const position=e=>{const r=wheel.getBoundingClientRect();return[(e.clientX-r.left)*320/r.width,(e.clientY-r.top)*320/r.height];};
    api.on(wheel,'pointerdown',e=>{if(!draft?.candidate||e.button!==0)return;const p=position(e),hits=draft.markers.filter(m=>Math.hypot(m.x-p[0],m.y-p[1])<10).sort((a,b)=>(b.id===draft.active)-(a.id===draft.active)||Math.hypot(a.x-p[0],a.y-p[1])-Math.hypot(b.x-p[0],b.y-p[1])),hit=hits[0],action=hit?null:spec.beginDrag?.(draft.config,Geo.uncanvas(p,draft.shape),draft.shape);if(!hit&&!action)return;
      if(hit){draft.active=hit.id;active.value=hit.id;}gesture={id:e.pointerId,last:p,offset:hit?[hit.x-p[0],hit.y-p[1]]:[0,0],ball:E.clone(draft.ball),config:E.clone(draft.config),hit,action};wheel.setPointerCapture?.(e.pointerId);e.preventDefault();
    });
    api.on(wheel,'pointermove',e=>{if(!gesture||e.pointerId!==gesture.id||!draft)return;const p=position(e),last=gesture.last,d=Geo.sub(p,last);gesture.last=p;
      try{if(gesture.hit||gesture.action==='anchor'){
        const hit=gesture.hit||{id:draft.config.anchor,kind:'plane'},b=E.clone(draft.ball),displayBall=spec.pickerSurface?b:undefined,color=E.resolve(b)[hit.id],absolute=E.pickerSurface(displayBall,draft.shape)?.pointerMode==='absolute',point=absolute?Geo.add(p,gesture.offset):Geo.add(E.pickerPoint(color,draft.shape,displayBall),d),angle=q=>Math.atan2(q[1]-160,q[0]-160)*180/Math.PI;
        const target=hit.kind==='hue'?[E.wrap(color[0]+E.wrap(angle(p)-angle(last)+180)-180),...color.slice(1)]:E.pickerColor(...point,color[0],draft.shape,displayBall);
        E.movePickerColor(b,hit.id,hit.kind,target,absolute&&hit.kind==='plane'?E.planeFree(b,draft.shape):true,draft.shape,hit.kind==='plane'?point:undefined,!!spec.pickerSurface,E.resolve(gesture.ball));E.validateBall(b);E.checkExtensions(b);publish(b);
      }else{
        const start=E.clone(draft.config),anchor=spec.dragOrigin?.(start,gesture.action),delta=anchor?Geo.sub(Geo.uncanvas(Geo.add(Geo.canvas(anchor,draft.shape),d),draft.shape),anchor):Geo.sub(Geo.uncanvas(p,draft.shape),Geo.uncanvas(last,draft.shape)),attempt=f=>evaluate(spec.drag(E.clone(start),Geo.mul(delta,f),gesture.action));let next;
        try{next=attempt(1);}catch{let lo=0,hi=1;for(let i=0;i<28;i++){const mid=(lo+hi)/2;try{const b=attempt(mid);lo=mid;next=b;}catch{hi=mid;}}}if(next)publish(next);
      }}catch(failure){error.textContent=failure.message;}
    });
    const end=e=>{if(gesture?.id!==e.pointerId)return;gesture=null;if(wheel.hasPointerCapture?.(e.pointerId))wheel.releasePointerCapture(e.pointerId);};
    api.on(wheel,'pointerup',end);api.on(wheel,'lostpointercapture',end);
    api.on(wheel,'pointercancel',e=>{if(gesture?.id===e.pointerId&&draft){const b=gesture.ball;gesture=null;publish(b);}});
    api.subscribe(state=>{const b=current(state);if(!b)return;if(draft&&!applying&&(b.id!==draft.ball.id||JSON.stringify(b)!==draft.original))close();const shape=spec.pickerShape||state.project.pickerShape||'triangle',c=Surface.get(b,id,shape);resume.hidden=remove.hidden=!c;edit.textContent=c?'Edit '+spec.title.toLowerCase():'Add '+spec.title.toLowerCase();summary.textContent=shape+' · '+(c?(spec.effective?.(c)===false?'Saved tool paused':c.enabled?'Constrained':'Guide only')+(c.visible?' · shown':' · hidden'):'No tool')+(Surface.state(b)?.active&&Surface.state(b).active!==shape?' · '+Surface.state(b).active+' governs colors':'');});
    return {begin};
  }
  return {make,button,field,roles,path,stroke,clip,editor};
})();
Surface.ui=UI;
