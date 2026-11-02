const Harmony = (() => {
  const E = globalThis.Shade, key = 'wheel-harmonies';
  const modes = {
    analogous: {name: 'Analogous', spread: 30, max: 89},
    triadic: {name: 'Triadic'},
    split: {name: 'Split complementary', spread: 30, max: 89},
    complementary: {name: 'Complementary'},
    monochromatic: {name: 'Monochromatic'},
    tetradic: {name: 'Tetradic', spread: 90, max: 179}
  };
  const get = ball => ball.addons?.[key];
  function offsets(config) {
    const a = config.spread;
    return {analogous: [0, -a, a], triadic: [0, 120, 240], split: [0, 180-a, 180+a], complementary: [0, 180], monochromatic: [0], tetradic: [0, a, 180, 180+a]}[config.mode];
  }
  function check(ball, config) {
    if (!config || config.version !== 1 || !Object.hasOwn(modes, config.mode)) throw Error('Unsupported harmony settings. Edit to choose a harmony again.');
    if (typeof config.enabled !== 'boolean' || typeof config.visible !== 'boolean') throw Error('Invalid harmony switches.');
    const mode = modes[config.mode];
    if (mode.max && (!Number.isFinite(config.spread) || config.spread < 1 || config.spread > mode.max)) throw Error('Enter a spread from 1° to ' + mode.max + '°.');
    if (!config.assignments || typeof config.assignments !== 'object' || Array.isArray(config.assignments)) throw Error('Choose the target colors.');
    const positions = offsets(config), roles = new Set(ball.roles.map(role => role.id)), used = new Set();
    for (const [id, position] of Object.entries(config.assignments)) {
      if (!roles.has(id)) throw Error('An assigned color is missing. Edit to reassign the harmony.');
      if (!Number.isInteger(position) || position < 0 || position >= positions.length) throw Error('Choose a valid hue position for each target.');
      used.add(position);
    }
    if (!Object.keys(config.assignments).length) throw Error('Assign at least one target color.');
    for (let i = 1; i < positions.length; i++) if (!used.has(i)) throw Error(config.mode === 'tetradic' ? 'Tetradic needs all four positions. Assign a fourth color or add Accent.' : 'Assign a color to each harmony position.');
    return config;
  }
  function valid(ball) { const config = get(ball); if (!config) return null; try { return check(ball, config); } catch { return null; } }
  function initial(ball, mode = 'analogous') {
    const config = {version: 1, mode, spread: modes[mode].spread || 30, enabled: true, visible: true, assignments: {}};
    const ids = [...new Set(['highlight', 'shadow', ...ball.roles.map(role => role.id)])].filter(id => ball.roles.some(role => role.id === id));
    const n = offsets(config).length;
    if (ids[0]) config.assignments[ids[0]] = n === 1 ? 0 : 1;
    if (ids[1]) config.assignments[ids[1]] = n < 3 ? n-1 : 2;
    return config;
  }
  function put(ball, config) { ball.addons = {...ball.addons, [key]: config}; }
  function resolve(ball, colors) {
    const config = valid(ball); if (!config?.enabled) return colors;
    const positions = offsets(config), h = ball.base[0];
    for (const [id, position] of Object.entries(config.assignments)) colors[id][0] = E.wrap(h + positions[position]);
    return colors;
  }
  function edit(ball, request) {
    const config = valid(ball); if (!config?.enabled) return false;
    const {id, kind, group, free, shape} = request;
    const hueAllowed=!request.channels||request.channels.includes('H');
    const target=hueAllowed?request.target:[E.resolveRecipe(ball)[id]?.[0],...request.target.slice(1)];
    if (!Array.isArray(target) || target.length !== 3 || target.some(value => !Number.isFinite(value))) throw Error('Choose a valid color.');
    if (kind === 'plane') { E.moveRecipeColor(ball, id, kind, target, free, shape); return true; }
    const current = E.resolve(ball)[id]; if (!current) throw Error('Select a color region.');
    const editSL = kind === 'sample' || Math.abs(current[1]-target[1])+Math.abs(current[2]-target[2]) > 1e-8;
    const owned = id === 'base' || Object.hasOwn(config.assignments, id);
    if (!owned) {
      if (kind === 'hue') E.editRecipeColor(ball, id, [target[0], ...E.resolveRecipe(ball)[id].slice(1)]);
      else if (kind === 'sample') E.sampleRecipeColor(ball, id, target);
      else E.editRecipeColor(ball, id, target, group);
      return true;
    }
    // Assigned hue edits rotate the Base anchor. They never capture/rewrite role formulas.
    if (hueAllowed && Math.abs(E.wrap(target[0]-current[0]+180)-180) > 1e-8) ball.base[0] = E.wrap(target[0] - (id === 'base' ? 0 : offsets(config)[config.assignments[id]]));
    if (kind === 'hue') return true;
    if (kind === 'sample') ball.strength = 1;
    const raw = E.resolveRecipe(ball)[id];
    if (editSL && Math.abs(raw[1]-target[1])+Math.abs(raw[2]-target[2]) > 1e-8) E.editRecipeColor(ball, id, [raw[0], target[1], target[2]], group);
    return true;
  }
  const controls = ball => valid(ball)?.enabled ? {hue: 'Hue harmony controls assigned points. Disable it to arrange wheel points freely.'} : {};
  return {key, modes, get, offsets, check, valid, initial, put, resolve, edit, controls};
})();
