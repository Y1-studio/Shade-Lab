// ball category lessons.
const ballSteps = [
 {
  "id": "selection",
  "title": "Click the ball to select a part",
  "view": "balls",
  "target": "#gallery .ball-card.active > canvas",
  "copy": [
   "Click directly on a colored part of the ball to select that part. Click its bright patch for Highlight, or its dark patch for Shadow. Your next color edit affects the part you clicked.",
   "Editing color shows the selected part’s name. Clicking a swatch below the ball also selects its part; double-clicking a part or swatch opens its shading recipe."
  ]
 },
 {
  "id": "points",
  "title": "The points are your ball colors",
  "view": "balls",
  "target": "#wheel",
  "copy": [
   "Each point represents a part of the ball. Drag it around the ring to change hue, or inside the square to change saturation and lightness.",
   "Choose overlapping points with Editing color. This tour uses a square so the previews match; Wheel settings also offers a triangle."
  ]
 },
 {
  "id": "new-ball",
  "title": "Create a ball — optional",
  "view": "new",
  "target": "#add-ball",
  "copy": [
   "A ball is a separate color study. Choose a Ball type, then + New ball to start another without replacing your existing studies.",
   "The creation preview is open. Name the ball and choose its starting colors or recipe, then Create ball when you want to keep it. You can use Next without creating anything."
  ],
  "focus": "#new-name"
 },
 {
  "id": "ball-parts",
  "title": "Take the reference ball apart",
  "view": "balls",
  "target": "#gallery .ball-card.active > canvas",
  "copy": [
   "This green reference uses three editable colors: mint Base, a pale Highlight and a teal Shadow. Its black outline is a fixed overlay, not another color region.",
   "Keep each part on the same-sized transparent PNG canvas and assign its mask to the matching named region. The gray cast shadow belongs to the background, separately from the ball."
  ]
 },
 {
  "id": "custom-type",
  "title": "Create your own ball type",
  "view": "newtype",
  "target": "#new-type",
  "copy": [
   "New type can use your own artwork. Stack the green reference’s Base, Shadow and Highlight masks, then place its fixed outline on top.",
   "The editor is open. Choose Custom PNG layers, then Edit type layers to assign the PNGs to named regions. An importable green-reference-ball.json is included in examples. Creation remains optional."
  ],
  "focus": "#new-design-mode"
 },
 {
  "id": "custom-compare",
  "title": "Different artwork, same color roles",
  "view": "balls",
  "target": "#gallery .ball-card.active > canvas",
  "copy": [
   "Both drawings use the same Base, Highlight and Shadow colors. The custom reference has its own highlight shape, shadow boundary and outline; it is not just a recolored Classic ball.",
   "Create another study from a different Ball type to compare designs. Open examples/green-reference-ball.json to add this reference-inspired layered type, then choose it in Ball types."
  ]
 },
 {
  "id": "library",
  "title": "Save and find your ball types",
  "view": "type",
  "target": "#save-type",
  "copy": [
   "Save ball type stores the current design and recipe as a reusable starting point in Ball types above your studies. Its save dialog is open for you.",
   "Studies and types stay in this browser on this device. Save project downloads an editable backup; Open JSON reopens it. Practice saves in this tour are temporary."
  ],
  "focus": "#type-name"
 },
 {
  "id": "ball-selection",
  "title": "Choose balls for group actions",
  "view": "balls",
  "target": ".selection-toolbar",
  "copy": [
   "Clicking artwork chooses the part you edit. The Select checkboxes choose which balls are included in group actions such as filters, hue swapping and comparison.",
   "Two example balls are checked. Tick individual Select boxes, or use Select all and Clear. Clearing the checks does not delete any balls."
  ]
 }
];
