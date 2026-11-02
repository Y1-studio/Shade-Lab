// Demonstrate the real controls in the leased practice workspace. No screen
// picker, downloads or external data are requested automatically.
function tutorialDemonstration(api){
 const E=Shade,R=ShadeRender,$=id=>document.getElementById(id);
 const ball=()=>{const s=api.getState();return E.clone(s.project.balls.find(b=>b.id===s.activeBallId));};
 const set=(input,value)=>{if(input.type==='checkbox')input.checked=value;else input.value=value;input.dispatchEvent(new Event(input.type==='range'?'input':'change',{bubbles:true}));if(input.type==='range')input.dispatchEvent(new Event('change',{bubbles:true}));api.refreshPicker();};
 const paint=value=>{api.applyColor(E.hexHsl(value));api.refreshPicker();};
 const snapshot=()=>{api.refreshPicker();const c=document.createElement('canvas');c.width=c.height=240;c.getContext('2d').drawImage($('wheel'),0,0,240,240);return c;};
 function pair(kind,before,after,labels=['Before','After'],caption='Example — before and after'){
  const figure=document.createElement('figure'),heading=document.createElement('figcaption'),grid=document.createElement('div');figure.className='tutorial-example';figure.dataset.comparison='true';heading.textContent=caption;grid.className='tutorial-example-pair';figure.append(heading,grid);
  [before,after].forEach((value,i)=>{const type=Array.isArray(kind)?kind[i]:kind,cell=document.createElement('div'),canvas=document.createElement('canvas'),label=document.createElement('span');canvas.id=i?'tutorial-demo-after':'tutorial-demo-before';canvas.width=240;canvas.height=type==='wheel'?240:198;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',labels[i]);if(type==='wheel'||type==='image')canvas.getContext('2d').drawImage(value,0,0,canvas.width,canvas.height);else R.ballCanvas(canvas,value);label.textContent=labels[i];cell.append(canvas,label);grid.append(cell);});return figure;
 }
 return {enter(step){
  let before;
  if(step.id==='wheel-gray'||step.id==='surface-gray'){
   before=snapshot();set($(step.id==='wheel-gray'?'picker-grayscale-wheel':'picker-grayscale-surface'),true);
   return pair('wheel',before,snapshot(),['Color','Grayscale'],step.id==='wheel-gray'?'Example: ring grayscale':'Example: square grayscale');
  }
  if(step.id==='ball-gray'){
   before=ball();set(document.querySelector('#gallery .ball-card.active .ball-gray input'),true);
   return pair('ball',before,ball(),['Color','Grayscale'],'Example: ball grayscale');
  }
  if(step.id==='background'){
   before=ball();set($('hex'),'#D8C4A0');return pair('ball',before,ball(),['No background','New background'],'Example: a light background');
  }
  if(step.id==='strength'||step.id==='blending'){
   before=ball();set($(step.id==='strength'?'strength':'softness'),step.id==='strength'?3:75);
   return pair('ball',before,ball(),step.id==='strength'?['1× strength','3× strength']:['Hard edges','75% blending'],step.id==='strength'?'Example: 1× vs 3× strength':'Example: hard edges vs soft blending');
  }
  if(step.id==='pick-screen'){
   api.selectRole('highlight');before=ball();paint('#42B883');
   return pair('ball',before,ball(),['Before','Sampled green'],'Demo sample #42B883 → Highlight');
  }
  if(step.id==='pick-lock'){
   api.selectRole('highlight');const checkpoint=api.checkpointTemporaryWorkspace();paint('#42B883');const unlocked=ball();api.restoreTemporaryWorkspace(checkpoint);$('color-pick-lock').click();paint('#42B883');
   return pair('ball',unlocked,ball(),['🔓 One part','🔒 Linked colors'],'The same green pick, with each lock setting');
  }
  if(step.id==='swap'){
   api.selectRole('highlight');paint('#F2CA63');api.selectRole('shadow');paint('#283C79');before=ball();$('wheel-swap').click();api.refreshPicker();
   return pair('ball',before,ball(),['Before swap','After swap'],'Highlight and Shadow exchange hues');
  }
  if(step.id==='ball-selection'){$('select-all').click();return null;}
  if(step.id==='constraints'){
   $('hue-color-limits-edit').click();$('hue-color-limits-apply').click();if(!$('sl-panel-body').contains($('sl-tools')))$('sl-tools-open').click();before=snapshot();$('surface-disable').click();
   return pair('wheel',before,snapshot(),['Constrained','Disabled'],'Example: disable without deleting settings');
  }
  if(step.id==='reference'){
   const picture=document.createElement('canvas');picture.width=240;picture.height=198;const ctx=picture.getContext('2d');ctx.fillStyle='#76B9D5';ctx.fillRect(0,0,240,198);ctx.fillStyle='#F2CA63';ctx.fillRect(150,18,50,50);ctx.fillStyle='#42B883';ctx.fillRect(0,110,240,88);ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.strokeRect(80,140,18,18);api.selectRole('highlight');paint('#42B883');
   return pair(['image','ball'],picture,ball(),['Demo reference','Sampled green'],'Example: a picture color → Highlight');
  }
  if(step.id==='history'){for(const hex of ['#42B883','#F2CA63','#283C79'])paint(hex);return null;}
  return null;
 }};
}
