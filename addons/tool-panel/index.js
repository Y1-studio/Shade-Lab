const addon = {
  activate(api) {
    const details = document.createElement('details'), summary = document.createElement('summary');
    details.id = 'tools-panel'; summary.textContent = 'Tools';
    const content = document.createElement('div'); content.className = 'tool-panel-content';
    details.append(summary, content);
    api.wrapSlot('tools', details, content);
  }
};
