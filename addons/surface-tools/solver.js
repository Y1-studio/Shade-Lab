const Surface = (() => {
  const E=globalThis.Shade,key='surface-tools';
  const providers=()=>ShadeAddons.providers('surface');
  const get=(ball,id,shape)=>ball.addons?.[id]?.surfaces?.[shape];
  function put(ball,id,shape,config){ball.addons??={};ball.addons[id]??={version:1,surfaces:{}};ball.addons[id].surfaces??={};ball.addons[id].surfaces[shape]=config;}
  const state=ball=>ball.addons?.[key];
  function activate(ball,shape){ball.addons??={};ball.addons[key]={...ball.addons[key],version:1,active:shape};}
  const raw=(ball,strength=ball.strength)=>E.resolveBefore(ball,strength,key);
  function collect(ball,shape){
    let layout=null;const areas=[];
    for(const provider of providers()){
      const config=get(ball,provider.id,shape);if(!config?.enabled||provider.effective?.(config)===false)continue;
      provider.check(config,ball,shape);
      if(provider.kind==='layout'){if(layout)throw Error('Use one point layout or constrained line per surface.');layout={provider,config};}
      else if(provider.kind==='area')areas.push({provider,config});
    }
    // Existing layout providers consume a single intersection of all areas.
    // Only the real provider configs receive persistent position writes.
    const area=areas.length===1?areas[0]:areas.length?{items:areas,config:{roles:[...new Set(areas.flatMap(a=>a.config.roles))],positions:Object.assign({},...areas.map(a=>Object.fromEntries(a.config.roles.filter(id=>a.config.positions?.[id]).map(id=>[id,a.config.positions[id]]))))},provider:{polygons:(_c,hue,view,id)=>areas.filter(a=>a.config.roles.includes(id)).flatMap(a=>a.provider.polygons(a.config,hue,view,id))}}:null;
    return {layout,area};
  }
  const areaItems=area=>area?.items||(area?[area]:[]);
  const owners=(area,id)=>areaItems(area).filter(a=>a.config.roles.includes(id));
  function contains(area,id,color,shape,layout=false){const items=owners(area,id);return Geo.inside(Geo.point(color,shape),Geo.domain(shape))&&items.every(a=>a.provider.contains?a.provider.contains(a.config,color,shape,id,layout||items.length>1):a.provider.polygons(a.config,color[0],shape,id).every(poly=>Geo.inside(Geo.point(color,shape),poly)));}
  function setPosition(area,id,point){for(const item of areaItems(area))if(item.config.roles.includes(id)){item.config.positions??={};item.config.positions[id]=[...point];}if(area)area.config.positions[id]=[...point];}
  function restrictions(area,id,hue,shape){return[Geo.domain(shape),...(area&&area.config.roles.includes(id)?area.provider.polygons(area.config,hue,shape,id):[])];}
  function solve(ball,colors=raw(ball),shape=state(ball)?.active){
    if(state(ball)&&state(ball).version!==1)throw Error('Unsupported surface-tool data version.');
    if(shape!==undefined&&!['square','triangle'].includes(shape))throw Error('Unknown governing surface.');
    if(!['square','triangle'].includes(shape))return colors;
    const {layout,area}=collect(ball,shape),result=E.clone(colors);
    if(area)for(const id of area.config.roles){const p=area.config.positions?.[id];if(p){if(!Geo.inside(p,Geo.domain(shape)))throw Error('A saved area point leaves the '+shape+'. Edit and apply the area again.');result[id]=Geo.color(p,colors[id][0],shape);}}
    if(layout)for(const [id,p]of Object.entries(layout.provider.points(layout.config,ball,colors,shape))){if(!Geo.inside(p,Geo.domain(shape)))throw Error('The layout leaves the '+shape+'. Reduce its size or move it inward.');result[id]=Geo.color(p,colors[id][0],shape);}
    const affected=new Set([...(area?.config.roles||[]),...Object.keys(layout?layout.provider.points(layout.config,ball,colors,shape):{})]);
    for(const id of affected)if(!contains(area,id,result[id],shape,!!layout))throw Error('The '+shape+' tools cannot fit '+E.roleName(ball,id)+'. Edit the area, size, or position.');
    return result;
  }
  function resolve(ball,colors){try{return solve(ball,colors);}catch{const fallback=state(ball)?.accepted;if(fallback&&Object.keys(colors).every(id=>Array.isArray(fallback[id])&&fallback[id].length===3&&fallback[id].every((v,i)=>Number.isFinite(v)&&v>=0&&v<=[360,100,100][i])))return E.clone(Object.fromEntries(Object.keys(colors).map(id=>[id,fallback[id]])));return colors;}}
  function accept(ball){if(state(ball)){const colors=solve(ball);state(ball).accepted=colors;const shape=state(ball).active,{area}=collect(ball,shape);if(area){area.config.positions??={};for(const id of area.config.roles)setPosition(area,id,Geo.point(colors[id],shape));}}return ball;}
  function prepare(ball,shape){
    activate(ball,shape);const colors=raw(ball),{layout,area}=collect(ball,shape);
    const owned=layout?layout.provider.points(layout.config,ball,colors,shape):{};
    if(area){area.config.positions??={};for(const id of area.config.roles){if(Object.hasOwn(owned,id))continue;const p=area.config.positions[id]||Geo.point(colors[id],shape),items=owners(area,id),project=items.length===1&&items[0].provider.project;setPosition(area,id,project?project(items[0].config,Geo.color(p,colors[id][0],shape),shape,id):Geo.closest(p,restrictions(area,id,colors[id][0],shape)));}}
    if(layout?.provider.fit){layout.provider.fit(layout.config,ball,colors,shape,area);if(area)for(const [id,p]of Object.entries(layout.provider.points(layout.config)))if(area.config.roles.includes(id))setPosition(area,id,p);}
    else if(layout){const pts=layout.provider.points(layout.config,ball,colors,shape),origin=layout.config.origin;
      const polys=Object.entries(pts).flatMap(([id,p])=>restrictions(area,id,colors[id][0],shape).map(poly=>poly.map(q=>Geo.sub(q,Geo.sub(p,origin)))));
      layout.config.origin=Geo.closest(origin,polys);
    }
    return accept(ball);
  }
  function edit(ball,request,next){
    const shape=state(ball)?.active;if(!['square','triangle'].includes(shape))return false;
    const current=solve(ball);let {layout,area}=collect(ball,shape);if(!layout&&!area)return false;
    if(request.kind==='plane'&&request.shape!==shape)throw Error(shape+' tools govern these colors. Resume tools for this view before dragging.');
    const before=E.clone(ball),{id,target,kind}=request;if(!current[id])throw Error('Select a color.');
    if(!Array.isArray(target)||target.some(x=>!Number.isFinite(x)))throw Error('Choose a valid color.');
    const hueChanged=Math.abs(E.wrap(target[0]-current[id][0]+180)-180)>1e-7&&kind!=='plane';
    let reprojected=false;
    if(hueChanged){next(ball,{...request,kind:'hue',free:kind==='sample'||kind==='color'?!request.group:request.free,target:[target[0],...raw(ball)[id].slice(1)]});try{solve(ball);}catch{if(kind==='sample'||areaItems(area).some(a=>a.provider.adaptHue)){prepare(ball,shape);reprojected=true;}else throw Error('This hue leaves the allowed area. Move or resize the tools first.');}}
    ({layout,area}=collect(ball,shape));
    if(kind==='hue'){accept(ball);return true;}
    if(request.point&&(!Array.isArray(request.point)||request.point.length!==2||request.point.some(v=>!Number.isFinite(v))))throw Error('Invalid pointer position.');
    const now=solve(ball),p=Geo.point(now[id],shape),goal=kind==='plane'&&request.point?(layout?.provider.pointerGoal?.(layout.config,id,request.point,shape)||Geo.uncanvas(request.point,shape)):Geo.point(target,shape),delta=Geo.sub(goal,p);
    if(Math.hypot(...delta)<1e-10&&!reprojected&&!request.display?.group){accept(ball);return true;}
    let clipped=reprojected;
    const owned=layout&&Object.hasOwn(layout.provider.points(layout.config,ball,raw(ball),shape),id);
    if(owned){
      const old=E.clone(layout.config),candidate=layout.provider.move(old,id,goal,ball,shape),a=layout.provider.points(old,ball,now,shape),b=layout.provider.points(candidate,ball,now,shape);let fraction=1;
      for(const key of Object.keys(a))fraction=Math.min(fraction,Geo.segment(a[key],b[key],restrictions(area,key,now[key][0],shape)));
      put(ball,layout.provider.id,shape,layout.provider.blend(old,candidate,fraction));clipped||=fraction<1-1e-6||Math.hypot(...Geo.sub(b[id],goal))>1e-6;
    }else if(area?.config.roles.includes(id)){
      const group=!layout&&request.display?.group;
      for(const key of group?area.config.roles:[id]){
        const member=group?.[key],from=now[key],start=Geo.point(from,shape),desired=member?Geo.point(member.color,shape):goal,req=member?{...request,display:{...request.display,point:member.point}}:request,items=owners(area,key),direct=items.length===1&&items[0].provider.projectMove?.(items[0].config,{id:key,from,target:member?.color||target,shape,request:req}),polys=direct?null:restrictions(area,key,from[0],shape),move=direct||(member?{point:Geo.closest(desired,polys),fraction:1}:request.interpolate?Geo.follow(t=>Geo.point(request.interpolate(from,target,t),shape),polys):{fraction:Geo.segment(start,desired,polys)});
        setPosition(area,key,move.point||Geo.add(start,Geo.mul(Geo.sub(desired,start),move.fraction)));clipped||=move.fraction<1-1e-6;
      }
    }else {next(ball,{...request,target:[now[id][0],target[1],target[2]]});}
    accept(ball);
    if(kind==='sample'&&clipped){const error=Error('The sample is outside the allowed area. Review the proposed color.');error.proposal={kind:key,before,after:E.clone(ball),sample:[...target],roleId:id};throw error;}
    return true;
  }
  function status(ball){const shape=state(ball)?.active;if(!shape)return 'No surface constraint is active.';try{solve(ball);const active=collect(ball,shape);return active.layout||active.area?shape+' tools govern colors in every view and export.':'No surface constraint is active.';}catch(error){return 'Suspended · '+error.message+' Last accepted colors are retained.';}}
  const controls=ball=>{const shape=state(ball)?.active;if(!shape)return {};try{const {layout,area}=collect(ball,shape);return layout||area?{plane:shape+' surface tools govern movement; use their editor or disable them.'}:{};}catch{return {};}};
  function hit({ball,shape,x,y}){if(shape!==state(ball)?.active||E.pickerSurface(ball,shape)?.exclusive)return null;try{const {layout}=collect(ball,shape);if(!layout||!layout.provider.hit?.(layout.config,[x,y],shape))return null;const anchor=Geo.canvas(layout.config.origin,shape);return{id:layout.config.anchor,kind:'plane',x:anchor[0],y:anchor[1]};}catch{return null;}}
  return {key,E,Geo,providers,get,put,state,activate,raw,collect,restrictions,contains,solve,resolve,accept,prepare,edit,status,controls,hit};
})();
