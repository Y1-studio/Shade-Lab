/* Offline HTML color engine. Existing version-1 files remain supported. No eval or Function. */
(function(root) {
'use strict';
const CHANNELS={HSL:['H','S','L'],RGB:['R','G','B'],CMYK:['C','M','Y','K']};
const LIMITS={H:360,S:100,L:100,R:255,G:255,B:255,C:100,M:100,Y:100,K:100};
const clamp=(v,lo=0,hi=100)=>Math.min(hi,Math.max(lo,v));
const wrap=v=>((v%360)+360)%360;
const clone=v=>JSON.parse(JSON.stringify(v));
const uid=()=>globalThis.crypto?.randomUUID?.().replace(/-/g,'').slice(0,12)||Math.random().toString(36).slice(2,14);
function hslRgb([h,s,l]) {h=wrap(h)/360;s=clamp(s)/100;l=clamp(l)/100;const c=(1-Math.abs(2*l-1))*s;const x=c*(1-Math.abs(h*6%2-1));const m=l-c/2;const rgb=h<1/6?[c,x,0]:h<2/6?[x,c,0]:h<3/6?[0,c,x]:h<4/6?[0,x,c]:h<5/6?[x,0,c]:[c,0,x];return rgb.map(v=>(v+m)*255);}
function rgbHsl(rgb,fallback=0) {const [r,g,b]=rgb.map(v=>clamp(v,0,255)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=fallback,s=0;if(d>1e-10){s=d/(1-Math.abs(2*l-1));h=(max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4)*60;}return[wrap(h),clamp(s*100),clamp(l*100)];}
function hexHsl(hex){hex=hex.trim().replace(/^#/,'');if(hex.length===3)hex=[...hex].map(x=>x+x).join('');if(!/^[a-f\d]{6}$/i.test(hex))throw Error('Enter a six-digit HEX color, such as #C92235.');return rgbHsl([0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)));}
const toHex=hsl=>'#'+hslRgb(hsl).map(v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,'0')).join('').toUpperCase();
// Full-range encoded RGB grayscale matching the supplied CSP sample.
// Quantize like toHex/canvas first, then truncate BT.601 luma (all three CSP samples).
const grayscaleByte=(r,g,b)=>Math.floor((299*Math.round(clamp(r,0,255))+587*Math.round(clamp(g,0,255))+114*Math.round(clamp(b,0,255)))/1000);
const grayscaleHex=hsl=>'#'+grayscaleByte(...hslRgb(hsl)).toString(16).padStart(2,'0').repeat(3).toUpperCase();
function values(hsl){const rgb=hslRgb(hsl),k=1-Math.max(...rgb)/255,cmy=k>.999999999?[0,0,0]:rgb.map(v=>(1-v/255-k)/(1-k)*100);return Object.fromEntries([...'HSLRGBCMYK'].map((ch,i)=>[ch,[...hsl,...rgb,...cmy,k*100][i]]));}
function fromModel(model,out,fallback=0){if(model==='HSL')return[wrap(out.H),clamp(out.S),clamp(out.L)];if(model==='RGB')return rgbHsl([..."RGB"].map(c=>out[c]),fallback);return rgbHsl([..."CMY"].map(c=>255*(1-clamp(out[c])/100)*(1-clamp(out.K)/100)),fallback);}
const funcs={min:Math.min,max:Math.max,abs:Math.abs,round:Math.round,sqrt:Math.sqrt,sin:Math.sin,cos:Math.cos,clamp,wrap};
function evaluate(expression,variables){
 if(typeof expression!=='string'||!expression.length||expression.length>500)throw Error('A formula must contain 1–500 characters.');
 const tokens=[];let p=0;while(p<expression.length){const tail=expression.slice(p);let m;if(/^\s/.test(tail)){p++;continue;}if(m=tail.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/)){tokens.push({type:'number',value:Number(m[0])});p+=m[0].length;}else if(m=tail.match(/^[A-Za-z_][A-Za-z_0-9]*/)){tokens.push({type:'name',value:m[0]});p+=m[0].length;}else if(tail.startsWith('**')){tokens.push({type:'^'});p+=2;}else if('+-*/^(),'.includes(tail[0])){tokens.push({type:tail[0]});p++;}else throw Error('Unsupported character in formula.');}
 if(tokens.length>150)throw Error('Formula is too complex.');let i=0;
 const at=t=>tokens[i]?.type===t,take=t=>{if(!at(t))throw Error('Invalid formula syntax.');return tokens[i++];};
 const check=v=>{if(!Number.isFinite(v)||Math.abs(v)>1e12)throw Error('Formula result must be finite and within ±1 trillion.');return v;};
 function atom(){if(at('number'))return check(take('number').value);if(at('(')){take('(');const v=sum();take(')');return v;}if(at('name')){const name=take('name').value;if(at('(')){if(!Object.hasOwn(funcs,name))throw Error('Unknown function: '+name);take('(');let args=[];if(!at(')')){args.push(sum());while(at(',')){take(',');args.push(sum());}}take(')');const [lo,hi]=['min','max'].includes(name)?[2,8]:name==='clamp'?[3,3]:[1,1];if(args.length<lo||args.length>hi)throw Error('Wrong number of function arguments.');return check(funcs[name](...args));}if(!Object.hasOwn(variables,name))throw Error('Unknown variable: '+name);return check(variables[name]);}throw Error('Invalid formula syntax.');}
 function power(){let a=atom();if(at('^')){take('^');const b=unary();if(Math.abs(b)>20||Math.abs(a)>1e6)throw Error('Power is too large.');a=check(a**b);}return a;}
 function unary(){if(at('+')){take('+');return unary();}if(at('-')){take('-');return -unary();}return power();}
 function product(){let v=unary();while(at('*')||at('/')){const op=tokens[i++].type,r=unary();v=check(op==='*'?v*r:v/r);}return v;}
 function sum(){let v=product();while(at('+')||at('-')){const op=tokens[i++].type,r=product();v=check(op==='+'?v+r:v-r);}return v;}
 const result=sum();if(i!==tokens.length)throw Error('Unexpected content after formula.');return check(result);
}
function resolveRecipe(ball,strength=ball.strength){const result={base:[...ball.base]},roles=new Map(ball.roles.map(r=>[r.id,r])),visiting=new Set();function get(id){if(Object.hasOwn(result,id))return result[id];if(visiting.has(id))throw Error('Color links form a cycle. Choose a different source.');if(!roles.has(id))throw Error('Missing source color: '+id);visiting.add(id);const role=roles.get(id),source=get(role.source),vars={...values(source),t:strength,pi:Math.PI};const out=Object.fromEntries(CHANNELS[role.model].map(c=>{let v;const rule=role.rule;if(rule?.kind==='offset')v=vars[c]+rule.amounts[c]*strength;else if(rule?.kind==='percent')v=vars[c]*(1+rule.amounts[c]/100*strength);else v=evaluate(role.expressions[c],vars);if(!Number.isFinite(v))throw Error('Color rule must produce finite numbers.');return[c,rule?.precise?v:Math.round(v)];}));result[id]=fromModel(role.model,out,source[0]);visiting.delete(id);return result[id];}for(const id of roles.keys())get(id);return result;}
function setRule(role,kind,amounts){
 if(!['offset','percent','formula'].includes(kind))throw Error('Unknown rule mode.');
 role.rule={kind,...(role.rule?.precise?{precise:true}:{})};
 if(kind!=='formula'){
  if(CHANNELS[role.model].some(c=>!Number.isFinite(amounts?.[c])))throw Error('Enter a number for every channel.');
  role.rule.amounts=clone(amounts);
  role.expressions=Object.fromEntries(CHANNELS[role.model].map(c=>[c,kind==='offset'?`${c} + (${amounts[c]}) * t`:`${c} * (1 + (${amounts[c]}) / 100 * t)`]));
 }
 return role;
}
function difference(source,target,model='HSL'){const a=values(source),b=values(target);return Object.fromEntries(CHANNELS[model].map(c=>[c,c==='H'?wrap(b[c]-a[c]+180)-180:b[c]-a[c]]));}
function measured(ball,id,strength=ball.strength){const cs=resolve(ball,strength),r=ball.roles.find(r=>r.id===id);if(!r)return{};return difference(cs[r.source],cs[id],r.model);}
function fitMeasured(ball,id,target,strength=ball.strength){const r=ball.roles.find(r=>r.id===id);if(!r)throw Error('Select a derived region.');const cs=resolveRecipe(ball,strength),d=difference(cs[r.source],target,r.model);setRule(r,'offset',Object.fromEntries(Object.entries(d).map(([c,v])=>[c,v/(strength||1)])));}
function defaultBall(name='Carmine study',base=[354,75,45]){const role=(id,name,h,s,l)=>setRule({id,name,source:'base',model:'HSL'},'offset',{H:h,S:s,L:l});return{id:uid(),name,baseName:'Base',base:[...base],mode:'cel',softness:0,strength:1,roles:[role('highlight','Highlight',15,5,8),role('shadow','Shadow',-8,-10,-10),role('rim','Shadow rim',-30,-8,-7),role('bounce','Bounce light',-65,-20,7)]};}
const defaultProject=()=>({schema:'shadelab.project',version:3,name:'Untitled studies',balls:[defaultBall(),defaultBall('Midnight study',[211,48,18])],groups:[],comparisons:[.5,1,2,3]});
const roleName=(ball,id)=>id==='base'?(ball.baseName||'Base'):ball.roles.find(r=>r.id===id)?.name||id;
function lockOffsets(ball){const colors=resolveRecipe(ball);for(const role of ball.roles){role.source='base';role.model='HSL';setRule(role,'offset',difference(ball.base,colors[role.id]));}ball.strength=1;}
function editRecipeColor(ball,id,hsl,group=false){
 if(!Array.isArray(hsl)||hsl.length!==3||hsl.some(v=>!Number.isFinite(v)))throw Error('Choose a valid color.');
 const trial=clone(ball),colors=resolveRecipe(trial);
 if(!Object.hasOwn(colors,id))throw Error('Select a color region before editing it.');
 hsl=[wrap(hsl[0]),clamp(hsl[1]),clamp(hsl[2])];
 if(group){
  const old=colors[id],all=Object.values(colors),ds=clamp(hsl[1]-old[1],-Math.min(...all.map(c=>c[1])),100-Math.max(...all.map(c=>c[1]))),dl=clamp(hsl[2]-old[2],-Math.min(...all.map(c=>c[2])),100-Math.max(...all.map(c=>c[2])));
  trial.base=[wrap(trial.base[0]+hsl[0]-old[0]),clamp(trial.base[1]+ds),clamp(trial.base[2]+dl)];
 }else if(id==='base')trial.base=hsl;
 else if(trial.roles.find(r=>r.id===id).rule?.kind!=='formula'&&trial.roles.find(r=>r.id===id).rule){
  if(!trial.strength)trial.strength=1;
  fitMeasured(trial,id,hsl);
 }else{
  const role=trial.roles.find(r=>r.id===id),current=values(colors[id]),target=values(hsl);
  for(const c of CHANNELS[role.model]){
   let d=target[c]-current[c];if(c==='H')d=wrap(d+180)-180;
   if(Math.abs(d)>1e-7){let expr=role.expressions[c],m=expr.match(/^\((.*)\) \+ \(([-+\d.eE]+)\)$/);if(m){expr=m[1];d+=Number(m[2]);}role.expressions[c]=Math.abs(d)<1e-8?expr:`(${expr}) + (${Number(d.toPrecision(10))})`;}
  }
 }
 // A failed edit must never change the live ball, including when its source is edited.
 validateBall(trial);
 Object.assign(ball,trial);
}

function sampleRecipeColor(ball,id,hsl,group=!!ball.groupMove,independent=false){
 if(independent){const colors=resolveRecipe(ball);if(!colors[id])throw Error('Select a color region.');colors[id]=[...hsl];fitRecipeColors(ball,colors,true);return;}
 const trial=clone(ball);trial.strength=1;
 if(group||id==='base')editRecipeColor(trial,id,hsl,group);
 else fitMeasured(trial,id,hsl,1);
 validateBall(trial);Object.assign(ball,trial);
}

function normalizeDocument(data){
 const result=clone(data);
 // Older builds could save floating-point saturation just above 100. Repair only
 // numerical boundary noise; genuinely out-of-range or malformed data still fails.
 const normalize=color=>{
  if(!Array.isArray(color)||color.length!==3)return color;
  return color.map((value,i)=>Number.isFinite(value)&&value>=-1e-7&&value<=[360,100,100][i]+1e-7?clamp(value,0,[360,100,100][i]):value);
 };
 if(result?.schema==='shadelab.project'){
  if(Array.isArray(result.balls))for(const b of result.balls)if(b&&typeof b==='object')b.base=normalize(b.base);
  if(Array.isArray(result.samples))result.samples=result.samples.map(normalize);
 }
 validateDocument(result);
 result.version=3;
 if(result.schema==='shadelab.project')result.groups??=[];
 if(result.schema==='shadelab.project'&&result.temperatureGuide)result.temperatureGuide={visible:result.temperatureGuide.visible,start:90,end:270};
 const migrate=b=>{for(const r of b.roles){if(!r.rule)r.rule={kind:'formula'};else if(r.rule.kind!=='formula')setRule(r,r.rule.kind,r.rule.amounts);}};
 if(result.schema==='shadelab.project')result.balls.forEach(migrate);
 else if(result.schema==='shadelab.ball-type')migrate(result.ball);
 else if(result.roles)migrate(result);
 return result;
}
function simpleAmounts(role,ball){return role.rule&&role.rule.kind!=='formula'?{kind:role.rule.kind==='offset'?'points':'percent',amounts:clone(role.rule.amounts)}:{kind:null,amounts:ball?measured(ball,role.id):{}};}
function fitLine(points){if(points.length<2)return null;const n=points.length,sx=points.reduce((a,p)=>a+p[0],0)/n,sy=points.reduce((a,p)=>a+p[1],0)/n,v=points.reduce((a,p)=>a+(p[0]-sx)**2,0);if(v<1e-12)return{vertical:sx};const m=points.reduce((a,p)=>a+(p[0]-sx)*(p[1]-sy),0)/v,b=sy-m*sx,ss=points.reduce((a,p)=>a+(p[1]-sy)**2,0),error=points.reduce((a,p)=>a+(p[1]-(m*p[0]+b))**2,0);return{m,b,r2:ss>1e-12?1-error/ss:1};}
const preset=(ball,name)=>({schema:'shadelab.formula',version:3,name,baseName:ball.baseName||'Base',roles:clone(ball.roles)});
function applyPreset(ball,data){const trial=clone(ball);for(const k of ['baseName','roles'])if(Object.hasOwn(data,k))trial[k]=clone(data[k]);if(data.version===1)for(const k of ['mode','softness'])if(Object.hasOwn(data,k))trial[k]=clone(data[k]);if(trial.design)trial.design.layers=trial.design.layers.filter(l=>l.kind==='overlay'||l.role==='base'||trial.roles.some(r=>r.id===l.role));trial.strength=1;validateBall(trial);Object.assign(ball,trial);}
const validId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(id)&&!['__proto__','constructor','prototype'].includes(id);
function validateDesign(design,roles){
 if(!design||!Number.isFinite(design.width)||!Number.isFinite(design.height)||design.width<1||design.height<1||design.width>16384||design.height>16384||!Array.isArray(design.layers))throw Error('Invalid layer canvas.');
 const ids=new Set();
 for(const l of design.layers){
  if(!l||!validId(l.id)||ids.has(l.id)||!validId(l.assetId)||typeof l.name!=='string'||!['mask','overlay'].includes(l.kind))throw Error('Invalid layer.');ids.add(l.id);
  if(l.kind==='mask'&&!roles.has(l.role))throw Error('A layer uses a missing color region.');
  if(l.clip!==undefined&&l.clip!=='ellipse')throw Error('Invalid layer clip.');
  if(l.blur!==undefined&&typeof l.blur!=='boolean')throw Error('Invalid layer blur setting.');
  for(const key of ['x','y','width','height','rotation','opacity'])if(!Number.isFinite(l[key])||Math.abs(l[key])>1e6)throw Error('Invalid layer '+key);
  if(l.width<=0||l.height<=0||l.opacity<0||l.opacity>1||['flipX','flipY','visible'].some(k=>typeof l[k]!=='boolean'))throw Error('Invalid layer size or visibility.');
 }
}
function assetIds(data){const ids=new Set();const walk=v=>{if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach(walk);return;}if(v.assetId)ids.add(v.assetId);if(v.thumbnailAssetId)ids.add(v.thumbnailAssetId);for(const [k,x] of Object.entries(v))if(!['assets','thumbnail','data'].includes(k))walk(x);};walk(data);return [...ids];}
function validateAssets(assets){if(!assets||typeof assets!=='object'||Array.isArray(assets))throw Error('Invalid image assets.');for(const [id,a]of Object.entries(assets)){if(!validId(id)||!a||typeof a.data!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(a.data)||!Number.isInteger(a.width)||!Number.isInteger(a.height)||a.width<1||a.height<1||a.width*a.height>16777216)throw Error('Invalid PNG asset (maximum 16 megapixels).');}}
function validateBall(b){
 if(!b||typeof b!=='object'||typeof b.name!=='string'||typeof b.id!=='string')throw Error('Every ball needs an id and name.');
 if(Object.hasOwn(b,'baseName')&&typeof b.baseName!=='string')throw Error('Base color name must be text.');
 if(Object.hasOwn(b,'groupMove')&&typeof b.groupMove!=='boolean')throw Error('groupMove must be true or false.');
 if(Object.hasOwn(b,'grayscale')&&typeof b.grayscale!=='boolean')throw Error('Grayscale must be true or false.');
 if(b.pickerFree?.planeByShape&&['square','triangle'].some(shape=>typeof b.pickerFree.planeByShape[shape]!=='boolean'))throw Error('Invalid surface picker locks.');
 if(b.pickerFree!==undefined&&(!b.pickerFree||typeof b.pickerFree!=='object'||Array.isArray(b.pickerFree)||['hue','plane'].some(k=>typeof b.pickerFree[k]!=='boolean')))throw Error('Invalid picker locks.');
 if(!Array.isArray(b.base)||b.base.length!==3||b.base.some((v,i)=>!Number.isFinite(v)||v<0||v>[360,100,100][i]))throw Error('Base HSL is out of range.');
 if(!['cel','rim','custom'].includes(b.mode))throw Error('Unknown sphere mode.');
 for(const [key,max] of [['strength',10],['softness',100]])if(!Number.isFinite(b[key])||b[key]<0||b[key]>max)throw Error('Invalid '+key);
 if(!Array.isArray(b.roles))throw Error('Roles must be a list.');
 const ids=new Set(['base']);
 for(const r of b.roles){
  if(!r||!validId(r.id)||ids.has(r.id))throw Error('Role IDs must be unique and cannot be reserved.');ids.add(r.id);
  if(typeof r.name!=='string'||typeof r.source!=='string'||!Object.hasOwn(CHANNELS,r.model))throw Error('Invalid color role.');
  const kind=r.rule?.kind||'formula';
  if(!['offset','percent','formula'].includes(kind))throw Error('Unknown rule mode.');
  if(r.rule?.precise!==undefined&&typeof r.rule.precise!=='boolean')throw Error('Invalid channel precision.');
  if(kind==='formula'){if(!r.expressions||CHANNELS[r.model].some(c=>typeof r.expressions[c]!=='string'))throw Error('Missing channel formula.');}
  else if(!r.rule.amounts||CHANNELS[r.model].some(c=>!Number.isFinite(r.rule.amounts[c])||Math.abs(r.rule.amounts[c])>1e9))throw Error('Invalid channel amounts.');
 }
 if(b.mode==='custom'&&!b.design)throw Error('A custom ball needs a layer design.');
 if(b.design)validateDesign(b.design,ids);
 resolveRecipe(b);
}
function validateDocument(data){
 if(!data||![1,2,3].includes(data.version))throw Error('Expected Shade Lab JSON version 1, 2, or 3.');
 if(Object.hasOwn(data,'name')&&typeof data.name!=='string')throw Error('Document name must be text.');
 if(data.assets)validateAssets(data.assets);
 if(data.schema==='shadelab.project'){
  if(data.pickerShape!==undefined&&!['triangle','square'].includes(data.pickerShape))throw Error('Unknown picker shape.');
  if(!Array.isArray(data.balls)||!data.balls.length)throw Error('Project must contain at least one ball.');
  const ids=new Set();for(const b of data.balls){validateBall(b);if(ids.has(b.id))throw Error('Ball IDs must be unique.');ids.add(b.id);}
  const groupIds=new Set();
  if(data.groups!==undefined&&!Array.isArray(data.groups))throw Error('Groups must be a list.');
  for(const g of data.groups||[]){if(!g||!validId(g.id)||groupIds.has(g.id)||typeof g.name!=='string'||!g.name.trim()||!Array.isArray(g.memberIds)||new Set(g.memberIds).size!==g.memberIds.length||g.memberIds.some(id=>!ids.has(id)))throw Error('Invalid group or missing group member.');groupIds.add(g.id);}
  if(data.temperatureGuide!==undefined){const g=data.temperatureGuide;if(!g||typeof g.visible!=='boolean'||['start','end'].some(k=>!Number.isFinite(g[k])||g[k]<0||g[k]>=360))throw Error('Invalid warm/cool guide.');}
  const ts=data.comparisons??[.5,1,2,3];if(!Array.isArray(ts)||!ts.length||ts.some(t=>!Number.isFinite(t)||t<0||t>10))throw Error('Comparison strengths must be between 0 and 10.');
  const samples=data.samples??[];if(!Array.isArray(samples)||samples.some(s=>!Array.isArray(s)||s.length!==3||s.some((v,i)=>!Number.isFinite(v)||v<0||v>[360,100,100][i])))throw Error('Samples must be HSL color arrays.');
 }else if(data.schema==='shadelab.formula')applyPreset(defaultBall(),data);
 else if(data.schema==='shadelab.ball-type'){if(!validId(data.id)||typeof data.name!=='string')throw Error('Invalid ball type.');validateBall(data.ball);if(data.thumbnail&&!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data.thumbnail))throw Error('Invalid thumbnail.');}
 else throw Error('This is not a Shade Lab project, formula, or ball type.');
 return data;
}
function trianglePoint([h,s,l],left=99,top=62,width=149,height=196){return[left+width*(1-Math.abs(2*l/100-1))*s/100,top+height*(1-l/100)];}
function triangleColor(x,y,h,left=99,top=62,width=149,height=196){const l=clamp((1-(y-top)/height)*100),max=1-Math.abs(2*l/100-1),s=max>1e-8?clamp((x-left)/width/max*100):0;return[wrap(h),s,l];}
// The CSP square is HSV; recipes and saved colors remain HSL.
function hslHsv([h,s,l]){s=clamp(s)/100;l=clamp(l)/100;const v=l+s*Math.min(l,1-l);return[wrap(h),v>0?clamp(2*(1-l/v)*100):s*100,v*100];}
function hsvHsl([h,s,v]){s=clamp(s)/100;v=clamp(v)/100;const l=v*(1-s/2);return[wrap(h),l>0&&l<1?clamp((v-l)/Math.min(l,1-l)*100):l===0?s*100:0,l*100];}
function squarePoint(color){const [,s,v]=hslHsv(color);return[84+152*s/100,84+152*(1-v/100)];}
function squareColor(x,y,h){return hsvHsl([h,(x-84)/152*100,(1-(y-84)/152)*100]);}
function pickerSurface(ball,shape){if(ball)for(const extension of extensions.values()){const view=extension.pickerSurface?.(ball,shape);if(view)return view;}return null;}
function pickerEditView(ball){for(const [,extension]of ordered('edit')){const view=extension.pickerEditView?.(ball);if(view)return view;}return{ball,label:''};}
function pickerPoint(color,shape='triangle',ball){const view=pickerSurface(ball,shape);return view?view.point(color):shape==='square'?squarePoint(color):trianglePoint(color);}
function pickerColor(x,y,h,shape='triangle',ball){const view=pickerSurface(ball,shape);return view?view.color(x,y,h):shape==='square'?squareColor(x,y,h):triangleColor(x,y,h);}
function pickerContains(x,y,shape='triangle',ball){const view=pickerSurface(ball,shape);if(view)return view.contains(x,y);if(shape==='square')return x>=84&&x<=236&&y>=84&&y<=236;const l=clamp((1-(y-62)/196)*100),edge=99+149*(1-Math.abs(2*l/100-1));return x>=99&&x<=edge&&y>=62&&y<=258;}
function moveRecipeColor(ball,id,kind,target,free=false,shape='triangle'){
 if(!['hue','plane'].includes(kind)||!['triangle','square'].includes(shape)||!Array.isArray(target)||target.length!==3||target.some(v=>!Number.isFinite(v)))throw Error('Invalid picker movement.');
 const trial=clone(ball),before=resolveRecipe(trial),next=clone(before),active=before[id];if(!active)throw Error('Select a color region.');
 if(kind==='hue'){
  const dh=wrap(target[0]-active[0]+180)-180;if(Math.abs(dh)<1e-9)return;
  for(const key of free?[id]:Object.keys(next))next[key][0]=wrap(before[key][0]+dh);
 }else if(free){
  next[id]=[active[0],clamp(target[1]),clamp(target[2])];
  if(Math.abs(next[id][1]-active[1])+Math.abs(next[id][2]-active[2])<1e-9)return;
 }else{
  const oldPoint=pickerPoint(active,shape),point=pickerPoint(target,shape),dx=point[0]-oldPoint[0],dy=point[1]-oldPoint[1];
  if(Math.abs(dx)+Math.abs(dy)<1e-9)return;
  // Intersect the proposed translation with every point's valid picker bounds.
  const slope=149/98,bounds=shape==='square'?[[1,0,236],[-1,0,-84],[0,1,236],[0,-1,-84]]:[[-1,0,-99],[1,-slope,99-slope*62],[1,slope,99+slope*258]];
  let fraction=1;
  for(const color of Object.values(before)){const [x,y]=pickerPoint(color,shape);for(const [a,b,c]of bounds){const speed=a*dx+b*dy;if(speed>1e-9)fraction=Math.min(fraction,Math.max(0,(c-a*x-b*y)/speed));}}
  if(fraction<1e-9)return;
  for(const [key,color]of Object.entries(before)){const [x,y]=pickerPoint(color,shape);next[key]=pickerColor(x+dx*fraction,y+dy*fraction,color[0],shape);}
 }
 fitRecipeColors(ball,next,shape==='square');
}
function fitRecipeColors(ball,next,precise=false){
 const trial=clone(ball);
 // Fit sources before their dependents so independent edits hold descendants still.
 trial.base=next.base;trial.strength=1;
 for(const r of trial.roles){setRule(r,'offset',difference(next[r.source],next[r.id],r.model));if(precise)r.rule.precise=true;}
 const done=new Set(['base']),pending=new Set();
 function fit(id){if(done.has(id))return;if(pending.has(id))throw Error('Color links form a cycle.');pending.add(id);const r=trial.roles.find(r=>r.id===id);if(!r)throw Error('Missing source color.');fit(r.source);fitMeasured(trial,id,next[id],1);done.add(id);pending.delete(id);}
 for(const r of trial.roles)fit(r.id);
 validateBall(trial);Object.assign(ball,trial);
}
// Optional feature hooks operate after recipe evaluation; raw recipes remain accessible.
const extensions=new Map();let extensionRevision=0;
function addExtension(id,extension){if(extensions.has(id))throw Error('Duplicate color extension: '+id);extensions.set(id,extension);extensionRevision++;return()=>{if(extensions.delete(id))extensionRevision++;};}
const ordered=stage=>[...extensions.entries()].sort((a,b)=>(a[1][stage+'Order']||0)-(b[1][stage+'Order']||0));
function resolveWithout(ball,strength=ball.strength,excluded=[]){let colors=resolveRecipe(ball,strength);for(const [id,extension]of ordered('resolve'))if(!excluded.includes(id)&&extension.resolve){const next=extension.resolve(ball,clone(colors),strength);if(!next||Object.keys(next).length!==Object.keys(colors).length||Object.keys(colors).some(id=>!Array.isArray(next[id])||next[id].length!==3||next[id].some((v,i)=>!Number.isFinite(v)||v<0||v>[360,100.0000001,100.0000001][i])))throw Error('Invalid colors from an add-on.');colors=next;}return colors;}
function resolve(ball,strength=ball.strength){return resolveWithout(ball,strength);}
// Evaluate a prefix of the color pipeline for tools that must read their inputs.
function resolveStage(ball,strength,id,inclusive=false){let colors=resolveRecipe(ball,strength);for(const [key,extension]of ordered('resolve')){if(key===id&&!inclusive)break;if(extension.resolve){const next=extension.resolve(ball,clone(colors),strength);if(!next||Object.keys(next).length!==Object.keys(colors).length||Object.keys(colors).some(k=>!Array.isArray(next[k])||next[k].length!==3||next[k].some((v,i)=>!Number.isFinite(v)||v<0||v>[360,100.0000001,100.0000001][i])))throw Error('Invalid colors from an add-on.');colors=next;}if(key===id)break;}return colors;}
const resolveBefore=(ball,strength,id)=>resolveStage(ball,strength,id),resolveThrough=(ball,strength,id)=>resolveStage(ball,strength,id,true);
function editRequest(ball,request){
 const list=ordered('edit');
 function route(target,req,start=0){for(let i=start;i<list.length;i++){const extension=list[i][1];if(extension.edit){const trial=clone(target);if(extension.edit(trial,req,(nextBall,nextRequest)=>route(nextBall,nextRequest,i+1))===true){validateBall(trial);resolve(trial);Object.assign(target,trial);return;}}}
  if(req.kind==='color')editRecipeColor(target,req.id,req.target,req.group);
  else if(req.kind==='sample')sampleRecipeColor(target,req.id,req.target,req.group,req.independent);
  else moveRecipeColor(target,req.id,req.kind,req.target,req.free,req.shape);
 }route(ball,request);
}
function editColor(ball,id,target,group=false){editRequest(ball,{kind:'color',id,target,group});}
function sampleColor(ball,id,target,options={}){editRequest(ball,{...options,kind:'sample',id,target,group:!!ball.groupMove});}
function pickerFree(ball,kind,shape,fallback){for(const [,extension]of ordered('edit')){const locks=extension.pickerLocks?.(ball,shape);if(typeof locks?.[kind]==='boolean')return !locks[kind];}return fallback;}
function movePickerColor(ball,id,kind,target,free=false,shape='triangle',point,displaySurface=true,origin){
 free=pickerFree(ball,kind,shape,free);
 const view=displaySurface&&pickerSurface(ball,shape);let interpolate,display;
 if(kind==='plane'&&shape==='square'&&!view){
  interpolate=(a,b,t)=>{const p=squarePoint(a),q=squarePoint(b);return squareColor(p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,a[0]);};
 }
 if(view&&kind==='plane'){
  display={id:view.id,point:point?[...point]:view.point(target)};
  if(!free){
   // Project every member from the same gesture origin, never from a clamped frame.
   const colors=origin||resolve(pickerEditView(ball).ball),anchor=view.point(colors[id]),delta=display.point.map((v,i)=>v-anchor[i]);
   display.group=Object.fromEntries(Object.entries(colors).map(([key,c])=>{const p=view.point(c).map((v,i)=>v+delta[i]);return[key,{point:p,color:view.color(...p,c[0])}];}));
  }
  interpolate=(a,b,t)=>{const p=view.point(a),q=view.point(b);return view.color(p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,a[0]);};
  if(point)point=pickerPoint(target,shape);
 }
 editRequest(ball,{kind,id,target,free,shape,point,interpolate,display});
}
const planeFree=(ball,shape)=>ball.pickerFree?.planeByShape?.[shape]??ball.pickerFree?.plane??false;
function controlLocks(ball){return Object.assign({},...[...extensions.values()].map(extension=>extension.controls?.(ball)||{}));}
function checkExtensions(ball){for(const extension of extensions.values())extension.validate?.(ball);}
const wheelAngle=hue=>(hue-150)*Math.PI/180;
const wheelPoint=(hue,radius=142)=>[160+Math.cos(wheelAngle(hue))*radius,160+Math.sin(wheelAngle(hue))*radius];
const wheelHue=(x,y)=>wrap(Math.atan2(y-160,x-160)*180/Math.PI+150);
const api={wheelAngle,wheelPoint,wheelHue,CHANNELS,LIMITS,clamp,wrap,clone,uid,hslRgb,rgbHsl,hexHsl,toHex,grayscaleByte,grayscaleHex,values,fromModel,evaluate,resolve,defaultBall,defaultProject,roleName,lockOffsets,editColor,sampleColor,setRule,difference,measured,fitMeasured,fitLine,preset,applyPreset,validateBall,validateDocument,normalizeDocument,validateAssets,assetIds,trianglePoint,triangleColor,simpleAmounts};
Object.assign(api,{hslHsv,hsvHsl,pickerEditView,checkExtensions,resolveWithout,resolveBefore,resolveThrough,planeFree,touchExtensions:()=>extensionRevision++,addExtension,resolveRecipe,editRecipeColor,sampleRecipeColor,moveRecipeColor,controlLocks,extensionRevision:()=>extensionRevision,squarePoint,squareColor,pickerPoint,pickerColor,pickerContains,pickerSurface,movePickerColor});
if(typeof module!=='undefined')module.exports=api;root.Shade=api;
})(globalThis);
