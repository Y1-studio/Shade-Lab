const FilterEngine=(()=>{
  const E=globalThis.Shade,key='blend-filters',modeIds=new Set(BlendMath.modes.map(m=>m[0]));
  const roles=ball=>['base',...ball.roles.map(r=>r.id)];
  function checkConfig(c){
    if(!c||typeof c!=='object'||typeof c.enabled!=='boolean'||!modeIds.has(c.mode)||!Array.isArray(c.sourceRgb)||c.sourceRgb.length!==3||c.sourceRgb.some(v=>!Number.isInteger(v)||v<0||v>255)||!Number.isFinite(c.opacity)||c.opacity<0||c.opacity>1)throw Error('Choose a valid filter, RGB paint color and opacity from 0 to 100%.');
  }
  function check(ball){const data=ball.addons?.[key];if(data===undefined)return;if(!data||data.version!==1||!data.roles||typeof data.roles!=='object'||Array.isArray(data.roles))throw Error('Unsupported filter settings are retained but suspended.');for(const c of Object.values(data.roles))checkConfig(c);if(data.comparison!==undefined)FilterSplit.check(data.comparison);}
  const config=(ball,id)=>{try{check(ball);return ball.addons?.[key]?.roles[id];}catch{return undefined;}};
  function resolve(ball,colors){try{check(ball);}catch{return colors;}
    const configs=ball.addons?.[key]?.roles;if(!configs)return colors;
    for(const [id,c]of Object.entries(configs))if(c.enabled&&c.opacity>0&&colors[id]){const input=colors[id];colors[id]=E.rgbHsl(BlendMath.blend(c.mode,E.hslRgb(input).map(v=>v/255),c.sourceRgb.map(v=>v/255),c.opacity).map(v=>v*255),input[0]);}
    return colors;
  }
  const active=ball=>roles(ball).some(id=>{const c=config(ball,id);return c?.enabled&&c.opacity>0;});
  function edit(ball,request,next){
    if(!active(ball))return false;
    const saved=E.clone(ball.addons[key]);delete ball.addons[key];
    const edit=request.kind==='sample'&&request.source==='picker'&&request.id==='base'?{...request,kind:'color',group:false}:request;
    next(ball,edit);ball.addons??={};ball.addons[key]=saved;return true;
  }
  const controls=()=>({});
  const pickerEditView=ball=>active(ball)?{ball:originals(ball),label:'Editing ball color · Multiply and other filter settings stay fixed'}:null;
  function put(ball,ids,c){checkConfig(c);check(ball);ball.addons??={};ball.addons[key]??={version:1,roles:{}};for(const id of ids){if(!roles(ball).includes(id))continue;ball.addons[key].roles[id]={enabled:c.enabled,mode:c.mode,sourceRgb:[...c.sourceRgb],opacity:c.opacity};}return ball;}
  function originals(ball){const b=E.clone(ball);if(b.addons)delete b.addons[key];return b;}
  function editOriginal(ball,id,hex){const original=originals(ball),data=ball.addons?.[key]===undefined?undefined:E.clone(ball.addons[key]);E.editColor(original,id,E.hexHsl(hex));E.validateBall(original);E.checkExtensions(original);if(data){original.addons??={};original.addons[key]=data;}E.resolve(original);return original;}
  function targets(row,ball){const ids=roles(ball);if(row.scope==='all')return ids;if(row.scope==='same')return ids.includes(row.roleId)?[row.roleId]:[];return ids.filter(id=>row.selections?.[ball.id]?.includes(id));}
  function pair(ball,row){const ids=targets(row,ball),before=E.clone(ball),after=E.clone(ball);check(ball);if(before.addons?.[key])for(const id of ids)delete before.addons[key].roles[id];put(after,ids,row);return {before,after,ids,input:E.resolve(before),output:E.resolve(after)};}
  function row(mode='multiply'){return{id:'filter_'+E.uid(),mode,sourceRgb:BlendMath.bytes(BlendMath.fromHex(FilterExamples.paints[mode][0])),opacity:1,enabled:true,scope:'all',roleId:'base',selections:{}};}
  function checkRow(r){checkConfig(r);if(r.paintHue!==undefined&&(!Number.isFinite(r.paintHue)||r.paintHue<0||r.paintHue>=360))throw Error('Invalid applied paint hue.');if(typeof r.id!=='string'||!['all','same','custom'].includes(r.scope)||typeof r.roleId!=='string'||!r.selections||typeof r.selections!=='object'||Array.isArray(r.selections)||Object.values(r.selections).some(ids=>!Array.isArray(ids)||ids.some(id=>typeof id!=='string')))throw Error('Invalid saved comparison row.');}
  function checkStudy(s){if(!s||typeof s.id!=='string'||typeof s.name!=='string'||!Array.isArray(s.ballIds)||s.ballIds.length>100||s.ballIds.some(id=>typeof id!=='string')||new Set(s.ballIds).size!==s.ballIds.length||!Array.isArray(s.rows)||s.rows.length<1||s.rows.length>12||new Set(s.rows.map(r=>r.id)).size!==s.rows.length||!Number.isFinite(s.split)||s.split<0||s.split>1||typeof s.arrows!=='boolean'||typeof s.labels!=='boolean')throw Error('Invalid saved Filter Lab study.');if(s.angle!==undefined&&(!Number.isFinite(s.angle)||s.angle<0||s.angle>=360))throw Error('Invalid saved comparison angle.');if(s.keepSplit!==undefined&&typeof s.keepSplit!=='boolean')throw Error('Invalid saved gallery comparison visibility.');s.rows.forEach(checkRow);if(s.compareAll!==undefined&&typeof s.compareAll!=='boolean')throw Error('Invalid comparison toggle.');for(const field of ['regularRows','comparisonRows'])if(s[field]!==undefined){if(!Array.isArray(s[field])||s[field].length>12||(field==='regularRows'&&!s[field].length)||new Set(s[field].map(r=>r.id)).size!==s[field].length)throw Error('Invalid saved comparison rows.');s[field].forEach(checkRow);if(field==='comparisonRows'&&s[field].length&&(s[field].length!==12||new Set(s[field].map(r=>r.mode)).size!==12))throw Error('Invalid saved all-filter comparisons.');}if(s.compareAll&&(s.rows.length!==12||new Set(s.rows.map(r=>r.mode)).size!==12||!s.regularRows?.length||!s.regularRows.some(r=>r.id===s.regularRowId)))throw Error('Invalid saved comparison toggle rows.');for(const overrides of Object.values(s.inputs||{}))for(const hex of Object.values(overrides))BlendMath.fromHex(hex);}
  return{E,key,roles,checkConfig,check,config,resolve,active,edit,controls,pickerEditView,put,originals,editOriginal,targets,pair,row,checkRow,checkStudy};
})();
