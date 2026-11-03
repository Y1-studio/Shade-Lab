const S=ShadeAddons.service('surface-tools'),G=S.Geo,E=S.E,U=S.ui;
const Areas=(()=>{
  const masks=new Map(),minimum=.01;
  const effective=c=>c?.mode!=='book';
  const rectangle=c=>{const [x,y,w,h]=c.rect;return[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];};
  function initial(ball,shape){return{version:1,enabled:false,visible:true,mode:'custom',shape:'rectangle',rect:[.1,.1,.7,.7],polygon:[[.1,.2],[.6,.2],[.7,.5],[.2,.8]],roles:U.roles(ball),positions:Object.fromEntries(Object.entries(E.resolve(ball)).map(([id,c])=>[id,G.point(c,shape)]))};}
  function forEditor(c,ball,shape){return c.mode==='book'?{...E.clone(c),...initial(ball,shape),retiredBook:E.clone(c)}:{...E.clone(c),mode:'custom'};}
  function check(c,ball){
    if(!c||c.version!==1||typeof c.enabled!=='boolean'||typeof c.visible!=='boolean'||!['custom','both'].includes(c.mode)||!['rectangle','polygon'].includes(c.shape))throw Error('Choose a supported custom area.');
    const ids=U.roles(ball);if(!Array.isArray(c.roles)||!c.roles.length||c.roles.some(id=>!ids.includes(id))||new Set(c.roles).size!==c.roles.length)throw Error('Select at least one existing color to constrain.');
    if(c.shape==='rectangle'){if(!Array.isArray(c.rect)||c.rect.length!==4||c.rect.some(v=>!Number.isFinite(v))||c.rect[0]<0||c.rect[1]<0||c.rect[2]<=0||c.rect[3]<=0||c.rect[0]+c.rect[2]>1+G.eps||c.rect[1]+c.rect[3]>1+G.eps)throw Error('Use a rectangle inside the surface with positive width and height.');}
    else G.polygon(c.polygon,32);
    for(const id of c.roles){const p=c.positions?.[id];if(p&&(!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v))))throw Error('Saved area positions are invalid. Recreate the area.');}
  }
  const polygons=c=>[c.shape==='rectangle'?rectangle(c):c.polygon];
  function draw(ctx,{ball,shape}){const c=S.get(ball,'color-areas',shape);if(!c?.visible||!effective(c))return;try{check(c,ball);const polys=polygons(c),key=JSON.stringify([shape,polys]);let mask=masks.get(key);
    if(!mask){mask=document.createElement('canvas');mask.width=mask.height=640;const m=mask.getContext('2d');m.scale(2,2);U.path(m,G.domain(shape),shape,true);m.fillStyle='#101522b0';m.fill();m.save();U.clip(m,shape);for(const poly of polys){U.path(m,poly,shape,true);m.clip();}m.globalCompositeOperation='destination-out';m.fillRect(0,0,320,320);m.restore();if(masks.size>20)masks.clear();masks.set(key,mask);}
    ctx.drawImage(mask,0,0,320,320);ctx.save();U.clip(ctx,shape);ctx.setLineDash(c.enabled?[]:[3,3]);for(const poly of polys)U.stroke(ctx,poly,shape,true,'#ffeea4');ctx.restore();
  }catch{/* Invalid masks never hide the picker. */}}
  return{kind:'area',initial,forEditor,effective,check,rectangle,polygons,minimum,draw,clear:()=>masks.clear()};
})();
