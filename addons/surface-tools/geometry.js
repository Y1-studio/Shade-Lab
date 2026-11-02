const Geo = (() => {
  const E=globalThis.Shade, eps=1e-7;
  const add=(a,b)=>a.map((x,i)=>x+b[i]), sub=(a,b)=>a.map((x,i)=>x-b[i]), mul=(a,k)=>a.map(x=>x*k), dot=(a,b)=>a[0]*b[0]+a[1]*b[1], cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
  const point=(c,shape)=>shape==='square'?[c[1]/100,c[2]/100]:[(1-Math.abs(2*c[2]/100-1))*c[1]/100,c[2]/100];
  const clean=v=>v>=-1e-5&&v<=100+1e-5?Math.max(0,Math.min(100,v)):v;
  const color=(p,h,shape)=>[E.wrap(h),clean(shape==='square'?p[0]*100:(1-Math.abs(2*p[1]-1))>eps?p[0]/(1-Math.abs(2*p[1]-1))*100:0),clean(p[1]*100)];
  const domain=shape=>shape==='square'?[[0,0],[1,0],[1,1],[0,1]]:[[0,0],[1,.5],[0,1]];
  const canvas=(p,shape)=>shape==='square'?[84+152*p[0],236-152*p[1]]:[99+149*p[0],258-196*p[1]];
  const uncanvas=(p,shape)=>shape==='square'?[(p[0]-84)/152,(236-p[1])/152]:[(p[0]-99)/149,(258-p[1])/196];
  const project=(p,a,b)=>{const d=sub(b,a),t=Math.max(0,Math.min(1,dot(sub(p,a),d)/(dot(d,d)||1)));return add(a,mul(d,t));};
  function inside(p,poly){let yes=false;const x=p[0],y=p[1];for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[j],b=poly[i],dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy,t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(length||1))),qx=x-a[0]-t*dx,qy=y-a[1]-t*dy;if(qx*qx+qy*qy<eps*eps)return true;if((a[1]>y)!==(b[1]>y)&&x<dx*(y-a[1])/dy+a[0])yes=!yes;}return yes;}
  function intersections(a,b,poly){const dx=b[0]-a[0],dy=b[1]-a[1],ts=[];for(let i=0;i<poly.length;i++){const c=poly[i],next=poly[(i+1)%poly.length],ex=next[0]-c[0],ey=next[1]-c[1],den=dx*ey-dy*ex;if(Math.abs(den)<1e-12)continue;const cx=c[0]-a[0],cy=c[1]-a[1],t=(cx*ey-cy*ex)/den,u=(cx*dy-cy*dx)/den;if(t>0&&t<1&&u>=-eps&&u<=1+eps)ts.push(t);}return ts;}
  function segment(a,b,polys){const ts=[0,1,...polys.flatMap(poly=>intersections(a,b,poly))].sort((x,y)=>x-y),valid=p=>polys.every(poly=>inside(p,poly));if(!valid(a))return 0;for(let i=1;i<ts.length;i++){if(!valid(add(a,mul(sub(b,a),(ts[i-1]+ts[i])/2))))return Math.max(0,ts[i-1]-eps);}return valid(b)?1:Math.max(0,ts.at(-2)-eps);}
  // Follow a non-linear display gesture through the same geometric restrictions.
  function follow(curve,polys){const pieces=[],start=curve(0),end=curve(1);function split(lo,hi,a,b,depth=0){const mid=(lo+hi)/2,p=curve(mid);if(depth<16&&Math.hypot(...sub(p,mul(add(a,b),.5)))>1e-6){split(lo,mid,a,p,depth+1);split(mid,hi,p,b,depth+1);}else pieces.push({t:hi,p:b});}split(0,1,start,end);let point=start,t=0;for(const next of pieces){const f=segment(point,next.p,polys);if(f<1)return{point:add(point,mul(sub(next.p,point),f)),fraction:t+(next.t-t)*f};point=next.p;t=next.t;}return{point,fraction:1};}
  function candidates(p,polys){const result=[p];for(const poly of polys)for(let i=0;i<poly.length;i++){result.push(poly[i],project(p,poly[i],poly[(i+1)%poly.length]));}for(let k=0;k<polys.length;k++)for(let j=k+1;j<polys.length;j++)for(let i=0;i<polys[k].length;i++){const a=polys[k][i],b=polys[k][(i+1)%polys[k].length];for(const t of intersections(a,b,polys[j]))result.push(add(a,mul(sub(b,a),t)));}return result;}
  function closest(p,polys){if(polys.every(poly=>inside(p,poly)))return p;let best=null,distance=Infinity;const consider=q=>{const d=(q[0]-p[0])**2+(q[1]-p[1])**2;if(d<distance&&(polys.length===1||polys.every(poly=>inside(q,poly)))){best=q;distance=d;}};for(const poly of polys)for(let i=0;i<poly.length;i++){if(polys.length>1)consider(poly[i]);consider(project(p,poly[i],poly[(i+1)%poly.length]));}for(let k=0;k<polys.length;k++)for(let j=k+1;j<polys.length;j++)for(let i=0;i<polys[k].length;i++){const a=polys[k][i],b=polys[k][(i+1)%polys[k].length];for(const t of intersections(a,b,polys[j]))consider(add(a,mul(sub(b,a),t)));}if(!best)throw Error('The allowed areas have no usable intersection.');return best;}
  function polygon(poly,max=128){if(!Array.isArray(poly)||poly.length<3||poly.length>max||poly.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)||v<0||v>1)))throw Error('Use 3–'+max+' vertices with coordinates from 0 to 1.');let area=0;for(let i=0;i<poly.length;i++){area+=cross(poly[i],poly[(i+1)%poly.length]);for(let j=i+2;j<poly.length;j++){if(i===0&&j===poly.length-1)continue;if(intersections(poly[i],poly[(i+1)%poly.length],[poly[j],poly[(j+1)%poly.length]]).length)throw Error('Polygon edges must not cross.');}}if(Math.abs(area)<1e-7)throw Error('The area must have nonzero size.');return poly;}
  function hsv(c){const s=c[1]/100,l=c[2]/100,v=l+s*Math.min(l,1-l);return[v?2*(1-l/v):0,v];}
  function fromHSV(p,h=0){const [s,v]=p,l=v*(1-s/2);return[h,l>0&&l<1?(v-l)/Math.min(l,1-l)*100:0,l*100];}
  function mapped(poly,fn,tolerance=1e-5){const result=[];function edge(a,b,pa,pb,depth=0){const m=mul(add(a,b),.5),pm=fn(m);if(depth<12&&Math.hypot(...sub(pm,mul(add(pa,pb),.5)))>tolerance){edge(a,m,pa,pm,depth+1);edge(m,b,pm,pb,depth+1);}else result.push(pa);}for(let i=0;i<poly.length;i++)edge(poly[i],poly[(i+1)%poly.length],fn(poly[i]),fn(poly[(i+1)%poly.length]));return result;}
  const rotate=(p,angle)=>{const a=angle*Math.PI/180;return[p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a)];};
  const aspect=shape=>shape==='triangle'?196/149:1;
  const rotateVisual=(p,angle,shape)=>{const a=aspect(shape),r=rotate([p[0],p[1]*a],angle);return[r[0],r[1]/a];};
  // Intersect an infinite visual line with every allowed polygon, including concave areas.
  function lineIntervals(origin,dir,polys){const a=sub(origin,mul(dir,4)),b=add(origin,mul(dir,4)),ts=[0,1,...polys.flatMap(poly=>intersections(a,b,poly))].sort((x,y)=>x-y),valid=t=>polys.every(poly=>inside(add(a,mul(sub(b,a),t)),poly)),out=[];
    for(let i=1;i<ts.length;i++)if(valid((ts[i-1]+ts[i])/2))out.push([ts[i-1]*8-4,ts[i]*8-4]);
    for(const t of ts)if(valid(t))out.push([t*8-4,t*8-4]);return out;
  }
  function lineDistance(origin,dir,polys,desired){const intervals=lineIntervals(origin,dir,polys);if(!intervals.length)throw Error('The line has no intersection with the allowed area.');return intervals.map(([lo,hi])=>Math.max(lo,Math.min(hi,desired))).sort((a,b)=>Math.abs(a-desired)-Math.abs(b-desired))[0];}
  return {eps,add,sub,mul,dot,cross,point,color,domain,canvas,uncanvas,project,inside,intersections,segment,follow,candidates,closest,polygon,hsv,fromHSV,mapped,rotate,aspect,rotateVisual,lineIntervals,lineDistance};
})();
