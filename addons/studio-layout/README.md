# Card outline correction — 3.6.5

Recipe opens from artwork/swatches do not mark the focused card or swatch as expanded. Panel expansion belongs only to a button and restores its prior attribute on close/replacement/cleanup. Expanded styles target buttons, so opening a panel cannot impersonate the active ball border. Tests inspect actual browser computed styles after picking, switching balls/swatches and duplication.

# Streamlined studio — ShadeLab 3.5.2

Production navigation and contextual panels for the existing HTML color engine.
The separate `navigation-redesign/prototype/` remains uninstalled.

`controls.js` owns layout construction, reversible relocation of existing control
nodes, four workspace tabs, the default analysis sidebar, picker disclosures,
help disclosures, per-ball strength/blend access, background side actions and
color-history UI. `panels.js` exposes the generic contextual dialog presenter.
The owning tool packages retain their detached drafts, checks and Apply/Cancel.
No core function is replaced and no private application state is accessed.

`history.js` records up to 50 distinct committed input colors under
`project.addons['studio-layout'] = {version:1, colors?, slidersOpen?, analysisOpen?}`.
Missing colors seed from legacy samples without altering them. Explicit empty
history stays empty. Unsupported future settings are retained. Core color edits
record through the generic commit hook inside the same Undo transaction; detached
filter paint is recorded only when Apply succeeds.

The layout depends on its existing navigation/control packages. Disabling a
dependency disables this layout first and restores the original nodes. Turning
the layout back on preserves the project and does not create an Undo entry.

The shared wheel conversion uses red at 10 o’clock, clockwise hue, matching CSP’s
official wheel reference. `Shade.wheelAngle`, `wheelPoint` and `wheelHue` supply
the same mapping to rendering, pointer input, harmony, comparison and arrows.
HSL values and the fixed 90°/270° warm/cool boundary hues do not change.

Run `node addons/studio-layout/tests/layout.cjs [--portable]` for interaction,
geometry, alpha-mask, persistence, transaction and cleanup checks. Run
`tests/browser.cjs` with Playwright available through NODE_PATH for real Edge
checks on source/portable files, four widths, screenshots and offline requests.
`node tools/verify-studio-release.cjs` runs the full source/portable suite matrix.
Generated logs and screenshots stay under ignored `tests/output/` and
`tests/artifacts/`; source tests and validation documentation are committed.

Recipe access uses double-click on ball regions/swatches; single clicks only select.
The analysis graph remains above the independently scrolling contextual controls.
Only its own disclosure header changes its saved open/closed preference.

The 3.5.2 audit fixes short-window scrolling, native-dialog Escape routing and
project replacement state. `tests/audit-browser.cjs` covers real saves, exports,
file round-trips, local reloads, control reachability and competing tabs.
