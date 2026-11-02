function activateTutorial(api){
 const $=id=>document.getElementById(id),make=(tag,attrs={},text)=>{const el=document.createElement(tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;},button=(id,text)=>make('button',{id,type:'button'},text);
 const launch=button('tutorial-open','? Learn');api.mount('help').append(launch);
 const chooser=make('dialog',{id:'tutorial-chooser','data-shade-addon':api.id,'aria-labelledby':'tutorial-choose-title'}),startButton=button('tutorial-start-simple','Start tour'),chooseClose=button('tutorial-choose-close','×'),warning=make('p',{id:'tutorial-start-notice',role:'status'}),introTop=make('div',{class:'tutorial-top'});
 chooseClose.setAttribute('aria-label','Close tutorial');chooseClose.title='Close tutorial';
 const choices=make('div',{class:'tutorial-categories'});
 for(const category of categories){const choice=button('tutorial-start-'+category.id,category.title);choice.append(make('small',{},category.steps.length+' steps · '+category.description));choices.append(choice);api.on(choice,'click',()=>start(category.id));}
 startButton.textContent='Start full guide';
 const introHero=make('div',{class:'tutorial-hero tutorial-intro-hero'}),introText=make('div',{});
 introText.append(make('p',{},'Choose a category or follow the full '+steps.length+'-step guide. Explore as you go, or just use Next.'),tutorialSpriteCredit());introHero.append(tutorialSprite('regular'),introText);
 introTop.append(make('h2',{id:'tutorial-choose-title'},'Learn Shade Lab'),chooseClose);chooser.append(introTop,introHero,choices,make('p',{class:'tutorial-small'},'Examples use a temporary practice project and reset between steps. Close with × or Escape to return to your work.'),warning,startButton);document.body.append(chooser);
 const runway=make('div',{'data-shade-addon':api.id,class:'tutorial-runway',hidden:''}),layer=make('div',{'data-shade-addon':api.id,id:'tutorial-layer',hidden:''}),spot=make('div',{class:'tutorial-spot','aria-hidden':'true'}),card=make('aside',{id:'tutorial-card',role:'dialog','aria-modal':'false','aria-labelledby':'tutorial-title',tabindex:'-1'}),meta=make('p',{id:'tutorial-meta','aria-live':'polite'}),exit=button('tutorial-close','×'),progress=make('progress',{id:'tutorial-progress','aria-label':'Tutorial progress'}),title=make('h2',{id:'tutorial-title'}),copy=make('div',{id:'tutorial-copy'}),back=button('tutorial-back','Back'),next=button('tutorial-next','Next'),nav=make('div',{class:'tutorial-nav'}),top=make('div',{class:'tutorial-top'});
 const example=make('div',{id:'tutorial-example',hidden:''}),sourceSpot=make('div',{class:'tutorial-source','aria-hidden':'true',hidden:''}),demonstration=tutorialDemonstration(api),illustrations=tutorialIllustrations(api);
 const categorySelect=make('select',{id:'tutorial-category','aria-label':'Tutorial category'});categorySelect.append(make('option',{value:''},'Full guide · '+steps.length+' steps'),...categories.map(c=>make('option',{value:c.id},c.title+' · '+c.steps.length+' steps')));
 const lessonHero=make('div',{class:'tutorial-hero tutorial-lesson-hero'}),lessonText=make('div',{});lessonText.append(title,tutorialSpriteCredit());lessonHero.append(tutorialSprite('glasses'),lessonText);
 exit.setAttribute('aria-label','Close tutorial');exit.title='Close tutorial (Escape)';top.append(meta,exit);nav.append(back,next);card.append(top,categorySelect,progress,lessonHero,example,copy,nav);layer.append(spot,sourceSpot,card);document.body.append(runway,layer);next.classList.add('accent');
 let index=-1,selectedCategory=null,practice=false,frame=0,observer=null,layoutAttempts=0,interacting=false,navigating=false;
 const list=()=>selectedCategory?steps.filter(s=>s.category===selectedCategory):steps;
 const active=()=>index>=0;
 function visible(el){if(!el?.isConnected)return false;const modal=[...document.querySelectorAll('dialog:modal')].at(-1);if(modal&&!modal.contains(el))return false;for(let p=el;p&&p!==document.body;p=p.parentElement){if(p.hidden||(p.tagName==='DIALOG'&&!p.open)||getComputedStyle(p).display==='none')return false;if(p.tagName==='DETAILS'&&!p.open&&!p.querySelector('summary')?.contains(el))return false;}return true;}
 function attach(){const host=[...document.querySelectorAll('dialog:modal')].at(-1)||document.body;if(layer.parentElement!==host)host.append(layer);}
 const dialogOpen=()=>[...document.querySelectorAll('dialog[open]')].filter(el=>el!==chooser);
 const cancelIds={'new-dialog':'new-cancel','type-dialog':'type-cancel','layers-dialog':'layers-cancel','group-dialog':'group-cancel','copy-dialog':'copy-close','compare-dialog':'compare-close','fl-dialog':'fl-close','fl-settings':'fl-settings-close'};
 function closeDialogs(){document.body.append(layer);for(const el of dialogOpen().reverse()){const id=cancelIds[el.id]||(el.id.endsWith('-dialog')?el.id.replace(/-dialog$/,'-cancel'):null),control=id&&$(id);if(control)control.click();else{el.dispatchEvent(new Event('cancel',{cancelable:true}));if(el.open)el.close();}}}
 function demo(){const p=Shade.defaultProject();p.name='Shade Lab — practice';p.pickerShape='square';return{project:p,library:{schema:'shadelab.library',version:3,seededDefaults:1,entries:ShadeStudio.builtins.map(t=>({schema:'shadelab.ball-type',version:3,id:t.id,name:t.name,ball:Shade.clone(t.ball)}))}};}
 const panel=(id,opener)=>{if(!visible($(id)))$(opener)?.click();};
 const previews={limits:'hue-color-limits',harmony:'harmony',areas:'color-areas',lines:'line-guides'};
 function reveal(view){
  closeDialogs();
  if(view==='filter'){$('select-all').click();$('fl-open').click();}
  else if(view==='reference'||view==='history')$('sl-'+view+'-tab').click();
  else{
   if($('fl-balls-tab').getAttribute('aria-selected')!=='true')$('fl-balls-tab').click();
   if(previews[view]){panel('sl-tools','sl-tools-open');$(previews[view]+'-edit')?.click();}
   else if(view==='recipe'){const b=api.getState().project.balls.find(b=>b.id===api.getState().activeBallId);if(api.getState().activeRoleId==='base')api.selectRole(b.roles[0].id);panel('sl-recipe','sl-recipe-open');}
   else if(view==='compare'){$('select-all').click();panel('sl-tools','sl-tools-open');$('compare-balls').click();}
   else if(view==='settings')panel('sl-wheel-settings','sl-settings-open');
   else if(view==='tools')panel('sl-tools','sl-tools-open');
   else if(view==='background')document.querySelector('#gallery .ball-card.active .bg-card-edit')?.click();
   else if(view==='strength'||view==='blending')document.querySelector('#gallery .ball-card.active [data-sl-'+(view==='strength'?'strength':'blend')+']')?.click();
   else if(view==='new'||view==='newtype')$(view==='new'?'add-ball':'new-type').click();
   else if(view==='type')$('save-type').click();
   else if(visible($('sl-panel-body')))$('sl-panel-close').click();
  }
  attach();
 }
 function targets(){const step=list()[index];return [...document.querySelectorAll(step.focus||step.target)].filter(visible);}
 function position(){
  frame=0;if(!active())return;attach();const els=targets(),r=TourPosition.target(els,null,api.getState().project.pickerShape||'triangle');spot.hidden=!r||!r.width||!r.height;
  if(!spot.hidden)Object.assign(spot.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
  const step=list()[index],source=step.focus&&TourPosition.target([...document.querySelectorAll(step.target)].filter(visible));sourceSpot.hidden=!source?.width||!source?.height;if(!sourceSpot.hidden)Object.assign(sourceSpot.style,{left:source.left+'px',top:source.top+'px',width:source.width+'px',height:source.height+'px'});
  const p=TourPosition.panel(r,card.offsetWidth||350,card.offsetHeight||300);
  if(p.overlap>0&&!interacting&&layoutAttempts<3){layer.dataset.compact='true';els[0]?.scrollIntoView?.({block:'start',inline:'nearest',behavior:'instant'});layoutAttempts++;schedule();}
  Object.assign(card.style,{left:p.x+'px',top:p.y+'px'});
 }
 function schedule(){if(active()&&!frame)frame=requestAnimationFrame(position);}
 function show(n){
  navigating=true;index=n;const step=list()[index],category=categories.find(c=>c.id===step.category),localIndex=category.steps.findIndex(s=>s.id===step.id);layer.hidden=false;runway.hidden=false;layer.dataset.index=String(index);layer.dataset.key=step.id;layer.dataset.category=step.category;layer.dataset.context=String(step.view!=='balls');layer.dataset.compact=String(innerWidth<700||innerHeight<740);layoutAttempts=0;
  closeDialogs();api.beginTemporaryWorkspace(demo());practice=true;reveal(step.view);api.refreshPicker();const preview=demonstration.enter(step)||illustrations.forStep(step);example.replaceChildren(preview);example.hidden=false;layer.dataset.example='true';
  meta.textContent=category.title+' · '+(localIndex+1)+' / '+category.steps.length;categorySelect.value=selectedCategory||'';title.textContent=step.title;copy.replaceChildren(...step.copy.map(text=>make('p',{},text)));progress.max=list().length;progress.value=index+1;back.disabled=index===0;next.textContent=index===list().length-1?'Finish':'Next';
  targets()[0]?.scrollIntoView?.({block:innerWidth<700?'start':'center',inline:'nearest',behavior:'instant'});position();schedule();navigating=false;card.focus({preventScroll:true});
 }
 function stop(){index=-1;if(frame)cancelAnimationFrame(frame);frame=0;observer?.disconnect();closeDialogs();if(practice){api.endTemporaryWorkspace();practice=false;}layer.hidden=true;runway.hidden=true;spot.hidden=true;launch.focus({preventScroll:true});}
 function observe(){observer?.disconnect();observer=new MutationObserver(records=>{if(records.some(r=>!layer.contains(r.target)&&!chooser.contains(r.target)&&!runway.contains(r.target)))schedule();});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','hidden','value','disabled','aria-pressed','aria-selected']});}
 api.on(launch,'click',()=>{if(active())stop();warning.textContent=dialogOpen().length?'Finish or cancel your current preview before starting the tour.':'';chooser.showModal();});
 api.on(chooseClose,'click',()=>{chooser.close();launch.focus({preventScroll:true});});
 function start(category=null){if(dialogOpen().length){warning.textContent='Finish or cancel your current preview before starting the tour.';return;}chooser.close();selectedCategory=category;observe();show(0);}
 api.on(startButton,'click',()=>start());api.on(categorySelect,'change',()=>{selectedCategory=categorySelect.value||null;show(0);});
 api.on(exit,'click',stop);api.on(next,'click',()=>{if(!active())return;if(index===list().length-1)stop();else show(index+1);});api.on(back,'click',()=>{if(index>0)show(index-1);});
 api.on(window,'keydown',e=>{if(!active())return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();stop();return;}if(card.contains(e.target)&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)){if(e.key==='ArrowRight'){e.preventDefault();next.click();}else if(e.key==='ArrowLeft'&&!back.disabled){e.preventDefault();back.click();}}},true);
 for(const type of ['pointerdown','pointerup','click','change'])api.on(document,type,e=>{if(!active()||navigating||layer.contains(e.target))return;if(type==='pointerdown')interacting=true;if(type==='pointerup')interacting=false;schedule();},true);
 api.on(window,'resize',()=>{layoutAttempts=0;schedule();});api.on(document,'scroll',schedule,true);api.on(document,'close',schedule,true);api.subscribe(()=>{if(active())schedule();});
 // The host's temporary-workspace lease restores data on disable/failure.
 api.onCleanup(()=>{index=-1;observer?.disconnect();if(frame)cancelAnimationFrame(frame);document.body.append(layer);chooser.remove();layer.remove();runway.remove();});
}
