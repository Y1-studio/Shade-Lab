// Not installed. Copy this folder and give the package a unique ID before registering it.
const addon = {
  activate(api) {
    const panel = api.mount('picker');
    const title = document.createElement('h2'); title.textContent = 'Example add-on';
    const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Save example setting';
    const output = document.createElement('p');
    panel.append(title, button, output);
    api.on(button, 'click', () => api.setData({ version: 1, count: (api.getData()?.count || 0) + 1 }, 'Example setting saved'));
    api.subscribe(state => { output.textContent = 'Saved count: ' + (state.project.addons?.[api.id]?.count || 0); });
    // api.on(), subscriptions, mounts, and styles are cleaned up automatically.
    // Register timers/other resources with api.onCleanup() as soon as they are created.
  }
};
