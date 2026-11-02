# Picker grayscale

Two independent view filters below the picker: **Grayscale wheel** and **Grayscale square / triangle**. The surface option follows the current square or triangle. Both start off. Ring and surface markers and guides use the same filter as their background.

The filters also apply to the Hue harmony, Allowed color area, and Line guide editor pickers. Ball artwork, swatches, numeric/HEX values, the Compare balls window, Copy PNG and exported artwork keep their existing behavior. Dragging uses the original color coordinates. The fixed 90°/270° guideline is unchanged.

Settings are project-wide view preferences in `project.addons["picker-grayscale"]`: `{version: 1, wheel: boolean, surface: boolean}`. They support Undo/Redo, project JSON and local saving. Activation creates no saved data. Disabled or absent packages retain the data but show the normal colored picker. Unknown versions are inactive until the user chooses a current setting.

`filter.js` transforms only the rendered picker pixels through `Shade.grayscaleByte`, shared with ball previews and exports. It uses full-range encoded 8-bit RGB with BT.601 weights (0.299/0.587/0.114) and truncation, matching all three supplied CSP references. Alpha is retained. Turning a filter off redraws from original colors and is lossless. `controls.js` owns the controls, with scoped CSS. No color-engine extension is installed.

The generic host `finishPicker(ctx, view)` hook runs after picker markers, with a detached `view.data` for the package's project settings. `tools:false` backgrounds skip both guide and finishing hooks, keeping the comparison overlay unchanged. The host refreshes once after startup so saved view filters apply before `ShadeReady` completes.

Run `node addons/picker-grayscale/tests/grayscale.cjs [--portable]` for actual canvas pixels, isolation, interaction, persistence, and lifecycle regressions.

## ShadeLab 3.5.0

The production studio places two compact labelled icon toggles at the left of the wheel. Input IDs and independent view-only state remain unchanged.
