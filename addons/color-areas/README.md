# Allowed color areas

Active tools are custom rectangles and polygons with per-role exceptions and independent visibility/enforcement. Rectangle movement and resizing clamp at boundaries; width and height have a 0.01 minimum. All normalized steppers use 0.1 without quantizing typed values. Colors retain their last accepted positions until an edge reaches them. Triangle masks clip exactly to the triangle domain.

Book controls and enforcement are paused. `profiles.js` and reference files remain in source but are excluded from the active manifest/bundle. Old `book` areas are inactive, old `both` areas use only the custom restriction, and stored profiles remain untouched. Editing a book-only area starts a custom draft and retains the old configuration as `retiredBook`; Cancel never migrates saved data.

`geometry.js` owns custom membership and cached masks; `controls.js` owns editing and membership indicators. Requires `surface-tools` for joint line movement, boundary handling, and persistence. Current tests cover custom shapes, exceptions, non-convex boundaries, sample proposals, preview gestures and rendering.

## Retained calibration provenance (inactive)

The user's supplied book extracts are in `for the next update/page-26.png` and `page-27.png`. The diagrams are consistent with HSV: white upper-left, pure hue upper-right, and black bottom. `reference/book-profiles.json` records source SHA256s, crop calibration, pixel landmarks, traced curve points, normalized polygons, and uncertainty. `reference/trace-verification.png` overlays the traces on the source diagrams; it was visually inspected. These images and book extracts are development references and are not shipped in the HTML ZIP.

The left neutral band and upper vivid-color notch were calibrated from scan landmarks; the lower chromatic boundary was digitized with a median filter to remove scan speckles. The final contour is sampled at 96 equal arclength positions, starting at the upper-left boundary, for continuous interpolation. Approximate uncertainty is ±5 source pixels (about 0.033 of the calibrated plot width), not measurement precision in a color space. The silhouettes are artistic reference cutoffs, not a universal gamut or published numeric thresholds.

Hue anchors follow the RGB/HSL model: R0, Y60, G120, C180, B240, M300. Primary reference: https://www.w3.org/TR/css-color-4/#the-hsl-notation . RGB and CMY interleave, rather than dividing the wheel into two halves. Linear interpolation of corresponding arclength vertices across each 60° interval is explicitly an app extension beyond the six diagrams. Adaptive mapping converts each HSV boundary to the displayed HSL coordinates; it never copies the original silhouette onto HSL.

User overrides are editable HSV polygons with 3–128 vertices; custom display-surface polygons allow 3–32 vertices. Crossed/empty polygons and empty combined intersections cannot apply. Sampling outside an area produces a review proposal with raw and constrained colors, retaining the raw sample when accepted.

Historical calibration tests are retained in the pre-fix backup. The current runner tests custom areas and retired-data compatibility.
