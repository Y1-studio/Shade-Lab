// tabs category lessons.
const tabsSteps = [
 {
  "id": "balls-tab",
  "title": "Balls tab",
  "view": "balls",
  "target": "#fl-balls-tab",
  "copy": [
   "Balls is the workspace for your color studies, saved types and group selection. Each ball keeps its own colors, recipe and tool settings.",
   "Click Balls to return to the gallery. Click a colored part to select it for editing, or check balls to include them in group actions."
  ],
  "focus": "#gallery .ball-card.active > canvas"
 },
 {
  "id": "filters",
  "title": "Filter Lab",
  "view": "filter",
  "target": "#fl-open",
  "copy": [
   "Filter Lab previews blend effects such as Multiply on checked balls. Choose a Filter, Applied color and Opacity; the gear opens affected-part and comparison settings.",
   "Pick applied paint edits the filter color with the main picker. Apply keeps the result; leaving without Apply discards the draft. Back in Balls, the picker edits Base again."
  ],
  "focus": "#fl-mode"
 },
 {
  "id": "reference",
  "title": "Reference Image tab",
  "view": "reference",
  "target": "#sl-reference-tab",
  "copy": [
   "Reference Image lets you load a picture and sample its colors for your studies. The example shows a demo picture and a color sampled onto Highlight.",
   "Click Load image or drop/paste an image into this tab, then click a colored pixel to use it. The color-picking lock controls whether other parts follow."
  ],
  "focus": "#load-image"
 },
 {
  "id": "history",
  "title": "History tab",
  "view": "history",
  "target": "#sl-history-tab",
  "copy": [
   "History keeps recent committed colors from your edits so you can reuse them. Several example colors are shown here.",
   "Click a swatch to use it on the selected part. Color → new ball or Color → region starts from that color. Clear removes history entries; Undo can restore them."
  ],
  "focus": "#sl-history-colors"
 }
];
