// Native HSV square: the original reference's raster, cubic path and mask styles.
// Never map this drawing into HSL; only color storage uses HSL conversion.
const ReferenceSquare=(()=>{
  const rasters=new Map(),tiles=new Map(),key='hue-color-limits';
  function config(ball){const shape=S.state(ball)?.active||'square';return S.get(ball,key,shape)||S.get(ball,key,'square');}
  function rgb(h,s,v){const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;const a=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return a.map(z=>Math.round((z+m)*255));}
  function raster(hue){let canvas=rasters.get(hue);if(canvas){rasters.delete(hue);rasters.set(hue,canvas);return canvas;}canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d'),image=ctx.createImageData(256,256),pixels=image.data,k=1-Math.abs((hue/60)%2-1),pure=hue<60?[1,k,0]:hue<120?[k,1,0]:hue<180?[0,1,k]:hue<240?[0,k,1]:hue<300?[k,0,1]:[1,0,k];for(let y=0;y<256;y++){const v=1-y/255;for(let x=0;x<256;x++){const c=v*(x/255),m=v-c,i=(y*256+x)*4;pixels[i]=Math.round((c*pure[0]+m)*255);pixels[i+1]=Math.round((c*pure[1]+m)*255);pixels[i+2]=Math.round((c*pure[2]+m)*255);pixels[i+3]=255;}}ctx.putImageData(image,0,0);if(rasters.size>=16)rasters.delete(rasters.keys().next().value);rasters.set(hue,canvas);return canvas;}
  function path(ctx,d,left=84,top=84,side=152,begin=true){if(begin)ctx.beginPath();d.path.forEach(c=>{const z=c.slice(1);if(c[0]==='M')ctx.moveTo(left+z[0]*side,top+z[1]*side);if(c[0]==='L')ctx.lineTo(left+z[0]*side,top+z[1]*side);if(c[0]==='C')ctx.bezierCurveTo(left+z[0]*side,top+z[1]*side,left+z[2]*side,top+z[3]*side,left+z[4]*side,top+z[5]*side);if(c[0]==='Z')ctx.closePath();});}
  function tile(hue,masked){
    const cacheKey=hue+':'+masked;if(tiles.has(cacheKey)){const saved=tiles.get(cacheKey);tiles.delete(cacheKey);tiles.set(cacheKey,saved);return saved;}
    // Keep the reference plot's local coordinates and Path2D construction too.
    // Moving the curves to another origin before rasterization changes edge pixels.
    const canvas=document.createElement('canvas');canvas.width=414;canvas.height=416;const ctx=canvas.getContext('2d'),left=43,top=12,side=152,d=HueLimits.definition(hue);ctx.setTransform(2,0,0,2,0,0);ctx.drawImage(raster(hue),left,top,side,side);
    let shape=null;if(typeof Path2D!=='undefined'){shape=new Path2D();path(shape,d,left,top,side,false);}
    if(masked){
      ctx.save();ctx.beginPath();ctx.rect(left,top,side,side);ctx.clip();ctx.save();
      if(shape){const excluded=new Path2D();excluded.rect(left,top,side,side);excluded.addPath(shape);ctx.clip(excluded,'evenodd');}
      else{ctx.beginPath();ctx.rect(left,top,side,side);path(ctx,d,left,top,side,false);ctx.clip('evenodd');}
      ctx.globalAlpha=.78;ctx.fillStyle='rgb(255,255,255)';ctx.fillRect(left,top,side,side);ctx.globalAlpha=.18;ctx.strokeStyle='rgb(26,28,31)';ctx.lineWidth=1;for(let off=-side;off<2*side;off+=12){ctx.beginPath();ctx.moveTo(left+off,top);ctx.lineTo(left+off+side,top+side);ctx.stroke();}ctx.restore();ctx.restore();
      ctx.strokeStyle='rgb(26,28,31)';ctx.lineWidth=1.7;if(shape)ctx.stroke(shape);else{path(ctx,d,left,top,side);ctx.stroke();}
    }
    ctx.strokeStyle='rgba(26,28,31,.08)';ctx.lineWidth=1;ctx.strokeRect(left,top,side,side);if(tiles.size>=24)tiles.delete(tiles.keys().next().value);tiles.set(cacheKey,canvas);return canvas;
  }
  function draw(ctx,{ball,active,hue}){const c=config(ball);ctx.drawImage(tile(hue,c.visible&&c.roles.includes(active)),41,72,207,208);}
  const point=color=>{const [s,v]=G.hsv(color);return[84+152*s,84+152*(1-v)];};
  const color=(x,y,h)=>G.fromHSV([E.clamp((x-84)/152,0,1),E.clamp(1-(y-84)/152,0,1)],h);
  const surface={id:'hue-reference-hsv',label:'HSV square',exclusive:true,pointerMode:'absolute',point,color,contains:(x,y)=>x>=84&&x<=236&&y>=84&&y<=236,draw};
  function get(ball,shape){if(shape!=='square')return null;const c=config(ball);if(!c||!c.enabled&&!c.visible)return null;try{HueLimits.check(c,ball);return surface;}catch{return null;}}
  return{get,config,rgb,clear:()=>{rasters.clear();tiles.clear();}};
})();
