// Every lesson has an explicit image, using the actual app renderer/preview
// where applicable. The custom-ball drawings share the importable type's paths.
function tutorialIllustrations(api){
 const E=Shade,R=ShadeRender,$=id=>document.getElementById(id),art=TutorialReferenceBall;
 const ball=()=>{const s=api.getState();return E.clone(s.project.balls.find(b=>b.id===s.activeBallId));};
 const card=(label,draw,square=false)=>({label,draw,square});
 function gallery(caption,items){
  const figure=document.createElement('figure'),heading=document.createElement('figcaption'),grid=document.createElement('div');figure.className='tutorial-example';heading.textContent=caption;grid.className='tutorial-example-pair';grid.dataset.columns=String(items.length);figure.append(heading,grid);
  for(const item of items){const cell=document.createElement('div'),canvas=document.createElement('canvas'),label=document.createElement('span');canvas.width=240;canvas.height=item.square?240:198;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',item.label);item.draw(canvas);label.textContent=item.label;cell.append(canvas,label);grid.append(cell);}return figure;
 }
 const rendered=(label,b)=>card(label,c=>R.ballCanvas(c,b));
 const reference=(label='Reference design',only=null)=>card(label,c=>{const ctx=c.getContext('2d');if(only){ctx.fillStyle='#62727B';ctx.fillRect(0,0,c.width,c.height);for(let y=0;y<c.height;y+=20)for(let x=0;x<c.width;x+=20)if((x+y)/20%2===0){ctx.fillStyle='#84959E';ctx.fillRect(x,y,20,20);}}art.draw(ctx,35,14,170,art.colors,only);});
 function snapshot(label,id,crop=null){return card(label,c=>{const src=$(id);if(!src)throw Error('Missing tutorial image source: '+id);const ctx=c.getContext('2d');if(crop)ctx.drawImage(src,...crop,0,0,c.width,c.height);else ctx.drawImage(src,0,0,c.width,c.height);},!crop&&id.includes('wheel'));}
 function wheel(label,shape,guide=null){return card(label,c=>{const src=document.createElement('canvas');src.id='tutorial-art-'+shape;src.width=src.height=640;R.drawWheel(src,ball(),'base',[],shape);if(guide){const ctx=src.getContext('2d');ctx.strokeStyle='#a5ffe0';ctx.lineWidth=3;ctx.beginPath();if(guide==='area')ctx.rect(105,105,110,90);else if(guide==='line'){ctx.moveTo(85,225);ctx.lineTo(235,95);}else{[0,120,240,0].forEach((h,i)=>{const p=E.wheelPoint(h);i?ctx.lineTo(...p):ctx.moveTo(...p);});}ctx.stroke();}c.getContext('2d').drawImage(src,0,0,c.width,c.height);},true);}
 return {forStep(step){
  if(step.id==='selection')return gallery('Click a region → that part becomes selected',[card('Example: click Highlight',c=>{R.ballCanvas(c,ball());const ctx=c.getContext('2d'),f=R.ballFrame(c.width,c.height,ball()),x=f.x+f.width*.24,y=f.y+f.height*.2;ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x+12,y-5);ctx.lineTo(205,28);ctx.stroke();})]);
  if(step.id==='points')return gallery('The same part has a hue and a position',[snapshot('Hue ring','wheel'),snapshot('Saturation / lightness','wheel',[168,168,304,304])]);
  if(step.id==='settings')return gallery('Two picker shapes for the same colors',[wheel('Square','square'),wheel('Triangle','triangle')]);
  if(step.id==='tools')return gallery('Examples of the guides in Tools',[wheel('Harmony','square','harmony'),wheel('Area','square','area'),wheel('Line','square','line')]);
  if(step.id==='recipes'){const before=ball(),after=E.clone(before);E.editRecipeColor(after,'base',E.hexHsl('#42B883'));return gallery('A recipe carries Base changes to linked parts',[rendered('Red Base',before),rendered('Green Base',after)]);}
  if(step.id==='new-ball')return gallery('A new study can use a different drawing',[rendered('Classic study',ball()),reference('Green reference style')]);
  if(step.id==='ball-parts')return gallery('Separate PNG layers from the green reference',[reference('1 · Base','base'),reference('2 · Shadow','shadow'),reference('3 · Highlight','highlight'),reference('4 · Outline','outline')]);
  if(step.id==='custom-type')return gallery('Stack the masks; keep the outline as an overlay',[reference('Base + Shadow + Highlight + Outline')]);
  if(step.id==='custom-compare'){const classic=ball();classic.base=E.hexHsl(art.colors.base);classic.roles=classic.roles.filter(r=>['highlight','shadow'].includes(r.id));for(const r of classic.roles)E.setRule(r,'offset',E.difference(classic.base,E.hexHsl(art.colors[r.id]),r.model));return gallery('Same colors and roles, different artwork',[rendered('Built-in Classic',classic),reference('Custom reference geometry')]);}
  if(step.id==='library')return gallery('A saved type keeps its design and recipe',[rendered('Save this ball',ball()),card('Reusable type',c=>{const ctx=c.getContext('2d');ctx.fillStyle='#263b34';ctx.fillRect(24,12,192,170);ctx.strokeStyle='#9ff4d6';ctx.lineWidth=3;ctx.strokeRect(24,12,192,170);const mini=document.createElement('canvas');mini.width=160;mini.height=140;R.ballCanvas(mini,ball());ctx.drawImage(mini,40,20);})]);
  if(step.id==='ball-selection'||step.id==='balls-tab')return gallery(step.id==='ball-selection'?'Checkboxes choose the group':'Each card is a separate study',api.getState().project.balls.slice(0,2).map((b,i)=>card('Study '+(i+1)+(step.id==='ball-selection'?' · checked':''),c=>{R.ballCanvas(c,b);if(step.id==='ball-selection'){const ctx=c.getContext('2d');ctx.strokeStyle='#9ff4d6';ctx.lineWidth=4;ctx.strokeRect(8,8,20,20);ctx.beginPath();ctx.moveTo(12,18);ctx.lineTo(17,23);ctx.lineTo(25,12);ctx.stroke();}})));
  const previews={harmony:'harmony-wheel',limits:'hue-color-limits-wheel',areas:'color-areas-wheel',lines:'line-guides-wheel',compare:'compare-wheel'};
  if(previews[step.id])return gallery(step.title+' — actual preview',[snapshot('Live tool preview',previews[step.id])]);
  if(step.id==='limit-locks')return gallery('Independent movement inside and around the wheel',[snapshot('Square points','hue-color-limits-wheel',[168,168,304,304]),snapshot('Wheel points','hue-color-limits-wheel')]);
  if(step.id==='filters')return gallery('The filter’s teaching example',[snapshot('Original / filtered','fl-teaching')]);
  if(step.id==='history')return gallery('Recent colors ready to reuse',[card('Committed colors',c=>{const colors=api.getState().project.addons?.['studio-layout']?.colors||[];const ctx=c.getContext('2d');colors.slice(0,3).forEach((color,i)=>{ctx.fillStyle=E.toHex(color);ctx.fillRect(8+i*78,28,68,132);});})]);
  throw Error('Add an illustration for tutorial step: '+step.id);
 }};
}
