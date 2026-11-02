/* Whole-ball selection, named groups, ordered gallery, and image clipboard. */
(function(root){
'use strict';
const E=root.Shade,R=root.ShadeRender,$=id=>document.getElementById(id);
let host,selected=null,anchor=null,groupId='',groupDraft=null,drag=null,copyBusy=false,copyURL=null,copyBlob=null,copyCanvas=null;
const list=()=>host.project().balls;
const groups=()=>host.project().groups||[];
const group=()=>groups().find(g=>g.id===groupId);
const chosen=()=>list().filter(b=>selected?.has(b.id));
const node=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
function normalize(){
 if(!host)return;
 if(selected===null)selected=new Set([host.active()]);
 const live=new Set(list().map(b=>b.id));selected=new Set([...selected].filter(id=>live.has(id)));
 if(!live.has(anchor))anchor=host.active();if(!group())groupId='';
}
function state(){return {selected:selected?[...selected]:null,anchor,groupId};}
function restore(s){selected=s?.selected?new Set(s.selected):null;anchor=s?.anchor||null;groupId=s?.groupId||'';normalize();}
function reset(id){selected=new Set(id?[id]:[]);anchor=id;groupId='';}
// A single selection follows artwork focus; explicit multi-selection stays intact.
function follow(id){normalize();if(selected.size===1&&!groupId)reset(id);}
function pick(id,event={}){
 normalize();const order=list().map(b=>b.id);
 if(event.shiftKey&&anchor&&order.includes(anchor)){
  const a=order.indexOf(anchor),b=order.indexOf(id),range=order.slice(Math.min(a,b),Math.max(a,b)+1);
  selected=new Set(event.ctrlKey||event.metaKey?[...selected,...range]:range);
 }else if(event.ctrlKey||event.metaKey||event.toggle){selected.has(id)?selected.delete(id):selected.add(id);anchor=id;}
 else {selected=new Set([id]);anchor=id;}
}
function refresh(){host.render();}
function duplicate(ids=chosen().map(b=>b.id),asGroup=false){
 if(!ids.length)return;
 const label=group()?.name||'Group';
 host.change(()=>{
  const set=new Set(ids),source=list().filter(b=>set.has(b.id));
  const copies=source.map(b=>({...E.clone(b),id:E.uid(),name:b.name+' copy'}));
  const at=Math.max(...source.map(b=>list().indexOf(b)))+1;
  list().splice(at,0,...copies);selected=new Set(copies.map(b=>b.id));anchor=copies[0].id;
  if(asGroup){const g={id:'group_'+E.uid(),name:label+' copy',memberIds:[...selected]};host.project().groups??=[];host.project().groups.push(g);groupId=g.id;}
  else groupId='';
  host.active(copies[0].id);
 },'Duplicated '+ids.length+' ball(s); Undo restores the previous gallery');
}
function remove(ids=chosen().map(b=>b.id)){
 if(!ids.length)return;
 host.change(()=>{
  if(ids.length>=list().length)throw Error('Keep at least one ball in the project.');
  const gone=new Set(ids);host.project().balls=list().filter(b=>!gone.has(b.id));
  for(const g of groups())g.memberIds=g.memberIds.filter(id=>!gone.has(id));
  selected=new Set([...selected].filter(id=>!gone.has(id)));
 },'Balls removed; Undo restores them and their groups');
}
function grayscale(ids,on){host.change(()=>{for(const b of list())if(ids.includes(b.id))b.grayscale=on;},on?'Grayscale view enabled; source colors are unchanged':'Original color view restored');}
function reorder(ids,beforeId){
 const set=new Set(ids),moving=list().filter(b=>set.has(b.id)),rest=list().filter(b=>!set.has(b.id));
 if(!moving.length||set.has(beforeId))return;
 const index=beforeId===null?rest.length:rest.findIndex(b=>b.id===beforeId);if(index<0)return;
 const next=[...rest.slice(0,index),...moving,...rest.slice(index)];
 if(next.every((b,i)=>b===list()[i]))return;
 host.change(()=>host.project().balls=next,'Ball order updated; Undo restores it');
}
function nudge(step){
 const ids=chosen().map(b=>b.id),set=new Set(ids);if(!ids.length)return;
 const rest=list().filter(b=>!set.has(b.id));
 if(step<0){const first=list().findIndex(b=>set.has(b.id));if(!first)return;reorder(ids,list()[first-1].id);}
 else {let last=-1;list().forEach((b,i)=>{if(set.has(b.id))last=i;});if(last>=list().length-1)return;const after=rest.findIndex(b=>b.id===list()[last+1].id)+1;reorder(ids,rest[after]?.id||null);}
}
function cancelDrag(){
 if(!drag)return;clearInterval(drag.timer);const d=drag;drag=null;
 document.body.classList.remove('gallery-dragging');document.querySelectorAll('.drop-before,.drop-after,.drag-source').forEach(n=>n.classList.remove('drop-before','drop-after','drag-source'));
 try{d.handle.releasePointerCapture(d.pointerId);}catch{}
}
const guide=()=>({visible:host.project().temperatureGuide?.visible!==false,start:90,end:270});
function locateDrop(){
 if(!drag?.moved)return;
 document.querySelectorAll('.drop-before,.drop-after').forEach(n=>n.classList.remove('drop-before','drop-after'));
 const card=document.elementFromPoint?.(drag.x,drag.y)?.closest('.ball-card');
 drag.valid=false;if(!card||drag.ids.includes(card.dataset.ballId))return;
 const rect=card.getBoundingClientRect(),after=drag.x>rect.left+rect.width/2;
 const rest=list().filter(b=>!drag.ids.includes(b.id)),i=rest.findIndex(b=>b.id===card.dataset.ballId);
 drag.before=after?(rest[i+1]?.id||null):card.dataset.ballId;drag.valid=true;card.classList.add(after?'drop-after':'drop-before');
}
function startDrag(e,id,handle){
 if(e.button!==0)return;e.preventDefault();e.stopPropagation();host.finishGesture();cancelDrag();
 if(!selected.has(id)){reset(id);host.active(id);refresh();}
 drag={ids:chosen().map(b=>b.id),pointerId:e.pointerId,handle,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false,valid:false};
 handle.setPointerCapture(e.pointerId);
 drag.timer=setInterval(()=>{if(!drag?.moved)return;const speed=drag.y<80?-18:drag.y>innerHeight-90?18:0;if(speed){window.scrollBy(0,speed);locateDrop();}},40);
}
function decorate(card,b){
 card.dataset.ballId=b.id;
 if(!card._collection){
  const bar=node('div');bar.className='ball-selection';const label=node('label');label.className='check';
  const check=node('input');check.type='checkbox';check.setAttribute('aria-label','Select '+b.name);label.append(check,node('span','Select'));
  const handle=node('button','⠿');handle.className='drag-handle';handle.title='Drag to reorder';handle.setAttribute('aria-label','Drag '+b.name+' to reorder');
  bar.append(label,handle);card.prepend(bar);
  label.onclick=e=>e.stopPropagation();check.onchange=e=>{pick(b.id,{...e,toggle:true,shiftKey:e.shiftKey});host.activate(b.id,false);};
  handle.onclick=e=>{e.preventDefault();e.stopPropagation();};handle.onpointerdown=e=>startDrag(e,b.id,handle);
  const grayLabel=node('label');grayLabel.className='check ball-gray';const gray=node('input');gray.type='checkbox';grayLabel.title='Grayscale';const grayIcon=node('span','◐');grayIcon.setAttribute('aria-hidden','true');grayLabel.append(gray,grayIcon);const options=node('div');options.className='ball-options';const addonSlot=node('span');addonSlot.className='ball-addon-actions';options.append(grayLabel,addonSlot);card.append(options);
  grayLabel.onclick=e=>e.stopPropagation();gray.onchange=()=>grayscale([b.id],gray.checked);
  card._collection={check,gray,handle,addonSlot};
 }
 const c=card._collection;c.check.checked=selected.has(b.id);c.check.setAttribute('aria-label','Select '+b.name);c.gray.checked=!!b.grayscale;c.gray.setAttribute('aria-label','Grayscale '+b.name);c.handle.setAttribute('aria-label','Drag '+b.name+' to reorder');
 card.classList.toggle('multi-selected',selected.has(b.id));
 window.ShadeAddons?.decorateBallCard({ball:b,slot:c.addonSlot});
}
function render(){
 if(!host)return;normalize();const balls=chosen(),n=balls.length;
 $('selection-count').textContent=n+' selected';
 for(const id of ['copy-png','duplicate-selected','remove-selected','make-group','move-earlier','move-later','selection-gray'])$(id).disabled=!n;
 const gray=balls.filter(b=>b.grayscale).length;$('selection-gray').checked=!!n&&gray===n;$('selection-gray').indeterminate=gray>0&&gray<n;
 const entries=[['','Choose a saved group'],...groups().map(g=>[g.id,g.name+' ('+g.memberIds.length+')'])],key=JSON.stringify(entries);
 if($('ball-groups').dataset.key!==key){$('ball-groups').replaceChildren(...entries.map(([id,name])=>{const o=node('option',name);o.value=id;return o;}));$('ball-groups').dataset.key=key;}
 $('ball-groups').value=groupId;
 for(const id of ['rename-group','delete-group','duplicate-group'])$(id).disabled=!group();
 for(const id of ['group-add','group-remove'])$(id).disabled=!group()||!n;
 $('duplicate-group').disabled=!group()?.memberIds.length;
 const g=guide();$('temperature-visible').checked=g.visible;$('temperature-legend').hidden=!g.visible;
 $('copy-png').disabled=!n||copyBusy;
}
function editGroup(rename=false){
 groupDraft=rename?groupId:null;$('group-name').value=rename?group().name:'Group '+(groups().length+1);$('group-dialog-heading').textContent=rename?'Rename group':'Group selected balls';$('group-dialog').showModal();$('group-name').focus();
}
function cleanCopy(){
 if(copyURL)URL.revokeObjectURL(copyURL);copyURL=null;copyBlob=null;
 if(copyCanvas)copyCanvas.width=copyCanvas.height=0;copyCanvas=null;$('copy-preview').removeAttribute('src');
}
function settings(){return {kind:$('copy-kind').value,width:Number($('copy-size').value),background:$('copy-background').value,labels:$('copy-labels').checked,grayscale:!$('copy-original').checked};}
function previewCanvas(canvas){
 cleanCopy();copyCanvas=canvas;$('copy-result').textContent='Preparing PNG…';$('copy-result').classList.remove('error');
 $('copy-dialog').showModal();
 const blob=new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG encoding failed. Try fewer balls or a smaller image.')),'image/png'));
 blob.then(b=>{if(copyCanvas!==canvas)return;copyBlob=b;copyURL=URL.createObjectURL(b);$('copy-preview').src=copyURL;},()=>{});
 return blob;
}
async function writePNG(blobPromise){
 if(root.isSecureContext===false||!navigator.clipboard?.write||!root.ClipboardItem)throw Error('Image clipboard access is unavailable here. Use a current desktop browser, or right-click the preview and choose Copy image.');
 if(ClipboardItem.supports&&!ClipboardItem.supports('image/png'))throw Error('This browser cannot copy PNG images. Right-click the preview and choose Copy image.');
 await navigator.clipboard.write([new ClipboardItem({'image/png':blobPromise})]);
}
async function copyPNG(retry=false,providedCanvas=null){
 if(copyBusy)return;
 let promise;
 try{
  if(retry){if(!copyBlob)throw Error('The PNG is not ready.');promise=Promise.resolve(copyBlob);}
  else if(providedCanvas)promise=previewCanvas(providedCanvas);
  else {const balls=E.clone(chosen());if(!balls.length)throw Error('Select at least one ball to copy.');const s=settings();promise=previewCanvas(R.exportCanvas(balls,s.kind,s.width,s.background,s.labels,[],s.grayscale));}
  promise.catch(()=>{});copyBusy=true;render();$('copy-retry').disabled=true;
  // Pass the pending encoding into ClipboardItem before leaving the click activation.
  await writePNG(promise);$('copy-result').textContent='PNG copied. Switch to your art program and paste.';$('copy-result').classList.remove('error');host.status('PNG copied to the clipboard. Paste it into your art program.');
 }catch(e){const message=e.name==='NotAllowedError'?'Clipboard access was denied. Allow clipboard access in your browser, then Retry, or right-click the preview and choose Copy image.':e.message;$('copy-result').textContent=message;$('copy-result').classList.add('error');host.status(message,true);}
 finally{copyBusy=false;$('copy-retry').disabled=false;if(!$('copy-dialog').open)cleanCopy();render();}
}
function init(h){
 host=h;normalize();
 $('select-all').onclick=()=>{host.finishGesture();selected=new Set(list().map(b=>b.id));groupId='';refresh();};
 $('clear-selection').onclick=()=>{host.finishGesture();reset();refresh();};
 $('duplicate-selected').onclick=()=>duplicate();$('remove-selected').onclick=()=>remove();$('move-earlier').onclick=()=>nudge(-1);$('move-later').onclick=()=>nudge(1);
 $('selection-gray').onchange=()=>grayscale(chosen().map(b=>b.id),$('selection-gray').checked);
 $('make-group').onclick=()=>editGroup();$('rename-group').onclick=()=>editGroup(true);
 $('group-cancel').onclick=()=>$('group-dialog').close();
 $('group-save').onclick=()=>{const name=$('group-name').value.trim();if(!name){$('group-name').focus();return;}
  if(host.change(()=>{if(groupDraft){const g=groups().find(g=>g.id===groupDraft);if(!g)throw Error('This group no longer exists.');g.name=name;}else{const g={id:'group_'+E.uid(),name,memberIds:chosen().map(b=>b.id)};host.project().groups??=[];host.project().groups.push(g);groupId=g.id;}},'Group saved'))$('group-dialog').close();};
 $('ball-groups').onchange=()=>{host.finishGesture();groupId=$('ball-groups').value;const g=group();if(g){selected=new Set(g.memberIds);anchor=g.memberIds[0];if(selected.size&&!selected.has(host.active()))host.active(anchor);}refresh();};
 $('delete-group').onclick=()=>host.change(()=>{host.project().groups=groups().filter(g=>g.id!==groupId);groupId='';},'Group removed; its balls are unchanged');
 $('duplicate-group').onclick=()=>duplicate(group().memberIds,true);
 for(const [id,add]of [['group-add',true],['group-remove',false]])$(id).onclick=()=>host.change(()=>{const g=group();g.memberIds=add?[...new Set([...g.memberIds,...selected])]:g.memberIds.filter(id=>!selected.has(id));},'Group membership updated');
 // Keep the selected group while checkbox edits build a membership change.
 $('copy-png').onclick=()=>copyPNG();$('copy-retry').onclick=()=>copyPNG(true);
 $('copy-close').onclick=()=>$('copy-dialog').close();$('copy-dialog').addEventListener('close',()=>{if(!copyBusy)cleanCopy();});
 $('copy-download').onclick=()=>{if(copyBlob)host.download(copyBlob,'Shade-Lab-selected.png');};
 $('temperature-visible').onchange=()=>host.change(()=>host.project().temperatureGuide={visible:$('temperature-visible').checked,start:90,end:270},'Warm/cool guide visibility updated; colors are unchanged');
 document.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pointerId)return;drag.x=e.clientX;drag.y=e.clientY;if(Math.hypot(drag.x-drag.startX,drag.y-drag.startY)>5){drag.moved=true;document.body.classList.add('gallery-dragging');for(const id of drag.ids)document.querySelector(`.ball-card[data-ball-id="${id}"]`)?.classList.add('drag-source');locateDrop();}});
 document.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.pointerId)return;const d=drag;cancelDrag();if(d.moved&&d.valid)reorder(d.ids,d.before);});
 document.addEventListener('pointercancel',cancelDrag);document.addEventListener('lostpointercapture',e=>{if(drag?.pointerId===e.pointerId)cancelDrag();});window.addEventListener('blur',cancelDrag);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){e.preventDefault();cancelDrag();return;}if(document.querySelector('dialog[open]')||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)||document.activeElement.isContentEditable)return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='a'){e.preventDefault();$('select-all').click();}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='c'&&chosen().length&&!window.getSelection()?.toString()){e.preventDefault();copyPNG();}
  if(e.altKey&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();nudge(e.key==='ArrowLeft'?-1:1);}
 });
}
root.ShadeCollection={init,state,restore,reset,pick,follow,normalize,render,decorate,chosen,duplicate,remove,reorder,cancelDrag,guide,copyCanvas:canvas=>copyPNG(false,canvas)};
})(globalThis);
