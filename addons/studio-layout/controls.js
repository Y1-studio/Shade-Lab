function studioControls(api){
 const E=globalThis.Shade,$=id=>document.getElementById(id);
 const make=(tag,attrs={},text)=>{const el=document.createElement(tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;};
 const button=(id,text,title)=>make('button',{id,type:'button',title:title||text,'aria-label':title||text},text);
 const root=api.mount('inspector'),inspector=root.parentElement,workspace=inspector.closest('main');
 const previousOwner=workspace.getAttribute('data-shade-addon');workspace.dataset.shadeAddon=api.id;
 const moves=[];api.onCleanup(()=>{for(const restore of moves.reverse())restore();});
 function move(node,parent){if(!node)return;const mark=document.createComment('studio layout location');node.before(mark);parent.append(node);moves.push(()=>{mark.replaceWith(node);});}
 const stash=make('div',{hidden:''}),analysis=make('details',{id:'sl-analysis',open:''}),analysisTitle=make('summary',{title:'Hide or show the color graph'},'Color path analysis');analysis.append(analysisTitle);
 const heading=make('div',{class:'sl-panel-heading',hidden:''}),title=make('h2',{id:'sl-panel-title'}),close=button('sl-panel-close','×','Close side panel');heading.append(title,close);
 const body=make('div',{id:'sl-panel-body',hidden:'',role:'region','aria-labelledby':'sl-panel-title',tabindex:'-1'});
 root.append(analysis,heading,body,stash);
 const recipe=make('section',{id:'sl-recipe'}),strength=make('section',{id:'sl-strength'}),blend=make('section',{id:'sl-blend'}),settings=make('section',{id:'sl-wheel-settings'}),tools=make('section',{id:'sl-tools'}),background=make('section',{id:'sl-background'});
 for(const node of [recipe,strength,blend,settings,tools,background])stash.append(node);
 for(const node of [...inspector.children])if(node!==root)move(node,recipe);
 move($('strength').closest('label'),strength);move(document.querySelector('.comparisons'),strength);
 move($('softness').closest('label'),blend);
 move(document.querySelector('.analysis'),analysis);
 for(const node of [recipe,strength,blend,settings,tools,background])stash.append(node);
 const toolsWasOpen=$('tools-panel').open;move($('tools-panel'),tools);$('tools-panel').open=true;api.onCleanup(()=>{if($('tools-panel'))$('tools-panel').open=toolsWasOpen;});
 for(const node of [$('picker-shape').closest('label'),$('temperature-visible').closest('label'),$('temperature-legend'),$('free-plane').closest('label'),$('free-hue').closest('label'),$('picker-lock-help'),$('group-move').closest('label'),$('group-move').closest('label').nextElementSibling])move(node,settings);
 const planeHelp=[...document.querySelectorAll('.picker-panel>details')].find(n=>n.textContent.includes('How the triangle'));move(planeHelp,settings);
 // A single panel owns the relocated controls, never their draft state.
 let current=null,returnFocus=null;
 function closePanel(cancel=true,focus=true){
  if(!current)return;if(!api.signal.aborted)api.finishColorGesture();const old=current;current=null;old.restore();
  if(cancel)old.cancel?.();
  heading.hidden=body.hidden=true;workspace.classList.remove('sl-panel-open');
  if(focus&&returnFocus?.isConnected){if(returnFocus.closest('[hidden]'))$('sl-tools-open')?.focus();else returnFocus.focus();}
 }
 function openPanel(node,name,options={}){
  api.finishColorGesture();const origin=options.origin||document.activeElement;
  if(current?.node===node){closePanel();return;}
  closePanel(true,false);returnFocus=origin;
  // Focus may be on artwork or a swatch; only a disclosure button opens a panel.
  const trigger=options.trigger===null?null:origin?.matches?.('button:not(.swatch)')?origin:null,expanded=trigger?.getAttribute('aria-expanded');
  const parent=node.parentNode,next=node.nextSibling;
  const restore=()=>{if(parent)parent.insertBefore(node,next?.parentNode===parent?next:null);node.classList.remove('sl-embedded-dialog');if(trigger){if(expanded===null)trigger.removeAttribute('aria-expanded');else trigger.setAttribute('aria-expanded',expanded);}};
  current={node,restore,cancel:options.cancel};body.append(node);heading.hidden=body.hidden=false;
  title.textContent=name;workspace.classList.add('sl-panel-open');
  if(globalThis.matchMedia?.('(max-width:700px)').matches)workspace.scrollIntoView({block:'start'});
  trigger?.setAttribute('aria-expanded','true');
  if(options.focus!==false)body.focus({preventScroll:true});
 }
 api.on(close,'click',()=>closePanel());
 api.on(document,'keydown',event=>{if(event.key==='Escape'&&current&&!document.querySelector('dialog[open]:not(.sl-embedded-dialog):not(#fl-dialog)')){event.preventDefault();event.stopImmediatePropagation();closePanel();}},true);
 ContextPanels.connect({
  openDialog(dialog){
   const label=dialog.querySelector('h2')?.textContent||'Tool preview';
   openPanel(dialog,label,{cancel:()=>{dialog.dispatchEvent(new Event('cancel',{cancelable:true}));if(dialog.open)dialog.close();}});
   dialog.classList.add('sl-embedded-dialog');dialog.open=true;
   help(dialog);
  },
  closeDialog(dialog){if(current?.node!==dialog)return false;closePanel(false);dialog.close();return true;}
 });
 // Direct color selection from a sphere or its keyboard-accessible swatch.
 api.onColorSelected(()=>{if(current?.node!==recipe)openPanel(recipe,'Shading recipe',{focus:false,trigger:null});});
 api.onCleanup(()=>{closePanel();ContextPanels.connect(null);});
 const commands=make('div',{class:'sl-picker-commands'}),wheelSettings=button('sl-settings-open','⚙','Wheel settings'),openTools=button('sl-tools-open','⌘','Tools'),openRecipe=button('sl-recipe-open','⌁','Shading recipe');
 const loadRecipe=button('sl-load-recipe','Open formula JSON');$('save-preset').before(loadRecipe);api.on(loadRecipe,'click',()=>$('open-json').click());api.onCleanup(()=>loadRecipe.remove());
 for(const [control,node,name]of [[wheelSettings,settings,'Wheel settings'],[openTools,tools,'Tools'],[openRecipe,recipe,'Shading recipe']]){
  control.dataset.slPanel='';control.setAttribute('aria-expanded','false');control.setAttribute('aria-controls','sl-panel-body');api.on(control,'click',()=>openPanel(node,name,{origin:control}));commands.append(control);
 }
 const picker=document.querySelector('.picker-panel');picker.querySelector('.panel-heading').after(commands);api.onCleanup(()=>commands.remove());
 // Keep both grayscale toggles as real labelled checkboxes, with compact icons.
 const wheelWrap=make('div',{class:'sl-wheel-wrap'});move($('wheel'),wheelWrap);move($('addon-picker-grayscale-view'),wheelWrap);$('wheel-section').prepend(wheelWrap);api.onCleanup(()=>wheelWrap.remove());
 const sliders=make('details',{id:'sl-sliders',open:''}),sliderTitle=make('summary',{},'Channels'),sliderHead=make('div',{class:'sl-slider-heading'});sliders.append(sliderTitle);
 move($('sliders'),sliders);sliderHead.append(sliders);move($('wheel-swap'),sliderHead);wheelWrap.parentElement.after(sliderHead);api.onCleanup(()=>sliderHead.remove());
 // Legacy mode buttons remain available without hiding the wheel.
 api.on($('show-sliders'),'click',()=>{savePref('slidersOpen',true);sliders.scrollIntoView?.({block:'nearest'});});
 api.on($('show-wheel'),'click',()=>{savePref('slidersOpen',true);});
 function savePref(key,value){api.updateProject(project=>{const old=project.addons?.[api.id];if(old&&old.version!==1)throw Error('Unsupported layout preferences are retained.');project.addons??={};project.addons[api.id]={...old,version:1,[key]:value};},'Workspace view updated');}
 api.on(sliderTitle,'click',event=>{event.preventDefault();savePref('slidersOpen',!sliders.open);});
 api.on(analysisTitle,'click',event=>{event.preventDefault();savePref('analysisOpen',!analysis.open);});
 // Extra tabs share Filter Lab's existing navigation and cancellation flow.
 const tablist=$('fl-open').parentElement,tabRoot=api.mount('studioWorkspace');
 const reference=make('section',{id:'sl-reference',role:'tabpanel',hidden:''}),history=make('section',{id:'sl-history',role:'tabpanel',hidden:''});tabRoot.append(reference,history);move(document.querySelector('.reference'),reference);
 const referenceTab=button('sl-reference-tab','Reference Image'),historyTab=button('sl-history-tab','History');
 const tabs=[$('fl-balls-tab'),$('fl-open'),referenceTab,historyTab];
 for(const [control,target]of [[referenceTab,reference],[historyTab,history]]){control.setAttribute('role','tab');control.setAttribute('aria-controls',target.id);target.setAttribute('aria-labelledby',control.id);tablist.append(control);api.onCleanup(()=>control.remove());}
 let activeTab='balls';
 function setTab(name){
  closePanel();if(name!=='filter'&&$('fl-dialog').open)$('fl-close').click();activeTab=name;
  $('studio-content').hidden=name!=='balls';reference.hidden=name!=='reference';history.hidden=name!=='history';
  tabs.forEach((control,i)=>{const on=['balls','filter','reference','history'][i]===name;control.setAttribute('aria-selected',String(on));control.tabIndex=on?0:-1;});
 }
 tabs.forEach((control,i)=>api.on(control,'click',()=>setTab(['balls','filter','reference','history'][i])));
 api.on(tablist,'keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();event.stopImmediatePropagation();let index=tabs.indexOf(event.target.closest?.('[role="tab"]'));if(index<0)index=tabs.indexOf(document.activeElement);index=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[index].click();tabs[index].focus();},true);
 for(const id of ['fl-apply','fl-close'])api.on($(id),'click',()=>{if(!$('fl-dialog').open)setTab('balls');});
 // Filter Lab owns its compact primary row and its own settings content.
 // History is separate from legacy samples so old imported data is never lost.
 const historyHead=make('div',{class:'panel-heading'}),clear=button('sl-history-clear','Clear'),historyGrid=make('div',{id:'sl-history-colors',class:'sl-history-grid'}),historyActions=make('div',{class:'actions'}),newBall=button('sl-history-ball','Color → new ball'),newRegion=button('sl-history-region','Color → region');
 historyHead.append(make('h2',{},'Color History'),clear);historyActions.append(newBall,newRegion);history.append(historyHead,make('p',{class:'hint'},'Recent committed colors. Click a swatch to reuse it.'),historyGrid,historyActions);
 let selectedColor=null,historyKey='';
 api.on(clear,'click',()=>{selectedColor=null;api.updateProject(project=>{project.addons??={};project.addons[api.id]={...project.addons[api.id],version:1,colors:[]};},'Color history cleared; Undo restores it');});
 api.on(newBall,'click',()=>{if(!selectedColor)return;const b=E.defaultBall('History study',selectedColor);if(api.updateProject(project=>project.balls.push(b),'Ball created from history')){api.focusBall(b.id);setTab('balls');}});
 api.on(newRegion,'click',()=>{if(selectedColor&&api.addColorRegion(selectedColor)){setTab('balls');}});
 function renderHistory(project){
  const colors=ColorHistory.colors(project),key=JSON.stringify(colors);clear.disabled=!colors.length||!!(project.addons?.[api.id]&&project.addons[api.id].version!==1);
  if(selectedColor&&!colors.some(color=>E.toHex(color)===E.toHex(selectedColor)))selectedColor=null;
  if(key!==historyKey){historyKey=key;historyGrid.replaceChildren();
   if(!colors.length)historyGrid.append(make('p',{class:'muted'},'Colors you choose will appear here.'));
   for(const color of colors){const hex=E.toHex(color),swatch=button('',hex,'Use '+hex),dot=make('i',{'aria-hidden':'true'});swatch.removeAttribute('id');swatch.dataset.historyColor=JSON.stringify(color);swatch.setAttribute('aria-pressed',String(!!selectedColor&&hex===E.toHex(selectedColor)));dot.style.background=hex;swatch.prepend(dot);historyGrid.append(swatch);}
  }
  newBall.disabled=newRegion.disabled=!selectedColor;
 }
 api.on(historyGrid,'click',event=>{const swatch=event.target.closest('[data-history-color]');if(!swatch)return;selectedColor=JSON.parse(swatch.dataset.historyColor);api.applyColor(selectedColor);for(const s of historyGrid.querySelectorAll('button'))s.setAttribute('aria-pressed',String(E.toHex(JSON.parse(s.dataset.historyColor))===E.toHex(selectedColor)));});
 // Per-ball strength / blending buttons use the existing live controls.
 api.onBallCard(({ball,slot})=>{
  if(slot.querySelector('[data-sl-strength]'))return;
  const backgroundEdit=slot.querySelector('.bg-card-edit');if(backgroundEdit)api.on(backgroundEdit,'click',()=>openBackground(backgroundEdit));
  const amount=button('','◒','Shading strength and comparisons'),soft=button('','◌','Soft blending');amount.removeAttribute('id');soft.removeAttribute('id');amount.dataset.slStrength=ball.id;soft.dataset.slBlend=ball.id;
  for(const [control,node,name]of [[amount,strength,'Shading strength'],[soft,blend,'Soft blending']]){control.dataset.slPanel='';control.setAttribute('aria-expanded','false');api.on(control,'click',event=>{event.stopPropagation();api.focusBall(ball.id);openPanel(node,name,{origin:control});});slot.append(control);}
 });
 api.onCleanup(()=>document.querySelectorAll('[data-sl-strength],[data-sl-blend]').forEach(n=>n.remove()));
 // Background editing is still the owning add-on's auxiliary picker target.
 const backgroundActions=make('div',{class:'actions'});background.append(make('p',{class:'hint'},'Choose the surrounding color with the wheel, surface, HEX or channels.'),backgroundActions);
 let backgroundReturns=[];
 const restoreBackground=()=>{for(const [node,parent]of backgroundReturns){if(parent.isConnected)parent.append(node);else node.remove();}backgroundReturns=[];};
 function openBackground(edit){const state=api.getState();if(current?.node===background)closePanel(false,false);restoreBackground();if(state.activeColorTarget?.id==='background'){
  const controls=edit.parentElement,id=state.activeBallId;
  for(const n of controls.querySelectorAll('.bg-card-toggle,.bg-card-clear')){backgroundReturns.push([n,controls]);backgroundActions.append(n);}
  openPanel(background,'Background',{origin:edit,cancel:()=>{restoreBackground();const s=api.getState();if(s.activeBallId===id&&s.activeColorTarget?.id==='background')edit.click();}});
 }else if(current?.node===background)closePanel(false);
 }
 api.onCleanup(restoreBackground);
 function help(container){
  for(const paragraph of container.querySelectorAll('p.hint')){
   if(paragraph.textContent.length<115||paragraph.closest('.sl-help')||paragraph.getAttribute('role')==='status')continue;
   const detail=make('details',{class:'sl-help'}),summary=make('summary',{title:'Help','aria-label':'Help'},'?');paragraph.before(detail);detail.append(summary,paragraph);moves.push(()=>detail.replaceWith(paragraph));
  }
 }
 const legacySamples=document.querySelector('.picked-section');const legacyHidden=legacySamples.hidden;legacySamples.hidden=true;
 const segments=picker.querySelector('.segments');const segmentsHidden=segments.hidden;segments.hidden=true;
 const swapPanel=$('addon-wheel-position-swap-actions');const swapPanelHidden=swapPanel.hidden;swapPanel.hidden=true;
 help(picker);help(recipe);help(analysis);help(settings);help($('fl-dialog'));help(document.querySelector('.collection-tools'));
 api.subscribe(state=>{
  const prefs=state.project.addons?.[api.id];sliders.open=prefs?.slidersOpen!==false;analysis.open=prefs?.analysisOpen!==false;
  if(current?.node===background&&state.activeColorTarget?.id!=='background'){closePanel(false,false);restoreBackground();}
  renderHistory(state.project);
  if(activeTab==='filter'&&!$('fl-dialog').open)setTab('balls');
  // The background package updates live visibility after each render.
 });
 api.on(window,'shade-project-opened',()=>{selectedColor=null;historyKey='';setTab('balls');renderHistory(api.getState().project);});
 renderHistory(api.getState().project);setTab('balls');
 api.onCleanup(()=>{
  for(const node of [...backgroundActions.children])document.querySelector('.bg-card-controls')?.append(node);
  legacySamples.hidden=legacyHidden;segments.hidden=segmentsHidden;swapPanel.hidden=swapPanelHidden;
  if(previousOwner===null)workspace.removeAttribute('data-shade-addon');else workspace.setAttribute('data-shade-addon',previousOwner);
  workspace.classList.remove('sl-panel-open');
 });
}
