// tools category lessons.
const toolsSteps = [
 {
  "id": "harmony",
  "title": "Hue harmony",
  "view": "harmony",
  "target": "#harmony-edit",
  "copy": [
   "A harmony keeps assigned colors at related angles around the hue ring, even when you rotate the set.",
   "The preview is open. Choose a harmony, assign parts to its positions and drag a hue point to rotate it. Apply keeps the draft; Cancel leaves the ball unchanged."
  ],
  "focus": "#harmony-wheel"
 },
 {
  "id": "limits",
  "title": "Hue color limits",
  "view": "limits",
  "target": "#hue-color-limits-edit",
  "copy": [
   "Hue color limits keep selected parts inside a cutout based on each part’s hue. The hatched area is outside its allowed range.",
   "The preview shows the cutout. Choose which parts use it, then Apply. Dragging around the ring changes hue; dragging inside the square stays within that part’s boundary."
  ],
  "focus": "#hue-color-limits-wheel"
 },
 {
  "id": "limit-locks",
  "title": "Square and wheel point locks",
  "view": "limits",
  "target": "#hue-color-limits-edit",
  "copy": [
   "Hue color limits has separate locks for Square points and Wheel points, so movement inside the square can be linked independently of hue rotation.",
   "🔒 moves the set; 🔓 moves one point. Each square point still respects its own hue boundary. Apply saves these settings. These locks are separate from the color-picking lock."
  ],
  "focus": "#hue-color-limits-square-lock, #hue-color-limits-wheel-lock"
 },
 {
  "id": "areas",
  "title": "Allowed color area",
  "view": "areas",
  "target": "#color-areas-edit",
  "copy": [
   "An allowed color area restricts selected parts to a rectangle or polygon inside the square or triangle.",
   "The preview is open. Choose a shape and affected parts; drag the rectangle body to move it or its corner to resize it. Adjust polygon vertices for a custom boundary, then Apply."
  ],
  "focus": "#color-areas-wheel"
 },
 {
  "id": "lines",
  "title": "Line guide",
  "view": "lines",
  "target": "#line-guides-edit",
  "copy": [
   "A line guide arranges attached parts along a path through the square or triangle.",
   "Choose the anchor and attached parts, then set the angle and spacing. Drag an attached point along the line or move the anchor to shift the path. Apply keeps the draft."
  ],
  "focus": "#line-guides-wheel"
 },
 {
  "id": "compare",
  "title": "Compare balls",
  "view": "compare",
  "target": "#compare-balls",
  "copy": [
   "Compare balls overlays checked studies on one wheel so you can compare their hues, saturation and lightness together.",
   "Two example balls are included. Select a row to bring overlapping points forward; hide colors in the legend and choose square or triangle. Close returns to the studies without changing them."
  ],
  "focus": "#compare-wheel"
 },
 {
  "id": "constraints",
  "title": "Disable, resume or remove constraints",
  "view": "tools",
  "target": "#surface-disable",
  "copy": [
   "Disabling a surface constraint stops its effect while keeping its settings. Show guide only changes the guide’s visibility; it does not turn the constraint off.",
   "The example disables a hue limit. Use Disable all surface constraints to free the current ball, Resume in this view to restore a tool, or Remove from this view to delete its settings."
  ]
 }
];
