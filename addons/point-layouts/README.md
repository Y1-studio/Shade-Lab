# Point layouts

Independent square/triangle Triangle, L, and custom-offset layouts. Base is the initial anchor; roles can be reassigned. Adjustable arm lengths, angle, scale, rotation, and individual custom offsets are previewed before one Apply transaction. Main-picker handle/body dragging moves the rigid group; first-boundary clipping preserves offsets. Layouts own S/L positions, while hue tools remain independent.

Requires `surface-tools`. `geometry.js` is the provider/guide; `controls.js` builds the editor. Invalid sizes cannot Apply; Fit position translates the entire configuration into the joint feasible region. A constrained line and a point layout cannot both own a surface.

Tests live in `tests/cases.cjs` and run through `addons/surface-tools/tests/surfaces.cjs` in source and portable modes.
