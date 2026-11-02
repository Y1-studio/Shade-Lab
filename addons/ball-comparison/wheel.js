const E=globalThis.Shade,R=globalThis.ShadeRender;
const Comparison=(()=>{
  function entries(balls){return balls.flatMap((ball,i)=>Object.entries(E.resolve(ball)).map(([id,color],j)=>({key:ball.id+'/'+id,ball,ballIndex:i,id,color,label:(i+1)+'.'+(id==='base'?'B':j),name:E.roleName(ball,id)})));}
  function symbol(ctx,x,y,index,r){ctx.beginPath();switch(index%4){case 1:ctx.rect(x-r,y-r,r*2,r*2);break;case 2:ctx.moveTo(x,y-r*1.3);ctx.lineTo(x+r*1.3,y);ctx.lineTo(x,y+r*1.3);ctx.lineTo(x-r*1.3,y);ctx.closePath();break;case 3:ctx.moveTo(x,y-r*1.35);ctx.lineTo(x+r*1.2,y+r);ctx.lineTo(x-r*1.2,y+r);ctx.closePath();break;default:ctx.arc(x,y,r,0,Math.PI*2);}}
  function draw(canvas,balls,shape,hidden,selected,guide){
    const all=entries(balls),focus=all.find(p=>p.key===selected)||all[0];if(!focus)return[];
    R.drawWheel(canvas,focus.ball,focus.id,[],shape,guide,{markers:false,tools:false});const ctx=canvas.getContext('2d'),points=[];
    for(const p of all.filter(p=>!hidden.has(p.key)).sort((a,b)=>(a.key===selected)-(b.key===selected))){const a=E.wheelAngle(p.color[0]);for(const [kind,xy]of [['hue',[160+Math.cos(a)*142,160+Math.sin(a)*142]],['plane',E.pickerPoint(p.color,shape)]]){
      symbol(ctx,...xy,p.ballIndex,p.key===selected?6:4.5);ctx.fillStyle=E.toHex(p.color);ctx.fill();ctx.strokeStyle='#0d1015';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='#ffffff';ctx.lineWidth=p.key===selected?1.6:.8;ctx.stroke();
      if(p.key===selected){ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#10151f';ctx.strokeText(p.label,xy[0],xy[1]-10);ctx.fillStyle='#fff';ctx.fillText(p.label,xy[0],xy[1]-10);}
      points.push({...p,kind,x:xy[0],y:xy[1]});
    }}return points;
  }
  function difference(color,base){return [E.wrap(color[0]-base[0]+180)-180,color[1]-base[1],color[2]-base[2]];}
  return{entries,draw,difference};
})();
