function layoutControls(api){U.editor(api,{...Layout,title:'Point layouts',help:'Drag a handle or the pattern to move it as a group. Edit lengths, angle, and scale below. Custom layouts let you set each color’s offset. Applying a constrained layout disables the constrained line for this surface.',
  fields(f){const c=f.config,options=U.roles(f.ball).map(id=>[id,E.roleName(f.ball,id)]);
    f.select('pattern','Shape',c.pattern,[['triangle','Triangle'],['L','L shape'],['custom','Custom offsets']],v=>c.pattern=v);
    f.select('anchor','Anchor',c.anchor,options,v=>{const points=Layout.points(c);c.assignments=c.assignments.filter(id=>id!==v);if(c.anchor!==v)c.assignments.unshift(c.anchor);c.anchor=v;c.origin=points[v]||G.point(E.resolve(f.ball)[v],f.shape);if(c.pattern!=='custom')c.assignments=c.assignments.slice(0,2);});
    f.number('x','Anchor X',c.origin[0],v=>c.origin[0]=v,0,1);f.number('y','Anchor Y (up)',c.origin[1],v=>c.origin[1]=v,0,1);
    f.number('angle','Rotation (degrees)',c.angle,v=>c.angle=v,-360,360);f.number('scale','Scale',c.scale,v=>c.scale=v,.01,10);
    if(c.pattern!=='custom'){
      for(let i=0;i<2;i++)f.select('role-'+i,'Handle '+(i+1),c.assignments[i],options.filter(([id])=>id!==c.anchor),v=>c.assignments[i]=v);
      f.number('arm-a','Anchor → handle 1 distance',c.armA,v=>c.armA=v,.001,2);f.number('arm-b','Anchor → handle 2 distance',c.armB,v=>c.armB=v,.001,2);
      if(c.pattern==='triangle')f.number('opening','Angle between arms',c.opening,v=>c.opening=v,1,179);
    }else{
      for(const [id,name]of options)if(id!==c.anchor){f.check('role-'+id,'Attach '+name,c.assignments.includes(id),on=>{c.assignments=c.assignments.filter(x=>x!==id);if(on){c.assignments.push(id);c.offsets[id]??=[.1,.1];}});c.offsets[id]??=[.1,.1];f.number('dx-'+id,name+' offset X',c.offsets[id][0],v=>c.offsets[id][0]=v);f.number('dy-'+id,name+' offset Y',c.offsets[id][1],v=>c.offsets[id][1]=v);}
    }
    f.note('Coordinates use the full surface width and height, from 0 to 1. Invalid sizes keep the last preview and cannot be applied. Fit position translates the whole layout without changing distances.');
  },
  drag(c,start,ball,shape){const points=Object.values(Layout.points(c));if(!points.some(p=>Math.hypot(...G.sub(p,start))<.08)&&!G.inside(start,points))return null;return end=>{const next=E.clone(c);next.origin=G.add(c.origin,G.sub(end,start));return next;};}
});}
