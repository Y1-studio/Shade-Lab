(function(root){
'use strict';
const E=root.Shade;
let sphereLayer=null;
const tinted=new Map();let tintedPixels=0;
// One geometry definition drives both the built-in renderer and editable masks.
const sphereShapes=kind=>kind==='cel'?
 [{role:'shadow',ellipse:null,blur:false},{role:'base',ellipse:[.32,.28,.57,.61]},{role:'highlight',ellipse:[.14,.08,.32,.33]}]:
 [{role:'shadow',ellipse:null,blur:false},{role:'rim',ellipse:[.83,.38,.65,.72]},{role:'base',ellipse:[.88,.35,.64,.70]},{role:'bounce',ellipse:[.12,.87,.29,.27]},{role:'highlight',ellipse:[.70,.12,.20,.17]}];
function paintSphereShape(ctx,d,shape){if(shape.ellipse){ctx.beginPath();ctx.ellipse(...shape.ellipse.map(v=>v*d),0,0,Math.PI*2);ctx.fill();}else ctx.fillRect(0,0,d,d);}
function layerSource(layer,color,scale){
 const img=root.ShadeAssets.image(layer.assetId);if(!img)throw Error('A layer PNG has not loaded.');
 if(layer.kind==='overlay')return img;
 const ratio=Math.min(1,Math.max(layer.width*scale/img.naturalWidth,layer.height*scale/img.naturalHeight)),w=Math.max(1,Math.ceil(img.naturalWidth*ratio)),h=Math.max(1,Math.ceil(img.naturalHeight*ratio));
 const key=layer.assetId+'/'+color+'/'+w+'/'+h;
 if(tinted.has(key)){const hit=tinted.get(key);tinted.delete(key);tinted.set(key,hit);return hit;}
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const c=canvas.getContext('2d');c.drawImage(img,0,0,w,h);c.globalCompositeOperation='source-in';c.fillStyle=color;c.fillRect(0,0,w,h);c.globalCompositeOperation='source-over';
 while(tinted.size&&(tintedPixels+w*h>8*1024*1024||tinted.size>=128)){const first=tinted.keys().next().value,old=tinted.get(first);tintedPixels-=old.width*old.height;old.width=old.height=0;tinted.delete(first);}
 if(w*h<=8*1024*1024){tinted.set(key,canvas);tintedPixels+=w*h;}return canvas;
}
function designCanvas(ctx,x,y,w,h,ball,colors){
 const d=ball.design,scale=Math.min(w/d.width,h/d.height),ox=x+(w-d.width*scale)/2,oy=y+(h-d.height*scale)/2;
 ctx.save();ctx.beginPath();ctx.rect(ox,oy,d.width*scale,d.height*scale);ctx.clip();
 for(const l of d.layers){if(!l.visible||!l.opacity)continue;const src=layerSource(l,E.toHex(colors[l.role]||colors.base),scale);ctx.save();ctx.translate(ox+l.x*scale,oy+l.y*scale);ctx.rotate(l.rotation*Math.PI/180);ctx.scale(l.flipX?-1:1,l.flipY?-1:1);ctx.globalAlpha=l.opacity;
  if(l.clip==='ellipse'){ctx.beginPath();ctx.ellipse(0,0,l.width*scale/2,l.height*scale/2,0,0,Math.PI*2);ctx.clip();}
  ctx.filter=ball.softness&&l.kind==='mask'&&l.blur!==false?`blur(${ball.softness/100*Math.min(w,h)*.045}px)`:'none';ctx.drawImage(src,-l.width*scale/2,-l.height*scale/2,l.width*scale,l.height*scale);ctx.restore();}
 ctx.restore();return{scale,x:ox,y:oy};
}
function sphere(ctx,x,y,d,ball,colors){
 if(ball.mode==='custom'&&ball.design){designCanvas(ctx,x,y,d,d,ball,colors);return;}
 // Reuse one scratch surface; repeated slider edits used to allocate a canvas
 // for every sphere on every pointer event, including all unchanged balls.
 const layer=sphereLayer||(sphereLayer=document.createElement('canvas')),side=Math.ceil(d);
 if(layer.width!==side||layer.height!==side){layer.width=side;layer.height=side;}
 const p=layer.getContext('2d');p.filter='none';p.clearRect(0,0,side,side);
 for(const shape of sphereShapes(ball.mode)){p.fillStyle=E.toHex(colors[shape.role]||colors.base);p.filter=ball.softness&&shape.blur!==false?`blur(${ball.softness/100*d*.045}px)`:'none';paintSphereShape(p,d,shape);}
 ctx.save();ctx.beginPath();ctx.arc(x+d/2,y+d/2,d/2,0,Math.PI*2);ctx.clip();ctx.drawImage(layer,x,y,d,d);ctx.restore();
}
function grayscaleCanvas(canvas){const c=canvas.getContext('2d'),image=c.getImageData(0,0,canvas.width,canvas.height),d=image.data;for(let i=0;i<d.length;i+=4){const gray=E.grayscaleByte(d[i],d[i+1],d[i+2]);d[i]=d[i+1]=d[i+2]=gray;}c.putImageData(image,0,0);}
function ballFrame(w,h,ball){const x=w*.08,y=h*.06,width=w*.84,height=h*.88;if(ball.mode==='custom'){const scale=Math.min(width/ball.design.width,height/ball.design.height),ww=ball.design.width*scale,hh=ball.design.height*scale;return{x:x+(width-ww)/2,y:y+(height-hh)/2,width:ww,height:hh};}const d=Math.min(width,height);return{x:x+(width-d)/2,y:y+(height-d)/2,width:d,height:d};}
function paintBall(ctx,view,options={}){const {ball,x,y,width,height}=view;let frame;if(ball.mode==='custom'){const scale=Math.min(width/ball.design.width,height/ball.design.height),ww=ball.design.width*scale,hh=ball.design.height*scale;frame={x:x+(width-ww)/2,y:y+(height-hh)/2,width:ww,height:hh};}else{const d=Math.min(width,height);frame={x:x+(width-d)/2,y:y+(height-d)/2,width:d,height:d};}const fitted={...view,...frame},paint=v=>{if(v.ball.mode==='custom')designCanvas(ctx,v.x,v.y,v.width,v.height,v.ball,v.colors);else sphere(ctx,v.x,v.y,v.width,v.ball,v.colors);};if(options.tools!==false&&root.ShadeAddons?.paintBall(ctx,fitted,paint))return;paint(fitted);}

function ballCanvas(canvas,ball,strength=ball.strength,options={}){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);paintBall(c,{ball,colors:E.resolve(ball,strength),strength,x:w*.08,y:h*.06,width:w*.84,height:h*.88},options);if(ball.grayscale)grayscaleCanvas(canvas);if(options.background!==false){c.save();c.globalCompositeOperation='destination-over';root.ShadeAddons?.drawBallBackdrop(c,{ball,strength,x:0,y:0,width:w,height:h});c.restore();}}

// Hit the same geometry used for painting, rather than guessing by displayed RGB.
// This remains unambiguous for grayscale, filtered colors and overlapping masks.
function ballHit(ball,w,h,x,y){
 const f=ballFrame(w,h,ball),px=(x-f.x)/f.width,py=(y-f.y)/f.height;
 if(px<0||px>1||py<0||py>1)return null;
 if(ball.mode!=='custom'){
  if(Math.hypot(px-.5,py-.5)>.5)return null;
  for(const shape of [...sphereShapes(ball.mode)].reverse()){
   if(!shape.ellipse)return shape.role;
   const [cx,cy,rx,ry]=shape.ellipse;if(((px-cx)/rx)**2+((py-cy)/ry)**2<=1)return shape.role;
  }
  return null;
 }
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');
 for(const layer of [...ball.design.layers].reverse()){
  if(layer.kind!=='mask'||!layer.visible||!layer.opacity||!['base',...ball.roles.map(r=>r.id)].includes(layer.role))continue;
  ctx.clearRect(0,0,w,h);
  designCanvas(ctx,f.x,f.y,f.width,f.height,{...ball,softness:0,design:{...ball.design,layers:[layer]}},{[layer.role]:'#ffffff'});
  if(ctx.getImageData(Math.min(w-1,Math.max(0,Math.floor(x))),Math.min(h-1,Math.max(0,Math.floor(y))),1,1).data[3]>16)return layer.role;
 }
 return null;
}

const pickerRasters=new Map();
function pickerRaster(hue,shape){
 const cached=pickerRasters.get(shape);if(cached?.hue===hue)return cached.canvas;
 const canvas=document.createElement('canvas');canvas.width=320;canvas.height=320;
 const ctx=canvas.getContext('2d'),img=ctx.createImageData(320,320);
 for(let y=62;y<=258;y++)for(let x=84;x<=248;x++)if(E.pickerContains(x,y,shape)){const rgb=E.hslRgb(E.pickerColor(x,y,hue,shape));img.data.set([...rgb,255],(y*320+x)*4);}
 ctx.putImageData(img,0,0);pickerRasters.set(shape,{hue,canvas});return canvas;
}
function drawWheel(canvas,ball,active,analysisIds,shape='triangle',guide=null,options={}){
 const ctx=canvas.getContext('2d');ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,320,320);
 const colors=options.colors||E.resolve(ball),h=colors[active]?.[0]??ball.base[0],surface=options.tools!==false&&options.surface!==false?E.pickerSurface(ball,shape):null,point=color=>E.pickerPoint(color,shape,surface?ball:undefined);
 for(let degree=0;degree<360;degree++){ctx.beginPath();ctx.arc(160,160,142,E.wheelAngle(degree),E.wheelAngle(degree+1.4));ctx.lineWidth=19;ctx.strokeStyle=E.toHex([degree,100,50]);ctx.stroke();}
 // Match the geometric surface exactly; the raster's inclusive edge pixels
 // otherwise extend beyond add-on masks and leave an uncovered bright strip.
 if(surface)surface.draw(ctx,{ball,colors,active,hue:h,shape});else{ctx.save();ctx.beginPath();
 if(shape==='square')ctx.rect(84,84,152,152);else{ctx.moveTo(99,62);ctx.lineTo(248,160);ctx.lineTo(99,258);ctx.closePath();}
 ctx.clip();ctx.drawImage(pickerRaster(h,shape),0,0);ctx.restore();}
 if(guide?.visible){
  // Fixed RGB/HSL guide: yellow-green at 90 degrees, opposite boundary at 270.
  const a=E.wheelPoint(90,154),b=E.wheelPoint(270,154);
  ctx.save();ctx.beginPath();ctx.rect(0,0,320,320);
  if(shape==='square')ctx.rect(79,79,162,162);else{ctx.moveTo(94,57);ctx.lineTo(254,160);ctx.lineTo(94,263);ctx.closePath();}ctx.clip('evenodd');
  ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.strokeStyle='#000b';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();ctx.restore();
 }
 const display=options.tools!==false?root.ShadeAddons?.pickerDisplay({ball,colors,active,shape})||{}:{};const selected=(options.connections===false||display.connections===false?[]:analysisIds).filter(id=>colors[id]),fit=E.fitLine(selected.map(id=>[colors[id][1],colors[id][2]]));
 ctx.lineWidth=1.3;ctx.strokeStyle='#ffffff90';ctx.beginPath();selected.forEach((id,i)=>{const p=point(colors[id]);i?ctx.lineTo(...p):ctx.moveTo(...p);});ctx.stroke();
 if(fit){ctx.save();ctx.setLineDash([3,4]);ctx.strokeStyle='#a8f7d9';ctx.beginPath();let started=false;for(let i=0;i<=200;i++){let s,l;if(fit.vertical!==undefined){s=fit.vertical;l=i/2;}else{s=i/2;l=fit.m*s+fit.b;}if(l<0||l>100){started=false;continue;}const p=point([h,s,l]);started?ctx.lineTo(...p):ctx.moveTo(...p);started=true;}ctx.stroke();ctx.restore();}
 if(options.tools!==false){ctx.save();if(surface?.exclusive){ctx.beginPath();ctx.rect(0,0,320,320);ctx.rect(82,82,156,156);ctx.clip('evenodd');}root.ShadeAddons?.drawPicker(ctx,{ball,colors,active,shape,surface});ctx.restore();}
 const markers=[];
 if(options.markers===false){if(options.tools!==false)root.ShadeAddons?.finishPicker(ctx,{ball,colors,active,shape,surface});return markers;}
 // Draw the selected role last; overlapping points remain selectable by the region menu.
 const entries=Object.entries(colors).map(([id,color],i)=>({id,color,i})).sort((a,b)=>(a.id===active)-(b.id===active));
 for(const {id,color,i}of entries){if((options.selectedOnly||display.selectedOnly)&&id!==active)continue;const r=142+(i%3-1)*3,wp=E.wheelPoint(color[0],r),tp=point(color);for(const [kind,p]of [['hue',wp],['plane',tp]]){ctx.beginPath();ctx.arc(...p,id===active?6:4.5,0,Math.PI*2);ctx.fillStyle=E.toHex(color);ctx.fill();ctx.strokeStyle='#0d1015';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle=id===active?'#ffffff':'#ffffffb0';ctx.lineWidth=1.5;ctx.stroke();markers.push({id,kind,x:p[0],y:p[1]});}}
 if(options.tools!==false)root.ShadeAddons?.finishPicker(ctx,{ball,colors,active,shape,surface});
 return markers;
}
function graph(canvas,ball,ids){const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);const left=64,top=20,pw=w-88,ph=h-66;ctx.font='24px Segoe UI';ctx.lineWidth=1;for(let t=0;t<=100;t+=25){const x=left+pw*t/100,y=top+ph*(1-t/100);ctx.strokeStyle='#37404d';ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,top+ph);ctx.moveTo(left,y);ctx.lineTo(left+pw,y);ctx.stroke();ctx.fillStyle='#a6b2c1';ctx.fillText(String(t),x-12,h-14);ctx.fillText(String(t),8,y+8);}const colors=E.resolve(ball),list=ids.filter(id=>colors[id]),fit=E.fitLine(list.map(id=>[colors[id][1],colors[id][2]]));const point=([_,s,l])=>[left+pw*s/100,top+ph*(1-l/100)];ctx.save();ctx.beginPath();ctx.rect(left,top,pw,ph);ctx.clip();if(fit){ctx.beginPath();if(fit.vertical!==undefined){ctx.moveTo(left+pw*fit.vertical/100,top);ctx.lineTo(left+pw*fit.vertical/100,top+ph);}else{ctx.moveTo(left,top+ph*(1-fit.b/100));ctx.lineTo(left+pw,top+ph*(1-(100*fit.m+fit.b)/100));}ctx.strokeStyle='#80ddbe';ctx.lineWidth=3;ctx.setLineDash([6,6]);ctx.stroke();ctx.setLineDash([]);}ctx.strokeStyle='#bec5ce80';ctx.lineWidth=2;ctx.beginPath();list.forEach((id,i)=>{const p=point(colors[id]);i?ctx.lineTo(...p):ctx.moveTo(...p);});ctx.stroke();ctx.restore();for(const id of list){ctx.beginPath();ctx.arc(...point(colors[id]),6,0,Math.PI*2);ctx.fillStyle=E.toHex(colors[id]);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();}return fit;}
function exportCanvas(balls,kind,width,background,labels,samples=[],viewGrayscale=false){
 if(!Number.isFinite(width)||width<1||width>4096)throw Error('Choose an image width from 1024 to 4096.');
 if(!balls.length&&!samples.length)throw Error('Select at least one ball to export.');
 const cols=Math.min(3,Math.max(1,balls.length)),cell=width/cols,pad=cell*.08,ballD=cell*.66;
 const maxRoles=Math.max(1,...balls.map(b=>b.roles.length+1));
 const stripHeight=labels?Math.max(cell*.30,Math.ceil(maxRoles/4)*cell*.17):cell*.12;
 const rowHeight=cell*.13+(kind!=='strips'?cell*.76:0)+(kind!=='balls'?stripHeight:0);
 const rows=Math.ceil(balls.length/cols),height=Math.max(1,Math.ceil(samples.length?width*.26:rows*rowHeight));
 if(height>32767||width*height>64*1024*1024)throw Error('This image is too large. Choose a smaller width or fewer balls.');
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d');
 if(background!=='transparent'){c.fillStyle=background==='white'?'#fff':'#161b22';c.fillRect(0,0,width,canvas.height);}const ink=background==='dark'?'#edf2f4':'#172129';
 const text=(s,x,y,size,max)=>{c.fillStyle=ink;c.font=`${size}px Segoe UI`;c.fillText(s,x,y,max);};
 if(samples.length){const sw=width/samples.length;for(let i=0;i<samples.length;i++){c.fillStyle=E.toHex(samples[i]);c.fillRect(i*sw,0,sw,width*.16);if(labels){text(String(i+1),i*sw+8,width*.195,width*.025,sw-10);text(E.toHex(samples[i]),i*sw+8,width*.23,width*.02,sw-10);}}return canvas;}
 balls.forEach((ball,i)=>{const x=(i%cols)*cell,y=Math.floor(i/cols)*rowHeight,colors=E.resolve(ball),gray=viewGrayscale&&ball.grayscale;if(kind!=='strips')root.ShadeAddons?.drawBallBackdrop(c,{ball,strength:ball.strength,x:x+pad,y:y+cell*.11,width:cell-pad*2,height:cell*.70});if(labels)text(ball.name,x+pad,y+cell*.07,cell*.04,cell-pad*2);let sy=y+cell*.11;if(kind!=='strips'){
  if(gray){const tmp=document.createElement('canvas');tmp.width=tmp.height=Math.ceil(ballD);paintBall(tmp.getContext('2d'),{ball,colors,strength:ball.strength,x:0,y:0,width:ballD,height:ballD});grayscaleCanvas(tmp);c.drawImage(tmp,x+(cell-ballD)/2,sy);tmp.width=tmp.height=0;}else paintBall(c,{ball,colors,strength:ball.strength,x:x+(cell-ballD)/2,y:sy,width:ballD,height:ballD});
  sy+=cell*.73;
 }if(kind!=='balls'){const entries=Object.entries(colors),per=labels?Math.min(4,entries.length):entries.length,sw=(cell-pad*2)/per;entries.forEach(([id,color],j)=>{const xx=x+pad+(j%per)*sw,yy=sy+Math.floor(j/per)*cell*.17;c.fillStyle=gray?E.grayscaleHex(color):E.toHex(color);c.fillRect(xx,yy,sw-2,cell*.07);if(labels){text(E.roleName(ball,id),xx,yy+cell*.105,cell*.026,sw-4);text(E.toHex(color),xx,yy+cell*.14,cell*.024,sw-4);}});}});return canvas;
}
root.ShadeRender={sphere,ballCanvas,ballFrame,ballHit,paintBall,designCanvas,drawWheel,graph,exportCanvas,sphereShapes,paintSphereShape};
})(globalThis);
