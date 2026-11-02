# Recoloring the whole ball outside Filter Lab — 3.7.5

Apply and every Filter Lab exit release the applied-paint target and select the current ball's Base. Base samples outside the workbench use an ordinary recipe-color edit, so highlights/shadows follow the base without refitting their rules or changing Multiply's paint, opacity, enabled state or split. Selecting a derived region still permits a separate color edit. The main picker displays material input colors; Filter Lab edits paint only while its session is open.

The Final/Original output-override addon and controls from 3.7.3–3.7.4 are removed. Old saved override data is retained as inactive unknown addon data; it no longer replaces rendered colors. Tutorial Skip is retained.

Verification: 37 Filter Lab integration checks per build, six dedicated whole-ball browser scenarios, and ten existing input-editing browser scenarios. Undo/Redo, project reload, type data, unchanged filter settings and all exit tabs are covered. See VALIDATION.md.

## Earlier implementation record

# Filter Lab — editing after Apply (3.7.2)

Multiply and the other blend modes now retain live color editing after Apply. The main picker identifies the original-color view; hue/plane markers, HEX/native values, channel controls and samples edit the pre-filter colors. The existing edit continuation routes through recipe and surface constraints with the filter temporarily omitted from the detached trial, then restores the exact configuration. No blend is baked in or applied repeatedly. Gallery, graph, swatches, comparisons and exports remain filtered; Before/After arrows retain their true endpoints. Disabled filters reveal edited originals.

The generic engine `pickerEditView(ball)` hook supplies the editable input ball and label. Renderer `options.colors` lets the main picker show those inputs while retaining tool and result overlays. Default rendering elsewhere stays resolved. Package version: 1.3.2.

Verification: 33 Filter Lab integration checks in each build, including six new regressions for HEX/native/channel edits, wheel gestures and cancellation, unaffected parts, all blend modes, Undo/Redo and reloading. Ten real-browser scenarios use the actual controls and mouse dragging in source and standalone. Details are in VALIDATION.md.

## Earlier implementation and design record

# Filter Lab — Shade Lab 3.4.4

Updated 12 October 2026: package 1.1.0 adds the marked inline Balls/Filter Lab tabs, 0–360° comparison angle, persisted gallery/PNG split geometry, a full-result display toggle and contrasting labeled selected-color arrows. The original/result comparison is clipped before compositing, retaining alpha on custom artwork. Older studies without an angle load at 0°.

Implemented 12 October 2026 as the installed `blend-filters` add-on. The offline app and distribution now include reversible named-color filters, detached multi-ball comparisons, per-row 0–100% opacity, original-color editing, a live six-band teaching ball, selected-color square/hue-ring arrows, editable saved studies, Copy/Download PNG and color-value copying. See `HTML_GUIDE.md` for the complete user workflow.

Apply commits only the selected alternative row in one validated Undo transaction. Settings per role contain enabled, mode, source RGB bytes and opacity; recipe data remains underneath. Disabled/uninstalled filters reveal original colors and retain settings. The comparison split is a display reveal, not an opacity control or spatial mask. Saved studies reference current ball IDs and retain missing references.

Runtime modules are `math.js`, `descriptions.js`, `examples.js`, `engine.js`, `split.js`, `arrows.js`, `preview.js`, `picker.js`, `workbench.js` and `index.js`, with `style.css` and `addon.json`. `registry.json` explicitly installs the package. Generic core hooks supply prefix color evaluation, auxiliary picker targets and the existing canvas clipboard/download flow. No PDF scans, prototype demos or calibration sheets are bundled into the released HTML.

Earlier verification: `node addons/blend-filters/tests/filters.cjs` and the same command with `--portable` passed 27 integration checks each. Math and teaching tests are `tests/math.cjs` and `tests/book-examples.cjs`; all 72 teaching input/output pairs use the shared blend calculation. Whole-app source/portable checks and build comparison are recorded in `tests/output/filter-lab-checks.json`.

The original printed pages 14–15 and copied text remain in `reference/book-review/review.html` for user review. The returned random-01 screenshot supports 12 cases at 100% opacity within one byte (seven exact), recorded in `demo/csp-painted-sheet-01-validation.json` and `reference/csp-painted-sheet-01-report.csv`. Other sheets, partial opacity, transparent bases and the Add (Glow) opacity rule remain unverified. Add (Glow) is explicitly experimental; never describe this evidence as general CSP equivalence.

## Approved stage 2 plan — retained design record

The following plan preceded implementation. Proposed hooks/modules below describe that planning stage; the runtime status and actual files above supersede those proposals.


### Confirmed scope and teaching examples

- Add a Filter Lab workspace through the existing add-on package, not a separate application. Keep the gallery and current ball selection. Filter Lab works on several chosen balls and on one or more named colors from each.
- Each chosen filter shows a short overview of what changes, a useful painting application, and any important limit. A collapsed More detail section may show the RGB formula and endpoints. The educational copy must describe the implementation, including opacity and clipping; literal book prose remains in the reference review, not automatically treated as exact algorithm documentation.
- Show a teaching ball made from the main illustration colors: Hair #ECDAA8, Skin #FEEDD9, Mouth #FFB2A2, Cheek #FED0BA, Ink #000000, Highlight #FBF3CE. These are approximate samples from printed scans, not the author's original HEX values. All six horizontal bands appear on both sides: original on the left, filtered on the right. A separate applied-color swatch and an input/output HEX table make every transformation inspectable.
- Default each example to its own sampled book paint swatch. Burn, Screen and Overlay have alternative swatches in the book; expose these as example choices. Brightness in the book uses a gradient; the solid-color example starts at #808080 and identifies that choice. User colors remain freely editable. The example and real balls use the same blend calculation and opacity, not pre-rendered illustrations that fail to respond to settings.
- The split is an adjustable before/after reveal, initially 50%. It never changes the filter's opacity or the saved color. Selected-role scope determines actual effect coverage; unaffected bands/regions look identical on both sides.

### Main flow and row layouts

1. Select balls in the gallery, then open Filter Lab. Start with the gallery order and provide explicit row reordering without silently rearranging the main gallery. A single ball also works for testing.
2. Choose a filter, applied color (swatch + HEX/RGB), opacity 0-100%, and target scope: All colors, Same named color from each ball, or Individually selected colors. Show which colors will change before Apply.
3. In the normal row, each ball appears as a column with a split preview and its selected original/result color pairs. All colors mode lists the whole palette; single-role mode aligns that role across selected balls. Color chips are selectable. Missing roles show Not present and remain unchanged, rather than creating roles or substituting Base.
4. A Compare filters view repeats the selected input colors across separate filter rows, with balls as columns. Each row has a mode, applied color and opacity. Reuse the same input snapshots across rows so comparisons isolate the settings. A row is an independent alternative, not another layer in a filter stack. Keep shared applied-color/opacity controls available for a fair comparison; individual rows can be unlinked for custom settings.
5. Changing the filter immediately changes the explanation and teaching preview. Editing an input color, applied color or opacity recalculates the affected previews, values and arrows live on detached drafts. No color changes are committed until Apply. Cancel discards the drafts.
6. Apply the chosen row to its targeted ball/color pairs in one validated Undo transaction. Comparing twelve alternatives does not apply twelve effects. Keep one active filter configuration per named color in version 1; applying another configuration to that color replaces its configuration. Different colors/balls may have different settings. Disabled configurations remain recoverable and reveal the original colors.

### Editing and copying

- Keep Original and Result fields visibly distinct. Original fields edit the pre-filter ball color through existing recipe/tool rules; Result fields display the calculated color and allow copying HEX/RGB. Do not try to reverse clamped Add/Burn results to infer originals. For the main picker outside Filter Lab, either enter an explicit original-color editing view or show an edit action instead of silently interpreting an output coordinate as an input edit.
- The preview is live; saving the workbench preserves its row definitions, order, selected ball/color IDs and comparison settings as project add-on data. Per-color filters live on the balls. Missing/deleted references remain recoverable in the saved study and show an unavailable entry. Ball duplication and type-save/import behavior need explicit tests.
- Copy PNG exports the visible comparison row/grid using the same render data, with optional names/HEX labels. Offer Download PNG when clipboard writing is unavailable. A PNG is a raster snapshot; saved studies/project JSON preserve editability. Add Copy filtered colors for HEX/RGB values where useful.
- The ordinary gallery, readouts, wheel markers, graph, ball comparison, Copy PNG and exports use the committed resolved colors. A comparison export can deliberately include the original half and must label that choice. The split slider only changes that comparison's view, never the effective colors exported as final results.

### Selected-color arrows

- Show arrows only when Show change arrows is enabled and an affected color/region is selected. Selecting a ball background does not turn on arrows for every color. Switching color changes the arrows to that exact ball/role; deselection hides them. Selecting an unaffected color shows that it is unchanged.
- Use original-to-result endpoints from the same pre-filter and post-filter data used for the HEX table. On the square, use the existing pickerPoint mapping. Its current logical coordinates are x=84+1.52*S and y=236-1.52*L, with S/L in percent. Draw a straight arrow from the original S/L point to the filtered S/L point.
- On the hue circle use the host marker radius for that role, with theta=(H-90) in radians around (160,160). The current marker radius is 142+(roleIndex%3-1)*3. Draw an arc using the shortest signed hue change: ((H_after-H_before+540)%360)-180. Make the 180-degree tie deterministic. Mark the original endpoint with a hollow marker and the result with a filled marker, using labels as well as color.
- Show input/result HEX and differences in hue degrees, saturation percentage points and lightness percentage points. The square represents S/L movement; the hue ring represents hue movement. If either color is achromatic, hue is undefined: suppress the hue arc and label it accordingly, while retaining the square change. Preserve a fallback hue internally without implying a visible hue shift.
- Zero movement has a coincident-marker/No change indication instead of a false-length arrow. The comparison editor's arrows do not write recipe data or move the fixed warm/cool guide. Existing triangle view may reuse its public mapping after the required square/ring behavior is verified.

### Package and state boundaries

Keep implementation, styles, explanations, sample-palette data and tests in `addons/blend-filters/`. Planned modules are math.js, descriptions.js, examples.js, preview.js, engine.js, arrows.js, workbench.js, controls.js and index.js, with an actual manifest added only when runnable. Palette provenance stays in developer reference files; distribute compact sampled values, not full PDF scans or calibration assets.

Proposed ball settings: `{version:1, roles:{[roleId]:{enabled, mode, sourceRgb:[r,g,b], opacity}}}` under `ball.addons['blend-filters']`, with finite integer input RGB bytes and opacity in [0,1]. Calculations use floating-point RGB and round only for readout/export bytes. Role identifiers are authoritative; labels are presentation. No project or ball defaults are created at startup.

Workbench preferences/studies belong under `project.addons['blend-filters']`. Persist rows as typed JSON, not DOM/canvas objects. Resolve committed role filters after harmony, hue swapping and surface tools, using the shared engine. Add a generic `resolveBefore` stage boundary so surface tools read their preceding stages and filters cannot be applied twice. Input edits must use the original stage explicitly; never monkey-patch core functions or access private app variables.

The current host can draw picker overlays and mount controls but does not expose the existing clipboard/export flow or a full workspace mode. Add small reusable hooks for opening an add-on workspace and exporting/copying a provided canvas. Source and portable HTML must call the same bridge. Where the present picker overlay hides endpoint markers, extend the generic drawing context with marker positions or a finishing overlay order rather than duplicating picker geometry in feature-specific core branches.

### Build order and acceptance

1. Educational content + live all-color teaching ball (the static proof is ready in demo/book-palette-split-ball.png and demo/book-palette-all-filters.png).
2. Multi-ball/color selection and detached row/filter comparisons, without committing effects.
3. Reversible per-color filters, the evaluation boundary and original/result editing, plus save/load and Undo/Redo.
4. Selection-gated square/ring arrows and exact endpoint readouts.
5. Copy PNG, editable saved studies, missing-reference recovery and whole-app export consistency.
6. Calibrate remaining colored/partial-opacity cases, including Add versus Add (Glow), before describing unverified behavior as CSP-equivalent. Keep observed one-byte discrepancies in fixtures instead of fitting coefficients to one screenshot. A demo may identify Add (Glow) as provisional; the final matching explanation needs the actual verified behavior.
7. Run feature math/state/rendering/selection/export tests on source and standalone HTML, then relevant host regressions. Verify each palette band is visible on both halves, the split has no effect on output values, canceled edits leave no changes, Apply is one Undo step, unaffected roles retain their colors, and arrows follow only the selected role. Check hue wrap, gray endpoints, disabled filters and existing surface-tool combinations.
8. Rebuild the offline HTML and guides, update validation, and package a new dated distribution ZIP with backups retained. Suggested release version is 3.4.0, subject to checking the actual current version immediately before release. Planning/demo assets do not themselves constitute that release.

## Calibration workflow

Updated calibration: the user's follow-up requested randomizing BOTH inputs. `demo/random-01.png` through `random-05.png` now provide 60 more tests. Every test has its own independently randomized base and applied color, with 120 distinct input HEX codes. Sheets 1-4 use 100% layer opacity; sheet 5 uses 50%. Inputs/results are frozen in `random-cases.json` so the exact sheets can be regenerated without choosing new colors. Existing fixed-color sheets remain available. Generate new random inputs with `node addons/blend-filters/demo/build-cases.cjs --random`; render the saved cases with `python addons/blend-filters/demo/render-sheets.py --random`; cross-check with `node addons/blend-filters/tests/canvas.cjs --random`.

Each PNG has twelve tests. The large split circle is base color on the LEFT and the predicted result on the RIGHT. The smaller separate circle is the source/blend color, unmodified. All three hex values, mode and opacity are printed. The source color is the paint on the upper CSP layer; the base color is below it. Apply the indicated mode and layer opacity. Compare central flat areas, away from edges, with the predicted result. Record test ID, base HEX, source HEX, opacity, CSP result HEX. Import the PNG at its original colors, avoiding profile conversion, correction layers and resampling when measuring bytes.

Five sheets cover blue over gray, gray over orange, light gray over blue, green over purple, and that same colored pair at 50% layer opacity. Reference colors are exact encoded 8-bit RGB. Results are calculated in normalized encoded RGB, then rounded once for the final output. A difference of one byte may identify rounding; systematic differences need investigation.

The eleven heading examples in the book are Multiply, Color burn, Screen, Add, Overlay, Difference, Color, Subtract, Hard light, Saturation and Brightness. Add (Glow) is an additional variant, not an extra main heading. Its formula below is a hypothesis to test, not established CSP behavior. No blur or halo is generated by this calculation.

## Math

Let b be a lower/base channel, s an upper/source channel, both in [0,1]. Let a be source/layer opacity. Calculate RGB, not HSL arithmetic. For an opaque base, ordinary output is (1-a)*b + a*F(b,s). Clamp to [0,1], multiply by 255, and round for HEX. Opacity is separate from recipe strength.

| Mode | F(b,s), per RGB channel |
| --- | --- |
| Multiply | b*s |
| Color burn | b=1: 1; otherwise s=0: 0; otherwise 1-min(1,(1-b)/s) |
| Screen | 1-(1-b)*(1-s) |
| Add | min(1,b+s) |
| Overlay | b<=0.5: 2*b*s; otherwise 1-2*(1-b)*(1-s) |
| Difference | abs(b-s) |
| Subtract | max(0,b-s) |
| Hard light | s<=0.5: 2*b*s; otherwise 1-2*(1-b)*(1-s) |

For the following three modes, B and S are whole RGB triples. Define Lum(C)=0.30R+0.59G+0.11B and Sat(C)=max(C)-min(C). SetLum adjusts all channels by the desired luminosity difference and rescales out-of-gamut channels around their luminosity. SetSat rescales the channel range with the minimum channel at zero. These are blend-specific functions, not Shade Lab's ordinary HSL L/S nor its separate grayscale-byte coefficients. The complete helper algorithms are in math.js.

- Color: SetLum(S,Lum(B)).
- Saturation: SetLum(SetSat(B,Sat(S)),Lum(B)).
- Brightness: SetLum(B,Lum(S)).

Candidate Add (Glow) opaque-base opacity rule: output=clamp(b+a*s), rather than interpolating a pre-clamped Add result. At 100% these two models agree. The 50% sheet deliberately includes clipping cases that can distinguish them. Do not release this candidate as CSP-compatible until measured. Semi-transparent base behavior is not modeled by this demo.

Sources: [W3C blending formulas](https://www.w3.org/TR/compositing-1/#blending), [official CSP descriptions](https://help.clip-studio.com/en-us/manual_en/180_layers/Blending_modes.htm). Standards define a starting model, not a promise about every CSP implementation detail. Ten supplied screenshot interior results match this model exactly for base #747474 and inferred source #0000FF at 100%. Color predicts #6363FF; the screenshot measures #6464FF, one byte higher in R and G. This discrepancy is recorded, not hidden by tuning coefficients. Original input values, CSP rounding and screenshot color handling need checking. Independent colored/partial-opacity calibration remains pending.

## Earlier implementation groundwork

The Stage 2 plan above supersedes earlier single-filter-per-ball and pending-text-review assumptions. The following notes preserve the original integration rationale.

1. Finish calibration with the user's CSP outputs. Keep fixtures with input/output bytes, opacity, app/version and color-profile context. Test black/white burn endpoints, gray vs chromatic inputs, clipping, zero/full/partial opacity and Add versus Add (Glow). Distinguish standard predictions, observed CSP results and provisional hypotheses.
2. Keep the feature in addons/blend-filters/: math.js, controls.js, engine.js, index.js, style.css, addon.json, tests/, README.md. Register only when the actual feature is complete. The present folder has no manifest or registry entry.
3. Build a detached filter editor: selected balls, affected roles (including Base), blend color with HEX/RGB input, mode, opacity, enabled state, and side-by-side original/result preview. One Apply commits one validated Undo step. Cancel writes nothing. Start with one filter per ball; a future stack needs explicit order. Store versioned settings under ball.addons['blend-filters'], not in recipes. Disable reveals original colors. No startup defaults silently modify existing balls.
4. Filter resolved colors after harmony, hue swapping and surface constraints, at proposed resolveOrder 200. Use the shared color engine so ball rendering, picker markers, tables, graphs, comparisons, Copy PNG and exports agree. Convert HSL to RGB without intermediate rounding, blend, then convert back with a stable fallback hue for achromatic results.
5. Fix the generic evaluation boundary before integrating. Surface.raw currently calls resolveWithout excluding only surface-tools; adding a later filter would cause surface editing to consume already filtered colors and potentially filter twice. Add a reusable resolveBefore(ball,strength,extensionId) API and have surface tools evaluate only their preceding stages. Exercise saved accepted-color fallbacks, strength previews, enable/disable and tool combinations. No feature-specific core branches or monkey-patching.
6. Define editing clearly. Burn/Add/clipped blends are often non-invertible. Do not attempt to infer an original color by reversing the visible result. Initially edit originals in a dedicated original-color view; show filtered markers as results. Ordinary output-color sampling/dragging requires a generic edit guard with a clear action to edit the underlying colors. Existing surface constraints describe pre-filter colors; filtered results may leave those regions. Original and result views must identify which stage is shown.
7. Reject invalid newly authored settings atomically. Preserve unsupported imported settings but suspend the effect with an explanation. Save/load, Undo/Redo, duplication, type-library behavior, missing roles and package disable/re-enable need coverage. V1 does not promise pixel-perfect layer compositing on custom semi-transparent image assets: color-role filtering and raster compositing have different alpha requirements.
8. After calibration and implementation, run source/portable feature tests and host regressions; rebuild with npm run build:html; update guides, validation and current dated distribution ZIP. Keep the portable app offline and exclude calibration assets/tests from distribution.

## Files

- math.js: pure prediction model, opaque-base only.
- tests/math.cjs: screenshot fixtures and mathematical boundary checks.
- tests/canvas.cjs: 45 independent Skia/Canvas comparisons, within one byte. This verifies the standard model, not CSP compatibility.
- demo/build-cases.cjs: exact inputs and predicted values.
- demo/render-sheets.py: lossless PNG sheets with verified center pixels.
- demo/cases.json: test IDs and exact input/output values, generated.
- demo/canvas-validation.json: independent standard-model comparison record, generated.
- demo/*.png: CSP sampling sheets, generated.

Run with Node: node addons/blend-filters/tests/math.cjs, then node addons/blend-filters/demo/build-cases.cjs. Run demo/render-sheets.py with Python/Pillow to regenerate the sheets.

## Group selection and applied-paint editing (1.2.0 / app 3.4.4)

New comparisons use angle 132°, split 0.5 and opacity 1. A single reopened comparison retains its saved view. Multi-ball sessions begin with all roles; inherited custom coverage no longer excludes newly selected unfiltered peers. Gallery selection changes update included IDs and capture snapshots for newly created balls. Apply validates all affected baseline snapshots and commits once.

The existing host picker edits a transient `paint` target exposed by `picker.js`. Its availability follows the detached session. Main wheel/surface gestures, HEX, channel fields and samples write integer RGB bytes to the selected row. Achromatic hue is retained as optional row metadata. Pointer cancellation restores detached draft rows; project Undo never rewinds unrelated draft paint. Selecting the target or inspecting another ball keeps gallery selection intact. Closing/disabling the package releases the target.

Compare-all is a reversible view toggle. It caches twelve unique mode rows, retains normal alternatives and carries the selected settings back into the active normal row when turned off. Its mode selector focuses an existing row, avoiding duplicates. Saved studies preserve normal/cache rows and toggle state; older studies remain supported. Add/remove controls are disabled in the comparison view. Inspector edits/arrows only remain active for a currently included affected role. Invalid previews cannot export values.

Regression suite: `node addons/blend-filters/tests/selection.cjs` (also `--portable`). Existing blend/geometry tests remain in `filters.cjs`; `math.cjs` and `book-examples.cjs` retain their independent math verification.

## ShadeLab 3.5.0

The primary row is Filter / Applied HEX / Opacity, with Apply and Cancel alongside the header. All secondary controls, saved studies, filter actions and exports belong to the Filter Lab settings side panel. Default split/angle remain 50% / 132°. The shared wheel orientation matches CSP; applied paint enters Color History only when Apply succeeds.
