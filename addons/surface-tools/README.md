# Shared surface tools

Support service for Part 3. `geometry.js` owns normalized square/triangle geometry, non-convex segment clipping, intersection projection, and HSV/HSL conversion. `solver.js` owns joint feasibility and detached edit routing. `editor.js` owns the reusable transactional UI; `index.js` owns status, recovery, and sample proposals.

No settings are installed on a ball until user action. Each feature stores version 1 data in `ball.addons[id].surfaces.square/triangle`. The support namespace records the active governing surface and last accepted colors. View switching does not select a new constraint surface. The old `pickerFree.plane` remains a fallback for each new `planeByShape` preference.

The resolver runs at order 100 after hue tools. It reads `Shade.resolveBefore(ball, strength, 'surface-tools')`, excluding later filter stages from original solving inputs. Editing runs at order -100 and delegates hue work to the next stage. Anchor/body translation uses a common first-exit fraction, preventing tunneling through non-convex gaps. Non-anchor line points slide independently. Area preparation projects free points from their last accepted positions; attached points use allowed intervals on their existing world line. Empty intersections reject the proposed movement.

Coordinates are X right/Y up in [0,1]. Visual angles account for the triangle's 149:196 aspect ratio. Boundary membership uses 1e-7 tolerance. Optional `request.point` contains raw logical 320-canvas coordinates so line projection happens before HSL clamping. The main picker and detached editors rebase every pointer event, consuming outward motion at an edge. Pointer cancellation restores the gesture snapshot. Fields retain DOM identity during drags; normalized steppers use 0.1, cyclic angles use 1 degree, and typed finer values remain supported.

Invalid imported configs retain data and last accepted colors. Removal and Disable all must remain available even with multiple invalid tools. Missing providers release their constraints without discarding saved settings. New tool gestures do not fit/bake formulas.

Shared test runner: `node addons/surface-tools/tests/surfaces.cjs [--portable]`. It also loads each feature's own invariant cases. Dependencies, node_modules, calibration images and tests are excluded from the portable release ZIP.

Point layouts are unregistered. Area providers may return `effective(config) === false` to retain retired data without enforcement. Providers may implement `fit` for individual line-distance fitting and `hit` for visible body dragging.

## ShadeLab 3.5.0

Editors use the generic contextual dialog presenter. Existing draft validation, constraints and Apply/Cancel transactions are retained; the main picker remains visible in the production studio.

## CSP square projection

The default square now displays HSV. Version-1 square tool coordinates remain HSL so existing areas, line settings and resolved colors load unchanged. `Geo.canvas` and `uncanvas` project between saved HSL coordinates and displayed HSV pixels. Adaptive display edges keep masks and guides aligned with the color markers; HSL lines and rectangles can curve in HSV. Line pointer projection uses the displayed curve, and area gesture deltas rebase from the current handle after an overshoot. The triangle and stored schemas are unchanged.
