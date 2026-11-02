const FilterSplit=(()=>{
  const E=globalThis.Shade;
  function polygon({x,y,width,height},split=.5,angle=0){
    const corners=[[x,y],[x+width,y],[x+width,y+height],[x,y+height]];
    if(split<=0)return [];if(split>=1)return corners;
    const radians=E.wrap(angle)*Math.PI/180,nx=Math.cos(radians),ny=Math.sin(radians),dots=corners.map(([a,b])=>a*nx+b*ny),cut=Math.min(...dots)+split*(Math.max(...dots)-Math.min(...dots)),inside=p=>p[0]*nx+p[1]*ny-cut;
    const out=[];for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4],da=inside(a),db=inside(b);if(da<=1e-8)out.push(a);if((da<0&&db>0)||(da>0&&db<0)){const t=da/(da-db);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}return out;
  }
  function clip(ctx,frame,split,angle){const points=polygon(frame,split,angle);ctx.beginPath();if(points.length){ctx.moveTo(...points[0]);points.slice(1).forEach(p=>ctx.lineTo(...p));ctx.closePath();}ctx.clip();}
  function check(c){if(!c||typeof c.visible!=='boolean'||!Number.isFinite(c.split)||c.split<0||c.split>1||!Number.isFinite(c.angle)||c.angle<0||c.angle>=360||!Array.isArray(c.roles)||c.roles.some(id=>typeof id!=='string'))throw Error('Invalid saved filter comparison split or angle.');}
  function paint(ctx,view,draw){const c=view.ball.addons?.[FilterEngine.key]?.comparison;if(!c?.visible)return false;try{FilterEngine.check(view.ball);check(c);}catch{return false;}
    const before=E.clone(view.ball);for(const id of c.roles)if(before.addons?.[FilterEngine.key]?.roles)delete before.addons[FilterEngine.key].roles[id];
    ctx.save();clip(ctx,view,c.split,c.angle);draw({...view,ball:before,colors:E.resolve(before,view.strength)});ctx.restore();ctx.save();clip(ctx,view,1-c.split,E.wrap(c.angle+180));draw(view);ctx.restore();return true;
  }
  return{polygon,clip,check,paint};
})();
