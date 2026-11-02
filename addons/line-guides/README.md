# Line guides

Separate square/triangle lines with an anchor, visual angle, and independent signed role distances. New lines constrain by default. Guide-only mode follows the resolved anchor without recoloring.

Non-anchor markers slide independently along the line, even for saved `locked: true` data. Drag the anchor or visible body to translate the group with spacing preserved. The solver stops at the first boundary and pointer rebasing permits immediate reversal. Rotation keeps the anchor and clamps distances individually. Signed-distance and normalized-coordinate steppers use 0.1; angles wrap modulo 360 with 1-degree steppers.

Requires `surface-tools`. Solid cyan segments are legal for the selected role; dashed red segments are excluded by its area. Moving an area preserves the world line and projects its colors along legal intervals. Empty intersections stop the area.

Geometry, controls and entry are separate. Tests in `tests/cases.cjs` and the shared gesture suite run against source and standalone HTML.
