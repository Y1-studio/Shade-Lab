const FilterArrows=(()=>{
  const E=FilterEngine.E;
  function geometry(before,after,shape='square',index=0,ball){const radius=142+(index%3-1)*3,delta=E.wrap(after[0]-before[0]+180)-180,theta=E.wheelAngle(before[0]);return{from:E.pickerPoint(before,shape,ball),to:E.pickerPoint(after,shape,ball),radius,theta,delta,hueDefined:before[1]>1e-7&&after[1]>1e-7};}
  function head(ctx,x,y,angle){ctx.beginPath();ctx.moveTo(x-11*Math.cos(angle-.55),y-11*Math.sin(angle-.55));ctx.lineTo(x,y);ctx.lineTo(x-11*Math.cos(angle+.55),y-11*Math.sin(angle+.55));ctx.stroke();}
  function mark(ctx,p,color,filled){ctx.beginPath();ctx.arc(...p,filled?6:7,0,Math.PI*2);ctx.fillStyle=filled?E.toHex(color):'#101820';ctx.fill();ctx.strokeStyle='#101820';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle=filled?'#67f4e8':'#ffe28a';ctx.lineWidth=2;ctx.stroke();}
  function badge(ctx,p,text,after=false,below=false){ctx.font='bold 11px Segoe UI';const width=ctx.measureText(text).width+12,x=Math.max(4,Math.min(316-width,p[0]+12)),y=Math.max(4,Math.min(299,p[1]+(below?12:-29))),color=after?'#67f4e8':'#ffe28a';ctx.strokeStyle='#101820';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(x,y+(below?0:19));ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=1.3;ctx.stroke();ctx.fillStyle='#101820';ctx.fillRect(x-1,y-1,width+2,21);ctx.fillStyle=color;ctx.fillRect(x,y,width,19);ctx.fillStyle='#101820';ctx.fillText(text,x+6,y+13.5);}
  function endpoints(ctx,a,b,before,after){const same=Math.hypot(b[0]-a[0],b[1]-a[1])<1;if(same){mark(ctx,b,after,true);badge(ctx,b,'Before = After');}else{mark(ctx,a,before,false);mark(ctx,b,after,true);const beforeBelow=b[1]<a[1]-2,afterBelow=Math.abs(b[1]-a[1])>2?!beforeBelow:true;badge(ctx,a,'Before',false,beforeBelow);badge(ctx,b,'After',true,afterBelow);}}
  function draw(ctx,before,after,shape,index=0,ball){const g=geometry(before,after,shape,index,ball),dx=g.to[0]-g.from[0],dy=g.to[1]-g.from[1];
    ctx.save();ctx.setLineDash([]);ctx.lineJoin=ctx.lineCap='round';
    for(const [color,width]of [['#101820',6],['#ffe28a',3]]){ctx.strokeStyle=color;ctx.lineWidth=width;if(Math.hypot(dx,dy)>1){ctx.beginPath();ctx.moveTo(...g.from);ctx.lineTo(...g.to);ctx.stroke();head(ctx,...g.to,Math.atan2(dy,dx));}if(g.hueDefined&&Math.abs(g.delta)>.1){const end=g.theta+g.delta*Math.PI/180;ctx.beginPath();ctx.arc(160,160,g.radius,g.theta,end,g.delta<0);ctx.stroke();head(ctx,160+g.radius*Math.cos(end),160+g.radius*Math.sin(end),end+(g.delta<0?-1:1)*Math.PI/2);}}
    endpoints(ctx,g.from,g.to,before,after);
    if(g.hueDefined){const a=[160+g.radius*Math.cos(g.theta),160+g.radius*Math.sin(g.theta)],end=g.theta+g.delta*Math.PI/180;endpoints(ctx,a,[160+g.radius*Math.cos(end),160+g.radius*Math.sin(end)],before,after);}ctx.restore();return g;
  }
  function display(view){const c=FilterEngine.config(view.ball,view.active);return view.data?.arrows===true&&c?.enabled&&c.opacity>0?{selectedOnly:true,connections:false}:{};}
  function finish(ctx,view){if(view.data?.arrows!==true)return;const {ball,active,shape}=view,c=FilterEngine.config(ball,active);if(!c?.enabled||c.opacity===0)return;const before=E.resolveBefore(ball,ball.strength,FilterEngine.key)[active],after=E.resolve(ball)[active];if(before&&after)draw(ctx,before,after,shape,FilterEngine.roles(ball).indexOf(active),view.surface?ball:undefined);}
  const signed=v=>(v>0?'+':'')+Number(v.toFixed(1));
  function describe(before,after){const g=geometry(before,after);return`${E.toHex(before)} → ${E.toHex(after)} · ΔH ${g.hueDefined?signed(g.delta)+'°':'undefined for gray'} · ΔS ${signed(after[1]-before[1])} pp · ΔL ${signed(after[2]-before[2])} pp`;}
  return{geometry,draw,finish,display,describe};
})();
