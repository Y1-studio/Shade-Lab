# Wheel harmonies — Part 2

This installed add-on adds **Tools → Add hue harmony** below the wheel. Settings belong to each ball; new and existing balls keep their current colors until a harmony is applied.

## Use

Choose Analogous, Triadic, Split complementary, Complementary, Monochromatic, or Tetradic. Base anchors the harmony on the existing RGB/HSL wheel. Assign each named region to a hue position or leave it Unaffected. Highlight and Shadow are the initial targets. Several regions can share a position while retaining different saturation and lightness.

Edit previews the wheel, ball, and palette in a detached dialog. **Apply** saves one Undo step; **Cancel** or Escape discards the whole preview, including draft Accents and Base hue edits. Changing the active ball or its data while the dialog is open cancels the draft. Incomplete or invalid fields retain the last valid picture and block Apply.

**Enabled** enforces the hue relationship. Turn it off to reveal the underlying recipe. **Show guide** only controls the guide; hiding it does not disable the harmony. **Remove** deletes the configuration, and Undo restores it. Applied Accents remain ordinary palette regions after removal; remove them with the existing region controls if no longer needed.

## Geometry

| Mode | Offsets from Base H | Adjustable spread |
| --- | --- | --- |
| Analogous | 0, −a, +a | Initial 30°; 1–89° |
| Triadic | 0, 120, 240 | Fixed; target positions can be swapped |
| Split complementary | 0, 180−a, 180+a | Initial 30°; 1–89° |
| Complementary | 0, 180 | Multiple targets can share the opposite hue |
| Monochromatic | 0 | Assigned targets share Base hue |
| Tetradic | 0, a, 180, 180+a | Initial 90° (square); 1–179° |

Offsets wrap modulo 360. The adjustable limits are product choices that keep positions distinct; they are not universal color-name boundaries. This remains an RGB/HSL wheel: red's opposite is cyan. The separate warm/cool guide stays fixed at 90°/270°.

Tetradic requires an assigned role at every non-Base position. Choose an existing third target, or click **Add Accent**. The Accent initially inherits Base's S/L. It appears in the palette and exports; it changes the artwork only if a design layer is assigned to it. Changing harmony mode within the same draft removes draft-only Accents. Cancel never adds a region.

## Editing and persistence

Dragging Base or an assigned hue marker in the main wheel or preview rotates Base and the entire harmony. Base input accepts any finite angle and wraps modulo 360; arrows wrap immediately. Surface preview points edit the selected S/L independently and respect active surface constraints. Use Selected color to reach overlaps. Numeric hue edits do the same. The old free-hue checkbox is disabled while the harmony is enabled; its saved preference is retained. Unassigned hues remain editable independently. Change spread in Edit. S/L inputs and plane movements continue using the existing recipe-editing behavior; harmony reapplies only hue afterward. HEX and screen/image samples go through the same constraint path, and raw sampled colors remain in the sample list.

The evaluation path is `recipe → harmony hue → views/exports → optional grayscale`. Changing strength affects the recipe's S/L while the configured hue angles stay fixed. Underlying formula errors reject a proposed edit atomically. Unknown settings or missing assigned regions suspend the tool with an explanation; their data is retained until edited or removed.

Settings use `ball.addons["wheel-harmonies"]`: `{version: 1, mode, spread, enabled, visible, assignments: {roleId: positionIndex}}`. The project format stays version 3. Project, duplication, saved ball types, and New ball recipe copies retain settings. Formula-only JSON still describes the underlying recipe; use Save ball type to share the harmony as well. Older apps or builds without this package retain the JSON settings but show the underlying recipe. Reinstalling the package restores the effect.

## Source and tests

- `math.js`: geometry, settings validation, hue resolution, and edit routing.
- `guide.js`: visible wheel guide; no enforcement decisions.
- `controls.js`: per-ball controls and detached preview transaction.
- `index.js`: package entry point and generic engine/renderer hooks.
- `style.css`: scoped responsive controls.
- `tests/harmonies.cjs` and `tests/interactions.cjs`: behavior, multi-turn preview gestures, cancellation, constraints and real-canvas/PNG regressions.

```text
node addons/wheel-harmonies/tests/harmonies.cjs
node build-html.cjs
node addons/wheel-harmonies/tests/harmonies.cjs --portable
```

Part 3 patterns, color areas, and line tools are not included.

## ShadeLab 3.5.0

Editors use the generic contextual dialog presenter, preserving their detached draft lifecycle and native-modal fallback without the studio layout. Shared wheel coordinates match CSP orientation.
