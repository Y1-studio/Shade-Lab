/* Saved types, transactional creation, and PNG layer composition. */
(function(root){
'use strict';
const E=root.Shade,A=root.ShadeAssets,R=root.ShadeRender,$=id=>document.getElementById(id);
const el=(tag,attrs={},text)=>{const n=document.createElement(tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;};
const signed=v=>(v>0?'+':'')+(Math.abs(v)<.005?'0':Number(v.toFixed(2)));
const arrows=(amounts,model='HSL')=>E.CHANNELS[model].map(c=>`${c} ${amounts[c]>.005?'↑':amounts[c]<-.005?'↓':'→'} ${signed(amounts[c])}`).join(' · ');
const choices=(node,items,value)=>{const key=JSON.stringify(items);if(node.dataset.key!==key){node.replaceChildren(...items.map(([id,name])=>el('option',{value:id},name)));node.dataset.key=key;}node.value=value;};
const sync=(id,value)=>{if(document.activeElement!==$(id))$(id).value=value;};
const roleOptions=b=>[['base',b.baseName||'Base'],...b.roles.map(r=>[r.id,r.name])];
function reconcile(parent,nodes){nodes.forEach((n,i)=>{if(parent.children[i]!==n)parent.insertBefore(n,parent.children[i]||null);});while(parent.children.length>nodes.length)parent.lastElementChild.remove();}
let host,library=[],selectedType='builtin-classic',draft=null,editor=null,picking=false,layerRequest=0,assetTasks=0,uploadChoice=null;
const thumbnails=new Map(),rowNodes=new Map(),layerNodes=new Map();
const specs=[['Green','#41DB9D','#71F56B','#349294'],['Peach','#FFE0BE','#FFF5D4','#F3A38D'],['Red','#B22643','#DB4A29','#89284C'],['Blue-purple','#2C3056','#758BC9','#1F1C42'],['Charcoal-blue','#262738','#3A536E','#191726'],['Purple hair','#A051EA','#F284FF','#6D4AAE']];
const classic=E.defaultBall('Classic');
const builtins=[{id:'builtin-classic',name:'Classic',ball:classic,builtin:true},...specs.map(([name,base,light,shadow],i)=>{const b=E.defaultBall(name,E.hexHsl(base));b.roles=b.roles.filter(r=>['highlight','shadow'].includes(r.id));for(const [id,hex]of [['highlight',light],['shadow',shadow]])E.fitMeasured(b,id,E.hexHsl(hex),1);return{id:'builtin-'+i,name,ball:b,builtin:true};})];
function defaultEntries(){return builtins.map(t=>{const b=E.clone(t.ball);b.roles=b.roles.filter(r=>['highlight','shadow'].includes(r.id));return {schema:'shadelab.ball-type',version:3,id:t.id,name:t.name,ball:b,originDefaultId:t.id};});}
library=defaultEntries();
const types=()=>library;
const blankType=()=>{const ball=E.defaultBall('Blank ball');ball.roles=ball.roles.filter(r=>['highlight','shadow'].includes(r.id));return {id:'',name:'Blank ball',ball};};
const currentType=()=>types().find(t=>t.id===selectedType)||types()[0]||blankType();
function thumbnail(ball){const key=E.extensionRevision()+'/'+JSON.stringify(ball);if(thumbnails.has(key))return thumbnails.get(key);const c=document.createElement('canvas');c.width=240;c.height=210;R.ballCanvas(c,ball);const url=c.toDataURL('image/png');if(thumbnails.size>=60)thumbnails.delete(thumbnails.keys().next().value);thumbnails.set(key,url);return url;}
function renderTypes(){
 const list=types();if(!list.some(t=>t.id===selectedType))selectedType=list[0]?.id||'';const type=currentType();
 choices($('type-select'),list.length?list.map(t=>[t.id,t.name]):[['','No saved types']],selectedType);for(const id of ['type-prev','type-next','edit-type','remove-type'])$(id).disabled=!list.length;$('restore-type').disabled=!type.originDefaultId;$('add-ball').textContent=list.length?'+ New ball':'+ New blank ball';$('type-thumbnail').src=type.ball.addons?thumbnail(type.ball):type.thumbnailAssetId?A.record(type.thumbnailAssetId)?.data||thumbnail(type.ball):thumbnail(type.ball);
 try{$('type-directions').textContent=type.ball.roles.map(r=>r.name+': '+arrows(E.measured(type.ball,r.id,1),r.model)).join('\n');}
 catch(error){$('type-directions').textContent='This recipe cannot be used at 1×: '+error.message;}
 $('remove-type').hidden=false;
}
function getLibrary(){return library;}
function getLibraryState(){return {schema:'shadelab.library',version:3,seededDefaults:1,entries:library};}
function setLibrary(value){
 let entries;
 if(Array.isArray(value)||!value){const old=value||[],ids=new Set(old.map(t=>t.id));entries=[...defaultEntries().filter(t=>!ids.has(t.id)),...old];}
 else {if(value.schema!=='shadelab.library'||value.version!==3||!Array.isArray(value.entries))throw Error('Invalid type library.');entries=value.entries;}
 const ids=new Set();const next=entries.map(t=>{const item=E.normalizeDocument(t);if(item.schema!=='shadelab.ball-type'||ids.has(item.id))throw Error('Duplicate or invalid ball type.');ids.add(item.id);return item;});
 library=next;renderTypes();
}
function cycle(amount){const list=types();if(!list.length)return;const index=list.findIndex(t=>t.id===selectedType);selectedType=list[(index+amount+list.length)%list.length].id;renderTypes();}
async function saveType(update=false,download=false){
 const epoch=host.context?.(),button=$(download?'type-export':update?'type-update':'type-save');button.disabled=true;assetTasks++;
 try{
  const b=E.clone(host.ball());b.strength=1;delete b.grayscale;const name=$('type-name').value.trim()||b.name;const png=thumbnail(b),thumbnailAssetId=await A.put(png,240,210);
  if(epoch!==host.context?.())return;
  const previous=currentType();if(update&&!previous.id)throw Error('Choose a type to update.');if(!$('type-dialog').open)return;
  const type={schema:'shadelab.ball-type',version:3,...(update&&previous.originDefaultId?{originDefaultId:previous.originDefaultId}:{}),id:update?previous.id:'type_'+E.uid(),name,ball:b,thumbnailAssetId};
  E.validateDocument(type);
  if(download)host.jsonDownload(A.portable(type),name+'-ball-type');
  else{host.change(()=>{if(update)library=library.map(t=>t.id===type.id?type:t);else library.push(type);selectedType=type.id;},update?'Ball type updated; existing balls are unchanged.':'Ball type saved');$('type-dialog').close();}
 }catch(e){$('type-error').textContent=e.message;}finally{button.disabled=false;assetTasks--;cleanAssets();}
}
function importType(type){host.change(()=>{const copy=E.clone(type);if(types().some(t=>t.id===copy.id))copy.id='type_'+E.uid();library.push(copy);selectedType=copy.id;},'Ball type added to the menu');}
function cleanAssets(){if(!assetTasks)A.prune([host.assetReferences(),library,draft?.ball,draft?.template,editor?.ball,...(editor?[...editor.undo,...editor.redo].map(s=>JSON.parse(s)):[])]);}
function createDraft(type,previous={}){
 const b=E.clone(type.ball);b.id=previous.ball?.id||E.uid();b.name=previous.ball?.name||b.name;b.strength=1;b.groupMove=false;delete b.grayscale;
 return {...previous,ball:b,template:E.clone(type.ball),recipe:type.id,method:'manual',colors:E.resolve(b),states:Object.fromEntries(roleOptions(b).map(([id])=>[id,'Example'])),samples:[],uploads:new Map(),invalid:new Set(),materializing:null,saving:false};
}
function switchRecipe(){
 const type=types().find(t=>t.id===$('new-recipe').value);if(!type)return;
 try{const next=createDraft(type,draft);E.validateBall(next.ball);draft=next;}
 catch(error){$('new-recipe').value=draft.recipe;$('new-error').textContent='Could not load type at 1×: '+error.message;return;}
 layerRequest++;uploadChoice=null;
 $('new-method').value='manual';$('new-examples').checked=true;$('new-error').textContent='';
 rowNodes.clear();$('new-regions').replaceChildren();renderNew();cleanAssets();
}
function liveField(input,apply,complete=()=>Number.isFinite(input.valueAsNumber)&&input.validity.valid){
 let accepted,acceptedState;
 const update=()=>{
  if(!draft)return;
  if(!complete()){draft.invalid.add(input);input.setAttribute('aria-invalid','true');$('new-error').textContent='Complete the highlighted value; the preview keeps the last valid result.';renderNew();return;}
  if(input.value===accepted&&acceptedState===JSON.stringify([draft.ball,draft.colors])&&!draft.invalid.has(input))return;
  draft.invalid.delete(input);input.removeAttribute('aria-invalid');
  if(apply()===false){draft.invalid.add(input);input.setAttribute('aria-invalid','true');}
  else {accepted=input.value;acceptedState=JSON.stringify([draft.ball,draft.colors]);$('new-error').textContent='';}
  renderNew();
 };
 input.oninput=update;input.onchange=update;
}

function openNew(kind='ball'){
 host.finishGesture();
 const type=kind==='new-type'?blankType():currentType(),b=E.clone(type.ball);b.id=E.uid();b.name='Study '+(host.project().balls.length+1);b.strength=1;b.groupMove=false;
 if(kind==='new-type')b.roles=b.roles.filter(r=>['highlight','shadow'].includes(r.id));if(kind!=='ball')b.name=kind==='new-type'?'New type':type.name;delete b.grayscale;
 try{const next=createDraft({...type,ball:b},{kind,typeId:kind==='edit-type'?type.id:null,originDefaultId:type.originDefaultId});E.validateBall(next.ball);draft=next;}
 catch(error){host.status('Could not load type at 1×: '+error.message,true);return;}
 uploadChoice=null;
 $('new-heading').textContent=kind==='ball'?'Create a color study':kind==='new-type'?'Create a ball type':'Edit ball type';$('new-create').textContent=kind==='ball'?'Create ball':'Save type';$('new-type-copy').hidden=kind!=='edit-type';$('new-type-design').hidden=kind==='ball';$('new-design-mode').value=b.mode;$('new-softness').value=b.softness;$('new-name').value=b.name;$('new-method').value='manual';$('new-examples').checked=true;$('new-rim').checked=b.roles.some(r=>r.id==='rim');$('new-bounce').checked=b.roles.some(r=>r.id==='bounce');
 $('new-error').textContent='';rowNodes.clear();$('new-regions').replaceChildren();renderNew();$('new-dialog').showModal();
}
function draftBall(){
 const b=E.clone(draft.ball);b.base=draft.colors.base||b.base;
 if(draft.method==='sample'){
  b.strength=1;
  const fallback=E.resolve(b),cs={...fallback,...Object.fromEntries(Object.entries(draft.colors).filter(([,v])=>v))};
  for(const r of b.roles)if(draft.colors[r.id])E.setRule(r,'offset',E.difference(cs[r.source],draft.colors[r.id],r.model));
 }
 E.validateBall(b);return b;
}
function setDraftColor(id,hsl,state='Sampled'){
 if(!draft)return;const prior=E.clone({ball:draft.ball,colors:draft.colors,states:draft.states});
 try{
  if(id==='base'){draft.colors.base=hsl;draft.ball.base=hsl;if(draft.method==='manual')draft.colors=E.resolve(draft.ball);}else if(draft.method==='manual'){E.sampleColor(draft.ball,id,hsl);draft.colors=E.resolve(draft.ball);}else draft.colors[id]=hsl;
  draft.states[id]=state;draftBall();if(state==='Sampled')draft.samples.push([...hsl]);
  const row=rowNodes.get(id);if(row)for(const input of [row.hex,row.color,...row.inputs.values()]){draft.invalid.delete(input);input.removeAttribute('aria-invalid');}
  $('new-error').textContent='';renderNew();return true;
 }catch(e){Object.assign(draft,prior);$('new-error').textContent=e.message;return false;}
}
function guess(id){
 try{const type=types().find(t=>t.id===draft.recipe)||{ball:draft.template},b=E.clone(type.ball);b.base=draft.colors.base||b.base;b.strength=1;const cs=E.resolve(b);let color=cs[id];
  if(id==='base')color=type.ball.base;
  if(!color){const fallback=E.defaultBall('Guess',b.base);color=E.resolve(fallback)[id]||E.resolve(draftBall())[id]||b.base;}
  setDraftColor(id,color,'Guessed');
 }catch(e){$('new-error').textContent=e.message;}
}
async function pickDraft(id,button){
 if(picking)return;if(!root.EyeDropper){$('new-error').textContent='Screen picking is unavailable. Enter a HEX color or use the color well.';return;}
 const target=draft;picking=true;button.disabled=true;
 try{const result=await new EyeDropper().open();if(draft===target&&$('new-dialog').open)setDraftColor(id,E.hexHsl(result.sRGBHex));}
 catch(e){if(draft===target)$('new-error').textContent=e.name==='AbortError'?'Pick cancelled.':e.message;}finally{picking=false;button.disabled=false;}
}
function renderNew(){
 if(!draft)return;let b;try{b=draftBall();}catch(e){$('new-error').textContent=e.message;$('new-create').disabled=true;return;}
 for(const id of draft.uploads.keys())if(!roleOptions(b).some(([key])=>key===id))draft.uploads.delete(id);
 $('new-rim').checked=b.roles.some(r=>r.id==='rim');$('new-bounce').checked=b.roles.some(r=>r.id==='bounce');$('new-design-mode').value=b.mode;if(!draft.invalid.has($('new-softness')))sync('new-softness',b.softness);
 choices($('new-recipe'),types().length?types().map(t=>[t.id,t.name]):[['','No saved types']],draft.recipe);$('new-recipe').disabled=!types().length;
 const busy=draft.uploads.size>0;
 $('new-upload-status').textContent=busy?'Loading region PNG…':'';$('new-edit-layers').disabled=busy||draft.saving;$('new-design-mode').disabled=busy||draft.saving;
 $('new-help').textContent=draft.method==='sample'?'Pick Base, Highlight, and Shadow, or choose Guess for each missing color. Sampled colors stay fixed while you collect; changing Base recalculates their offsets.':'Enter signed amounts for each region. Arrows show actual movement from its linked source. You can also pick a region color to measure its offsets.';
 R.ballCanvas($('new-preview'),b);const cs=E.resolve(b);
 const nodes=roleOptions(b).map(([id,name])=>{
  let row=rowNodes.get(id);
  if(!row){
   const node=el('section',{class:'creation-region','data-region':id}),head=el('div',{class:'region-head'}),title=el('input',{class:'region-name','aria-label':name+' region name'}),state=el('span',{class:'sample-state'}),color=el('input',{type:'color','aria-label':name+' color'}),hex=el('input',{'aria-label':name+' HEX',placeholder:'#RRGGBB',class:'region-hex'}),pick=el('button',{},'Pick screen'),guessButton=el('button',{},'Guess'),upload=el('button',{'aria-label':'Upload PNG for '+name},'Upload PNG'),label=el('span',{class:'hint'}),fields=el('div',{class:'creation-amounts'});
   title.onchange=()=>{const text=title.value.trim()||name;if(id==='base')draft.ball.baseName=text;else draft.ball.roles.find(r=>r.id===id).name=text;renderNew();};
   liveField(color,()=>setDraftColor(id,E.hexHsl(color.value),'Entered'),()=>true);
   liveField(hex,()=>setDraftColor(id,E.hexHsl(hex.value),'Sampled'),()=>/^#?(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex.value.trim()));pick.onclick=()=>pickDraft(id,pick);guessButton.onclick=()=>guess(id);
   upload.onclick=()=>{uploadChoice={target:draft,id};$('new-region-file').value='';$('new-region-file').click();};
   head.append(title,state,color,hex,pick,guessButton,upload);node.append(head,label,fields);row={node,title,state,color,hex,label,fields,upload,model:'',inputs:new Map()};rowNodes.set(id,row);
  }
  if(document.activeElement!==row.title)row.title.value=name;row.state.textContent=draft.states[id]||'Missing';row.state.dataset.state=draft.states[id]||'Missing';
  row.upload.disabled=draft.uploads.has(id)||draft.saving;row.upload.setAttribute('aria-label','Upload PNG for '+name);
  const available=!!draft.colors[id];if(document.activeElement!==row.hex&&!draft.invalid.has(row.hex))row.hex.value=available?E.toHex(draft.colors[id]||cs[id]):'';row.color.value=E.toHex(draft.colors[id]||cs[id]);
  const r=b.roles.find(r=>r.id===id);if(draft.kind!=='ball'&&r)renderTypeRole(row,r,b);row.label.textContent=r?`From ${E.roleName(b,r.source)} · ${arrows(E.measured(b,id),r.model)}`:'Starting color';
  row.fields.hidden=!r||draft.method!=='manual';
  if(r){
   if(row.model!==r.model){row.fields.replaceChildren();row.inputs.clear();row.model=r.model;
    for(const c of E.CHANNELS[r.model]){const label=el('label',{class:'field'},c+' amount'),input=el('input',{type:'number',step:'any','aria-label':name+' '+c+' amount'});liveField(input,()=>{
     const prior=E.clone(draft.ball);try{const actual=draft.ball.roles.find(x=>x.id===id),kind=draft.kind!=='ball'&&actual.rule?.kind==='percent'?'percent':'offset',amounts=actual.rule?.kind===kind?E.clone(actual.rule.amounts):E.measured(draft.ball,id,1);amounts[c]=input.valueAsNumber;if(c==='S'&&row.link?.checked)amounts.L=amounts.S;E.setRule(actual,kind,amounts);draft.ball.groupMove=false;E.validateBall(draft.ball);draft.states[id]='Entered';draft.colors=E.resolve(draft.ball);return true;}catch(e){draft.ball=prior;$('new-error').textContent=e.message;return false;}
    });label.append(input);row.fields.append(label);row.inputs.set(c,input);}
    if(r.model==='HSL'){const label=el('label',{class:'check'}),link=el('input',{type:'checkbox','aria-label':name+' same S and L'});label.append(link,document.createTextNode('Same S/L'));row.fields.append(label);row.link=link;}
   }
   const amounts=r.rule?.kind==='offset'||(draft.kind!=='ball'&&r.rule?.kind==='percent')?r.rule.amounts:E.measured(b,id,1);for(const[c,input]of row.inputs)if(document.activeElement!==input&&!draft.invalid.has(input))input.value=Number(amounts[c].toFixed(4));
  }
  return row.node;
 });
 reconcile($('new-regions'),nodes);for(const input of draft.invalid)if(!input.isConnected||input.closest('[hidden]')){draft.invalid.delete(input);input.removeAttribute('aria-invalid');}
 $('new-create').disabled=busy||draft.saving||draft.invalid.size>0||!draft.colors.base||(draft.method==='sample'&&roleOptions(b).some(([id])=>!draft.colors[id]));$('new-type-copy').disabled=$('new-create').disabled;
}
function renderTypeRole(row,r,b){
 if(!row.typeControls){
  const controls=el('div',{class:'region-controls'}),source=el('select',{'aria-label':r.name+' source'}),model=el('select',{'aria-label':r.name+' model'}),ruleMode=el('select',{'aria-label':r.name+' relationship mode'}),remove=el('button',{},'Remove region'),detail=el('details'),summary=el('summary',{},'Advanced formulas'),fields=el('div'),apply=el('button',{},'Apply formulas');
  ruleMode.append(...[['offset','Measured offsets'],['percent','Percentage amounts'],['formula','Advanced formulas']].map(([value,name])=>el('option',{value},name)));
  model.append(...Object.keys(E.CHANNELS).map(m=>el('option',{value:m},m)));detail.append(summary,fields,apply);controls.append(source,model,ruleMode,remove,detail);row.node.append(controls);row.typeControls={source,model,ruleMode,fields,modelKey:''};
  ruleMode.onchange=()=>changeDraft(b=>{const role=b.roles.find(v=>v.id===r.id),kind=ruleMode.value;if(kind==='formula')E.setRule(role,kind);else{const amounts=E.measured(b,r.id,1);if(kind==='percent'){const v=E.values(E.resolve(b)[role.source]);for(const c of E.CHANNELS[role.model]){if(!v[c]&&Math.abs(amounts[c])>1e-9)throw Error('A zero source channel needs measured offsets for this color.');amounts[c]=v[c]?amounts[c]/v[c]*100:0;}}E.setRule(role,kind,amounts);}});
  source.onchange=()=>changeDraft(b=>{b.roles.find(v=>v.id===r.id).source=source.value;});
  model.onchange=()=>changeDraft(b=>{const role=b.roles.find(v=>v.id===r.id),colors=E.resolve(b);role.model=model.value;E.setRule(role,'offset',E.difference(colors[role.source],colors[role.id],role.model));});
  remove.onclick=()=>changeDraft(b=>{if(b.roles.some(v=>v.source===r.id)||b.design?.layers.some(l=>l.kind==='mask'&&l.role===r.id))throw Error('Other roles or layers use this region. Reassign them first.');b.roles=b.roles.filter(v=>v.id!==r.id);});
  apply.onclick=()=>changeDraft(b=>{const role=b.roles.find(v=>v.id===r.id);role.expressions=Object.fromEntries([...fields.querySelectorAll('input')].map(n=>[n.dataset.channel,n.value]));E.setRule(role,'formula');});
 }
 const c=row.typeControls;choices(c.source,roleOptions(b).filter(([id])=>id!==r.id),r.source);c.model.value=r.model;c.ruleMode.value=r.rule?.kind||'formula';
 if(c.modelKey!==r.model){c.fields.replaceChildren(...E.CHANNELS[r.model].map(ch=>{const label=el('label',{class:'region-formula'},ch),input=el('input',{'data-channel':ch,'aria-label':r.name+' '+ch+' formula'});label.append(input);return label;}));c.modelKey=r.model;}
 for(const input of c.fields.querySelectorAll('input'))if(document.activeElement!==input)input.value=r.expressions[input.dataset.channel];
}
function toggleOptional(id,on){
 const previous=E.clone(draft.ball);
 try{
  if(on&&!draft.ball.roles.some(r=>r.id===id)){const r=E.clone(draft.template.roles.find(r=>r.id===id)||E.defaultBall().roles.find(r=>r.id===id));r.source='base';draft.ball.roles.push(r);draft.states[id]='Missing';delete draft.colors[id];if(draft.method==='manual'){draft.colors=E.resolve(draft.ball);draft.states[id]='Guessed';}}
  if(!on){if(draft.ball.roles.some(r=>r.source===id))throw Error('Another region depends on this color. Keep it enabled.');draft.ball.roles=draft.ball.roles.filter(r=>r.id!==id);if(draft.ball.design)draft.ball.design.layers=draft.ball.design.layers.filter(l=>l.kind==='overlay'||l.role!==id);delete draft.colors[id];delete draft.states[id];}
  E.validateBall(draft.ball);renderNew();
 }catch(e){draft.ball=previous;$('new-'+id).checked=!on;$('new-error').textContent=e.message;}
}
async function uploadRegion(file,target,id){
 if(!file||draft!==target||!roleOptions(target.ball).some(([key])=>key===id))return;
 const request=Symbol(id);target.uploads.set(id,request);assetTasks++;$('new-error').textContent='';renderNew();
 const current=()=>draft===target&&$('new-dialog').open&&target.uploads.get(id)===request&&roleOptions(target.ball).some(([key])=>key===id);
 try{
  const asset=await A.fromFile(file);if(!current())return;
  let prepared;
  if(target.ball.mode!=='custom'){
   if(!target.materializing)target.materializing=starter(target.ball,target.ball.mode).catch(error=>{target.materializing=null;throw error;});
   prepared=await target.materializing;if(!current())return;
  }
  // Concurrent uploads merge into the latest draft; no mutation precedes validation.
  const b=draftBall();if(b.mode!=='custom'){const roles=new Set(roleOptions(b).map(([key])=>key));b.mode='custom';b.design=E.clone(prepared);b.design.layers=b.design.layers.filter(l=>roles.has(l.role));}
  const d=b.design,matching=l=>l.kind==='mask'&&l.role===id,last=d.layers.findLastIndex(matching);
  const at=last<0?d.layers.length:d.layers.slice(0,last).filter(l=>!matching(l)).length;
  const scale=Math.min(d.width/asset.width,d.height/asset.height),layer=newLayer(asset.id,E.roleName(b,id),id,d,asset.width*scale,asset.height*scale);
  d.layers=d.layers.filter(l=>!matching(l));d.layers.splice(at,0,layer);E.validateBall(b);target.ball=b;
  $('new-error').textContent='';
 }catch(error){if(current())$('new-error').textContent='Could not upload region PNG: '+error.message;}
 finally{if(target.uploads.get(id)===request)target.uploads.delete(id);if(!target.uploads.size)target.materializing=null;assetTasks--;if(draft===target)renderNew();cleanAssets();}
}

function changeDraft(fn){
 const prior=draft.ball;
 try{const b=draftBall();fn(b);E.validateBall(b);draft.ball=b;draft.colors=E.resolve(b);$('new-error').textContent='';renderNew();return true;}
 catch(e){draft.ball=prior;$('new-error').textContent=e.message;renderNew();return false;}
}
async function commitDraft(asNew=false){
 const target=draft;if(!target||$('new-create').disabled)return;
 assetTasks++;
 try{
  const b=draftBall();b.name=$('new-name').value.trim()||b.name;
  if(draft.kind==='ball'){if(host.commitBall(b,draft.samples))closeNew();return;}
  target.saving=true;renderNew();
  const id=!asNew&&draft.typeId?draft.typeId:'type_'+E.uid(),thumbnailAssetId=await A.put(thumbnail(b),240,210);
  if(draft!==target||!$('new-dialog').open)return;
  const type={schema:'shadelab.ball-type',version:3,id,name:b.name,ball:b,thumbnailAssetId,...(!asNew&&draft.originDefaultId?{originDefaultId:draft.originDefaultId}:{})};E.validateDocument(type);
  if(host.change(()=>{if(!asNew&&draft.typeId){if(!library.some(t=>t.id===id))throw Error('This type was removed.');library=library.map(t=>t.id===id?type:t);}else library.push(type);selectedType=id;},'Ball type saved; existing balls are unchanged'))closeNew();
 }catch(e){if(draft===target)$('new-error').textContent=e.message;}
 finally{target.saving=false;assetTasks--;if(draft===target)renderNew();cleanAssets();}
}
function newLayer(assetId,name,role,design,width=design.width,height=design.height){return{id:'layer_'+E.uid(),assetId,name,kind:'mask',role,x:design.width/2,y:design.height/2,width,height,rotation:0,opacity:1,flipX:false,flipY:false,visible:true};}
async function starter(ball,kind){
 const design={width:1024,height:1024,layers:[]},ids=new Set(roleOptions(ball).map(([id])=>id));
 for(const shape of R.sphereShapes(kind)){
  const role=ids.has(shape.role)?shape.role:'base',c=document.createElement('canvas');c.width=c.height=1024;const p=c.getContext('2d');p.fillStyle='#fff';R.paintSphereShape(p,1024,shape);
  const assetId=await A.put(c.toDataURL('image/png'),1024,1024);design.layers.push({...newLayer(assetId,E.roleName(ball,role),role,design),clip:'ellipse',blur:shape.blur!==false});
 }
 return design;
}
async function openLayers(targetBall=null,onApply=null){
 host.finishGesture();
 const request=++layerRequest,target=targetBall||host.ball(),b=E.clone(target);$('edit-layers').disabled=true;assetTasks++;
 try{if(!b.design)b.design=await starter(b,b.mode==='rim'?'rim':'cel');if(request!==layerRequest)return;b.mode='custom';editor={ball:b,onApply,targetId:target.id,selected:b.design.layers.at(-1)?.id||null,undo:[],redo:[],drag:null,frame:0};$('layers-error').textContent='';layerNodes.clear();$('layer-list').replaceChildren();renderLayers();$('layers-dialog').showModal();}
 catch(e){host.status(e.message,true);}finally{$('edit-layers').disabled=false;assetTasks--;cleanAssets();}
}
const selectedLayer=b=>b.design.layers.find(l=>l.id===editor.selected);
function remember(stack,b){stack.push(JSON.stringify(b));let bytes=stack.reduce((n,s)=>n+s.length*2,0);while(stack.length>1&&(stack.length>100||bytes>4*1024*1024))bytes-=stack.shift().length*2;}
function layerChange(fn){
 finishLayerDrag();const previous=editor.ball,selection=editor.selected,trial=E.clone(previous);
 try{fn(trial);E.validateBall(trial);if(JSON.stringify(previous)!==JSON.stringify(trial)){remember(editor.undo,previous);editor.redo=[];}editor.ball=trial;if(!selectedLayer(trial))editor.selected=trial.design.layers.at(-1)?.id||null;$('layers-error').textContent='';renderLayers();}
 catch(e){editor.selected=selection;$('layers-error').textContent=e.message;renderLayers();}
}
function drawLayers(){
 if(!editor)return;editor.frame=0;const c=$('layer-preview'),p=c.getContext('2d'),b=editor.ball;p.clearRect(0,0,c.width,c.height);const rect=R.designCanvas(p,0,0,c.width,c.height,b,E.resolve(b));editor.rect=rect;const l=selectedLayer(b);if(l){p.save();p.translate(rect.x+l.x*rect.scale,rect.y+l.y*rect.scale);p.rotate(l.rotation*Math.PI/180);p.strokeStyle='#80ddbe';p.lineWidth=2;p.setLineDash([7,5]);p.strokeRect(-l.width*rect.scale/2,-l.height*rect.scale/2,l.width*rect.scale,l.height*rect.scale);p.restore();}
}
function renderLayers(){
 if(!editor)return;if(editor.frame)cancelAnimationFrame(editor.frame);drawLayers();const b=editor.ball,d=b.design,l=selectedLayer(b);
 sync('design-width',d.width);sync('design-height',d.height);$('layers-undo').disabled=!editor.undo.length;$('layers-redo').disabled=!editor.redo.length;
 const nodes=[...d.layers].reverse().map(layer=>{let button=layerNodes.get(layer.id);if(!button){button=el('button',{class:'layer-row'});button.onclick=()=>{finishLayerDrag();editor.selected=layer.id;renderLayers();};layerNodes.set(layer.id,button);}button.textContent=(layer.visible?'◉ ':'○ ')+layer.name+' · '+(layer.kind==='mask'?E.roleName(b,layer.role):'Original colors');button.classList.toggle('active',layer.id===editor.selected);return button;});reconcile($('layer-list'),nodes);
 for(const id of layerNodes.keys())if(!d.layers.some(x=>x.id===id))layerNodes.delete(id);
 $('layer-fields').hidden=!l;for(const id of ['layer-up','layer-down','layer-copy','layer-remove'])$(id).disabled=!l;
 if(l){sync('layer-name',l.name);$('layer-kind').value=l.kind;choices($('layer-role'),roleOptions(b),l.role||'base');$('layer-role').disabled=l.kind==='overlay';for(const key of ['x','y','width','height','rotation','opacity'])sync('layer-'+key,Number((l[key]*(key==='opacity'?100:1)).toFixed(3)));for(const key of ['flipX','flipY','visible'])$('layer-'+key).checked=l[key];}
}
function finishLayerDrag(cancel=false){
 if(!editor?.drag)return;const drag=editor.drag;editor.drag=null;
 if(cancel)editor.ball=drag.before;else if(JSON.stringify(editor.ball)!==JSON.stringify(drag.before)){remember(editor.undo,drag.before);editor.redo=[];}
 renderLayers();
}
function editorPoint(event){const box=$('layer-preview').getBoundingClientRect(),r=editor.rect;return{x:((event.clientX-box.left)/box.width*768-r.x)/r.scale,y:((event.clientY-box.top)/box.height*768-r.y)/r.scale};}
function hitLayer(point){
 const probe=document.createElement('canvas');probe.width=probe.height=1;const ctx=probe.getContext('2d');
 return [...editor.ball.design.layers].reverse().find(l=>{if(!l.visible||!l.opacity)return false;const a=-l.rotation*Math.PI/180,dx=point.x-l.x,dy=point.y-l.y,x=(dx*Math.cos(a)-dy*Math.sin(a))*(l.flipX?-1:1)+l.width/2,y=(dx*Math.sin(a)+dy*Math.cos(a))*(l.flipY?-1:1)+l.height/2;if(x<0||y<0||x>=l.width||y>=l.height)return false;const img=A.image(l.assetId);ctx.clearRect(0,0,1,1);ctx.drawImage(img,Math.floor(x/l.width*img.naturalWidth),Math.floor(y/l.height*img.naturalHeight),1,1,0,0,1,1);return ctx.getImageData(0,0,1,1).data[3]>5;});
}
async function importLayers(files,replace=false){
 const target=editor,button=$(replace?'layer-replace':'layers-import');button.disabled=true;assetTasks++;
 try{
  const assets=[];for(const f of files)assets.push({...await A.fromFile(f),name:f.name.replace(/\.png$/i,'')});if(editor!==target||!$('layers-dialog').open)return;
  layerChange(b=>{for(const a of assets){if(replace){const l=selectedLayer(b);if(!l)throw Error('Select a layer first.');l.assetId=a.id;continue;}const d=b.design;if(!d.layers.length){d.width=a.width;d.height=a.height;}const scale=Math.min(1,d.width/a.width,d.height/a.height);const unused=roleOptions(b).find(([id])=>!d.layers.some(l=>l.kind==='mask'&&l.role===id));const role=roleOptions(b).find(([id,name])=>a.name.toLowerCase().includes(name.toLowerCase()))?.[0]||unused?.[0]||'base';const l=newLayer(a.id,a.name,role,d,a.width*scale,a.height*scale);d.layers.push(l);editor.selected=l.id;}});
 }catch(e){$('layers-error').textContent=e.message;}finally{button.disabled=false;assetTasks--;cleanAssets();}
}
async function replaceStarter(kind){
 const target=editor;assetTasks++;try{const design=await starter(editor.ball,kind);if(editor!==target||!$('layers-dialog').open)return;layerChange(b=>{b.design=design;editor.selected=design.layers.at(-1)?.id;});}catch(e){$('layers-error').textContent=e.message;}finally{assetTasks--;cleanAssets();}
}
function closeNew(){layerRequest++;draft=null;uploadChoice=null;$('new-dialog').close();cleanAssets();}
function closeLayers(){layerRequest++;if(editor?.frame)cancelAnimationFrame(editor.frame);editor=null;$('layers-dialog').close();cleanAssets();}

function init(h){
 host=h;renderTypes();
 $('type-prev').onclick=()=>cycle(-1);$('type-next').onclick=()=>cycle(1);$('type-select').onchange=()=>{selectedType=$('type-select').value;renderTypes();};
 $('remove-type').onclick=()=>host.change(()=>{library=library.filter(t=>t.id!==selectedType);},'Saved type removed; Undo restores it');
 $('save-type').onclick=()=>{$('type-name').value=host.ball().name;$('type-error').textContent='';$('type-update').disabled=!currentType().id;$('type-dialog').showModal();};$('type-cancel').onclick=()=>$('type-dialog').close();
 $('type-save').onclick=()=>saveType();$('type-update').onclick=()=>saveType(true);$('type-export').onclick=()=>saveType(false,true);$('type-png').onclick=async()=>{const epoch=host.context?.(),name=($('type-name').value||'Ball type').replace(/[<>:"/\\|?*]/g,'_')+'.png';try{const b=E.clone(host.ball());b.strength=1;const response=await fetch(thumbnail(b)),blob=await response.blob();if(epoch!==host.context?.()||!$('type-dialog').open)return;host.download(blob,name);}catch(e){if(epoch===host.context?.())$('type-error').textContent=e.message;}};
 $('add-ball').onclick=()=>openNew();$('edit-type').onclick=()=>openNew('edit-type');$('new-type').onclick=()=>openNew('new-type');
 $('restore-type').onclick=()=>host.change(()=>{const id=currentType().originDefaultId,original=defaultEntries().find(t=>t.id===id);if(!original)throw Error('Select a default type to restore.');library=library.map(t=>t.id===selectedType?original:t);selectedType=id;},'Default type restored; existing balls are unchanged');
 $('restore-types').onclick=()=>host.change(()=>{const originals=defaultEntries(),ids=new Set(originals.map(t=>t.id));library=[...originals,...library.filter(t=>!ids.has(t.id))];},'Default types restored; other saved types and balls are unchanged');
 $('new-design-mode').onchange=()=>{const mode=$('new-design-mode').value;if(mode==='custom'&&!draft.ball.design){$('new-design-mode').value=draft.ball.mode;$('new-edit-layers').click();}else changeDraft(b=>b.mode=mode);};
 liveField($('new-softness'),()=>changeDraft(b=>b.softness=$('new-softness').valueAsNumber));
 $('new-edit-layers').onclick=()=>{const target=draft;return openLayers(draftBall(),b=>{if(draft!==target)return;draft.ball=b;draft.colors=E.resolve(b);for(const [id]of roleOptions(b))draft.states[id]??='Entered';$('new-design-mode').value=b.mode;renderNew();});};
 $('new-type-copy').onclick=()=>commitDraft(true);
 $('new-cancel').onclick=closeNew;$('new-dialog').addEventListener('cancel',e=>{e.preventDefault();closeNew();});
 $('new-method').onchange=()=>{draft.ball=draftBall();draft.method=$('new-method').value;draft.ball.strength=1;draft.colors=draft.method==='sample'?{}:E.resolve(draft.ball);draft.states=Object.fromEntries(roleOptions(draft.ball).map(([id])=>[id,draft.method==='sample'?'Missing':'Entered']));$('new-examples').checked=draft.method!=='sample';renderNew();};
 $('new-examples').onchange=()=>{if($('new-examples').checked){const b=E.clone(draft.template);b.strength=1;const colors=E.resolve(b);for(const [id]of roleOptions(draft.ball))if(colors[id]){draft.colors[id]=colors[id];draft.states[id]='Example';}draft.ball.base=[...b.base];}else{delete draft.colors.base;draft.states.base='Missing';}renderNew();};
 $('new-recipe').onchange=switchRecipe;
 $('new-rim').onchange=()=>toggleOptional('rim',$('new-rim').checked);$('new-bounce').onchange=()=>toggleOptional('bounce',$('new-bounce').checked);
 $('new-add-role').onclick=()=>{const id='color_'+E.uid(),name='Color '+(draft.ball.roles.length+1);draft.ball.roles.push(E.setRule({id,name,source:'base',model:'HSL'},'offset',{H:0,S:0,L:0}));draft.states[id]=draft.method==='sample'?'Missing':'Entered';if(draft.method==='manual')draft.colors=E.resolve(draft.ball);renderNew();};
 $('new-create').onclick=()=>commitDraft();
 $('new-region-file').onchange=()=>{const choice=uploadChoice,file=$('new-region-file').files[0];uploadChoice=null;$('new-region-file').value='';if(choice&&file)return uploadRegion(file,choice.target,choice.id);};
 $('edit-layers').onclick=()=>openLayers();$('layers-cancel').onclick=closeLayers;$('layers-dialog').addEventListener('cancel',e=>{e.preventDefault();closeLayers();});
 $('layers-classic').onclick=()=>replaceStarter('cel');$('layers-rim').onclick=()=>replaceStarter('rim');$('layers-blank').onclick=()=>layerChange(b=>{b.design={width:1024,height:1024,layers:[]};});
 $('layers-import').onclick=()=>$('layers-files').click();$('layers-files').onchange=async()=>{const files=[...$('layers-files').files];$('layers-files').value='';await importLayers(files);};$('layer-replace').onclick=()=>$('layer-replace-file').click();$('layer-replace-file').onchange=async()=>{const files=[...$('layer-replace-file').files];$('layer-replace-file').value='';await importLayers(files,true);};
 for(const [id,key]of [['design-width','width'],['design-height','height']])$(id).onchange=()=>{const v=$(id).valueAsNumber;layerChange(b=>b.design[key]=v);};
 $('layer-name').onchange=()=>{const v=$('layer-name').value.trim()||'Layer';layerChange(b=>selectedLayer(b).name=v);};
 for(const key of ['kind','role'])$('layer-'+key).onchange=()=>{const v=$('layer-'+key).value;layerChange(b=>selectedLayer(b)[key]=v);};
 for(const key of ['x','y','width','height','rotation','opacity'])$('layer-'+key).onchange=()=>{let value=$('layer-'+key).valueAsNumber;if(key==='opacity')value/=100;layerChange(b=>{const l=selectedLayer(b);if($('layer-aspect').checked&&['width','height'].includes(key)){const other=key==='width'?'height':'width';l[other]*=value/l[key];}l[key]=value;});};
 for(const key of ['flipX','flipY','visible'])$('layer-'+key).onchange=()=>{const v=$('layer-'+key).checked;layerChange(b=>selectedLayer(b)[key]=v);};
 $('layer-copy').onclick=()=>layerChange(b=>{const l=E.clone(selectedLayer(b));l.id='layer_'+E.uid();l.name+=' copy';b.design.layers.push(l);editor.selected=l.id;});
 $('layer-remove').onclick=()=>layerChange(b=>b.design.layers=b.design.layers.filter(l=>l.id!==editor.selected));
 for(const [id,step]of [['layer-up',1],['layer-down',-1]])$(id).onclick=()=>layerChange(b=>{const ls=b.design.layers,i=ls.findIndex(l=>l.id===editor.selected),j=i+step;if(j>=0&&j<ls.length)[ls[i],ls[j]]=[ls[j],ls[i]];});
 $('layer-add-role').onclick=()=>layerChange(b=>{const id='color_'+E.uid(),name=$('layer-new-role-name').value.trim()||'Color '+(b.roles.length+1);b.roles.push(E.setRule({id,name,source:'base',model:'HSL'},'offset',{H:0,S:0,L:0}));if(selectedLayer(b)){selectedLayer(b).role=id;selectedLayer(b).kind='mask';}$('layer-new-role-name').value='';});
 for(const [id,redo]of [['layers-undo',false],['layers-redo',true]])$(id).onclick=()=>{finishLayerDrag();const from=redo?editor.redo:editor.undo,to=redo?editor.undo:editor.redo;if(!from.length)return;remember(to,editor.ball);editor.ball=JSON.parse(from.pop());if(!selectedLayer(editor.ball))editor.selected=editor.ball.design.layers.at(-1)?.id||null;renderLayers();};
 $('layer-preview').onpointerdown=e=>{if(e.button!==0)return;const point=editorPoint(e),hit=hitLayer(point);if(!hit)return;editor.selected=hit.id;renderLayers();editor.drag={before:E.clone(editor.ball),point,x:hit.x,y:hit.y,pointerId:e.pointerId};$('layer-preview').setPointerCapture(e.pointerId);};
 $('layer-preview').onpointermove=e=>{if(!editor?.drag||editor.drag.pointerId!==e.pointerId)return;const p=editorPoint(e),l=selectedLayer(editor.ball),d=editor.drag;l.x=d.x+p.x-d.point.x;l.y=d.y+p.y-d.point.y;if(!editor.frame)editor.frame=requestAnimationFrame(drawLayers);};
 for(const event of ['pointerup','lostpointercapture'])$('layer-preview').addEventListener(event,()=>finishLayerDrag());$('layer-preview').addEventListener('pointercancel',()=>finishLayerDrag(true));window.addEventListener('blur',()=>finishLayerDrag());
 $('layers-apply').onclick=()=>{finishLayerDrag();const b=E.clone(editor.ball),id=editor.targetId;if(!b.design.layers.length){$('layers-error').textContent='Import a PNG or choose a starter before applying.';return;}if(editor.onApply){editor.onApply(b);closeLayers();return;}if(host.change(()=>{const live=host.project().balls.find(x=>x.id===id);if(!live)throw Error('This ball was removed.');Object.assign(live,b);},'Custom layer design applied'))closeLayers();};
 document.addEventListener('keydown',e=>{if(editor&&$('layers-dialog').open&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();$(e.shiftKey?'layers-redo':'layers-undo').click();}});
}
root.ShadeStudio={getSelection:()=>selectedType,setSelection:id=>{selectedType=id;renderTypes();},cancelPending:()=>{closeNew();closeLayers();},init,getLibrary,getLibraryState,setLibrary,renderTypes,importType,builtins,arrows,signed,openNew,openLayers,save:project=>A.save(project,getLibraryState()),load:A.load,prepareDocument:A.prepareDocument,portable:A.portable,starter};
})(globalThis);
