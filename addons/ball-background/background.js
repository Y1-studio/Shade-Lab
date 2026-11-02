const BallBackground=(()=>{
  const E=globalThis.Shade,key='ball-background';
  function check(ball){const c=ball.addons?.[key];if(c===undefined)return;if(!c||c.version!==1||typeof c.enabled!=='boolean'||typeof c.hex!=='string'||!/^#[\da-f]{6}$/i.test(c.hex)||(c.hue!==undefined&&(!Number.isFinite(c.hue)||c.hue<0||c.hue>=360)))throw Error('Unsupported background settings are retained. Clear the background to recover.');}
  function config(ball){try{check(ball);return ball.addons?.[key];}catch{return undefined;}}
  function put(ball,hex,enabled=true,hue){const color=E.hexHsl(hex),normalized=E.toHex(color);ball.addons??={};ball.addons[key]={version:1,enabled,hex:normalized,hue:E.wrap(hue??color[0])};check(ball);return ball;}
  function read(ball){const c=config(ball),color=E.hexHsl(c?.hex||'#20262F');if(color[1]===0&&c?.hue!==undefined)color[0]=c.hue;return color;}
  function write(ball,color){put(ball,E.toHex(color),true,color[0]);}
  function draw(ctx,view){const c=config(view.ball);if(!c?.enabled)return;ctx.fillStyle=c.hex;ctx.fillRect(view.x,view.y,view.width,view.height);}
  return{E,key,check,config,put,read,write,draw};
})();
