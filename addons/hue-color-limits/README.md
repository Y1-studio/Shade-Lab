# Separate movement locks — 3.6.4

The detached limiter menu has Square points and Wheel points lock buttons, both locked by default. Missing settings in earlier saves also mean locked. Locked arrangements move together; unlocked arrangements move only the chosen point. Their generic engine policy overrides saved legacy free preferences before display-group generation. The wheel policy also governs a triangle view while the square limiter remains active. These flags are distinct from picking: the separate unlocked-by-default pick lock governs sampled colors.

# Linked square dragging — 3.6.3

A locked square arrangement moves its constrained roles using one shared HSV display delta from the start of the gesture. Each role projects to its own hue contour, so a clamped role does not freeze the others. Start positions prevent drift during overshoot and restore spacing on re-entry. Free arrangements still move only the selected role. Main, surface-preview and harmony-preview callers pass the gesture origin through the generic display-surface request. Layout-owned groups retain their existing solver. Cutout commands, rendering, the hue ring and triangle are unchanged.

# Hue cutout square — 1.1.1

The existing square displays the original six cutouts from the selected RGB/CMY visual unchanged. The outer wheel and triangle do not receive overlays. `reference-coordinates.json` and `profiles.js` retain the visual's exact path commands and nearest-primary sectors, without shape interpolation.

Individual hue limits now validate and project directly in that point's own HSV profile. Cached source contours and a native movement projector avoid expensive subdivided HSL paths for the usual square drag. Raw display coordinates preserve nearest-boundary projection outside the box. Absolute dragging retains the grab offset and prevents accumulated mismatch after overshoot. Main and detached squares share this behavior. Joint custom-area/line restrictions keep their common solver and mapped-geometry tolerance.

Geometry containment/intersections avoid temporary arrays, nearest-point lookup exits immediately for an interior target and avoids sorting all candidates, and single-polygon projection is linear. The raster loop computes hue factors once and writes bytes directly while preserving exact output; bounded LRU caches retain other points' recently used hue images. See `PERFORMANCE.md` for measured before/after timings and test scope.

`square.js` reuses the original HSV raster calculation, 256×256 field, cubic paths, mask opacity, hatching, outline and reference-local coordinates. The original 207×208 plot is rasterized at 2× and placed into the existing 152px square. Keeping its local Path2D construction avoids even one-channel edge differences from moving a curve's origin before rasterization. The square gradient/cutout is reused; the app retains its own editing markers. Its Pure RGB label appears below the wheel, and the hue follows the selected color.

Rendering and pointer mapping both use HSV. HSL color storage and constraint geometry remain internal, preserving recipes, intersections and exports. Ordinary area/line editors keep their HSL geometry; their guides remain in those editors while the exclusive reference square is displayed. Harmony preview input and filter arrows follow the selected display mapping. Raw comparison views remain unchanged.

The generic `engine.pickerSurface` adapter is supplied only for Square. No triangle cutout or hue-ring ticks, letters or locks are added. The shared transactional editor fixes this tool's preview and Apply to Square; applying switches to that view. Legacy triangle data is retained. No data is created at startup. Apply/Cancel, role exceptions, visibility, Undo, save/load, types and recovery remain supported.

The anchor hues are R0/Y60/G120/C180/B240/M300, with the selected visual's midpoint tie order. Those visual definitions were originally approximations of scans; this correction treats the visual itself as authoritative, not as official CSP gamut boundaries.

Run `tests/limits.cjs [--portable]`, `tests/browser.cjs` and `tests/exact-square-browser.cjs` from this package with Node (Playwright on NODE_PATH for browser tests). `tests/reference-visual.html` is an unchanged copy of the chat visual, used for independent pixel comparisons and excluded from the distribution.
