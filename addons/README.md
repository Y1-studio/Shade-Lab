# Shade Lab add-ons

## Streamlined studio (3.5.0)

`studio-layout/` owns the production layout, four tabs, contextual panels and
committed color history. Feature packages keep their own controls and engines.
The uninstalled navigation prototype remains a separate design artifact.

The additive host API includes `api.selectRole(id, ballId?)`, `applyColor(hsl)`,
`addColorRegion(hsl)`, `onColorSelected(callback)`, `openDialog(dialog)` and
`closeDialog(dialog)`. Dialog presentation uses an active generic `panelHost`
provider, with native modal fallback when none is installed. Owners retain
drafts and cancellation; the presenter restores nodes when closing/disabling.

`api.rememberColor(projectDraft,hsl)` lets a feature include a committed input
color in its existing transaction. Active `colorHistory.record(project,hsl)`
providers synchronously update only their namespace on that same draft. Core
picker edits call this after valid completed edits, never on hover or canceled
gestures. Transient filter paint records only during Apply.

Shared `Shade.wheelAngle(hue)`, `wheelPoint(hue,radius=142)` and `wheelHue(x,y)`
use logical 320-pixel picker coordinates with CSP orientation. Renderers and
hit testing must use these conversions rather than a separate angular offset.
`ShadeRender.ballHit(ball,width,height,x,y)` shares sphere geometry and custom
mask transforms with drawing; decorative overlays are not editable regions.

Every new feature now belongs in its own folder here. Existing features stay in `web/`. Version 3.2 installs wheel harmonies, the shared surface support package, point layouts, color areas, line guides, selected-ball comparison, and hue-wheel swapping. Per-ball constraints are created only by user action. The example template stays uninstalled. Part 3 features have separate packages.

These are local source packages, bundled into the offline HTML app. Installing or removing a package requires rebuilding the HTML. There is no runtime folder picker or marketplace. The single distribution HTML still contains everything, but developers maintain each new feature separately.

## Package layout

```text
addons/
  registry.json                 Explicit list of installed packages
  bundle.js                     Generated; do not edit
  _template/                    Example only; not installed
  wheel-harmonies/               Installed Part 2 package
    addon.json
    math.js
    controls.js
    index.js
    style.css
    README.md
    tests/
```

Use small files with clear responsibilities inside each package. The harmony package separates pure calculations, guide drawing, controls, styles, tests, and its entry point.

## Add a feature

1. Copy `_template/` to a folder with a unique lowercase ID, such as `wheel-harmonies`.
2. Change `id`, `name`, and `version` in its `addon.json`. Use API version 1. List JavaScript files in dependency order in `scripts`, and optional CSS files in `styles`. All paths must remain inside the package. No package manager or network loader is needed in the browser.
3. Declare exactly one `const addon = { activate(api) { ... } }` across the listed scripts. Scripts share a private closure within that package; other add-ons have separate closures. Use ordinary JavaScript, without `import`, `export`, or `require`. Put side effects and resource allocation inside `activate`, not at the top level. `activate` must be synchronous.
4. Add a registry entry and rebuild:

```json
{
  "version": 1,
  "addons": [
    { "path": "wheel-harmonies", "enabled": true }
  ]
}
```

```text
npm run build:html
npm test
node tests/html-addons.cjs --portable
node addons/wheel-harmonies/tests/harmonies.cjs --portable
```

The builder validates manifests, file boundaries, API versions, duplicate IDs, and JavaScript syntax before replacing app output. CSS must be self-contained: no `@import` or `url(...)` references. Scope selectors to `[data-shade-addon="your-id"]`; package CSS is installed only while active. Scope animation names too. Include feature-specific tests under the package's `tests/` and add their command to `npm test` when introducing the feature. The host regression suite lives at `tests/html-addons.cjs`.

Both `web/index.html` and `Shade Lab.html` use the generated package bundle. Rebuild after editing any package or the registry. The source page needs its adjacent folders; the standalone HTML needs no adjacent scripts or styles. Only registry entries are bundled: `_template`, tests, documentation, and unlisted folders are ignored.

## Lifecycle

Activation happens after the saved project and type library finish loading. `window.ShadeReady` includes add-on startup. With no installed add-ons, the host creates no controls, styles, settings, or project fields.

`enabled: false` bundles a package without activating it. `ShadeAddons.enable(id)` and `ShadeAddons.disable(id)` are developer/session controls. `ShadeAddons.list()` reports versions, state, and errors. These session controls do not change the registry; change the registry and rebuild to change startup defaults. Remove an entry and rebuild to uninstall. Saved package data is retained when disabled or absent so reinstallation can recover it.

The host releases mounts, subscriptions, registered event handlers, and styles on disable or failure. `api.signal` is aborted. Add-ons must register other resources (timers, observers, object URLs) with `api.onCleanup()` immediately after creation. A cleanup function may also be returned from `activate`. Use `api.on()` for event callbacks, including async work, so rejected callbacks are reported and contained. Check `api.signal.aborted` after awaiting work; stopped API instances reject writes.

Packages execute trusted application code in the same page. The host contains ordinary activation/registered-callback failures; it is not a security sandbox for arbitrary third-party JavaScript. Async activation is unsupported. Finish async work before starting a synchronous project transaction.

## Host API version 1

| API | Purpose |
| --- | --- |
| `api.id`, `api.apiVersion`, `api.signal` | Package identity, contract version, lifecycle cancellation |
| `api.getState()` | Detached snapshot: `project`, `activeBallId`, `activeRoleId`, `selectedBallIds` |
| `api.subscribe(fn)` | Receives a fresh snapshot after startup and each core render; returns unsubscribe |
| `api.getData()` | Detached `project.addons[api.id]`, or undefined if absent |
| `api.setData(json, message)` | Save this package's JSON settings through validation, Undo/Redo, rendering, and autosave |
| `api.selectColorTarget(id, ballId?)` | Select this package’s auxiliary target on a ball, or null to return to its normal colors |
| `api.focusBall(id)` | Change the active ball without replacing whole-ball selection; preserve targets declaring `preserveSelection` |
| `api.refreshPicker()` | Refresh core controls after detached target changes |
| `api.finishColorGesture()` | Finish the current picker gesture before switching detached rows or settings |
| `api.onBallCard(callback)` | Render owned controls into each ball’s adjacent-to-Grayscale action slot |
| `api.updateProject(edit, message)` | Synchronously edit a detached project draft; validate and commit atomically; returns success boolean |
| `api.mount(slot)` | Create/reuse this package's section in `tools` (collapsible tool controls), `view` (above Tools), `actions` (below Pick screen), `picker`, `inspector`, `studio`, `studioNavigation`, `studioWorkspace`, or `studioContent` |
| `api.showSlot(slot, visible)` | Change a host slot’s visibility; cleanup restores its original hidden state |
| `api.wrapSlot(slot, wrapper, content = wrapper)` | Wrap a host slot in an add-on-owned element; restore its existing controls in place on cleanup |
| `api.on(target, event, fn, options)` | Register a guarded handler; returns unsubscribe |
| `api.onCleanup(fn)` | Register resource cleanup even if activation later fails |
| `api.status(text, error)` | Show a status message |
| `api.copyCanvas(canvas)` | Copy an existing HTML canvas through the host PNG clipboard/preview/retry/download flow |
| `api.download(blob, name)` | Download an add-on-generated Blob using the shared host flow |
| `api.color` | Shared color functions: `clamp`, `wrap`, `hslRgb`, `rgbHsl`, `hexHsl`, `toHex`, `resolve`, `editColor`, `pickerPoint`, `pickerColor` |

Snapshots and retained drafts cannot mutate live state. Each successful changed transaction becomes one Undo entry. Invalid transactions return false and show the validation error; they leave the project unchanged. Observe state during activation/subscriptions and make edits only in response to user actions, to prevent render loops. `subscribe` starts delivering after activation; a subscription added later receives its next snapshot on the next render, so use `getState()` for an immediate read.

Store versioned, finite JSON under your namespace, for example `{ version: 1, mode: "triadic" }`. Only create data after a user action. Existing project save/load and Undo retain it, including when the add-on is unavailable. Future per-ball settings may be stored under `ball.addons[api.id]` using a transaction; reusable type handling and state migrations belong in that feature's implementation and tests. Do not rename IDs after release without a migration.

## Color and picker extension contract

A package may declare `engine: { resolve, edit, controls }` and `drawPicker` alongside `activate`. The host registers its engine callbacks before the app's first render, and removes them on disable or failure. This lets saved tools work during project/type loading, before UI activation. Keep callback declarations side-effect-free. Use the public `Shade` color functions, never replace them.

- `resolve(ball, colors, strength)` receives detached recipe colors and returns resolved HSL colors with the same role IDs. It must not mutate the ball or throw for recoverable missing/unsupported package data. Suspend those settings, retain their data, and explain the problem in the UI. Hue and S/L must remain finite and in range. The built-in renderer, previews, comparison strengths, graph, Copy PNG, and export all use `Shade.resolve()`.
- `edit(trialBall, request)` returns true when it handles the edit, false when the ordinary recipe path should run. Requests contain `id`, `target` HSL, `kind` (`color`, `sample`, `hue`, or `plane`), and relevant `group`, `free`, and `shape` flags. The engine validates the detached trial and its resolved result before applying it atomically. Throw to reject an invalid proposed edit.
- `controls(ball)` can return `{ hue: "Reason" }` to disable free hue arrangement while the tool owns it. Keep the stored free-hue preference intact.
- `drawPicker(ctx, {ball, colors, active, shape})` draws the package's guide before the color markers, using the wheel's logical 320×320 coordinates. The host saves/restores the context; each package controls its own guide visibility.

`Shade.resolveRecipe()` evaluates only the underlying recipe. `editRecipeColor`, `sampleRecipeColor`, and `moveRecipeColor` are explicit ways for a color extension to use ordinary editing without recursively calling itself. The existing recipe-fitting helpers also use raw recipe colors, so a visual constraint cannot accidentally be captured as a saved hue formula. `Shade.extensionRevision()` invalidates cached previews after package enable/disable.

## Boundary with the core

The bridge supports controls, project transactions, observations, shared color calculations, color extensions, and picker guides. Harmony solving and its tool controls live entirely in `wheel-harmonies/`. Part 3 constraints use the shared surface service and feature providers. Add the smallest reusable core hook when another requested feature needs it; do not monkey-patch engine/render functions or depend on private app variables. All color readouts, previews, comparisons, and exports must continue to agree on the committed/resolved result.

`web/addons.js` owns the host; `web/engine.js` owns the generic evaluation/edit hooks; `web/app.js` connects readiness, transactions, control locks, and cache invalidation; `web/render.js` exposes the picker drawing hook. `web/index.html` loads the host/bundle and provides the tools slot. `tools/build-addons.cjs` and `tools/bundle-app.cjs` handle packaging. No existing features have moved.

## Shared providers and ordered editing (3.2)

The `hue-color-limits/` package adds the user-selected six HSV cutouts and nearest-primary hue sectors. Multiple area providers are intersected per role by `surface-tools`; an optional fourth `polygons(config,hue,shape,roleId)` argument identifies that role. Persistent positions are synchronized only to providers owning the role. Providers declaring `adaptHue: true` allow hue edits to refit the joint geometry when a new hue's region excludes an old point. Existing providers keep their previous behavior. The new package does not reactivate legacy book-only settings in `color-areas`.

Manifests may declare `requires: ["surface-tools"]`; dependencies must occur earlier in the registry. Activation requires active dependencies. Disabling a dependency also disables its active dependents. Re-enable the support package first, then its features. Failed activation is reported without stopping unrelated packages.

`ShadeAddons.service(id)` returns a package's declared service while waiting/active. `ShadeAddons.providers(key)` enumerates declared capabilities with package IDs; the shared surface solver consumes `surface` providers. These are trusted in-process extension interfaces, not a third-party sandbox.

Engine extensions may set `resolveOrder` and `editOrder` (default 0). `edit(trial, request, next)` may delegate a transformed request to the following handler. `request.channels` optionally limits a partial edit (currently used for S/L-only delegation). `Shade.resolveWithout(ball, strength, excludedIds)` evaluates the same pipeline excluding named stages. `Shade.checkExtensions(ball)` invokes explicit tool validators for authoring previews; normal resolution remains tolerant of recoverable imported settings.

Surface providers expose `kind`, `check`, and either `points/move/blend` for layouts or `polygons` for areas. See their package READMEs. `surface-tools` resolves at 100, after harmony (0) and optional hue swap (50), and edits at −100. Hue swap maps hue requests at −50. Geometry and area feasibility are joint, not independent clamps.

`hitPicker(view)` may return a marker-like hit for a tool body. `controls()` may return a `plane` lock reason. The core exposes independent `planeByShape` preferences, retaining old `plane` as fallback. An edit error can carry a generic `proposal`; the app dispatches `shade-edit-proposal` after rollback, allowing the owning add-on to show a detached review.

`ShadeRender.drawWheel(..., guide, {markers:false, tools:false})` can render its standard background for an overlay such as ball comparison. Defaults preserve existing rendering.

For constrained plane gestures, `movePickerColor` accepts an optional final `point` argument in logical 320×320 picker coordinates. This lets the surface solver project the raw pointer before HSL clamping. It is optional and leaves existing callers unchanged. Surface providers may expose `effective`, `fit`, and `hit` hooks for retired settings, line-interval fitting, and visible body dragging. Point layouts and book profiles are excluded from the 3.2.1 active bundle.

## Picker view finishing hooks (3.3)

Color engine extensions can expose `pickerSurface(ball,shape)`, returning an
adapter with `id`, `label`, `point(hsl)`, `color(x,y,hue)`, `contains(x,y)` and
`draw(ctx,view)` in logical 320px coordinates. `Shade.pickerPoint/Color/Contains`
accept an optional ball to use it; existing callers keep their coordinate model.
`movePickerColor` maps display requests back into constraint coordinates; its
optional eighth argument disables that conversion for ordinary HSL editors.
Adapters must not mutate state. `drawWheel(...,{surface:false})` retains the
standard display, as does `tools:false`. Finish callbacks receive `surface` or
null for aligned annotations. An exclusive square owns its interior, keeping
ordinary tool guides and body editing in their editors; constraints still apply.
The shared editor's optional `pickerShape`/`pickerSurface` settings select its
preview geometry and switch views on Apply in the same transaction. Hue cutouts
use these hooks only for the square, leaving the wheel and triangle unchanged.

Display adapters can declare `pointerMode:'absolute'` to retain cursor and grab
offset alignment across clipped drags. Core and detached editors honor this.
Plane requests include `display:{id,point}` with the original logical pointer
coordinates. An area provider may expose `contains(config,color,shape,id,joint)`
for native membership, `project(config,color,shape,id)` for preparation, and
`projectMove(config,{id,from,target,shape,request})` for native pointer projection.
Projectors return normalized constraint-space points; movement returns
`{point,fraction}` or null to use the usual solver. Direct projection is used
only for a role's sole applicable area, without a governing layout. Shared
custom-area/line intersections retain the ordinary joint solver. `joint` tells
membership callbacks when mapped geometry is involved. These callbacks must
not mutate the ball or other providers' settings.

`finishPicker(ctx, view)` runs after the shared picker's guides and markers for active add-ons. It receives the same ball/colors/active/shape context as `drawPicker`, plus `data`, a detached copy of the package's project settings. It may change displayed canvas pixels; it must not change color data, project state, or hit geometry. The host saves/restores canvas state and contains callback failures. `tools:false` skips both drawing and finishing hooks for unmodified backgrounds such as Compare balls.

The host refreshes after package activation so saved display settings are applied before `ShadeReady` completes. Picker grayscale uses this hook in `picker-grayscale/`; no color-engine extension is involved.

## Picker layout (3.3.2)

`tool-panel/` wraps the tools slot in a native disclosure. Its UI is independent of the color tools; disabling it restores their controls without changing tool state. `wrapSlot` accepts a detached HTML wrapper and its descendant content element, gives the wrapper the package ownership attribute, and permits one wrapper per slot. Cleanup unwraps the slot without recreating its children. Grayscale uses `view`; hue swap uses `actions`. Existing and future tool controls use `tools`.

## Filter Lab and evaluation boundaries (3.4.0)

`blend-filters/` provides detached multi-ball comparisons, reversible named-color RGB effects with individual 0–100% opacity, educational examples, selected-color arrows and saved editable studies. Its color stage resolves at 200; the original-edit guard runs at −200. The main Filter Lab launcher uses `actions`; its dialog belongs to the package and is removed on cleanup. No settings are created at startup.

`Shade.resolveBefore(ball, strength, extensionId)` evaluates stages preceding the named extension; `Shade.resolveThrough(...)` includes that extension. A missing stage evaluates the currently available pipeline. Both share result validation with ordinary resolution. Surface solving reads the prefix before `surface-tools`, and swap accepted colors stop through `surface-tools`, so later filters cannot be evaluated twice or captured as original tool settings.

`finishOrder` sorts picker finishing callbacks numerically (default 0). Filter arrows finish at −100; grayscale finishes afterward. Finishing callbacks still receive only drawing context and detached settings, and must not mutate color/project state. `api.copyCanvas` and `api.download` use the existing collection bridge; feature-specific comparison rendering and state remain in the add-on.

## Workspace tabs and ball rendering (3.4.1)

`studioNavigation` lies between Ball types and selection controls. `studioWorkspace` holds add-on tab panels after selection controls. `studioContent` contains the ordinary gallery, strength comparisons, analysis and reference panels. A tab add-on can use `showSlot` to hide/reveal that content without project writes; disable/failure cleanup restores its original visibility. Registered buttons/keyboard handlers and owned panels use ordinary mount/on/onCleanup lifecycle handling.

`pickerDisplay(view)` may return `{selectedOnly:true, connections:false}` to isolate a selected role's markers and suppress analysis paths. It receives detached package data. `drawWheel` also accepts these options for detached previews. Other marker visibility and default selection behavior stay unchanged when no provider opts in.

`paintBall(ctx, view, paint)` is an optional add-on rendering callback. It receives the fitted artwork frame (x/y/width/height), ball, resolved colors and strength, and a callback that paints that artwork once with a supplied view. Return true only when the add-on fully handles painting; false uses the normal renderer. Context state is saved/restored and failures are contained. This runs before grayscale in gallery/strength/type previews and PNG exports. The callback must not mutate state or recursively invoke itself. `ShadeRender.ballCanvas` accepts a fourth `{tools:false}` argument for raw comparison rendering; `ballFrame` and `paintBall` expose the same artwork fitting for add-on previews.

Filter Lab renders original and result in complementary clips, preserving translucent layer alpha and the export background. `split.js` owns polygon clipping and versioned comparison validation; settings are stored under the existing per-ball add-on namespace. Its underlying RGB filtering math is unchanged.

## Ball backdrops (3.4.2)

`drawBallBackdrop(ctx, {ball, strength, x, y, width, height})` paints a per-ball surrounding area. The host saves/restores context and contains failures. `ballCanvas` calls it after artwork grayscale, with destination-over compositing so opaque artwork is preserved. A fourth `{background:false}` option skips that backdrop. PNG exports call it before painting each ball's artwork area, preserving the global image background elsewhere; strip-only exports skip it. It remains separate from `paintBall` split geometry and color resolution.

The installed `ball-background/` package owns the HSL square editor, per-ball settings, drafts, validation, styles and tests. Startup invalidates the shared rendering revision after activation and before refresh, so cached galleries/strength/type previews include saved drawing callbacks immediately.

## Auxiliary editing targets and card controls (3.4.3)

An add-on can declare `colorTargets: { id: { label, read(ball), write(trialBall, color, request) } }`. Read returns a finite HSL tuple (H in [0,360), S/L in [0,100]); write changes only its namespace on the detached trial. No synthetic role is added to shared ball resolution. Main picker display, channels, HEX/native inputs, gestures and samples route through the selected target. Actual ball analysis, recipes and exports still use the normal role colors.

`api.selectColorTarget(id, ballId)` selects this package's target; null returns to ordinary color editing. `getState().activeColorTarget` identifies it. Target selection is temporary; Undo snapshots retain it, unavailable targets reset safely, and selecting an actual role or another ball exits it. Target gestures use core atomic edits/Undo/cancellation and do not run unrelated role constraints.

`onBallCard(callback)` receives a detached ball, current active-ball/auxiliary-target selection metadata, and a stable action slot next to Grayscale. Render controls only; do not write project state from this callback. Register user-event handlers with `api.on`, remove owned nodes on cleanup, and release callbacks/resources for removed cards. Core owns the footer and each add-on owns only its children. The background package uses this slot without accessing private collection fields or replacing core handlers.

Auxiliary `colorTargets` can declare `available(ball)` to omit temporary targets when no draft is open. `preserveSelection: true` keeps collection selection when entering that target or changing the active ball. A detached target declares `transient: true`, `capture()` and `restore(json)` so pointer cancellation restores draft state without committing it to a ball. The host validates finite JSON and invokes this restoration only for gesture cancellation; normal project Undo remains independent. Such targets must validate draft writes before mutation and release draft bindings on cleanup.

## Successful project replacement (3.5.2)

The window event `shade-project-opened` fires after a successful, current JSON
project import. Layouts and detached editors discard transient state on this
event. Superseded/invalid imports and formula/type imports do not emit it.

Display-surface plane requests may include `display.group`, a map of role IDs to translated display `point` and HSL `color`. `movePickerColor` accepts optional resolved origin colors after `displaySurface`; pointer callers pass their gesture-start colors. Free area groups project each member against its own applicable constraints; layout-owned points retain layout movement.

The `colorPick` mount is beside Pick screen. Sample requests may specify `source` and `independent`; independent recipe samples preserve other colors with measured links at full precision. Engine `pickerLocks(ball, shape)` can return Boolean `plane` / `hue` arrangement locks, applied before display-group generation. Missing entries retain the caller preference. `role.rule.precise` retains fractional channel values; older rules keep their rounded evaluation.

The `help` mount adds feature-owned controls to the top-bar actions. Guided tutorials live in `guided-tutorial/` and use public controls and services. The package owns its curriculum, action checks, focus positioning and presentation.

## Temporary workspaces (3.7.1)

`api.beginTemporaryWorkspace({project,library})` starts an owner-scoped disposable workspace. A repeat call replaces the temporary data while retaining the original snapshot. Autosaving is suspended for the temporary workspace. `checkpointTemporaryWorkspace()` returns an opaque token; `restoreTemporaryWorkspace(token)` restores and consumes that checkpoint. `endTemporaryWorkspace()` restores the original project, library, reference, selection and Undo/Redo history. Cleanup releases the owner lease automatically. The host retains referenced assets and invalidates pending project/image requests across workspace changes.

`shade-workspace-changed` reports temporary workspace entry/exit. Project replacement also emits `shade-project-opened` so detached editors can discard obsolete drafts. `shade-download-ready` carries the generated file's name and MIME type after a download is prepared. These are generic host hooks; tutorial-specific tasks remain in the addon.

## Editable input views (3.7.2)

An engine extension can expose `pickerEditView(ball)` returning `{ball, label}` for a detached editable input stage, or null to keep the ordinary resolved picker. `Shade.pickerEditView` selects the first applicable view in edit order; its default returns the original ball and an empty label. Main HEX, channels, picking, gesture origins and wheel points use this input stage. Edits still route through the existing transactional edit continuation. An optional `colors` map on `drawWheel` supplies marker/input colors without changing the ball used for tool overlays. Other render/export calls retain resolved colors. Filter Lab uses these hooks to edit originals while keeping its effect applied.

3.7.5 removes the isolated final-output picker and its addon. The input-view hook remains for editing material colors beneath Filter Lab effects.
