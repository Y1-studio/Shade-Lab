function lineControls(api){U.editor(api,{...Line,title:'Line guide',prepare:true,help:'Drag Highlight and Shadow independently along the line. Drag the anchor or line body to move the group. Points stop at the boundary and respond as soon as you drag back. Angles wrap through 0°.',
  fields(f){const c=f.config,options=U.roles(f.ball).map(id=>[id,E.roleName(f.ball,id)]);
    f.select('anchor','Anchor',()=>c.anchor,options,v=>{const pts=Line.points(c),origin=pts[v]||G.point(E.resolve(f.ball)[v],f.shape);c.origin=origin;c.anchor=v;c.distances=Object.fromEntries(Object.entries(pts).filter(([id])=>id!==v).map(([id,p])=>[id,Line.distance(c,p)]));});
    f.number('x','Anchor X',()=>c.origin[0],v=>c.origin[0]=v,0,1,.1);f.number('y','Anchor Y (up)',()=>c.origin[1],v=>c.origin[1]=v,0,1,.1);f.number('angle','Angle (degrees)',()=>c.angle,v=>c.angle=v,null,null,1,true);
    for(const [id,name]of options)if(id!==c.anchor){f.check('role-'+id,'Attach '+name,()=>Object.hasOwn(c.distances,id),on=>{if(on)c.distances[id]=0;else delete c.distances[id];});f.number('distance-'+id,name+' signed distance',()=>c.distances[id]??0,v=>{c.distances[id]=v;},-2,2,.1);}
    f.note('Solid cyan portions are allowed for the selected color; dashed red portions are blocked by its area. Signed distances are independent and use the surface width. A guide-only line follows its anchor color.');
  },
  beginDrag(c,start,shape){return Line.hit(c,G.canvas(start,shape),shape)?'anchor':null;}
});}
