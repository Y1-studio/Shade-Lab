// Bundle the offline HTML app. The Python version is archived separately.
const fs = require('node:fs');
const path = require('node:path');
const { buildAddons } = require('./tools/build-addons.cjs');
const { bundleApp } = require('./tools/bundle-app.cjs');
const root = __dirname;
const addonBundle = buildAddons(path.join(root, 'addons'));
const html = bundleApp(root, addonBundle);
fs.writeFileSync(path.join(root, 'addons/bundle.js'), addonBundle);
fs.writeFileSync(path.join(root, 'Shade Lab.html'), html);
console.log('Built standalone Shade Lab.html');
const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = text => escape(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
function guide(source, output, title) {
  let code = false, list = '', parts = [];
  for (const line of fs.readFileSync(path.join(root, source), 'utf8').split(/\r?\n/)) {
    if (line.startsWith('```')) { if (list) { parts.push('</' + list + '>'); list = ''; } parts.push(code ? '</code></pre>' : '<pre><code>'); code = !code; continue; }
    if (code) { parts.push(escape(line) + '\n'); continue; }
    const bullet = line.match(/^\s*- (.*)/), numbered = line.match(/^\d+\. (.*)/), kind = bullet ? 'ul' : numbered ? 'ol' : '';
    if (kind !== list) { if (list) parts.push('</' + list + '>'); if (kind) parts.push('<' + kind + '>'); list = kind; }
    if (kind) parts.push('<li>' + inline((bullet || numbered)[1]) + '</li>');
    else if (/^## /.test(line)) parts.push('<h2>' + inline(line.slice(3)) + '</h2>');
    else if (/^# /.test(line)) parts.push('<h1>' + inline(line.slice(2)) + '</h1>');
    else if (line.trim()) parts.push('<p>' + inline(line) + '</p>');
  }
  if (list) parts.push('</' + list + '>');
  fs.writeFileSync(path.join(root, output), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + '</title><style>body{font:17px/1.65 system-ui,sans-serif;max-width:860px;margin:48px auto;padding:0 24px 60px;background:#f5f6f9;color:#202735}h1,h2{line-height:1.25}h2{margin-top:2em}a{color:#2354b8}pre{overflow:auto;background:#e7eaf0;padding:18px;border-radius:10px}code{font-size:.9em}li{margin:.6em 0}nav{display:flex;gap:24px;flex-wrap:wrap}</style><nav><a href="Shade Lab.html">Open Shade Lab</a><a href="User Guide.html">User guide</a><a href="AI Formula Guide.html">AI formula guide</a></nav><main>' + parts.join('\n') + '</main></html>');
}
guide('HTML_GUIDE.md', 'User Guide.html', 'Shade Lab — User Guide');
guide('AI_FORMULA_GUIDE.md', 'AI Formula Guide.html', 'Shade Lab — AI Formula Guide');
console.log('Built browser-readable guides');
