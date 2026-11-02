# Compare balls

Standalone read-only add-on. Select at least two gallery balls, then Compare selected balls. `wheel.js` builds the resolved role list and overlays markers; `controls.js` owns the comparison dialog, actual-color swatches, HSL/HEX table, shortest signed hue differences, visibility switches, and per-ball previews.

Every color uses its exact resolved hue-wheel and square/triangle coordinates. Point fills always use its actual color. Balls cycle through four marker silhouettes and have numbered table labels; selecting a row brings overlaps forward and selecting near coincident markers cycles through them. The center background follows the inspected color's hue. Diagram shape and visibility changes are local to the dialog; no project writes or Undo steps occur.

The renderer exposes generic optional `markers:false` and `tools:false` switches so the add-on can reuse its background without duplicating the core wheel. Comparison does not depend on the surface-tool package and continues to work when other packages are disabled.

Run `node addons/ball-comparison/tests/comparison.cjs [--portable]`.

## ShadeLab 3.5.0

The comparison opens inside the studio side panel with its own wheel and all selected-ball previews. Its ring points use the shared CSP wheel mapping.
