const S=ShadeAddons.service('surface-tools'),G=S.Geo,E=S.E,U=S.ui;
const HueLimits=(()=>{
  const cache=new Map(),profiles=new Map();
  function definition(hue){const h=E.wrap(hue),distance=p=>Math.abs(E.wrap(p.hue-h+180)-180);return HueLimitProfiles.reduce((a,b)=>distance(b)<distance(a)?b:a);}
  function profile(hue){
    const name=definition(hue).name;if(profiles.has(name))return profiles.get(name);
    const result=[];let current,first;
    const push=p=>result.push([p[0],1-p[1]]);
    function curve(a,b,c,d,depth=0){
      if(depth>=16||Math.max(Math.hypot(...G.sub(b,G.project(b,a,d))),Math.hypot(...G.sub(c,G.project(c,a,d))))<.00002){push(d);return;}
      const ab=G.mul(G.add(a,b),.5),bc=G.mul(G.add(b,c),.5),cd=G.mul(G.add(c,d),.5),abc=G.mul(G.add(ab,bc),.5),bcd=G.mul(G.add(bc,cd),.5),mid=G.mul(G.add(abc,bcd),.5);
      curve(a,ab,abc,mid,depth+1);curve(mid,bcd,cd,d,depth+1);
    }
    for(const command of definition(hue).path){const c=command.slice(1);if(command[0]==='M'||command[0]==='L'){current=c;push(c);if(command[0]==='M')first=c;}else if(command[0]==='C'){curve(current,c.slice(0,2),c.slice(2,4),c.slice(4,6));current=c.slice(4,6);}else current=first;}
    profiles.set(name,result);return result;
  }
  const family=hue=>definition(hue).name;
  function polygon(hue,shape){
    const key=shape+':'+family(hue),saved=cache.get(key);if(saved)return saved;
    const p=G.mapped(profile(hue),sv=>G.point(G.fromHSV(sv,hue),shape),.00002);
    cache.set(key,p);return p;
  }
  function initial(ball,shape){return{version:1,enabled:true,visible:true,squareLocked:true,wheelLocked:true,roles:U.roles(ball),positions:Object.fromEntries(Object.entries(E.resolve(ball)).map(([id,c])=>[id,G.point(c,shape)]))};}
  function contains(_config,color,shape,_id,joint=false){const p=G.hsv(color),poly=profile(color[0]);if(G.inside(p,poly))return true;const legacyEdge=joint||G.inside(G.point(color,shape),polygon(color[0],shape));return legacyEdge&&Math.hypot(...G.sub(p,G.closest(p,[poly])))<.00005;}
  function project(_config,color,shape){const p=G.closest(G.hsv(color),[profile(color[0])]);return G.point(G.fromHSV(p,color[0]),shape);}
  function projectMove(config,{from,target,shape,request}){if(request.display?.id!=='hue-reference-hsv')return null;const [x,y]=request.display.point,desired=[(x-84)/152,1-(y-84)/152],p=G.closest(desired,[profile(from[0])]);return{point:G.point(G.fromHSV(p,from[0]),shape),fraction:Math.hypot(...G.sub(p,desired))<G.eps?1:0};}
  function check(c,ball){
    if(!c||c.version!==1||typeof c.enabled!=='boolean'||typeof c.visible!=='boolean')throw Error('Choose supported hue color limits.');
    for(const key of ['squareLocked','wheelLocked'])if(c[key]!==undefined&&typeof c[key]!=='boolean')throw Error('Invalid hue-limit movement lock.');
    const ids=U.roles(ball);if(!Array.isArray(c.roles)||!c.roles.length||new Set(c.roles).size!==c.roles.length||c.roles.some(id=>!ids.includes(id)))throw Error('Choose at least one existing color to lock.');
    if(c.positions!==undefined&&(!c.positions||typeof c.positions!=='object'||Array.isArray(c.positions)))throw Error('Saved color-limit positions are invalid.');
    for(const id of c.roles){const p=c.positions?.[id];if(p&&(!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)||v<0||v>1)))throw Error('Saved color-limit positions are invalid.');}
  }
  function pickerLocks(ball,shape){const active=S.state(ball)?.active,c=S.get(ball,'hue-color-limits',active);if(active!=='square'||!c?.enabled)return;try{check(c,ball);}catch{return;}return{...(shape==='square'?{plane:c.squareLocked!==false}:{}),hue:c.wheelLocked!==false};}
  return{pickerLocks,kind:'area',adaptHue:true,definition,profile,polygon,polygons:(_c,hue,shape)=>[polygon(hue,shape)],contains,project,projectMove,family,initial,check,clear:()=>{cache.clear();profiles.clear();}};
})();
