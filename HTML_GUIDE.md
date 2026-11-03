# Shade Lab 1.0 — user guide

## Download and open

Download **Shade-Lab-HTML-v1.0.zip** from the GitHub release, extract it into a folder, then open **Shade Lab.html** in your desktop browser. On Windows, use **Extract All** before opening the HTML file. **Installation Guide.html** in the ZIP covers setup, saving and updating. No installer, account or server is needed.

**Firefox:** screen color picking (**Pick screen**) does not work in Firefox.

## Tutorial characters

The regular character welcomes you on the category menu. The character with glasses appears beside each lesson after you enter a section or the full guide. The characters accompany the existing illustrated examples. Sprite art: @nerukka38261 — https://x.com/nerukka38261. The credit in the app opens the artist’s page. Both original transparent sprites are embedded, so no connection is needed to see them.

## Categorized guide

Click **? Learn** to choose a category or **Start full guide** for all 31 short steps:
- **Ball basics — 8 steps:** clicking the ball to select a part, wheel points, optional creation, custom types, saving/storage and choosing several balls.
- **Icon controls — 12 steps:** each picker and per-ball icon has its own explanation and visible result, including the two grayscale switches, picking lock, backgrounds, strength, blending and hue swap.
- **Tools — 7 steps:** hue harmony, hue color limits, independent square/wheel locks, allowed color areas, line guides, ball comparison and disabling/resuming/removing constraints. Each tool opens its own actual preview.
- **Tabs — 4 steps:** Balls, Filter Lab, Reference Image and History, with their real workspaces and example colors.

Every step has an image: real rendered previews, control/shape diagrams or before/after comparisons. The Ball basics section reconstructs the supplied green ball as separate Base, Shadow and Highlight masks plus a fixed outline. A matched-color comparison shows that a custom ball changes the artwork and region shapes, not only the palette. The gray cast shadow is background artwork, separate from the ball.

Open **examples/green-reference-ball.json** with **Open JSON** to import the optional reference-inspired custom type. It contains three editable PNG masks and a fixed outline overlay. Choose it in Ball types to make a study or inspect its layers. Creating or importing anything remains optional during the guide.

The category menu in the tutorial can switch sections or return to the full guide at any time. The header shows the current category and step. A category launched on its own finishes at its own last step; the full guide continues across all categories. **Next** is always available and **Back** revisits a step. No exercise, ball creation, type saving or download is required.

**Clicking a colored part of a ball selects the part affected by the next edit.** Clicking its swatch does the same; Editing color shows the name. The first Ball basics step highlights the ball itself and explains this directly.

Icon examples open their real panels or show rendered comparisons. Pick screen uses a labeled demo color until you choose to start a real screen sample. Reference Image uses a clearly labeled illustration alongside its actual Load image workspace; History is filled with temporary example colors. Tool edits remain previews until Apply. Creation and type dialogs can simply be left with Next.

Examples reset between steps and category changes. The practice project stays square so previews agree. **×**, **Escape**, or the last step’s **Finish** restores your project, type library, reference image, selection, shape preference and Undo/Redo. Practice edits are not autosaved. Finish or cancel an existing preview before starting.

Studies appear in **Your color studies**. **Save ball type** adds a reusable version to **Ball types**. Studies/types stay in this browser on this device; **Save project** downloads an editable backup, and **Open JSON** reopens it.

The close button stays available while the card scrolls and inside native dialogs. Arrow keys while focused in the tutorial navigate steps; input controls keep their usual keys. Double-click **Shade Lab.html** to run the offline app. The footer should say **1.0 · Illustrated guide**.

## Local saves and multiple tabs

Completed edits start a local save immediately. If a save is still pending or has failed, closing/reloading warns before leaving. Wait for it to finish or use Save project for a downloaded JSON copy. When another current-version Shade Lab tab has saved newer work, automatic saving stops in the older edited tab. Download that tab’s project before reloading so you can retain both versions. An idle tab does not overwrite the shared save just by closing.

Opening a project discards detached filter previews and resets workspace selection. If you choose multiple files in quick succession, the latest request wins. Reference images remain session-only; keep the original image file to reload it. Saved project JSON includes ball/layer PNG assets, not the separate reference workspace image.

## Navigate the studio

Use **Balls**, **Filter Lab**, **Reference Image**, and **History** above the gallery. Reference Image keeps image loading, dropping, pasting and pixel sampling together. History replaces the Screen samples section; it shows the latest 50 distinct committed input colors, newest first. Click a swatch to reuse it, then choose Color → new ball or Color → region. Clear supports Undo. Legacy project samples remain stored and seed history when no history has been saved.

Single-click a colored sphere region or its swatch to select it. Double-click it to open **Shading recipe** beside the picker. Region clicks keep checked balls selected; modifier-clicks and checkboxes still select collections. Transparent custom mask pixels are skipped, and decorative overlays do not become editable color regions. Recipe edits apply live and support Undo. Use **Open formula JSON** and **Save formula JSON** in that panel to reuse recipes.

The right sidebar starts with **Color path analysis** expanded. Click its header to collapse/reopen it. The picker’s recipe icon also opens the current recipe. The graph stays visible above recipe, Tools and other side panels; opening or closing those panels never collapses it. Only its own header hides or reopens the graph. A side panel’s **×** closes just that panel. Long explanations are under **?** controls. On phones the picker remains above the scrolling side controls.

Channel sliders start expanded below the triangle/square. Click **Channels** to collapse/reopen them. This never hides the wheel. Each ball’s **Strength** icon opens Rule strength and Compare shading strength together; **Soft blending** opens its existing softness slider.

## Choose a background with the existing picker

On a ball’s card, click the **Background** icon beside Grayscale, Strength and Soft blending. Its side panel opens and the main picker’s Editing color menu says Background. Use the wheel, square/triangle, sliders, HEX or sampling to change the surrounding color live. Selecting background mode alone creates no saved setting.

Each numeric/HEX edit uses the usual Undo transaction. A whole wheel/square or channel-slider drag is one Undo step; canceling a wheel gesture restores its start. Background editing does not change the ball's actual colors, shading recipe, group spacing, geometry, constraints or Filter Lab settings. It works even when filters lock ordinary ball-color edits. Hue is retained for an achromatic background so you can set its hue before adding saturation.

Click the active Background button again, use **Back to ball colors** below the main picker, or select Base/Highlight/Shadow in the Editing color menu to return to ball-color editing. Clicking a ball swatch or another ordinary ball also exits background mode. Clicking another card's Background button edits that card's background. The square/triangle selector still chooses your usual picker surface.

The gallery preview is inset to align with its color swatches, with rounded corners and space above and below it. This display framing applies consistently to gallery balls; it does not crop or resize saved artwork or exported PNGs.

The Background side panel contains an **eye** button to hide/show the saved background and **× Clear background** to clear it. Hide retains its color; Clear restores transparent artwork. Both support Undo/Redo. Background data is included in projects, duplication and reusable types. Closing the side panel returns to ball-color editing.

Gallery, strength/type previews and Filter Lab comparisons show the same backdrop. Ball PNG exports and Copy PNG include it behind each ball; the export's global background fills the remaining image. Color-strip exports show their usual color values. Ball grayscale applies to artwork, leaving the chosen background in color. Translucent custom layers retain their alpha when composited over it.

## Filter Lab — colors, comparisons and opacity

Select one or more balls in the gallery, then click the marked **◐ Filter Lab** tab between Ball types and the selection controls. **● Balls** returns to the ordinary gallery. The workspace is an inline tab panel, with selection controls still available above it. Use Left/Right or Home/End while a tab is focused to switch tabs. Switching back discards uncommitted drafts. With no gallery selection it uses the active ball. Opening and editing this workspace creates a detached preview; **Cancel / Close** or Escape discards it. Saving a study saves comparison settings without applying its filters.

The primary row contains **Filter**, **Applied HEX**, and **Opacity (%)**. Open **⚙ Filter Lab settings** for RGB, coverage, comparison rows, split/angle, arrows, saved studies, filter enable/remove and export options. Choose **Filter** and **Opacity (%)**. The main picker automatically enters **Applied filter paint** mode while Filter Lab is open. Use the existing wheel, square/triangle, HEX and channel controls to choose the applied paint; the applied-color swatch selects this target again after inspecting another editing target. Filter Lab's applied HEX and RGB fields stay synchronized with that picker. These paint edits only affect the selected comparison row's draft, and do not recolor live balls or create project Undo entries until Apply. Canceling a wheel gesture restores the draft paint.

All included balls use that row's same paint, mode and opacity. Use **Inspect ball (keeps group selected)** or a ball column button to switch the active ball without reducing the group. Selecting a color chip also focuses its ball without losing the other targets. Gallery selection changes update the open workspace, including newly duplicated balls. Clearing selection leaves no targets. A multi-ball session starts with **All colors**, so a ball without an earlier filter is included too; choose another coverage option when needed. New comparisons start at **132°**, **50% split**, **100% opacity**. Reopening a single saved comparison restores its saved geometry and opacity. Each comparison row has its own numeric field and slider, from **0%** (original color) to **100%** (full effect). You may type fractional percentages. Changing one row does not alter another row. **Use paint + opacity for all rows** explicitly copies those two settings across the alternatives.

The **Affect** menu offers:

- **All colors:** every named color of each included ball.
- **Same named color in each ball:** choose a role such as Base, Highlight or Shadow. A ball missing that role is unchanged.
- **Individually selected colors:** open **Choose and order balls / affected colors**, include the balls you want and check the exact roles on each ball.

This coverage selects named colors. The **Before / after split** slider changes the position of the original/filtered boundary. **Shading split angle (°)** rotates that boundary: 0° puts original on the left, 90° on top, 180° on the right and 270° on the bottom. Other angles give a diagonal split; typed full turns wrap around. The percentage positions the boundary across the artwork's extent along that direction. Neither control changes opacity, filtered HEX values, the existing artwork's light direction, or actual role coverage.

**Keep split and angle on applied balls** starts checked. Apply saves that comparison geometry on each affected ball and returns to the gallery with the same boundary. Reopening Filter Lab restores it. **Show saved split on selected balls** inside Filter Lab settings switches between the retained comparison and the full filtered ball without discarding its geometry or changing color values. Gallery, strength previews, Copy PNG, PNG exports, duplication and reusable types retain this view. Color strips/readouts show the resolved filtered values. Undo/Redo and project saving retain the geometry. Ball earlier/later and row earlier/later only change comparison order.

**Add comparison row** makes another editable alternative. **Compare all filters: Off/On** toggles twelve independent rows using the current paint, opacity and coverage. Turning it off returns to the normal rows and carries the selected comparison settings into the previously active normal row; other normal rows are retained. Turning it back on reuses the same twelve alternatives with their edits, instead of creating more rows. While on, choose an existing row by the Filter menu or its row button. Add/remove row controls are temporarily disabled. The toggle, normal rows and comparison cache are saved with editable studies. They all start from the same original inputs for their targeted colors; they do not form a stack. Select a row by its filter button or one of its color chips. **Apply selected row** applies only that row. A new filter replaces the existing configuration on each targeted color; other roles keep their settings.

The right side explains the selected effect and its uses. **More detail / formula** describes the calculation. At a vertical 0° half split, the teaching ball repeats six approximate illustration colors on both sides: Hair, Skin, Mouth, Cheek, Ink and Highlight. Its table always lists all six before/after values using the same paint, opacity and math as your balls; changing the split angle can put different bands on either side. **Book example paint → Use example paint** loads an example swatch; where available, choose an alternative. Brightness's solid #808080 example represents a middle gray chosen from a gradient, not an exact author-provided color.

Select a color chip to inspect its original and result HEX values. Edit **Original HEX (edit input)** to change the input through existing recipe/tool rules. These edits remain drafts until Apply. Result values are calculated; clipped results cannot reliably be inverted. After Apply or leaving the Filter Lab tab, the picker returns to **Base** for the current ball. Enter HEX, use the native/screen/image picker, change channels or drag a point to recolor the ball. Base picks change its material color; linked highlights, shadows and named colors follow the existing recipe. Multiply's paint, opacity, enabled state, scope and comparison split/angle remain unchanged. Other selected studies are not recolored by this single-ball edit. Select a specific named part when you want to adjust it separately.

Inside Filter Lab, Applied filter paint remains a separate draft target. Leaving through Balls, Reference Image, History or Close releases that target. Reopening Filter Lab shows its original applied paint, not the ball's new base color. The main picker displays the ball's pre-filter material color; the original side of a comparison shows that color, and the result side retains the Multiply effect. All completed ball edits support Undo/Redo and save with the project. The temporary Final/Original output-override controls have been removed.

Enable **Show arrows for selected color** to see a straight saturation/lightness change on the square and the shortest hue change on the surrounding ring. The original endpoint has a hollow gold ring and a **Before** label; the filled result has a cyan ring and an **After** label. Outlined arrows point from Before to After. While those arrows are shown, the picker displays only the selected role's positions, keeping other role markers and analysis paths out of the way. Turning arrows off restores the normal picker markers. Readouts give hue degrees and saturation/lightness percentage points. Gray endpoints have no meaningful hue arc; zero movement has no artificial arrow. Only a selected affected color shows arrows. **Show selected color change arrows** below the main picker separately controls the committed view. Grayscale picker preferences still apply to that view.

Apply commits all affected balls and pending original edits in **one Undo step**. Gallery swatches, ball previews, the analysis graph, comparisons, PNG exports and Copy PNG use the resolved filtered colors. Main picker values and markers show the ball colors being edited underneath the saved filter. Recipes remain stored underneath. **Disable selected filters** reveals originals and retains configurations; **Enable selected filters** restores them; **Remove selected filters** removes their configurations. An incompatible imported configuration is retained but suspended, with a recovery message. If a ball changes outside an open preview, Apply rejects the stale draft; reopen Filter Lab to continue.

Name the comparison and click **Save editable study**. It stores rows, individual opacities, paint, coverage, ball order, split, angle, applied-comparison visibility, labels, arrows and draft original-color overrides inside the project. **Load study** reopens it against the current balls; missing ball/role references remain unavailable rather than substituting another color. Editing and saving produces a new study. Save/download the project JSON to retain studies, ball data and assets outside browser storage. PNG images preserve a visual snapshot; project JSON preserves editability.

Choose **PNG rows** (selected or all) and a background, then **Copy PNG** or **Download PNG**. Exports include the comparison split and angle, filter, paint and opacity; optional labels include color names and HEX values. Large grids may require fewer rows or balls. **Copy color values** prepares a table with ball, role, mode, applied HEX, opacity, original HEX and result HEX. If text clipboard access fails, select the prepared text and press Ctrl+C. Image copying uses the usual preview with Retry/Download when browser clipboard permission is unavailable.

For ordinary modes on opaque colors, normalized encoded RGB output is `original × (1 − opacity) + fullBlend × opacity`, clamped to [0,1]; readout bytes are rounded. Add clamps the full sum before interpolation. The experimental **Add (Glow)** candidate instead clamps `original + opacity × paint`, so it can differ from Add at partial opacity; it does not create a blur or halo. Color, Saturation and Brightness use RGB blend luminosity/range helpers, not ordinary HSL channel replacement. The first returned CSP sheet supports 12 cases at 100% within one byte, with seven exact; partial-opacity CSP matching, transparent bases and other sheets remain unverified.

## Tools side panel

Click the **Tools** icon above the wheel to open Hue harmony, Square / triangle tools, Allowed color area, Hue color limits, Line guide and Compare balls beside the picker. Opening and closing the panel preserves active settings. Tool editors open in the same side panel and keep their own editable preview wheel and ball. **Apply** commits the draft once; Cancel or Escape discards it. The main picker remains visible.

## Lock colors to their hue areas

Choose **Tools → Add hue color limits**. Its preview uses the existing square, with the original HSV cutout. Constrain colors starts on. Check each color that should stay within its allowed area; unchecked colors remain exceptions. Apply commits all choices together and switches to Square. Cancel or Escape discards the preview. Edit the tool to hide its guide, use guide-only mode, change the selected colors, or remove it.

The tool uses the six cutouts from the selected RGB/CMY reference visual, without retracing or blending their boundaries. Each hue uses the nearest primary's region: Red around 0°, Yellow 60°, Green 120°, Cyan 180°, Blue 240°, Magenta 300°, with divisions halfway between them. Exact midpoint ties follow the reference's ordering: Red, Yellow, Green, Cyan, Blue, Magenta. Red wraps through 360°.

The square uses the same colored gradient, curved cutout, upper notch and faded/hatched excluded area as the original six panels. Saturation increases left to right; Value increases bottom to top. Its hue follows the selected color's position on the unchanged outer wheel, while its cutout changes with the matching hue sector. The Pure RGB label identifies the full-saturation/value color at that hue. Selecting another ball color updates the square. Unchecked exceptions use the full HSV square without an active mask. Hue changes refit an out-of-area point into its region; dragging stops at the boundary. Existing custom areas and lines also constrain colors and can be adjusted in their own editors.

The cutout is drawn directly in HSV; it is not reshaped into HSL. The square label says HSV SQUARE while this display is active. Numeric sliders still use their chosen model. The triangle retains its normal HSL display and has no cutout overlay. Switching to Triangle preserves constrained colors. Filter Lab effects run afterward and can change resulting displayed colors. Hide guide removes the mask; disabling both constraint and guide restores the standard square.

Each point follows its own hue's limit, even when other points have different hues. While dragging inside the square, the point retains the spot where you grabbed it. Outside its allowed region it clamps to that region's nearest boundary; returning inside aligns it with the cursor again, without a leftover offset. This also applies to the square in detached previews. The hue limiter menu has separate **🔒 Square points** and **🔒 Wheel points** controls, both locked by default, including when opening older saved limits. Locked means move the points together; unlock either to move only the selected point on that surface. These controls override the older arrangement preferences while the limiter is enabled. With the square arrangement locked, dragging moves all constrained points together. Each adjusts at its own hue boundary; returning the cursor restores the intended spacing from the start of the drag. Unlock **Square points** to move only the selected point. The same behavior applies in detached previews; existing linked-hue and line settings still work as configured.

## Grayscale wheel and square / triangle

Two compact icons on the wheel’s left edge control independent grayscale views:

- **Grayscale wheel** filters the outer hue ring and its points.
- **Grayscale square / triangle** filters the inner color surface and its points. It works with either shape.

Toggle either icon or both; toggle again to restore the original appearance. These are view filters: your actual colors, HEX/HSL values, rules, ball artwork and PNG exports stay unchanged. Dragging still adjusts the actual colors. Ball grayscale remains a separate control.

These settings also apply to the picker inside Hue harmony, Allowed color area and Line guide previews. The Compare balls window retains its existing actual-color display. The fixed 90°/270° guideline keeps its position and behavior.

The two settings are saved with the project and local session, and each change supports Undo/Redo. They start off for projects without saved grayscale-picker settings.

## Grayscale conversion in 3.3.1

All grayscale views now use the same full-range RGB calculation: `floor((299 × R + 587 × G + 114 × B) / 1000)`, using the displayed 8-bit RGB channels. It matches all three supplied Clip Studio Paint references: **#F385FF → #B3B3B3**, **#A051EA → #7A7A7A**, and **#6E4BAF → #606060**. The fractional result is truncated, which matters for the first and third colors.

This applies to grayscale balls, custom PNG layers, gallery swatches, strength previews, grayscale picker/tool previews, Copy PNG, and PNG exports that include the grayscale view. Source colors, formulas, alpha and original-color exports remain unchanged. The browser's separate CSS grayscale filter is no longer used for gallery swatches.

## Square and triangle tools — Part 3

Open the **Tools** side panel, then choose **Allowed color area** or **Line guide**. Each ball keeps separate settings for its square and triangle. Changing the view preserves colors. The status says which surface governs all colors and exports. **Apply** or **Resume in this view** makes the edited surface active.

Every editor has **Constrain colors** and **Show guide**. Displaying a guide alone does not enforce it. **Apply** commits one Undo step; **Cancel** or Escape discards the draft. Invalid or incomplete values keep the last valid preview and block Apply. **Remove from this view** removes that tool's current-surface settings. **Disable all surface constraints** reveals the underlying recipe while retaining settings.

Drag the actual color points on the preview wheel or surface. The **Selected color** menu lets you choose overlapping points. Hue dragging respects an active harmony. Surface dragging adjusts the chosen point within its constraints. Canceling a pointer gesture restores its starting state; releasing keeps the latest valid preview. Apply is still required to save the draft.

**Allowed color area:** choose a rectangle or polygon. Drag the rectangle body to move it and its upper-right corner to resize it. Movement stops at the frame; reversing the drag responds immediately. Colors stay in place until an edge reaches them, then move only as far as needed to remain inside. They do not spring back when you reverse. Width and height have a 0.01 minimum. Edit polygon vertices by dragging, entering coordinates, or adding/removing a vertex. The triangle clips the area to its boundary. Uncheck a color to exempt it.

Legacy Book restrictions and Point layouts remain paused. They have no active controls or enforcement. Existing saved settings are retained. A saved combined custom/book area uses its custom part only; a book-only area stays inactive. Editing a book-only area starts a fresh custom draft, retaining its old data for recovery. The new Hue color limits tool is separate and uses the selected reference visual's six definitions.

**Line guide:** choose an anchor, angle, attached colors, and independent signed distances. A new line constrains its colors by default. Drag Highlight or Shadow to slide just that point along the line. Drag the anchor or line body to translate the group while preserving spacing. Points stop at the first boundary and respond as soon as you drag inward, even after a large overshoot. Old saved spacing-lock flags no longer couple non-anchor points.

Turn off **Constrain colors** for a guide-only line following its anchor's actual position. Solid cyan line segments are allowed for the selected color; dashed red segments are blocked by its area. Distances use the surface width, and angles remain visually correct on the triangle. Rotating keeps the anchor fixed and clamps each attached distance independently when an edge is reached.

All normalized coordinate, width, height, and signed-distance arrows step by **0.1**. You may still type finer values. Line angles step by 1° and wrap from 359° to 0° and back; typed full turns normalize when committed. Incomplete input keeps the last valid preview.

A line and allowed area can work together. Moving the area keeps the world line in place and slides affected colors along its legal portions. The area stops if the line would have no usable intersection. HEX, screen/image samples, and numeric edits use the same constraints. An outside sample opens a review dialog with the raw and proposed HEX colors. **Apply constrained color** retains the original sample; Cancel keeps the ball unchanged.

Tools remain separate from recipe formulas. Project/type saves, New ball, duplication, and Undo retain their settings. Inconsistent imported settings retain their recoverable data and last accepted colors; edit, remove, disable, or Undo to recover.

## Compare balls

Select two or more gallery balls using their checkboxes, a saved group, or **Select all**, then open **Tools → Compare selected balls**. The comparison shows every selected ball on one wheel and one square/triangle. All point fills use their actual color, even if a ball's artwork is displayed in grayscale.

Each ball has a number and a symbol. The table lists its regions, HEX and HSL values, and differences from the matching region of ball 1. Hue differences take the shortest signed route around the circle. Hide individual points with the row checkbox. Select a row to bring that point forward; clicking overlapping wheel points cycles through them. Selecting a color also changes the center's background hue to that color's hue. Changing the comparison surface or closing the window does not change the project.

## Swap Highlight and Shadow on the hue wheel

Click the **⇄ Swap hue** icon beside Channels. It affects all checked balls; when none are checked it affects the ball being edited. There is no scope selector. This exchanges Highlight and Shadow hues. Their saturation/lightness, square/triangle positions, and recipe formulas stay with their original regions. Click again to restore the original hue positions, or use Undo. Both regions must exist on every targeted ball.

The swap follows hue harmonies and precedes area checks, so subsequent hue edits follow the exchanged positions. If the exchange conflicts with an allowed area, the whole operation is rejected and the status explains why. Swap settings survive project saves and saved ball types. Comparison and exports show the swapped hues.

## Hue harmonies — Part 2

Under the wheel, choose **Tools → Add hue harmony**. Choose Analogous, Triadic, Split complementary, Complementary, Monochromatic, or Tetradic. Base anchors the relationship on the existing RGB/HSL wheel. Highlight and Shadow are the starting targets; each named region can be assigned to a hue position or left Unaffected. Harmony changes hue only; your recipe continues to determine saturation and lightness.

Analogous starts at ±30° around Base. Triadic uses +120° and +240°. Split complementary starts at +150° and +210°. Complementary uses the opposite hue (+180°); Highlight and Shadow may share it. Monochromatic uses Base hue for assigned colors. Tetradic starts as a square at 0°, 90°, 180°, and 270°, with an adjustable rectangle spread. The adjustable modes have a Spread field, and positions 1 and 2 can be swapped.

Tetradic needs a real fourth color. Assign an existing extra region to position 3 or click **Add Accent**. Accent starts with Base's saturation/lightness and appears in the palette. It affects the ball artwork only after you assign it to a custom design layer. Draft-only Accents disappear on Cancel. Applied Accents remain ordinary regions if you later remove the harmony.

The dialog previews the ball, hue wheel, and swatches. **Apply** saves the configuration and any draft Accent as one Undo step. **Cancel** or Escape discards all preview changes. **Enabled** turns enforcement on/off; disabling reveals the underlying recipe. **Show guide** hides or shows the visual guide without changing colors. **Edit** reopens a preview, and **Remove** deletes the tool configuration. Undo restores it.

Dragging Base or an assigned hue marker, including in the harmony preview, rotates the harmony. Base hue wraps through 0° continuously: 360° becomes 0°, 361° becomes 1°, and negative values wrap too. Its arrows step by 1° and wrap immediately; typed values preview wrapped and normalize when committed. Spread remains bounded because it controls the spacing between positions.

Drag a point inside the preview square/triangle to adjust that color's saturation/lightness independently. Choose **Selected color** to reach overlapping points. Active area and line constraints still apply. Unassigned hues remain independently editable. Numeric hue, HEX, and sampling edits use the same relationship. The main free-hue arrangement checkbox remains unavailable while harmony is enabled; its preference is retained. Shading strength affects the recipe while harmony angles remain fixed.

Harmony settings belong to each ball and survive duplication, project saves, saved ball types, and New ball recipe copies. Formula-only JSON saves the underlying recipe; **Save ball type** includes the harmony. If an assigned color is removed, the tool suspends with a message until you reassign it or Undo. No harmony is enabled on a ball until you apply one.

This is an RGB/HSL wheel, so red's complement is cyan. The warm/cool guide remains fixed at 90° and 270°. The harmony guide has separate visibility controls.

## Add-ons

New features are developed in separate add-on folders. Wheel harmonies are the first installed package. Packages are included when the app is rebuilt, so the delivered HTML continues to work offline as one file. Part 3 is implemented as separate surface-tool packages. The development project includes **addons/README.md** and an inactive template for creating future packages.

## Select balls and save groups

Each ball has a **Select** checkbox. Ctrl/Cmd-click toggles a ball; Shift-click selects a range. **Select all** and **Clear** manage the whole gallery. The selection count identifies the balls that bulk actions affect. The outlined active ball is the one whose colors you are editing; ordinary color edits still affect only that ball.

Choose **Group selected**, enter a name, and save. Use the **Saved groups** menu to select a group's members. While a group is chosen, select balls and use **Add selected** or **Remove selected from group** to edit membership. Groups can overlap. Rename, duplicate, or delete a group with its buttons. Deleting a group keeps its balls. Deleting balls removes their group memberships; Undo restores both. Keep at least one ball in a project.

Clicking artwork or a swatch moves a single collection selection to that ball. An explicit selection of multiple balls is retained. The green card border follows the ball being edited, including when the shading panel remains open or another ball is duplicated.

**Duplicate** copies selected balls, preserves their internal order, and inserts the copies after the selection. New copies have independent colors, rules, and designs. **Duplicate group** also creates a separate named group.

## Copy a PNG into your art program

1. Select one or several balls, or choose a saved group.
2. Click **Copy PNG**. The preview confirms the generated image and reports whether copying succeeded.
3. Switch to your art program and paste. No saved file is required.

The default is one transparent PNG, 2048 pixels wide, with up to three balls per row in gallery order and no labels. **Copy PNG settings** lets you choose balls, color strips, or both; width; background; and labels. Copy uses the grayscale appearance shown in the gallery. Enable **Original colors** to copy the stored colors instead. This checkbox does not change the balls.

Ctrl/Cmd+C also copies the selected balls when focus is outside a text field or dialog and no text is selected. Ctrl/Cmd+A selects all balls in the same context. The clipboard contains an image, not editable Shade Lab balls; use **Duplicate** for in-app copies.

If clipboard access is unavailable or denied, the preview remains open with an explanation. Retry after permitting clipboard access, or use the preview's right-click Copy image action where the browser offers it. **Download PNG** is an optional fallback. The app never reports success until the browser confirms the clipboard write. Very large selections may require a smaller image width or fewer balls.

## Reorder and view in grayscale

Drag the **⠿** handle on a card to move it. A line marks the insertion position. Dragging a selected ball moves the selected set together, preserving its order. Dragging an unselected ball selects and moves that ball alone. The page scrolls near its top or bottom edge. Escape or pointer cancellation leaves the original order. **Earlier / Later** and Alt+Left / Alt+Right offer the same operation without dragging. Each completed reorder is one Undo step.

Each card's **Grayscale** checkbox changes only its rendered view. **Grayscale selected** applies to every selected ball, including a group chosen from the menu. A mixed indicator means only some selected balls are grayscale. The complete ball, including colored overlays, its swatches, and its comparison previews are filtered. The wheel, HEX values, formulas, and original assets retain their actual colors. Turn grayscale off to restore the color view.

PNG downloads keep original colors unless **Include grayscale view** is checked. Copy PNG defaults to the displayed view. Both use the same image renderer. Group membership, gallery order, and grayscale flags are saved in project JSON and local storage.

## Warm and cool guide

The warm/cool guide starts on. Open **⚙ Wheel settings** to turn **Show warm / cool guide** off or back on. A saved off preference is respected. CSP orientation places red near 10 o’clock with hues clockwise. The thin divider is fixed at **90° (yellow-green)** and **270°** on the existing RGB/HSL wheel. It is only a visual guideline: it cannot be dragged or rotated, has no angle controls, and never constrains or changes your colors. Warm and Cool labels identify the color families. The line is masked behind the square or triangle so their controls remain clear. Its visibility supports Undo and is saved with the project. Older saved guide angles are normalized to these fixed boundaries when opened.

## Arrange the picker points

In **⚙ Wheel settings**, there are two independent arrangement checkboxes:

- **Arrange triangle points freely** (or **Arrange square points freely**): check it to drag one point's saturation and lightness while keeping every other color fixed, including when moving Base.
- **Arrange wheel points freely**: check it to change one point's hue while keeping the other points fixed.

Uncheck either box to lock that surface's arrangement. Dragging a point then moves all its points together: rotation around the wheel, or translation inside the triangle/square. The group stops at the area's edge rather than squashing individual points against it. Whole-channel rounding can cause small position differences.

Use **Wheel settings → Color area → HSL square** to replace the triangle with a square. Saturation goes left to right, and lightness goes bottom to top. Switching shape changes the view without changing the colors; the same arrangement checkbox works in both shapes.

Dragging an arrangement saves measured offset rules at **1×**, using the regions' existing channel models and linked sources. Existing advanced or percentage rules are replaced by measured links when you perform a drag. Toggling a checkbox, switching shape, or simply clicking a marker does not rewrite rules or reset strength. Undo/Redo restores arrangement edits.

The two checkboxes apply to dragging on the picker. **Move linked colors together** in Wheel settings continues to govern sliders and sampled colors. Select a region in **Editing color** to reach points that overlap. Shape choice is saved with the project; each ball keeps its own arrangement checkboxes, also included in saved ball types.

## Make a ball

Choose a type beside **New ball**. The arrows browse types, the thumbnail shows its design, and the H/S/L arrows describe each region's movement from its source.

Click **New ball**. Inside the dialog, **Ball type / recipe** loads the chosen type's complete colors, rules, regions, and design at 1×. Changing it replaces previous draft edits, uploaded shapes, and samples while retaining the ball name you entered. It resets the method to **Enter movements** with the chosen type's example colors. In **Edit type**, this changes the draft content; Save still updates the original library entry.

Choose a creation method:

- **Enter movements:** choose a Base color, then enter Highlight and Shadow amounts. Positive numbers increase a channel; negative numbers decrease it. H uses degrees, S and L use percentage points. Turn off the S/L link to use different amounts or opposite directions.
- **Sample colors:** collect Base, Highlight, and Shadow using HEX, a color well, or the screen eyedropper. Previously collected colors stay fixed while you collect the draft. Replacing Base recalculates the relationships to those fixed samples.

Rim and Bounce start off. Enable them if needed, or add and name another region. Missing colors have an explicit **Guess** button. A guess uses the chosen recipe's offsets; it does not analyze your artwork. Guessed colors are labeled and can be replaced individually.

The ball preview updates immediately after choosing a type, Guess, screen picking, color-well changes, or valid HEX/amount input. You do not need to leave a field to see the change. Incomplete values are highlighted and retain the last valid preview; finish them before creating or saving the ball.

**Upload PNG**, beside Guess and Pick screen on every region, replaces that region's shape. The PNG's transparency is tinted by that region's color; the PNG's original RGB colors do not become a painted overlay. This also works for Base and added named regions.

Export each region on the same full canvas, including transparent padding, to preserve alignment. The whole image is fitted proportionally and centered inside the design canvas; it is never cropped. Reuploading replaces the previous shape. If several masks use the same region, they become one mask at the former topmost matching layer position; other masks and overlays keep their order. A region with no mask is added on top. Built-in sphere shapes become editable masks, retaining the remaining geometry and soft blending.

PNGs may be up to 32 MB and 16 megapixels. Loading disables Create/Save until the upload is ready. Canceling, choosing an invalid file, switching types, or closing the draft cannot allow an old upload to overwrite the current draft. Uploading a shape does not fill missing sampled colors.

The old image-sampling section is removed from this dialog. The main workspace's **Reference image** tools, including image paste when no dialog is open, remain available.

**Create** adds the finished ball. **Cancel** discards the draft. You can start from a type's example colors or uncheck that option and choose a different Base.

## Understand and edit the links

Select a ball and a region. The measured relationship display always shows the current difference from that region's linked source, normally Base. It includes signed numbers and direction arrows.

- **Measured offsets:** add or subtract fixed channel points for each 1× step. For example S −10 and L +5 makes a less saturated, lighter color.
- **Percentage amounts:** multiply the source channel. S −5% changes 75 to 71.25 before the output is rounded; it does not subtract five points.
- **Advanced formulas:** edit expressions with source variables and strength `t`. Existing advanced formulas remain intact until you explicitly change mode, apply simple amounts, or sample that region.

The measured display describes the colors you currently see, including strength and output rounding. Stored rule amounts describe one step. Therefore those two displays can differ at 2× strength or by a fraction because of rounding.

Hue takes the shortest path around the wheel: 350° to 10° is +20°, not −340°. HSL hue wraps; the other channels stop at their valid bounds. Derived channel outputs use whole numbers, with halves rounding upward. Calculations retain their fractional precision internally.

Picking or entering a derived color saves its measured offsets and sets the ball to **1×**. Picking Base also uses 1× and moves its dependents. Cancelling the screen picker changes nothing. The original sampled swatch is retained; a rendered derived color can differ slightly after whole-channel rounding.

**Move group** preserves the captured spacing. It moves the whole group instead of learning new offsets from the selected color. A linked source other than Base is supported. RGB and CMYK rules work too; CMYK is a simple screen conversion rather than a printer profile.

Use the comparison previews to see several strengths together. The HSL triangle places lightness vertically and saturation across the available width: its black and white tips have no saturation width. A straight S/L equation therefore need not look straight in triangle geometry. The analysis panel reports `L = m × S + b` for selected colors.

## Save and reuse ball types

**Save ball type** stores the selected ball's named regions, rules, example colors, design, and a generated PNG thumbnail at 1×. Save as a new type or update a saved type. Existing balls keep their own copies when a type changes.

The type browser starts with Classic plus Green, Peach, Red, Blue-purple, Charcoal-blue, and Purple hair recipes. Every entry, including these defaults, can be edited or removed.

**Edit type** opens a draft. Rename it, change example colors, region names, sources, channel models, measured or percentage amounts, advanced formulas, softness, or PNG layers. Layer Apply returns to the type draft; **Save type** commits the type. Cancel discards the entire type draft. **Save as new type** keeps the original entry. **New type** starts a new recipe. To change a region's source, avoid circular links; reassign dependent roles or masks before removing a region.

**Remove type** removes that menu entry. It stays removed after restarting. Undo restores it. Under **Restore defaults**, restore the selected default's original recipe or all seven original defaults. Your other saved types and existing balls remain intact. An empty library offers **New blank ball** and **New type** without silently recreating the defaults. In **Save ball type**, **Download type JSON** downloads the active ball as a portable JSON containing its needed PNG assets. Download the thumbnail separately when you want a preview image.

Open a ball-type JSON with **Open JSON** to add it to the local library. Project JSON contains the designs used by its balls; export saved types separately to share your type library.

## Build your own design with PNG layers

Prepare transparent PNGs in your drawing app. Export each region on the same canvas size to preserve alignment. Open **Edit ball layers** and choose a starter or a blank composition.

Import one PNG or several at once. In a blank composition, the first image establishes the canvas dimensions. Matching image dimensions preserve alignment; other sizes initially fit inside the composition. PNGs must be at most 16 megapixels and 32 MB each.

Each layer has one of two jobs:

- **Recolorable mask:** its transparency and soft edges define the shape. Its assigned named region supplies the color. Multiple masks can share one region.
- **Original-color overlay:** retains the PNG's original colors, useful for outlines and small details.

Select a layer in the preview or ordered list. Drag to move it, or enter position, size, rotation, opacity, and flips. You can reorder, duplicate, hide, replace, and remove layers. The top of the list is the front of the composition. Replacement keeps the existing transform. Add a named color role when the design needs another region.

Classic and rim/bounce starters are editable PNG masks. They use the regions that exist on the ball; add Rim or Bounce if you want those roles in a starter. Custom designs use their own silhouette and composition bounds, without a circular clip.

Layer **Undo/Redo** is separate while the editor is open. **Apply** commits the complete design to the ball; **Cancel** discards the changes. Soft blending affects masks; original-color overlays remain sharp. Painting and erasing belong in your drawing app.

## Save, export, and share

- **Save project:** portable version-3 JSON with balls, rules, named groups, gallery order, grayscale and guide settings, sampled colors, and required PNG assets.
- **Save formula:** rules and region names without a design. Applying a formula keeps the current Base and design, but removes mask layers assigned to roles that the new formula does not contain. Undo restores the previous state.
- **PNG export:** selected or all balls, palette strips, or both; labels and transparent or solid backgrounds. Custom designs also appear in comparisons and exports.
- **Share:** send **Shade-Lab-HTML.zip**. Your friend extracts it and opens **Shade Lab.html**. Send project or type JSON separately when sharing your own work.

Version-1 and version-2 files still open. New downloads are version 3 and need the upgraded app.

## Local saving and recovery

The app stores local projects, the type library, and PNG assets in IndexedDB. It migrates the old localStorage project without deleting that original copy. Shared image bytes are deduplicated and kept outside undo history.

If browser storage is full or unavailable, editing and explicit JSON downloads still work; the app reports the problem. If saved data is damaged, use the recovery download offered by the app before replacing it. Keep a downloaded project before clearing browser data, changing browsers, using private browsing, or moving the HTML file.

The pre-Part-1 app is preserved in **backups/20260926-before-part1/** in the development folder. The Python version is preserved in **archive/python-version/**; development now uses only HTML.

The New ball fixes are included in version 3.0.1. The preceding 3.0 app is preserved in **backups/20260927-before-new-ball-fix/**.

The pre-fix 3.2.0 release is preserved in **backups/20260927-before-tool-fixes-205938/**.

The pre-grayscale 3.2.1 release is preserved in **backups/20260928-before-picker-grayscale-210747/**.

The pre-correction 3.3.0 release is preserved in **backups/20260928-before-grayscale-correction-212620/**.

## Independent color picking — 3.6.4

The **🔓** button beside **Pick screen** starts unlocked. HEX, system color picker, screen/reference samples and History then edit only the chosen color and preserve the other linked colors, including when choosing Base. Full channel precision keeps the picked RGB exact. This creates measured links at 1× without changing their source IDs or channel models. Click **🔒** to pick with linked colors moving together. This control is separate from the slider group-move preference and the two hue limiter movement locks. Settings belong to each ball and support Undo, save/reload, duplication and reusable types. Active tool constraints still apply to picked colors; outside-area samples retain the existing review flow.
