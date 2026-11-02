function harmonyControls(api) {
  const E = globalThis.Shade, R = globalThis.ShadeRender, panel = api.mount('tools');
  const make = (tag, attrs = {}, text) => { const node = document.createElement(tag); for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value); if (text !== undefined) node.textContent = text; return node; };
  const button = (id, text) => make('button', {id, type: 'button'}, text);
  const field = (text, input) => { const label = make('label', {class: 'field'}, text); label.append(input); return label; };
  const toggle = (id, text) => { const input = make('input', {type: 'checkbox', id}); const label = make('label', {class: 'check'}); label.append(input, document.createTextNode(text)); return {input, label}; };
  const heading = make('h3', {}, 'Hue harmony'), summary = make('p', {id: 'harmony-summary', class: 'hint'});
  const enabled = toggle('harmony-enabled', 'Enabled'), visible = toggle('harmony-visible', 'Show guide');
  const switches = make('div', {class: 'actions'}); switches.append(enabled.label, visible.label);
  const edit = button('harmony-edit', 'Add hue harmony'), remove = button('harmony-remove', 'Remove');
  const actions = make('div', {class: 'actions'}); actions.append(edit, remove); panel.append(heading, summary, switches, actions);
  const dialog = make('dialog', {id: 'harmony-dialog', 'aria-labelledby': 'harmony-heading', 'data-shade-addon': api.id});
  const mode = make('select', {id: 'harmony-mode'});
  for (const [id, spec] of Object.entries(Harmony.modes)) mode.append(make('option', {value: id}, spec.name));
  const spread = make('input', {id: 'harmony-spread', type: 'number', min: 1, max: 89, step: 1}), spreadField = field('Spread (degrees)', spread);
  const base = make('input', {id: 'harmony-base', type: 'number', step: 1});
  const draftEnabled = toggle('harmony-draft-enabled', 'Enabled'), draftVisible = toggle('harmony-draft-visible', 'Show guide');
  const settings = make('div', {class: 'harmony-settings'}); settings.append(field('Harmony', mode), spreadField, field('Base hue (anchor)', base), draftEnabled.label, draftVisible.label);
  const roles = make('div', {id: 'harmony-roles'}), swap = button('harmony-swap', 'Swap positions 1 / 2'), accent = button('harmony-accent', 'Add Accent');
  const roleActions = make('div', {class: 'actions'}); roleActions.append(swap, accent);
  const wheel = make('canvas', {id: 'harmony-wheel', width: 640, height: 640, 'aria-label': 'Harmony hue wheel preview'}), ballCanvas = make('canvas', {id: 'harmony-ball', width: 320, height: 280, 'aria-label': 'Harmony ball preview'});
  const previews = make('div', {class: 'harmony-previews'}); previews.append(wheel, ballCanvas);
  const active = make('select', {id: 'harmony-active'});
  const swatches = make('div', {id: 'harmony-swatches', class: 'harmony-swatches'}), error = make('p', {id: 'harmony-error', role: 'status', class: 'error'});
  const apply = button('harmony-apply', 'Apply'), cancel = button('harmony-cancel', 'Cancel'), footer = make('div', {class: 'actions'}); apply.classList.add('accent'); footer.append(apply, cancel);
  dialog.append(make('h2', {id: 'harmony-heading'}, 'Hue harmony'), make('p', {class: 'hint'}, 'Drag a wheel point to rotate the harmony. Drag a surface point to adjust its saturation and lightness. Base is the hue anchor; angles wrap through 0°.'), settings, roles, roleActions, make('p', {class: 'hint'}, 'Tetradic needs four positions including Base. Assign an existing color to position 3, or add Accent. Accent appears in the palette; it paints the ball only when assigned to a design layer.'), field('Selected color (also selects overlapping points)', active), previews, swatches, error, footer);
  document.body.append(dialog); api.onCleanup(() => dialog.remove());
  let draft = null, applying = false, gesture = null;
  const current = state => state.project.balls.find(ball => ball.id === state.activeBallId);
  const close = () => { draft = null; gesture = null; if (dialog.open) api.closeDialog(dialog); };
  function attempt(fn) { try { fn(); } catch (failure) { api.status(failure.message, true); } }
  function previewBall() {
    const ball = E.clone(draft.ball), config = E.clone(draft.config), hue = base.valueAsNumber;
    if (!Number.isFinite(hue)) throw Error('Enter a finite Base hue.');
    if (Harmony.modes[config.mode].max) config.spread = spread.valueAsNumber;
    ball.base[0] = E.wrap(hue); Harmony.check(ball, config); Harmony.put(ball, config); E.validateBall(ball); E.checkExtensions(ball); E.resolve(ball);
    return ball;
  }
  function preview() {
    if (!draft) return;
    try {
      const ball = previewBall(), colors = E.resolve(ball);
      draft.ball = ball; draft.config = E.clone(Harmony.get(ball));
      draft.markers = R.drawWheel(wheel, ball, draft.active, [], draft.shape); R.ballCanvas(ballCanvas, ball);
      swatches.replaceChildren(...Object.entries(colors).map(([id, color]) => { const chip = make('span', {}, E.roleName(ball, id)+' · '+E.toHex(color)); chip.style.borderColor = E.toHex(color); return chip; }));
      apply.disabled = false; error.textContent = '';
    } catch (failure) { error.textContent = failure.message; apply.disabled = true; }
  }
  function roleFields() {
    const config = draft.config, positions = Harmony.offsets(config);
    active.replaceChildren(...['base', ...draft.ball.roles.map(r=>r.id)].map(id=>make('option',{value:id},E.roleName(draft.ball,id)))); active.value=draft.active;
    roles.replaceChildren(...draft.ball.roles.map(role => {
      const select = make('select', {'data-role': role.id, id: 'harmony-role-'+role.id});
      select.append(make('option', {value: ''}, 'Unaffected'));
      positions.forEach((offset, i) => select.append(make('option', {value: i}, i === 0 ? 'Base hue' : 'Position '+i+' · H '+(offset < 0 ? '− ' : '+ ')+Math.abs(offset)+'°')));
      select.value = Object.hasOwn(config.assignments, role.id) ? String(config.assignments[role.id]) : '';
      return field(role.name, select);
    }));
    const spec = Harmony.modes[config.mode]; spreadField.hidden = !spec.max; spread.max = spec.max || 179;
    swap.hidden = positions.length < 3; accent.hidden = config.mode !== 'tetradic';
    accent.disabled = draft.added.length > 0;
  }
  function begin() {
    const state = api.getState(), ball = current(state); if (!ball) return;
    const config = Harmony.valid(ball) || Harmony.initial(ball);
    draft = {ball: E.clone(ball), original: JSON.stringify(ball), config: E.clone(config), active: state.activeRoleId || 'base', added: [], shape: state.project.pickerShape || 'triangle'};
    mode.value = config.mode; spread.value = config.spread; base.value = ball.base[0]; draftEnabled.input.checked = config.enabled; draftVisible.input.checked = config.visible;
    roleFields(); preview(); api.openDialog(dialog);
  }
  api.on(edit, 'click', begin);
  api.on(cancel, 'click', close);
  api.on(dialog, 'cancel', event => { event.preventDefault(); close(); });
  api.on(dialog, 'keydown', event => { if (event.key === 'Escape') { event.preventDefault(); close(); } });
  api.on(dialog, 'close', () => { if (!dialog.open) { draft = null; gesture = null; } });
  api.on(mode, 'change', () => {
    draft.ball.roles = draft.ball.roles.filter(role => !draft.added.includes(role.id)); draft.added = [];
    const next = Harmony.initial(draft.ball, mode.value); next.enabled = draft.config.enabled; next.visible = draft.config.visible; draft.config = next;
    spread.value = next.spread; roleFields(); preview();
  });
  api.on(spread, 'input', () => { if (Number.isFinite(spread.valueAsNumber)) draft.config.spread = spread.valueAsNumber; roleFields(); preview(); });
  api.on(base, 'input', preview);
  const normalizeBase=()=>{if(draft&&Number.isFinite(base.valueAsNumber)){base.value=E.wrap(base.valueAsNumber);preview();}};
  api.on(base,'change',normalizeBase);api.on(base,'blur',normalizeBase);
  const stepBase=sign=>{if(!draft)return;base.value=E.wrap(Math.round(((base.valueAsNumber||0)+sign)*1e10)/1e10);preview();};
  const baseSteps=make('span',{class:'harmony-number-steps'}),baseDown=button('harmony-base-down','−'),baseUp=button('harmony-base-up','+');baseDown.setAttribute('aria-label','Decrease Base hue');baseUp.setAttribute('aria-label','Increase Base hue');baseSteps.append(baseDown,baseUp);base.after(baseSteps);
  api.on(baseDown,'click',()=>stepBase(-1));api.on(baseUp,'click',()=>stepBase(1));
  api.on(base,'keydown',e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();stepBase(e.key==='ArrowUp'?1:-1);}else if(e.key==='Enter'){e.preventDefault();normalizeBase();}});
  api.on(active,'change',()=>{draft.active=active.value;preview();});
  const position=e=>{const r=wheel.getBoundingClientRect();return[(e.clientX-r.left)*320/r.width,(e.clientY-r.top)*320/r.height];};
  api.on(wheel,'pointerdown',e=>{if(!draft||apply.disabled||e.button!==0)return;const p=position(e),hit=draft.markers.filter(m=>Math.hypot(m.x-p[0],m.y-p[1])<10).sort((a,b)=>(b.id===draft.active)-(a.id===draft.active)||Math.hypot(a.x-p[0],a.y-p[1])-Math.hypot(b.x-p[0],b.y-p[1]))[0];if(!hit)return;draft.active=hit.id;active.value=hit.id;gesture={id:e.pointerId,hit,last:p,offset:[hit.x-p[0],hit.y-p[1]],ball:E.clone(draft.ball),base:base.value};wheel.setPointerCapture?.(e.pointerId);e.preventDefault();});
  api.on(wheel,'pointermove',e=>{if(!gesture||e.pointerId!==gesture.id||!draft)return;const p=position(e),last=gesture.last;gesture.last=p;try{
    const b=E.clone(draft.ball),hit=gesture.hit,color=E.resolve(b)[hit.id],absolute=E.pickerSurface(b,draft.shape)?.pointerMode==='absolute',point=absolute?p.map((v,i)=>v+gesture.offset[i]):E.pickerPoint(color,draft.shape,b).map((v,i)=>v+p[i]-last[i]),angle=q=>Math.atan2(q[1]-160,q[0]-160)*180/Math.PI;
    const target=hit.kind==='hue'?[E.wrap(color[0]+E.wrap(angle(p)-angle(last)+180)-180),...color.slice(1)]:E.pickerColor(...point,color[0],draft.shape,b);
    E.movePickerColor(b,hit.id,hit.kind,target,absolute&&hit.kind==='plane'?E.planeFree(b,draft.shape):true,draft.shape,hit.kind==='plane'?point:undefined,true,E.resolve(gesture.ball));E.validateBall(b);E.checkExtensions(b);draft.ball=b;draft.config=E.clone(Harmony.get(b));base.value=b.base[0];preview();
  }catch(failure){error.textContent=failure.message;}});
  const end=e=>{if(gesture?.id===e.pointerId){gesture=null;if(wheel.hasPointerCapture?.(e.pointerId))wheel.releasePointerCapture(e.pointerId);}};
  api.on(wheel,'pointerup',end);api.on(wheel,'lostpointercapture',end);
  api.on(wheel,'pointercancel',e=>{if(gesture?.id===e.pointerId&&draft){draft.ball=gesture.ball;draft.config=E.clone(Harmony.get(gesture.ball));base.value=gesture.base;gesture=null;preview();}});
  for (const [control, key] of [[draftEnabled.input, 'enabled'], [draftVisible.input, 'visible']]) api.on(control, 'change', () => { draft.config[key] = control.checked; preview(); });
  api.on(roles, 'change', event => {
    const id = event.target.dataset.role; if (!id) return;
    if (event.target.value === '') delete draft.config.assignments[id]; else draft.config.assignments[id] = Number(event.target.value);
    preview();
  });
  api.on(swap, 'click', () => { for (const id of Object.keys(draft.config.assignments)) { const n = draft.config.assignments[id]; if (n === 1 || n === 2) draft.config.assignments[id] = 3-n; } roleFields(); preview(); });
  api.on(accent, 'click', () => {
    const id = 'accent_'+E.uid(); draft.ball.roles.push(E.setRule({id, name: 'Accent', source: 'base', model: 'HSL'}, 'offset', {H: 0, S: 0, L: 0}));
    draft.config.assignments[id] = 3; draft.added.push(id); roleFields(); preview();
  });
  api.on(apply, 'click', () => {
    if (!draft || apply.disabled) return;
    try {
      const next = previewBall(), original = draft.original; applying = true;
      const ok = api.updateProject(project => {
        const i = project.balls.findIndex(ball => ball.id === next.id);
        if (i < 0 || JSON.stringify(project.balls[i]) !== original) throw Error('This ball changed while the preview was open. Cancel and edit again.');
        project.balls[i] = next;
      }, 'Hue harmony applied');
      if (ok) close(); else error.textContent = 'The ball changed or could not be saved. Cancel and edit again.';
    } catch (failure) { error.textContent = failure.message; }
    finally { applying = false; }
  });
  for (const [control, key] of [[enabled.input, 'enabled'], [visible.input, 'visible']]) api.on(control, 'change', () => attempt(() => {
    const id = api.getState().activeBallId, value = control.checked;
    api.updateProject(project => { const ball = project.balls.find(ball => ball.id === id), config = Harmony.get(ball); if (!config) throw Error('Choose a harmony first.'); config[key] = value; if (value && key === 'enabled') Harmony.check(ball, config); }, key === 'visible' ? 'Harmony guide updated' : 'Harmony '+(value ? 'enabled' : 'disabled'));
  }));
  api.on(remove, 'click', () => {
    const id = api.getState().activeBallId;
    api.updateProject(project => { const ball = project.balls.find(ball => ball.id === id); if (ball?.addons) { delete ball.addons[api.id]; if (!Object.keys(ball.addons).length) delete ball.addons; } }, 'Hue harmony removed');
  });
  api.subscribe(state => {
    const ball = current(state); if (!ball) return;
    if (draft && !applying && (ball.id !== draft.ball.id || JSON.stringify(ball) !== draft.original)) close();
    const config = Harmony.get(ball); switches.hidden = !config; remove.hidden = !config; edit.textContent = config ? 'Edit' : 'Add hue harmony';
    enabled.input.checked = config?.enabled === true; visible.input.checked = config?.visible === true;
    if (!config) summary.textContent = 'Hue harmony · choose a relationship for this ball.';
    else try { Harmony.check(ball, config); summary.textContent = Harmony.modes[config.mode].name+' · '+(config.enabled ? 'Enabled — assigned hue edits rotate Base.' : 'Disabled — showing the underlying recipe.')+(config.visible ? ' Guide shown.' : ' Guide hidden.'); }
    catch (failure) { summary.textContent = 'Suspended · '+failure.message; }
  });
}
