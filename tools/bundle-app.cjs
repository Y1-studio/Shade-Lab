const fs = require('node:fs');
const path = require('node:path');
const scripts = ['web/engine.js', 'web/assets.js', 'web/render.js', 'web/studio.js', 'web/collection.js', 'web/addons.js', 'addons/bundle.js', 'web/app.js'];
function bundleApp(root, addonBundle) {
  let html = fs.readFileSync(path.join(root, 'web/index.html'), 'utf8');
  html = html.replace('<link rel="stylesheet" href="style.css">', () => '<style>\n' + fs.readFileSync(path.join(root, 'web/style.css'), 'utf8') + '\n</style>');
  html = html.replace(/<script defer src="[^"]+"><\/script>/g, '');
  const inline = scripts.map(file => {
    const source = file === 'addons/bundle.js' ? addonBundle : fs.readFileSync(path.join(root, file), 'utf8');
    // Keep HTML-looking strings in scripts from terminating their containing element.
    return '<script>\n' + source.replace(/<\/script/gi, '<\\/script') + '\n</script>';
  }).join('\n');
  return html.replace('</body>', () => inline + '\n</body>');
}
module.exports = { bundleApp, scripts };
