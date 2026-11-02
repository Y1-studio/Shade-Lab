// A code-native tracing of the user's flat green sphere. The same geometry
// makes the teaching diagrams and the importable PNG-layer example type.
const TutorialReferenceBall=(()=>{
 const colors={base:'#A5F2AB',highlight:'#EDF5E9',shadow:'#6ED4AE',outline:'#101B18'};
 function circle(ctx){ctx.moveTo(296,150);ctx.arc(150,150,146,0,Math.PI*2);ctx.closePath();}
 function lit(ctx){ctx.moveTo(150,4);ctx.bezierCurveTo(187,4,223,16,245,42);ctx.bezierCurveTo(264,84,260,139,237,185);ctx.bezierCurveTo(217,228,180,259,135,269);ctx.bezierCurveTo(87,280,45,260,21,224);ctx.bezierCurveTo(9,201,4,178,4,150);ctx.bezierCurveTo(4,70,68,4,150,4);ctx.closePath();}
 function highlight(ctx){ctx.moveTo(87,40);ctx.bezierCurveTo(119,29,145,50,149,82);ctx.bezierCurveTo(154,108,136,139,113,157);ctx.bezierCurveTo(88,177,54,173,34,152);ctx.bezierCurveTo(15,131,27,98,41,74);ctx.bezierCurveTo(51,54,68,44,87,40);ctx.closePath();}
 function layer(ctx,role,palette=colors){ctx.save();ctx.fillStyle=palette[role]||colors[role];ctx.beginPath();if(role==='base')circle(ctx);else if(role==='shadow'){circle(ctx);lit(ctx);}else if(role==='highlight')highlight(ctx);else{circle(ctx);ctx.strokeStyle=colors.outline;ctx.lineWidth=3.5;ctx.stroke();ctx.restore();return;}ctx.fill(role==='shadow'?'evenodd':'nonzero');ctx.restore();}
 function draw(ctx,x,y,size,palette=colors,only=null){ctx.save();ctx.translate(x,y);ctx.scale(size/300,size/300);for(const role of only?[only]:['base','shadow','highlight','outline'])layer(ctx,role,palette);ctx.restore();}
 return{colors,layer,draw};
})();
