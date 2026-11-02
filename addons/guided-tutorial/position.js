const TourPosition=(()=>{
 const clamp=(v,a,b)=>Math.max(a,Math.min(Math.max(a,b),v));
 function target(elements,part,shape){
  const rects=elements.map(el=>{
   const box=el.getBoundingClientRect(),area=part==='plane'?(shape==='square'?[84,84,236,236]:[99,62,248,258]):[0,0,320,320],r={left:box.left+box.width*area[0]/320,right:box.left+box.width*area[2]/320,top:box.top+box.height*area[1]/320,bottom:box.top+box.height*area[3]/320};
   for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(s.overflowX)){r.left=Math.max(r.left,b.left+p.clientLeft);r.right=Math.min(r.right,b.left+p.clientLeft+p.clientWidth);}if(/auto|scroll|hidden|clip/.test(s.overflowY)){r.top=Math.max(r.top,b.top+p.clientTop);r.bottom=Math.min(r.bottom,b.top+p.clientTop+p.clientHeight);}}
   return {...r,width:r.right-r.left,height:r.bottom-r.top};
  }).filter(r=>r.width>0&&r.height>0);if(!rects.length)return null;
  let r={left:Math.min(...rects.map(r=>r.left)),top:Math.min(...rects.map(r=>r.top)),right:Math.max(...rects.map(r=>r.right)),bottom:Math.max(...rects.map(r=>r.bottom))};
  r.left=clamp(r.left-6,6,innerWidth-6);r.right=clamp(r.right+6,6,innerWidth-6);r.top=clamp(r.top-6,6,innerHeight-6);r.bottom=clamp(r.bottom+6,6,innerHeight-6);
  return {...r,width:Math.max(0,r.right-r.left),height:Math.max(0,r.bottom-r.top)};
 }
 function panel(r,width,height){
  const margin=12,gap=16,w=Math.min(width,innerWidth-margin*2),h=Math.min(height,innerHeight-margin*2);
  if(!r)return{x:innerWidth-w-margin,y:innerHeight-h-margin};
  const candidates=[[r.right+gap,r.top],[r.left-w-gap,r.top],[r.left,r.bottom+gap],[r.left,r.top-h-gap]];
  return candidates.map(([x,y],i)=>{x=clamp(x,margin,innerWidth-w-margin);y=clamp(y,margin,innerHeight-h-margin);const overlap=Math.max(0,Math.min(x+w,r.right)-Math.max(x,r.left))*Math.max(0,Math.min(y+h,r.bottom)-Math.max(y,r.top));return{x,y,overlap,score:overlap+i*.01};}).sort((a,b)=>a.score-b.score)[0];
 }
 return{target,panel};
})();
