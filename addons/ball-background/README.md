# Ball background — Shade Lab 3.4.5 / package 1.1.1

A Background editing button lives next to Grayscale on each gallery card. It selects an auxiliary color target on the main wheel and square/triangle. Existing HEX, HSL/RGB/CMYK channels, native color input and screen/image samples use that target. A second click, Back to ball colors, or selecting an artwork role returns to normal editing. The standalone background editor has been removed.

Each ball stores `{version:1, enabled, hex, hue?}` in `ball.addons['ball-background']`. Optional hue preserves a meaningful chosen hue while the color is achromatic; non-gray readouts use the exact saved HEX. Older HEX-only settings still load. No defaults are created on target selection. Background updates remain independent of RGB filters, recipes, tool locks and geometry. Hide/Show and Clear are per-card, undoable controls; saved projects, duplication and types retain the settings.

`background.js` owns configuration, rendering and target read/write; `controls.js` owns card controls and editing hint through lifecycle-managed generic host APIs; `index.js` declares the target, backdrop and validator. Source math is shared with the existing picker. The core's auxiliary-target path keeps drawing/readouts/input routing separate from actual ball roles. A live drag groups changes into one Undo step and pointer cancellation restores its start. Picker-target selection is temporary, but follows Undo/Redo snapshots and clears when the feature is unavailable.

The existing `drawBallBackdrop` hook still preserves grayscale artwork with colored context, translucent custom layers, Filter Lab split/angle and per-ball PNG backgrounds. Color strips use only actual ball colors.

Run `node addons/ball-background/tests/background.cjs` and append `--portable`. Eighteen checks cover card placement, mode-only selection, main HEX/wheel/square/channels, gesture Undo/cancellation, achromatic hue, RGB, invalid recovery, switching back to real colors, another ball, gallery pixels, show/clear, saves/types/duplicates, disable cleanup, exports, grayscale/translucency, filtered-color locks, samples and legacy/malformed recovery. Native browser layout/pointer capture and actual OS clipboard paste remain unverified.

## Card presentation (3.4.5)

The package stylesheet scopes gallery framing through the existing owned background controls: previews use a 14px inset matching swatches, 12px/10px vertical spacing and 10px corner rounding. A subtle outline appears only for a visible saved backdrop. Native canvas size and drawing/export functions are unchanged. No core extension is needed; removing the package stylesheet restores the default frame.

The Background label stays short in editing mode; its existing pressed state and mint outline identify the selected target. An inline SVG eye replaces the Hide/Show text to fit the toolbar beside Grayscale, with a crossed eye for hidden backgrounds. The visibility button retains an explicit title, accessible name and pressed state. Control groups stay together and text can truncate inside very narrow cards; the full accessible labels remain available. Lifecycle cleanup and retained card/button identities are unchanged.

## ShadeLab 3.5.0

The card uses a Background icon. The production studio moves Hide/Show and Clear into its contextual Background panel while retaining the same main-picker target and live transactions.
