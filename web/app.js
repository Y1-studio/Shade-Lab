'use strict';
const E=Shade,R=ShadeRender,S=ShadeStudio,C=ShadeCollection,$=id=>document.getElementById(id);
const make=(tag,attrs={},text)=>{const n=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==='class')n.className=v;else if(k==='style')n.style.cssText=v;else n.setAttribute(k,v);}if(text!==undefined)n.textContent=text;return n;};
let project=E.defaultProject(),ballId=project.balls[0].id,roleId='base',analysisIds=['base','highlight','shadow'],samples=[],sampleIndex=-1,history=[],future=[],markers=[],reference=null,drag=null,auxiliaryTarget=null;
const qaMode=new URLSearchParams(location.search).has('qa');
let recoveryRaw=null,startupMessage='',saveTimer=0,saveRevision=0,unsavedEdits=false,frame=0,needsFullRender=false,gesture=null,pendingInputColor=null;
let temporaryWorkspace=null,workspaceEpoch=0;
try{
 const saved=qaMode?null:localStorage.getItem('shadelab-v1');
 if(saved){
  try{project=E.normalizeDocument(JSON.parse(saved));if(project.schema!=='shadelab.project')throw Error('Saved data is not a project.');}
  catch(error){recoveryRaw=saved;project=E.defaultProject();startupMessage='The previous session could not be loaded. Its backup is preserved; use Download saved backup.';}
 }
}catch{startupMessage='Automatic saving is unavailable. Use Save project to keep your work.';}
ballId=project.balls[0].id;samples=project.samples||[];project.samples=samples;sampleIndex=samples.length-1;
const ball=()=>project.balls.find(b=>b.id===ballId)||project.balls[0];
const role=()=>ball().roles.find(r=>r.id===roleId);
const colors=()=>E.resolve(ball());
const pickerTarget=(b=ball())=>auxiliaryTarget&&auxiliaryTarget.ballId===b.id?ShadeAddons.colorTarget(auxiliaryTarget,b):null;
const pickerColor=(b=ball())=>pickerTarget(b)?.color||E.resolve(E.pickerEditView(b).ball)[roleId];
function editPickerColor(b,color,kind='color'){pendingInputColor=[...color];if(pickerTarget(b)){ShadeAddons.editColorTarget(auxiliaryTarget,b,color,{kind});return;}if(kind==='sample')E.sampleColor(b,roleId,color,{source:'picker'});else E.editColor(b,roleId,color,!!b.groupMove);}

const snapshot=()=>JSON.stringify(project);
const capture=()=>({data:snapshot(),library:JSON.stringify(S.getLibraryState()),collection:C.state(),ballId,roleId,auxiliaryTarget:auxiliaryTarget?E.clone(auxiliaryTarget):null,auxiliaryState:ShadeAddons.captureColorTarget(auxiliaryTarget,ball()),analysisIds:[...analysisIds],sampleIndex});
const stateChanged=saved=>saved.data!==snapshot()||saved.library!==JSON.stringify(S.getLibraryState());
function restore(saved,restoreAuxiliary=false){
 project=JSON.parse(saved.data);samples=project.samples||[];project.samples=samples;
 ballId=saved.ballId;roleId=saved.roleId;auxiliaryTarget=saved.auxiliaryTarget||null;analysisIds=[...saved.analysisIds];sampleIndex=saved.sampleIndex;
 if(restoreAuxiliary)ShadeAddons.restoreColorTarget(auxiliaryTarget,ball(),saved.auxiliaryState);
 normalizeSelection();
 S.setLibrary(JSON.parse(saved.library||'[]'));
 C.restore(saved.collection);
}
function normalizeSelection(){
 if(!project.balls.some(b=>b.id===ballId))ballId=project.balls[0].id;
 if(roleId!=='base'&&!ball().roles.some(r=>r.id===roleId))roleId='base';
 if(auxiliaryTarget&&auxiliaryTarget.ballId!==ballId&&ShadeAddons.colorTarget(auxiliaryTarget,ball())?.preserveSelection)auxiliaryTarget.ballId=ballId;
 if(auxiliaryTarget&&(auxiliaryTarget.ballId!==ballId||roleId!=='base'||!pickerTarget()))auxiliaryTarget=null;
 sampleIndex=samples.length?E.clamp(sampleIndex,0,samples.length-1):-1;
 C.normalize();
}
function pushHistory(stack,saved){
 if(stack.at(-1)?.data!==saved.data||stack.at(-1)?.library!==saved.library)stack.push(saved);
 const size=s=>(s.data.length+(s.library?.length||0))*2;
 let bytes=stack.reduce((n,s)=>n+size(s),0);
 while(stack.length>1&&(stack.length>100||bytes>8*1024*1024))bytes-=size(stack.shift());
}
function status(message,error=false){const output=globalThis.document?.getElementById('status');if(output){output.textContent=message;output.classList.toggle('error',error);}}
function persist(immediate=false,edited=false){
 clearTimeout(saveTimer);saveTimer=0;
 if(temporaryWorkspace||qaMode||recoveryRaw)return;
 if(!edited&&!unsavedEdits)return;
 if(edited)unsavedEdits=true;const revision=++saveRevision;
 const save=()=>{saveTimer=0;try{S.save(project).then(()=>{if(revision===saveRevision)unsavedEdits=false;},error=>status(error.message,true));}catch(error){status(error.message,true);}};
 if(immediate)save();else saveTimer=setTimeout(save,400);
}
window.addEventListener('pagehide',()=>persist(true));
window.addEventListener('beforeunload',event=>{if(unsavedEdits){persist(true);event.preventDefault();event.returnValue='';}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)persist(true);});
function queueRender(full=false){
 needsFullRender=needsFullRender||full;
 if(!frame)frame=requestAnimationFrame(()=>{frame=0;const complete=needsFullRender;needsFullRender=false;render(complete);});
}
function flushRender(full=true){
 if(frame)cancelAnimationFrame(frame);frame=0;needsFullRender=false;render(full);
}
function beginGesture(key){
 if(gesture?.key===key&&gesture.ballId===ballId&&gesture.roleId===roleId)return;
 finishGesture();gesture={key,before:capture(),start:E.clone(ball()),ballId,roleId};
}
function liveEdit(key,fn,incremental=false){
 beginGesture(key);
 try{
  const trial=E.clone(incremental?ball():gesture.start);fn(trial);E.validateBall(trial);
  Object.assign(ball(),trial);if(key==='wheel'||key.startsWith('channel-'))pendingInputColor=[...pickerColor(trial)];queueRender(false);persist(false,stateChanged(gesture.before));
 }catch(error){status(error.message,true);queueRender(false);}
}
function finishGesture(refresh=true){
 if(!gesture)return;
 if(gesture.key==='wheel'){drag=null;document.body.classList.remove('dragging');}
 const saved=gesture.before;gesture=null;
 if(stateChanged(saved)){if(pendingInputColor)ShadeAddons.rememberColor(project,pendingInputColor);pushHistory(history,saved);future=[];persist(true,true);}pendingInputColor=null;
 if(refresh)flushRender(true);
}
function change(fn,message='Updated',full=true){
 finishGesture();pendingInputColor=null;const before=capture();
 try{
  fn();project.samples=samples;E.validateDocument(project);normalizeSelection();if(pendingInputColor&&stateChanged(before))ShadeAddons.rememberColor(project,pendingInputColor);pendingInputColor=null;
 }catch(error){restore(before);flushRender(true);status(error.message,true);if(error.proposal)window.dispatchEvent(new CustomEvent('shade-edit-proposal',{detail:error.proposal}));return false;}
 const changed=stateChanged(before);if(changed){pushHistory(history,before);future=[];}
 flushRender(full);persist(true,changed);status(message);return true;
}
function selectBall(id,event={},select=true){finishGesture();if(select)C.pick(id,event);ballId=id;roleId='base';auxiliaryTarget=null;normalizeSelection();analysisIds=['base','highlight','shadow'].filter(id=>id==='base'||ball().roles.some(r=>r.id===id));flushRender(true);}
function selectColorTarget(target,id=ballId){finishGesture();if(target){selectBall(id,{},!ShadeAddons.colorTarget(target,project.balls.find(b=>b.id===id))?.preserveSelection);auxiliaryTarget={...target,ballId:id};roleId='base';}else auxiliaryTarget=null;normalizeSelection();flushRender(true);}
function focusBall(id,follow=false){if(!project.balls.some(b=>b.id===id))throw Error('Unknown ball.');finishGesture();if(follow)C.follow(id);const target=pickerTarget()?.preserveSelection?{addonId:auxiliaryTarget.addonId,id:auxiliaryTarget.id}:null;selectBall(id,{},false);if(target)selectColorTarget(target,id);}
function selectRole(id,reveal=false){const target=ShadeAddons.colorTargets(ball()).find(t=>t.value===id);if(target){selectColorTarget({addonId:target.addonId,id:target.id});return;}finishGesture();auxiliaryTarget=null;roleId=id;normalizeSelection();flushRender(true);if(reveal)ShadeAddons.colorSelected({ballId,roleId});}
function options(node,items,value){
 const key=JSON.stringify(items);
 if(node.dataset.optionsKey!==key){node.replaceChildren(...items.map(([id,name])=>make('option',{value:id},name)));node.dataset.optionsKey=key;}
 node.value=value;
}
const ids=b=>[['base',b.baseName||'Base'],...b.roles.map(r=>[r.id,r.name])];
function syncInput(id,value){if(document.activeElement!==$(id))$(id).value=value;}
function render(full=true){normalizeSelection();const b=ball(),cs=E.resolve(b),target=pickerTarget(),editView=target?null:E.pickerEditView(b),inputColors=editView&&editView.ball!==b?E.resolve(editView.ball):cs,editingColor=target?.color||inputColors[roleId];if(!cs[roleId])roleId='base';analysisIds=analysisIds.filter(id=>cs[id]);$('undo').disabled=!history.length;$('redo').disabled=!future.length;if(document.activeElement!==$('project-title'))$('project-title').textContent=project.name||'Untitled studies';syncInput('ball-name',b.name);syncInput('base-name',b.baseName||'Base');$('ball-mode').value=b.mode;$('softness').value=b.softness;$('soft-value').textContent=b.softness+'%';$('strength').max=Math.max(3,b.strength);$('strength').value=b.strength;$('strength-value').textContent=b.strength+'×';$('group-move').checked=target?false:!!b.groupMove;$('group-move').disabled=!!target;options($('selected-role'),[...ids(b),...ShadeAddons.colorTargets(b).map(t=>[t.value,t.label])],target?'addon:'+target.addonId+':'+target.id:roleId);syncInput('hex',E.toHex(editingColor));$('native-color').value=E.toHex(editingColor);
 if(full){renderSliders();renderRuleEditor();renderAnalysisChecks();S.renderTypes();}else updateSliders();renderMeasured();
 const shape=project.pickerShape||'triangle',surface=target?null:E.pickerSurface(b,shape),surfaceName=surface?.label||'HSL '+shape;$('picker-shape').value=shape;$('picker-shape-label').textContent=surfaceName.toUpperCase();$('picker-edit-note').textContent=editView?.label||'';$('picker-edit-note').hidden=!$('picker-edit-note').textContent;$('show-wheel').textContent='Wheel + '+shape;$('free-plane-label').textContent='Arrange '+shape+' points freely';$('free-plane').checked=target?true:E.planeFree(b,shape);$('free-hue').checked=target?true:!!b.pickerFree?.hue;$('wheel').setAttribute('aria-label','Hue wheel and '+surfaceName+'. Select a color and drag; numeric controls are below.');
 const locks=target?{plane:'Editing one auxiliary color.',hue:'Editing one auxiliary color.'}:E.controlLocks(b);$('free-plane').disabled=!!locks.plane;$('free-plane').title=locks.plane||'';$('free-hue').disabled=!!locks.hue;$('free-hue').title=locks.hue||'';const pickerBall=target?{...E.clone(b),base:[...target.color],roles:[],addons:{}}:b;markers=R.drawWheel($('wheel'),pickerBall,target?'base':roleId,target?[]:analysisIds,shape,C.guide(),target?{}:{colors:inputColors});C.render();renderGallery();renderComparisons();renderRelationships();renderSamples();const fit=R.graph($('graph'),b,analysisIds);$('fit-result').textContent=!fit?'Select at least 2 colors':fit.vertical!==undefined?`S = ${fit.vertical.toFixed(2)} (vertical)`:`L = ${fit.m.toFixed(3)} × S ${fit.b<0?'−':'+'} ${Math.abs(fit.b).toFixed(2)}\nR² = ${fit.r2.toFixed(3)}`;$('use-fit').disabled=!fit||fit.vertical!==undefined||roleId==='base';ShadeAddons.notify();}
function renderSliders(){
 const model=$('color-model').value;
 if($('sliders').dataset.model!==model){
  const fields=E.CHANNELS[model].map(c=>{
   const row=make('div',{class:'slider-line'});row.append(make('label',{for:'slider-'+c},c));
   const range=make('input',{id:'slider-'+c,type:'range',min:0,max:E.LIMITS[c],step:1,'aria-label':c+' channel'}),number=make('input',{id:'number-'+c,type:'number',min:0,max:E.LIMITS[c],step:1,'aria-label':c+' value'});
   range.addEventListener('pointerdown',()=>beginGesture('channel-'+c));
   range.addEventListener('input',()=>liveEdit('channel-'+c,b=>setChannel(c,Number(range.value),b)));
   for(const event of ['change','pointerup','pointercancel','lostpointercapture','blur'])range.addEventListener(event,finishGesture);
   number.addEventListener('change',()=>{const value=number.valueAsNumber;change(()=>setChannel(c,value));});
   row.append(range,number);return row;
  });
  $('sliders').replaceChildren(...fields);$('sliders').dataset.model=model;
 }
 updateSliders();
}
function updateSliders(){const vals=E.values(pickerColor()),model=$('color-model').value;for(const c of E.CHANNELS[model]){const range=$('slider-'+c),num=$('number-'+c);if(!range)continue;range.value=Math.round(vals[c]);if(document.activeElement!==num)num.value=Math.round(vals[c]);const lo={...vals,[c]:0},hi={...vals,[c]:E.LIMITS[c]};range.style.background=c==='H'?'linear-gradient(to right,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)':`linear-gradient(to right,${E.toHex(E.fromModel(model,lo,vals.H))},${E.toHex(E.fromModel(model,hi,vals.H))})`;}}
function setChannel(c,v,b=ball()){if(!Number.isFinite(v))throw Error('Enter a valid number.');const current=pickerColor(b),vals=E.values(current);vals[c]=E.clamp(Math.round(v),0,E.LIMITS[c]);editPickerColor(b,E.fromModel($('color-model').value,vals,current[0]));}
function reconcile(parent,nodes){
 nodes.forEach((node,i)=>{if(parent.children[i]!==node)parent.insertBefore(node,parent.children[i]||null);});
 while(parent.children.length>nodes.length)parent.lastElementChild.remove();
}
const galleryCards=new Map(),relationshipRows=new Map();
let comparisonKey='',comparisonItems=[];
function renderGallery(){
 const liveIds=new Set(project.balls.map(b=>b.id));
 for(const [id,item] of galleryCards)if(!liveIds.has(id)){item.canvas.width=0;item.canvas.height=0;item.card.remove();galleryCards.delete(id);}
 const cards=project.balls.map(b=>{
  let item=galleryCards.get(b.id);
  if(!item){
   const id=b.id,card=make('article',{class:'ball-card',tabindex:0}),top=make('div',{class:'ball-top'}),actions=make('div',{class:'ball-actions'}),title=make('strong'),copy=make('button',{title:'Duplicate ball'},'⧉'),remove=make('button',{title:'Remove ball'},'×'),canvas=make('canvas',{width:400,height:330}),swatches=make('div',{class:'swatches'}),meta=make('div',{class:'card-meta'}),mode=make('span'),strength=make('span');
   const selectRegion=(e,reveal=false)=>{if(e.ctrlKey||e.metaKey||e.shiftKey)return;const rect=canvas.getBoundingClientRect(),b=project.balls.find(b=>b.id===id),hit=R.ballHit(b,canvas.width,canvas.height,(e.clientX-rect.left)*canvas.width/rect.width,(e.clientY-rect.top)*canvas.height/rect.height);if(!hit)return;e.stopPropagation();focusBall(id,true);selectRole(hit,reveal);};
   canvas.addEventListener('click',e=>selectRegion(e));canvas.addEventListener('dblclick',e=>selectRegion(e,true));
   card.addEventListener('click',e=>selectBall(id,e));card.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target===card)selectBall(id,e);});
   copy.onclick=e=>{e.stopPropagation();C.duplicate([id]);};
   remove.onclick=e=>{e.stopPropagation();C.remove([id]);};
   actions.append(copy,remove);top.append(title,actions);meta.append(mode,strength);card.append(top,canvas,swatches,meta);
   item={card,title,copy,remove,canvas,swatches,mode,strength,buttons:new Map(),key:''};galleryCards.set(id,item);
  }
  item.card.classList.toggle('active',b.id===ballId);item.card.setAttribute('aria-label',b.name);
  C.decorate(item.card,b);
  const key=E.extensionRevision()+'/'+JSON.stringify({...b,pickerFree:undefined});
  if(key!==item.key){
   item.title.textContent=b.name;item.copy.setAttribute('aria-label','Duplicate '+b.name);item.remove.setAttribute('aria-label','Remove '+b.name);
   R.ballCanvas(item.canvas,b);const cs=E.resolve(b),nodes=[];
   for(const [id,hsl] of Object.entries(cs)){
    let sw=item.buttons.get(id);
    if(!sw){sw=make('button',{class:'swatch'});const bid=b.id;sw.onclick=e=>{e.stopPropagation();focusBall(bid,true);selectRole(id);};sw.ondblclick=e=>{e.stopPropagation();focusBall(bid,true);selectRole(id,true);};item.buttons.set(id,sw);}
    sw.style.background=b.grayscale?E.grayscaleHex(hsl):E.toHex(hsl);sw.title=E.roleName(b,id)+' · '+E.toHex(hsl);sw.setAttribute('aria-label',E.roleName(b,id));nodes.push(sw);
   }
   for(const [id] of item.buttons)if(!Object.hasOwn(cs,id))item.buttons.delete(id);
   reconcile(item.swatches,nodes);item.mode.textContent=b.mode==='custom'?'Custom layers':b.mode==='cel'?'Cel shading':'Rim + bounce';item.strength.textContent=b.strength+'×';item.key=key;
  }
  for(const [id,sw] of item.buttons)sw.classList.toggle('selected',b.id===ballId&&id===roleId);
  return item.card;
 });
 reconcile($('gallery'),cards);
}
function renderComparisons(){
 const b=ball(),ts=project.comparisons||[.5,1,2,3];$('compare-name').textContent=b.name;syncInput('comparison-values',ts.join(', '));
 const key=JSON.stringify([E.extensionRevision(),b.base,b.roles,b.addons,b.mode,b.design,b.softness,b.grayscale,ts]);if(key===comparisonKey)return;
 const nodes=ts.map((t,i)=>{
  let item=comparisonItems[i];
  if(!item){const div=make('div',{class:'comparison-card'}),canvas=make('canvas',{width:240,height:210}),caption=make('span');div.append(canvas,caption);item={div,canvas,caption};comparisonItems[i]=item;}
  try{R.ballCanvas(item.canvas,b,t);item.canvas.hidden=false;item.caption.textContent=t+'× strength';}
  catch(e){item.canvas.hidden=true;item.caption.textContent=t+'×: '+e.message;}
  return item.div;
 });
 for(const item of comparisonItems.slice(ts.length)){item.canvas.width=0;item.canvas.height=0;}
 comparisonItems.length=ts.length;reconcile($('comparison-gallery'),nodes);comparisonKey=key;
}
function renderRelationships(){
 const b=ball(),cs=colors(),nodes=[];
 for(const [id,name] of ids(b)){
  let item=relationshipRows.get(id);
  if(!item){const bt=make('button',{class:'relationship'}),dot=make('span',{class:'color-dot'}),text=make('span',{class:'relation-text'}),title=make('span'),source=make('small'),values=make('span',{class:'relation-values'});text.append(title,source);bt.append(dot,text,values);bt.onclick=()=>selectRole(id);item={bt,dot,title,source,values};relationshipRows.set(id,item);}
  const r=b.roles.find(r=>r.id===id),model=r?.model||'HSL',vals=E.values(cs[id]);
  item.bt.classList.toggle('active',id===roleId);item.title.textContent=name;item.source.textContent=id==='base'?'Starting color · HSL':`← ${E.roleName(b,r.source)} · ${model}`;item.dot.style.background=E.toHex(cs[id]);item.values.textContent=E.CHANNELS[model].map(c=>Math.round(vals[c])).join(' / ');nodes.push(item.bt);
 }
 for(const [id] of relationshipRows)if(!Object.hasOwn(cs,id))relationshipRows.delete(id);
 reconcile($('relationship-list'),nodes);
}
function renderMeasured(){const r=role();if(!r)return;$('measured-differences').textContent=`Current movement from ${E.roleName(ball(),r.source)} at ${ball().strength}×\n${S.arrows(E.measured(ball(),r.id),r.model)}`;}
function renderRuleEditor(){
 const r=role();$('base-note').hidden=!!r;$('rule-editor').hidden=!r;if(!r)return;
 syncInput('role-name',r.name);options($('rule-source'),ids(ball()).filter(([id])=>id!==r.id),r.source);$('rule-model').value=r.model;
 const fieldsNode=$('expression-fields'),amountNode=$('amount-controls'),context=ballId+'/'+r.id+'/'+r.model;
 const newContext=fieldsNode.dataset.context!==context;
 if(newContext){
  fieldsNode.replaceChildren(...E.CHANNELS[r.model].map(c=>{const div=make('label',{class:'formula-line'}),input=make('input',{'data-channel':c,'aria-label':c+' formula',spellcheck:'false'});div.append(make('span',{},c),input);return div;}));
  amountNode.replaceChildren(...E.CHANNELS[r.model].map(c=>{const label=make('label',{class:'field'},c+' amount'),input=make('input',{type:'number',step:'any','data-amount':c,'aria-label':c+' amount'});input.addEventListener('input',()=>{if(c==='S'&&$('sl-link').checked){const l=amountNode.querySelector('[data-amount="L"]');if(l)l.value=input.value;}});label.append(input);return label;}));
  fieldsNode.dataset.context=context;
 }
 const key=JSON.stringify([r.rule,r.expressions,r.rule?.kind==='formula'?E.measured(ball(),r.id,1):null]),changed=newContext||fieldsNode.dataset.expressions!==key;
 $('relationship-mode').value=r.rule?.kind||'formula';
 if(changed){
  for(const field of fieldsNode.querySelectorAll('input'))field.value=r.expressions[field.dataset.channel];
  const simple=E.simpleAmounts(r,ball());$('amount-type').value=simple.kind||'points';
  $('simple-builder').querySelector('p').textContent=simple.kind?'Saved amount per 1× step. Signed numbers: − subtracts, + adds. The measured movement above also includes rounding and limits.':'Advanced formulas are preserved. These numbers measure the current differences; applying them replaces this region’s formula.';
  if(r.model==='HSL')$('sl-link').checked=simple.amounts.S===simple.amounts.L;
  for(const field of amountNode.querySelectorAll('input'))field.value=Number(simple.amounts[field.dataset.amount].toFixed(4));
  fieldsNode.dataset.expressions=key;
 }
 $('sl-link-label').hidden=r.model!=='HSL';
}
const analysisChecks=new Map();let sampleButtons=[];
function renderAnalysisChecks(){
 const nodes=ids(ball()).map(([id,name])=>{
  let item=analysisChecks.get(id);
  if(!item){const label=make('label',{class:'check'}),check=make('input',{type:'checkbox'}),text=make('span');check.onchange=()=>{analysisIds=check.checked?[...new Set([...analysisIds,id])]:analysisIds.filter(v=>v!==id);queueRender(false);};label.append(check,text);item={label,check,text};analysisChecks.set(id,item);}
  item.check.checked=analysisIds.includes(id);item.text.textContent=name;return item.label;
 });
 const keys=new Set(ids(ball()).map(([id])=>id));for(const [id] of analysisChecks)if(!keys.has(id))analysisChecks.delete(id);
 reconcile($('analysis-roles'),nodes);
}
function renderSamples(){
 const nodes=samples.map((s,i)=>{
  let b=sampleButtons[i];
  if(!b){b=make('button',{class:'sample'});b.onclick=()=>change(()=>{sampleIndex=i;editPickerColor(ball(),samples[i],'sample');},pickerTarget()?'Sample applied to '+pickerTarget().label:'Sample applied at 1×');sampleButtons[i]=b;}
  b.classList.toggle('active',sampleIndex===i);b.style.background=E.toHex(s);b.title=E.toHex(s);b.setAttribute('aria-label','Apply sample '+(i+1)+' '+E.toHex(s));return b;
 });
 sampleButtons.length=samples.length;reconcile($('samples'),nodes);$('sample-study').disabled=sampleIndex<0;$('sample-region').disabled=sampleIndex<0;
}
function addSample(hsl,apply=true){
 return change(()=>{
  if(apply)editPickerColor(ball(),hsl,'sample');
  samples.push([...hsl]);sampleIndex=samples.length-1;
 },pickerTarget()?'Color sampled for '+pickerTarget().label+'.':'Color sampled at 1×. Measured offsets saved; pick again to collect another.');
}
const offsetExpression=(c,d,t)=>t?`${c} + (${Number((d/t).toPrecision(10))}) * t`:`${c} + (${Number(d.toPrecision(10))})`;
function newRegion(hsl){const b=ball(),id='color_'+E.uid(),target=hsl||colors()[roleId];b.strength=1;b.roles.push(E.setRule({id,name:'Color '+(b.roles.length+1),source:'base',model:'HSL'},'offset',E.difference(b.base,target)));roleId=id;}
$('add-ball').onclick=()=>change(()=>{const b=E.defaultBall('Study '+(project.balls.length+1),[Math.floor(Math.random()*360),65,50]);project.balls.push(b);ballId=b.id;C.reset(ballId);roleId='base';},'New ball added');
$('ball-name').onchange=()=>change(()=>ball().name=$('ball-name').value.trim()||'Untitled ball');
$('base-name').onchange=()=>change(()=>ball().baseName=$('base-name').value.trim()||'Base');
$('project-title').onblur=()=>change(()=>project.name=$('project-title').textContent.trim()||'Untitled studies');
$('selected-role').onchange=()=>selectRole($('selected-role').value);
$('color-model').onchange=()=>{finishGesture();renderSliders();};
$('show-wheel').onclick=()=>{$('wheel-section').hidden=false;$('show-wheel').classList.add('active');$('show-sliders').classList.remove('active');};
$('show-sliders').onclick=()=>{$('wheel-section').hidden=false;$('show-wheel').classList.remove('active');$('show-sliders').classList.add('active');};
$('hex').onchange=()=>change(()=>editPickerColor(ball(),E.hexHsl($('hex').value),'sample'));
$('native-color').onchange=()=>change(()=>editPickerColor(ball(),E.hexHsl($('native-color').value),'sample'));
$('group-move').onchange=()=>{if(pickerTarget())return;const on=$('group-move').checked;change(()=>{if(on)E.lockOffsets(ball());ball().groupMove=on;},on?'Current HSL spacing captured. Drag any marker to move the group.':'Base-driven formula editing restored');};
for(const[id,key]of [['softness','softness'],['strength','strength']]){
 const input=$(id);input.onpointerdown=()=>beginGesture(key);input.oninput=()=>liveEdit(key,b=>{b[key]=Number(input.value);});
 for(const event of ['change','pointerup','pointercancel','lostpointercapture','blur'])input.addEventListener(event,finishGesture);
}
$('ball-mode').onchange=()=>{const mode=$('ball-mode').value;if(mode==='custom'&&!ball().design){$('ball-mode').value=ball().mode;S.openLayers();}else change(()=>ball().mode=mode);};
$('role-name').onchange=()=>change(()=>role().name=$('role-name').value.trim()||'Color');
$('add-role').onclick=()=>change(()=>newRegion(), 'Region added to palette and analysis');
$('delete-role').onclick=()=>change(()=>{if(ball().roles.some(r=>r.source===roleId)||ball().design?.layers.some(l=>l.kind==='mask'&&l.role===roleId))throw Error('Other colors or layers use this region. Change their source or assignment before removing it.');ball().roles=ball().roles.filter(r=>r.id!==roleId);roleId='base';},'Region removed; Undo restores it');
$('rule-source').onchange=()=>change(()=>{role().source=$('rule-source').value;ball().groupMove=false;});
$('rule-model').onchange=()=>{const model=$('rule-model').value;change(()=>{const r=role(),cs=colors(),d=E.difference(cs[r.source],cs[roleId],model);r.model=model;E.setRule(r,'offset',Object.fromEntries(Object.entries(d).map(([c,v])=>[c,v/(ball().strength||1)])));if(!ball().strength)ball().strength=1;ball().groupMove=false;});};
$('relationship-mode').onchange=()=>{const kind=$('relationship-mode').value;change(()=>{const b=ball(),r=role();if(kind==='formula')E.setRule(r,'formula');else{const target=colors()[roleId];b.strength=1;const source=E.resolve(b)[r.source],d=E.difference(source,target,r.model);if(kind==='percent'){const v=E.values(source);for(const c of E.CHANNELS[r.model]){if(!v[c]&&Math.abs(d[c])>1e-9)throw Error('A zero source channel cannot create this color with percentages. Use measured offsets.');d[c]=v[c]?d[c]/v[c]*100:0;}}E.setRule(r,kind,d);}b.groupMove=false;},'Relationship mode updated');};
$('apply-formulas').onclick=()=>{const trial=E.clone(ball()),r=trial.roles.find(r=>r.id===roleId);r.expressions={};for(const field of $('expression-fields').querySelectorAll('input'))r.expressions[field.dataset.channel]=field.value.trim();E.setRule(r,'formula');trial.groupMove=false;try{E.resolve(trial);change(()=>Object.assign(ball(),trial),'Advanced formulas applied');}catch(e){status(e.message,true);}};
$('apply-amounts').onclick=()=>{const kind=$('amount-type').value==='percent'?'percent':'offset',link=$('sl-link').checked,amounts=Object.fromEntries([...$('amount-controls').querySelectorAll('input')].map(n=>[n.dataset.amount,n.valueAsNumber]));change(()=>{const r=role();if(r.model==='HSL'&&link)amounts.L=amounts.S;if(!r.rule||r.rule.kind==='formula')ball().strength=1;E.setRule(r,kind,amounts);ball().groupMove=false;},'Linked amounts applied');};
$('update-comparisons').onclick=()=>change(()=>{const ts=$('comparison-values').value.split(',').map(s=>Number(s.trim()));if(!ts.length||ts.some(t=>!Number.isFinite(t)||t<0||t>10))throw Error('Use comma-separated strengths between 0 and 10.');project.comparisons=ts;},'Comparison strengths updated');
$('use-fit').onclick=()=>change(()=>{const cs=colors(),fit=E.fitLine(analysisIds.map(id=>[cs[id][1],cs[id][2]]));if(!fit||fit.vertical!==undefined||!role())throw Error('Select a derived region and at least two colors with different saturation.');const r=role();if(r.model!=='HSL')throw Error('Change this region’s formula model to HSL first.');r.expressions.L=`(${Number(fit.m.toPrecision(8))}) * (${r.expressions.S}) + (${Number(fit.b.toPrecision(8))})`;E.setRule(r,'formula');ball().groupMove=false;},'Fitted line saved as the selected region’s L rule');
function undo(redo=false){C.cancelDrag();finishGesture();const from=redo?future:history,to=redo?history:future;if(!from.length)return;pushHistory(to,capture());restore(from.pop());flushRender(true);persist(true,true);status(redo?'Redone':'Undone');}
$('undo').onclick=()=>undo();$('redo').onclick=()=>undo(true);document.addEventListener('keydown',e=>{if(!document.querySelector('dialog[open]')&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&!document.activeElement.isContentEditable){e.preventDefault();undo(e.shiftKey);}});
const safeName=s=>(s||'shade-lab').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,120);
function download(blob,name){const url=URL.createObjectURL(blob),a=make('a',{href:url,download:name});a.click();window.dispatchEvent(new CustomEvent('shade-download-ready',{detail:{name,type:blob.type}}));setTimeout(()=>URL.revokeObjectURL(url),10000);}
function jsonDownload(data,name){download(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),safeName(name)+'.json');status('Saved '+name+'.json');}
$('save-project').onclick=()=>{finishGesture();persist(true);try{jsonDownload(S.portable(project),project.name);}catch(e){status(e.message,true);}};
$('save-preset').onclick=()=>{const name=$('preset-name').value.trim()||'My shading recipe';jsonDownload(E.preset(ball(),name),name);};
let documentRequest=0;
$('open-json').onclick=()=>$('json-file').click();$('json-file').onchange=async()=>{const file=$('json-file').files[0];if(!file)return;const request=++documentRequest;try{const data=await S.prepareDocument(JSON.parse(await file.text()));if(request!==documentRequest)return;if(data.schema==='shadelab.ball-type')S.importType(data);else {const opened=change(()=>{if(data.schema==='shadelab.project'){project=data;ballId=project.balls[0].id;C.reset(ballId);roleId='base';samples=project.samples||[];sampleIndex=samples.length-1;}else{E.applyPreset(ball(),data);ball().groupMove=false;roleId='base';$('preset-name').value=data.name||'Imported recipe';}},'Opened '+file.name);if(opened&&data.schema==='shadelab.project')window.dispatchEvent(new CustomEvent('shade-project-opened'));}}catch(e){if(request===documentRequest)status('Could not open JSON: '+e.message,true);}finally{if(request===documentRequest)$('json-file').value='';}};
let picking=false;
$('eyedropper').onclick=async()=>{
 if(picking)return;
 if(!window.EyeDropper){status('Screen picking is unavailable in this browser. You can paste or load a screenshot.',true);return;}
 finishGesture();const targetBall=ballId,targetRole=roleId,targetPicker=JSON.stringify(auxiliaryTarget),epoch=workspaceEpoch;picking=true;$('eyedropper').disabled=true;
 try{
  const result=await new EyeDropper().open();
  if(epoch!==workspaceEpoch||targetBall!==ballId||targetRole!==roleId||targetPicker!==JSON.stringify(auxiliaryTarget)){status('Selection changed while picking. Select the intended color and pick again.',true);return;}
  addSample(E.hexHsl(result.sRGBHex));
 }catch(e){status(e.name==='AbortError'?'Screen pick cancelled.':'Screen picker: '+e.message,e.name!=='AbortError');}
 finally{picking=false;$('eyedropper').disabled=false;}
};
if(!window.EyeDropper)$('pick-hint').textContent='Screen picking is unavailable in this browser. Image sampling still works.';
$('clear-samples').onclick=()=>change(()=>{samples=[];sampleIndex=-1;},'Samples cleared; Undo restores them');
$('sample-study').onclick=()=>change(()=>{const b=E.defaultBall('Sample study '+(project.balls.length+1),samples[sampleIndex]);project.balls.push(b);ballId=b.id;C.reset(ballId);roleId='base';},'New study from screen sample');
$('sample-region').onclick=()=>change(()=>newRegion(samples[sampleIndex]),'Sample added as a region');
$('picker-shape').onchange=()=>{const shape=$('picker-shape').value;change(()=>{project.pickerShape=shape;},'Picker changed; colors are unchanged');};
for(const [control,kind]of [['free-plane','plane'],['free-hue','hue']])$(control).onchange=()=>{if(pickerTarget())return;const on=$(control).checked;change(()=>{const b=ball();b.pickerFree={plane:false,hue:false,...b.pickerFree};if(kind==='plane'){b.pickerFree.planeByShape={square:E.planeFree(b,'square'),triangle:E.planeFree(b,'triangle'),[project.pickerShape||'triangle']:on};}else b.pickerFree.hue=on;},on?'Arrange individual points; other colors stay fixed.':'Arrangement locked. Drag a point to move the group.');};
$('wheel').onpointerdown=e=>{
 if(e.button!==undefined&&e.button!==0)return;document.activeElement?.blur?.();finishGesture();const rect=$('wheel').getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*320,y=(e.clientY-rect.top)/rect.height*320;
 const nearby=markers.map(m=>({...m,d:Math.hypot(m.x-x,m.y-y)})).filter(m=>m.d<11).sort((a,b)=>a.d-b.d),active=nearby.find(m=>m.id===roleId),nearest=(active&&active.d<=6?active:nearby[0])||(!pickerTarget()?ShadeAddons.hitPicker({ball:ball(),shape:project.pickerShape||'triangle',x,y}):null);
 let kind;if(nearest){roleId=nearest.id;kind=nearest.kind;flushRender(true);}else{const radius=Math.hypot(x-160,y-160);if(radius>127&&radius<158)kind='hue';else{if(!E.pickerContains(x,y,project.pickerShape||'triangle',pickerTarget()?undefined:ball()))return;kind='plane';}}
 e.preventDefault();beginGesture('wheel');const color=pickerColor(gesture.start);drag={kind,shape:project.pickerShape||'triangle',pointerId:e.pointerId,lastPoint:[x,y],offsetX:nearest?nearest.x-x:0,offsetY:nearest?nearest.y-y:0,hueOffset:nearest?color[0]-(E.wheelHue(x,y)):0};
 $('wheel').setPointerCapture(e.pointerId);document.body.classList.add('dragging');if(!nearest)moveWheel(e);
};
function moveWheel(e){
 if(!drag||(e.pointerId!==undefined&&e.pointerId!==drag.pointerId))return;
 const rect=$('wheel').getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*320+drag.offsetX,y=(e.clientY-rect.top)/rect.height*320+drag.offsetY;
 const rawPoint=[(e.clientX-rect.left)/rect.width*320,(e.clientY-rect.top)/rect.height*320],bounded=!pickerTarget()&&drag.kind==='plane'&&!!E.controlLocks(ball()).plane,last=drag.lastPoint;drag.lastPoint=rawPoint;
 liveEdit('wheel',b=>{const current=pickerColor(b),displayBall=pickerTarget(b)?undefined:b,rawX=rawPoint[0],rawY=rawPoint[1],absolute=E.pickerSurface(displayBall,drag.shape)?.pointerMode==='absolute',point=bounded&&!absolute?E.pickerPoint(current,drag.shape,displayBall).map((v,i)=>v+rawPoint[i]-last[i]):[x,y],next=drag.kind==='hue'?[E.wrap(E.wheelHue(rawX,rawY)+drag.hueOffset),current[1],current[2]]:E.pickerColor(...point,current[0],drag.shape,displayBall);
 if(pickerTarget(b)){editPickerColor(b,next,drag.kind);return;}E.movePickerColor(b,roleId,drag.kind,next,drag.kind==='plane'?E.planeFree(b,drag.shape):!!b.pickerFree?.hue,drag.shape,bounded?point:undefined,true,E.resolve(E.pickerEditView(gesture.start).ball));},bounded);
}
function endWheel(e){if(drag&&(e?.pointerId===undefined||e.pointerId===drag.pointerId)){drag=null;document.body.classList.remove('dragging');finishGesture();}}
function cancelWheel(e){if(!drag||e.pointerId!==drag.pointerId)return;const saved=gesture?.before;gesture=null,pendingInputColor=null;drag=null;document.body.classList.remove('dragging');if(saved)restore(saved,true);flushRender(true);persist(true);}
$('wheel').onpointermove=moveWheel;$('wheel').addEventListener('pointercancel',cancelWheel);for(const event of ['pointerup','lostpointercapture'])$('wheel').addEventListener(event,endWheel);
window.addEventListener('blur',()=>{endWheel();finishGesture();});
let imageRequest=0;
async function loadImage(file){const request=++imageRequest;let img;try{img=await createImageBitmap(file);if(request!==imageRequest)return;const next=document.createElement('canvas');next.width=img.width;next.height=img.height;next.getContext('2d').drawImage(img,0,0);const canvas=$('reference'),scale=Math.min(1,1200/img.width);canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);reference=next;canvas.hidden=false;$('reference-empty').hidden=true;status('Reference loaded. Click a color to sample it.');}catch(e){if(request===imageRequest)status('Could not load image: '+e.message,true);}finally{img?.close();}}
$('load-image').onclick=()=>$('image-file').click();$('image-file').onchange=()=>{if($('image-file').files[0])loadImage($('image-file').files[0]);$('image-file').value='';};
document.addEventListener('paste',e=>{if(document.querySelector('dialog[open]'))return;const item=[...(e.clipboardData?.items||[])].find(i=>i.type.startsWith('image/'));if(item){e.preventDefault();loadImage(item.getAsFile());}});
const referencePanel=document.querySelector('.reference');referencePanel.ondragover=e=>e.preventDefault();referencePanel.ondrop=e=>{e.preventDefault();const file=[...e.dataTransfer.files].find(f=>f.type.startsWith('image/'));if(file)loadImage(file);};
$('reference').onclick=e=>{if(!reference)return;const rect=$('reference').getBoundingClientRect(),x=E.clamp(Math.floor((e.clientX-rect.left)/rect.width*reference.width),0,reference.width-1),y=E.clamp(Math.floor((e.clientY-rect.top)/rect.height*reference.height),0,reference.height-1),data=reference.getContext('2d').getImageData(x,y,1,1).data;if(!data[3]){status('This pixel is fully transparent.');return;}addSample(E.rgbHsl([...data].slice(0,3)));};
$('export').onclick=()=>$('export-dialog').showModal();$('download-png').onclick=()=>{const epoch=workspaceEpoch;try{const scope=$('export-scope').value,kind=$('export-kind').value;let list=scope==='all'?project.balls:scope==='comparisons'?(project.comparisons||[.5,1,2,3]).map(t=>({...E.clone(ball()),strength:t,name:ball().name+' · '+t+'×'})):C.chosen();if(scope!=='samples'&&!list.length)throw Error('Select at least one ball to export.');if(scope==='samples'&&!samples.length)throw Error('Pick at least one screen or image color first.');if(scope==='samples')list=samples.map((s,i)=>({...E.clone(ball()),base:[...s],name:'Sample '+(i+1)}));const canvas=R.exportCanvas(list,kind,Number($('export-size').value),$('export-background').value,$('export-labels').checked,scope==='samples'&&kind==='strips'?samples:[],$('export-grayscale').checked);canvas.toBlob(blob=>{if(epoch!==workspaceEpoch)return;if(!blob){status('PNG export failed. Try fewer balls or a smaller width.',true);return;}download(blob,safeName(scope==='all'?project.name:scope==='samples'?'Screen samples':ball().name)+'-'+kind+'.png');status('PNG exported');$('export-dialog').close();},'image/png');}catch(e){status(e.message,true);}};
function beginTemporaryWorkspace(owner,data){
 if(temporaryWorkspace&&temporaryWorkspace.owner!==owner)throw Error('Finish the current temporary workspace first.');
 const draft=E.normalizeDocument(data.project);if(draft.schema!=='shadelab.project')throw Error('Choose a project workspace.');
 finishGesture();if(!temporaryWorkspace)persist(true);const saved=capture();
 if(!temporaryWorkspace)temporaryWorkspace={checkpoints:new Map(),owner,saved,history:[...history],future:[...future],reference,referenceSize:[$('reference').width,$('reference').height],model:$('color-model').value,selectedType:S.getSelection(),unsavedEdits};
 workspaceEpoch++;documentRequest++;imageRequest++;S.cancelPending();
 project=draft;history=[];future=[];reference=null;samples=project.samples||[];project.samples=samples;sampleIndex=samples.length-1;ballId=project.balls[0].id;roleId='base';auxiliaryTarget=null;analysisIds=['base','highlight','shadow'];unsavedEdits=false;
 if(data.library)S.setLibrary(data.library);C.reset(ballId);$('reference').hidden=true;$('reference-empty').hidden=false;
 flushRender(true);window.dispatchEvent(new CustomEvent('shade-project-opened',{detail:{temporary:true,owner}}));window.dispatchEvent(new CustomEvent('shade-workspace-changed',{detail:{temporary:true,owner}}));return true;
}
function checkpointTemporaryWorkspace(owner){
 if(temporaryWorkspace?.owner!==owner)throw Error('No owned temporary workspace.');finishGesture();const token=E.uid();temporaryWorkspace.checkpoints.set(token,{saved:capture(),history:[...history],future:[...future],reference,referenceSize:[$('reference').width,$('reference').height],model:$('color-model').value,selectedType:S.getSelection()});return token;
}
function restoreTemporaryWorkspace(owner,token){
 if(temporaryWorkspace?.owner!==owner)throw Error('No owned temporary workspace.');const value=temporaryWorkspace.checkpoints.get(token);if(!value)return false;
 finishGesture();workspaceEpoch++;documentRequest++;imageRequest++;S.cancelPending();restore(value.saved,true);history=value.history;future=value.future;reference=value.reference;$('color-model').value=value.model;S.setSelection(value.selectedType);if(reference){const c=$('reference');c.width=value.referenceSize[0];c.height=value.referenceSize[1];c.getContext('2d').drawImage(reference,0,0,c.width,c.height);c.hidden=false;$('reference-empty').hidden=true;}else{$('reference').hidden=true;$('reference-empty').hidden=false;}temporaryWorkspace.checkpoints.delete(token);flushRender(true);window.dispatchEvent(new CustomEvent('shade-project-opened',{detail:{temporary:true,owner}}));return true;
}
function endTemporaryWorkspace(owner){
 if(!temporaryWorkspace||temporaryWorkspace.owner!==owner)return false;
 finishGesture();workspaceEpoch++;documentRequest++;imageRequest++;S.cancelPending();
 const saved=temporaryWorkspace;restore(saved.saved,true);history=saved.history;future=saved.future;reference=saved.reference;$('color-model').value=saved.model;S.setSelection(saved.selectedType);unsavedEdits=saved.unsavedEdits;
 if(reference){const c=$('reference');c.width=saved.referenceSize[0];c.height=saved.referenceSize[1];c.getContext('2d').drawImage(reference,0,0,c.width,c.height);c.hidden=false;$('reference-empty').hidden=true;}else{$('reference').hidden=true;$('reference-empty').hidden=false;}
 temporaryWorkspace=null;flushRender(true);window.dispatchEvent(new CustomEvent('shade-project-opened',{detail:{temporary:false,owner}}));window.dispatchEvent(new CustomEvent('shade-workspace-changed',{detail:{temporary:false,owner}}));status('Practice finished · your project is back');return true;
}
S.init({ball,project:()=>project,change,status,download,jsonDownload,finishGesture,context:()=>workspaceEpoch,
 commitBall:(b,collected)=>change(()=>{project.balls.push(b);samples.push(...collected);sampleIndex=samples.length-1;ballId=b.id;C.reset(ballId);roleId='base';},'New ball created'),
 assetReferences:()=>[project,...(temporaryWorkspace?[JSON.parse(temporaryWorkspace.saved.data),JSON.parse(temporaryWorkspace.saved.library),...[...temporaryWorkspace.checkpoints.values()].flatMap(v=>[JSON.parse(v.saved.data),JSON.parse(v.saved.library)])]:[]),...[...history,...future].flatMap(s=>[JSON.parse(s.data),JSON.parse(s.library||'[]')])]
});
C.init({project:()=>project,active:id=>{if(id){ballId=id;roleId='base';}return ballId;},activate:(id,select)=>selectBall(id,{},select),render:()=>flushRender(true),change,finishGesture,status,download});
render(true);
if(recoveryRaw){$('recover-session').hidden=false;$('recover-session').onclick=()=>download(new Blob([recoveryRaw],{type:'application/json'}),'Shade-Lab-saved-backup.json');}
if(startupMessage)status(startupMessage,true);
window.ShadeReady=(async()=>{
 if(qaMode)return;
 document.querySelector('main').inert=true;document.querySelector('header').inert=true;
 try{const saved=await S.load();if(saved.project){project=saved.project;C.reset(project.balls[0].id);samples=project.samples||[];project.samples=samples;ballId=project.balls[0].id;roleId='base';sampleIndex=samples.length-1;recoveryRaw=null;$('recover-session').hidden=true;}S.setLibrary(saved.library);flushRender(true);if(!recoveryRaw)status('Ready · local studies loaded');}
 catch(e){if(e.recovery){recoveryRaw=e.recovery;$('recover-session').hidden=false;$('recover-session').onclick=()=>download(new Blob([recoveryRaw],{type:'application/json'}),'Shade-Lab-saved-backup.json');status('Saved data could not be loaded. Its backup is preserved; use Download saved backup.',true);}else status(e.message,true);}
 finally{document.querySelector('main').inert=false;document.querySelector('header').inert=false;}
})();
// Keep add-ons behind the same validation, history, rendering, and persistence as core edits.
window.ShadeReady=window.ShadeReady.then(()=>ShadeAddons.start({
 snapshot:()=>({project,activeBallId:ballId,activeRoleId:roleId,activeColorTarget:auxiliaryTarget,selectedBallIds:C.chosen().map(b=>b.id)}),
 commit:(edit,message)=>change(()=>{const draft=E.clone(project);edit(draft);E.validateDocument(draft);if(draft.schema!=='shadelab.project')throw Error('An add-on must retain the project schema.');project=E.clone(draft);samples=project.samples||[];},message),
 slots:{help:document.querySelector('.topbar .actions'),tools:$('picker-tools'),view:$('picker-view'),actions:$('picker-actions'),colorPick:$('color-pick-actions'),picker:document.querySelector('.picker-panel'),inspector:document.querySelector('.inspector'),studio:document.querySelector('.studio'),studioNavigation:$('studio-navigation'),studioWorkspace:$('studio-workspace'),studioContent:$('studio-content')},
 beginTemporaryWorkspace,endTemporaryWorkspace,checkpointTemporaryWorkspace,restoreTemporaryWorkspace,selectColorTarget,focusBall,selectRole,applyColor:color=>change(()=>editPickerColor(ball(),color,'sample'),'History color applied'),addColorRegion:color=>change(()=>newRegion(color),'Region added from history'),finishGesture:()=>finishGesture(false),status,copyCanvas:canvas=>C.copyCanvas(canvas),download,refresh:()=>flushRender(true),report:message=>status('Add-on stopped · '+message,true)
}));
