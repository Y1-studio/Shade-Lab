function pickerGrayscaleControls(api) {
  const panel = api.mount('view'), heading = document.createElement('h3');
  heading.textContent = 'Grayscale view'; panel.append(heading);
  const inputs = {};
  for (const [key, text] of [['wheel', 'Grayscale wheel'], ['surface', 'Grayscale square / triangle']]) {
    const label = document.createElement('label'), input = document.createElement('input');
    label.className = 'check'; input.type = 'checkbox'; input.id = 'picker-grayscale-' + key;
    label.title=text;input.setAttribute('aria-label',text);const icon=document.createElement('span');icon.textContent=key==='wheel'?'◐':'◩';icon.setAttribute('aria-hidden','true');label.append(input,icon); panel.append(label); inputs[key] = input;
    api.on(input, 'change', () => {
      const data = PickerGrayscale.settings(api.getData());
      const ok = api.setData({version: 1, ...data, [key]: input.checked}, 'Picker grayscale view updated');
      if (!ok) sync(api.getData());
    });
  }
  const hint = document.createElement('p'); hint.className = 'hint';
  hint.textContent = 'View filter for this picker and tool previews. Colors and artwork stay unchanged.';
  panel.append(hint);
  function sync(data) {
    const values = PickerGrayscale.settings(data);
    for (const key of Object.keys(inputs)) inputs[key].checked = values[key];
  }
  sync(api.getData());
  api.subscribe(state => sync(state.project.addons?.[api.id]));
}
