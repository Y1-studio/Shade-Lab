// Small host bridge for optional, locally bundled features.
(function (root) {
  'use strict';
  const API_VERSION = 1, records = new Map(), wrappedSlots = new Map();
  let host = null, notifying = false, committing = false, activating = false;
  const copy = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  function json(value, seen = new Set()) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
    if (typeof value === 'number' && Number.isFinite(value)) return;
    if (!value || typeof value !== 'object' || seen.has(value)) throw Error('Add-on data must be finite, non-circular JSON.');
    if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) throw Error('Add-on data must use plain JSON objects.');
    seen.add(value); for (const item of Object.values(value)) json(item, seen); seen.delete(value);
  }
  function report(record, error) {
    record.error = String(error?.message || error);
    console.error('Shade Lab add-on ' + record.meta.id + ': ' + record.error);
    if (host) host.report(record.meta.name + ': ' + record.error);
  }
  function dispose(record) {
    record.removeExtension?.(); record.removeExtension = null;
    const scope = record.scope;
    if (!scope) return;
    record.scope = null; scope.disposed = true; scope.controller.abort();
    for (const cleanup of scope.cleanups.reverse()) {
      try { cleanup(); } catch (error) { report(record, error); }
    }
    scope.listeners.clear();scope.cards.clear();
  }
  function fail(record, error) {
    dispose(record); record.state = 'failed'; report(record, error);
  }
  function invoke(record, scope, callback, ...args) {
    if (scope.disposed) return;
    try {
      const result = callback(...args);
      if (result && typeof result.then === 'function') Promise.resolve(result).catch(error => { if (!scope.disposed) fail(record, error); });
      return result;
    } catch (error) { fail(record, error); }
  }
  function context(record, scope) {
    const ensure = () => { if (scope.disposed) throw Error('This add-on has stopped.'); };
    const updateProject = (edit, message = record.meta.name + ' updated') => {
      ensure();
      if (notifying || committing || activating) throw Error('Make edits from user actions, not activation or state notifications.');
      if (typeof edit !== 'function') throw Error('An edit callback is required.');
      committing = true;
      try {
        return host.commit(draft => {
          const result = edit(draft);
          if (result && typeof result.then === 'function') {
            Promise.resolve(result).catch(() => {});
            throw Error('Project edits must be synchronous. Finish async work before committing.');
          }
          json(draft);
        }, message);
      } finally { committing = false; }
    };
    return Object.freeze({
      apiVersion: API_VERSION, id: record.meta.id, signal: scope.controller.signal,
      getState() { ensure(); return copy(host.snapshot()); },
      getData() { ensure(); return copy(host.snapshot().project.addons?.[record.meta.id]); },
      setData(value, message) {
        json(value); const saved = copy(value);
        return updateProject(draft => {
          if (draft.addons === undefined) draft.addons = {};
          if (!draft.addons || Array.isArray(draft.addons) || typeof draft.addons !== 'object') throw Error('Project add-on data is invalid.');
          draft.addons[record.meta.id] = saved;
        }, message);
      },
      updateProject,
      beginTemporaryWorkspace(data) { ensure();json(data);const result=host.beginTemporaryWorkspace(record.meta.id,copy(data));if(!scope.workspaceLease){scope.workspaceLease=true;scope.cleanups.push(()=>host.endTemporaryWorkspace(record.meta.id));}return result; },
      checkpointTemporaryWorkspace() { ensure();return host.checkpointTemporaryWorkspace(record.meta.id); },
      restoreTemporaryWorkspace(token) { ensure();return host.restoreTemporaryWorkspace(record.meta.id,token); },
      endTemporaryWorkspace() { ensure();return host.endTemporaryWorkspace(record.meta.id); },
      selectColorTarget(id, ballId) {
        ensure();const target=id===null?null:{addonId:record.meta.id,id};
        if(target&&!root.ShadeAddons.colorTarget(target,host.snapshot().project.balls.find(b=>b.id===(ballId||host.snapshot().activeBallId))))throw Error('Unknown color editing target.');
        host.selectColorTarget(target,ballId);
      },
      focusBall(id) { ensure();host.focusBall(id); },
      selectRole(id,ballId) { ensure();if(ballId)host.focusBall(ballId);host.selectRole(id); },
      applyColor(color) { ensure();return host.applyColor(copy(color)); },
      addColorRegion(color) { ensure();return host.addColorRegion(copy(color)); },
      rememberColor(project,color) { ensure();root.ShadeAddons.rememberColor(project,color); },
      openDialog(dialog) { ensure();root.ShadeAddons.openDialog(dialog); },
      closeDialog(dialog) { ensure();root.ShadeAddons.closeDialog(dialog); },
      onColorSelected(callback) { ensure();scope.colorSelections.add(callback);return ()=>scope.colorSelections.delete(callback); },
      refreshPicker() { ensure();host.refresh(); },
      finishColorGesture() { ensure();host.finishGesture(); },
      onBallCard(callback) {
        ensure();if(typeof callback!=='function')throw Error('Provide a card renderer.');scope.cards.add(callback);return ()=>scope.cards.delete(callback);
      },
      subscribe(callback) {
        ensure(); if (typeof callback !== 'function') throw Error('A state listener is required.');
        scope.listeners.add(callback); return () => scope.listeners.delete(callback);
      },
      mount(slot = 'picker') {
        ensure();
        const target = host.slots[slot]; if (!target) throw Error('Unknown add-on slot: ' + slot);
        if (scope.mounts.has(slot)) return scope.mounts.get(slot);
        const panel = document.createElement('section');
        panel.id = 'addon-' + record.meta.id + '-' + slot;
        panel.dataset.shadeAddon = record.meta.id;
        panel.setAttribute('aria-label', record.meta.name);
        target.append(panel); scope.mounts.set(slot, panel); scope.cleanups.push(() => panel.remove());
        return panel;
      },
      wrapSlot(slot, wrapper, content = wrapper) {
        ensure();
        const target = host.slots[slot]; if (!target) throw Error('Unknown add-on slot: ' + slot);
        if (wrappedSlots.has(slot)) throw Error('Add-on slot is already wrapped: ' + slot);
        if (!(wrapper instanceof root.HTMLElement) || !(content instanceof root.HTMLElement) || wrapper.parentNode || !wrapper.contains(content) || wrapper.contains(target)) throw Error('Provide a detached wrapper containing its content element.');
        wrapper.dataset.shadeAddon = record.meta.id;
        target.before(wrapper); content.append(target); wrappedSlots.set(slot, wrapper);
        scope.cleanups.push(() => { wrapper.replaceWith(target); wrappedSlots.delete(slot); });
        return wrapper;
      },
      showSlot(slot, visible) {
        ensure();const target=host.slots[slot];if(!target||typeof visible!=='boolean')throw Error('Provide a slot and visibility.');
        if(!scope.visibility.has(slot)){scope.visibility.set(slot,target.hidden);scope.cleanups.push(()=>{target.hidden=scope.visibility.get(slot);});}
        target.hidden=!visible;
      },
      on(target, event, callback, options) {
        ensure();
        const guarded = (...args) => invoke(record, scope, callback, ...args);
        target.addEventListener(event, guarded, options);
        const off = () => target.removeEventListener(event, guarded, options);
        scope.cleanups.push(off); return off;
      },
      onCleanup(callback) { ensure(); if (typeof callback !== 'function') throw Error('A cleanup function is required.'); scope.cleanups.push(callback); },
      status(message, error = false) { ensure(); host.status(String(message), error); },
      copyCanvas(canvas) { ensure(); if (!(canvas instanceof root.HTMLCanvasElement)) throw Error('Provide a canvas to copy.'); return host.copyCanvas(canvas); },
      download(blob, name) { ensure(); if (!(blob instanceof root.Blob) || typeof name !== 'string') throw Error('Provide a file and name.'); host.download(blob, name); },
      color: Object.freeze(Object.fromEntries(['clamp', 'wrap', 'hslRgb', 'rgbHsl', 'hexHsl', 'toHex', 'resolve', 'editColor', 'pickerPoint', 'pickerColor'].map(key => [key, (...args) => root.Shade[key](...args)])))
    });
  }
  function activate(record) {
    if (!host || record.scope) return;
    if (record.meta.requires?.some(id => records.get(id)?.state!=='active')) { fail(record, Error('Enable this add-on’s dependencies first.')); return; }
    if (record.implementation.engine && !record.removeExtension) record.removeExtension = root.Shade.addExtension(record.meta.id, record.implementation.engine);
    const scope = { controller: new AbortController(), cleanups: [], listeners: new Set(), colorSelections:new Set(), cards:new Set(), mounts: new Map(), visibility:new Map(), disposed: false };
    record.scope = scope; record.error = null; activating = true;
    try {
      if (record.css) {
        const style = document.createElement('style'); style.dataset.shadeAddon = record.meta.id; style.textContent = record.css;
        document.head.append(style); scope.cleanups.push(() => style.remove());
      }
      const cleanup = record.implementation.activate(context(record, scope));
      if (cleanup && typeof cleanup.then === 'function') {
        Promise.resolve(cleanup).catch(() => {});
        throw Error('activate() must be synchronous. Register async work with api.on() and api.signal.');
      }
      if (typeof cleanup === 'function') scope.cleanups.push(cleanup);
      record.state = 'active';
    } catch (error) { fail(record, error); }
    finally { activating = false; }
  }
  function notify() {
    if (!host || notifying) return;
    notifying = true;
    try {
      for (const record of records.values()) {
        const scope = record.scope;
        if (record.state === 'active' && scope) for (const callback of [...scope.listeners]) invoke(record, scope, callback, copy(host.snapshot()));
      }
    } finally { notifying = false; }
  }
  function register(meta, implementation, css = '') {
    if (host) throw Error('Register add-ons before the app starts.');
    if (!meta || typeof meta.id !== 'string' || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(meta.id) || ['constructor', 'prototype'].includes(meta.id)) throw Error('Invalid add-on ID.');
    if (records.has(meta.id)) throw Error('Duplicate add-on ID: ' + meta.id);
    if (meta.apiVersion !== API_VERSION || typeof implementation?.activate !== 'function') throw Error('Incompatible add-on: ' + meta.id);
    const record = { meta: copy(meta), implementation, css, scope: null, state: meta.enabled === false ? 'disabled' : 'waiting', error: null };
    records.set(meta.id, record);
    if (meta.enabled !== false && implementation.engine) record.removeExtension = root.Shade.addExtension(meta.id, implementation.engine);
  }
  root.ShadeAddons = Object.freeze({
    apiVersion: API_VERSION, register, notify,
    rememberColor(project,color) {
      for(const record of records.values())if(record.state==='active'&&record.implementation.colorHistory)record.implementation.colorHistory.record(project,copy(color));
    },
    colorSelected(view) {
      for(const record of records.values())if(record.state==='active'&&record.scope)for(const callback of record.scope.colorSelections)invoke(record,record.scope,callback,copy(view));
    },
    openDialog(dialog) {
      for(const record of records.values())if(record.state==='active'&&record.implementation.panelHost){record.implementation.panelHost.open(dialog);return;}
      dialog.showModal();
    },
    closeDialog(dialog) {
      for(const record of records.values())if(record.state==='active'&&record.implementation.panelHost&&record.implementation.panelHost.close(dialog))return;
      dialog.close();
    },
    service(id) { const record=records.get(id); return ['waiting','active'].includes(record?.state) ? record.implementation.service : undefined; },
    providers(key) { return [...records.values()].filter(record=>['waiting','active'].includes(record.state)&&record.implementation?.[key]).map(record=>({id:record.meta.id,...record.implementation[key]})); },
    colorTargets(ball) {
      const list=[];for(const record of records.values())if(record.state==='active')for(const [id,target]of Object.entries(record.implementation?.colorTargets||{}))if(!target.available||target.available(ball))list.push({addonId:record.meta.id,id,label:String(target.label),value:'addon:'+record.meta.id+':'+id});return list;
    },
    colorTarget(target,ball) {
      const record=records.get(target?.addonId),definition=record?.implementation?.colorTargets?.[target?.id];if(!ball||record?.state!=='active'||!definition||(definition.available&&!definition.available(ball)))return null;
      const color=definition.read(ball);if(!Array.isArray(color)||color.length!==3||color.some(v=>!Number.isFinite(v))||color[0]<0||color[0]>=360||color[1]<0||color[1]>100||color[2]<0||color[2]>100)throw Error('Invalid auxiliary picker color.');return {...target,label:String(definition.label),color:[...color],preserveSelection:definition.preserveSelection===true};
    },
    editColorTarget(target,ball,color,request={}) {
      const record=records.get(target?.addonId),definition=record?.implementation?.colorTargets?.[target?.id];if(record?.state!=='active'||!definition||(definition.available&&!definition.available(ball)))throw Error('This color editing target is unavailable.');
      if(!Array.isArray(color)||color.length!==3||color.some(v=>!Number.isFinite(v))||color[0]<0||color[0]>=360||color[1]<0||color[1]>100||color[2]<0||color[2]>100)throw Error('Choose a valid color.');definition.write(ball,[...color],request);
    },
    captureColorTarget(target,ball) {
      const record=records.get(target?.addonId),definition=record?.implementation?.colorTargets?.[target?.id];
      if(!root.ShadeAddons.colorTarget(target,ball)||!definition.transient||!definition.capture)return undefined;
      const value=definition.capture();json(value);return copy(value);
    },
    restoreColorTarget(target,ball,value) {
      const record=records.get(target?.addonId),definition=record?.implementation?.colorTargets?.[target?.id];
      if(value!==undefined&&root.ShadeAddons.colorTarget(target,ball)&&definition.transient&&definition.restore){json(value);definition.restore(copy(value));}
    },
    decorateBallCard(view) {
      const state=host?.snapshot(),selection={activeBallId:state?.activeBallId,activeColorTarget:copy(state?.activeColorTarget)};
      for(const record of records.values())if(record.state==='active'&&record.scope)for(const callback of record.scope.cards)invoke(record,record.scope,callback,{...view,ball:copy(view.ball),selection});
    },
    hitPicker(view) { for (const record of records.values()) if (record.state==='active' && record.implementation.hitPicker) { const hit=record.implementation.hitPicker(view); if(hit)return hit; } return null; },
    pickerDisplay(view) {
      const options={};for(const record of records.values())if(record.state==='active'&&record.implementation?.pickerDisplay)try{Object.assign(options,record.implementation.pickerDisplay({...view,data:copy(host.snapshot().project.addons?.[record.meta.id])}));}catch(error){fail(record,error);}return options;
    },
    paintBall(ctx,view,paint) {
      for(const record of records.values())if(record.state==='active'&&record.implementation?.paintBall){ctx.save();try{if(record.implementation.paintBall(ctx,view,paint))return true;}catch(error){fail(record,error);}finally{ctx.restore();}}return false;
    },
    drawBallBackdrop(ctx,view) {
      for(const record of records.values())if(record.state==='active'&&record.implementation?.drawBallBackdrop){ctx.save();try{record.implementation.drawBallBackdrop(ctx,view);}catch(error){fail(record,error);}finally{ctx.restore();}}
    },
    drawPicker(ctx, view) {
      for (const record of records.values()) if (['waiting', 'active'].includes(record.state) && record.implementation?.drawPicker) {
        ctx.save();
        try { record.implementation.drawPicker(ctx, view); } catch (error) { fail(record, error); }
        finally { ctx.restore(); }
      }
    },
    finishPicker(ctx, view) {
      for (const record of [...records.values()].sort((a,b)=>(a.implementation?.finishOrder||0)-(b.implementation?.finishOrder||0))) if (record.state === 'active' && record.implementation?.finishPicker) {
        ctx.save();
        try { record.implementation.finishPicker(ctx, {...view, data: copy(host.snapshot().project.addons?.[record.meta.id])}); }
        catch (error) { fail(record, error); }
        finally { ctx.restore(); }
      }
    },
    loadFailed(meta, error) {
      if (!records.has(meta.id)) records.set(meta.id, { meta: copy(meta), state: 'failed', error: null, scope: null });
      report(records.get(meta.id), error);
    },
    start(bridge) {
      if (host) throw Error('Add-on host already started.');
      host = bridge;
      for (const record of records.values()) {
        if (record.state === 'waiting') activate(record);
        else if (record.state === 'failed') host.report(record.meta.name + ': ' + record.error);
      }
      root.Shade.touchExtensions(); host.refresh?.(); notify();
    },
    enable(id) {
      const record = records.get(id); if (!record || !record.implementation) throw Error('Add-on is not available: ' + id);
      if (!host) { record.state = 'waiting'; return; }
      activate(record); root.Shade.touchExtensions(); host.refresh?.(); notify(); return record.state === 'active';
    },
    disable(id) {
      const record = records.get(id); if (!record) throw Error('Unknown add-on: ' + id);
      for (const child of records.values()) if (child.meta.requires?.includes(id) && child.state==='active') root.ShadeAddons.disable(child.meta.id);
      dispose(record); record.state = 'disabled';
      root.Shade.touchExtensions();
      host?.refresh?.();
    },
    list() { return [...records.values()].map(record => ({ ...copy(record.meta), state: record.state, error: record.error })); }
  });
})(globalThis);
