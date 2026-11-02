// icons category lessons.
const iconsSteps = [
 {
  "id": "settings",
  "title": "⚙ Wheel settings",
  "view": "settings",
  "target": "#sl-settings-open",
  "focus": "#picker-shape",
  "copy": [
   "The gear opens settings for the picker’s shape, point movement and warm/cool guide.",
   "Wheel settings is open for you. Choose square or triangle with Color area, or change whether points move together. The gear opens or closes this panel."
  ]
 },
 {
  "id": "tools",
  "title": "⌘ Tools",
  "view": "tools",
  "target": "#sl-tools-open",
  "focus": "#harmony-edit",
  "copy": [
   "⌘ opens the Tools panel, where constraints and comparisons help organize your colors. The panel is open for you.",
   "The Tools category demonstrates each tool separately. Open an editor, adjust its draft, then Apply to keep it or Cancel to discard it."
  ]
 },
 {
  "id": "recipes",
  "title": "⌁ Shading recipe",
  "view": "recipe",
  "target": "#sl-recipe-open",
  "focus": "#relationship-mode",
  "copy": [
   "A shading recipe defines how the selected part follows a source color, such as Highlight following Base.",
   "Shading recipe is open with Highlight selected. Choose its source and relationship and adjust the amounts. Changes are live. ⌁ opens this panel for the selected part."
  ]
 },
 {
  "id": "wheel-gray",
  "title": "◐ Grayscale ring",
  "view": "balls",
  "target": "#addon-picker-grayscale-view label:has(#picker-grayscale-wheel)",
  "focus": "#wheel",
  "copy": [
   "The upper icon at the wheel’s left edge shows the hue ring in grayscale so you can compare its light and dark values.",
   "Click ◐ to toggle it. Click again to restore color. This changes the picker view, not your ball’s colors."
  ]
 },
 {
  "id": "surface-gray",
  "title": "◩ Grayscale square",
  "view": "balls",
  "target": "#addon-picker-grayscale-view label:has(#picker-grayscale-surface)",
  "focus": "#wheel",
  "copy": [
   "The lower icon at the wheel’s left edge shows the middle square or triangle in grayscale, independently of the ring.",
   "Click ◩ to toggle it; click again to restore color. Your ball’s actual colors stay unchanged."
  ]
 },
 {
  "id": "pick-screen",
  "title": "Pick screen",
  "view": "balls",
  "target": "#eyedropper",
  "focus": "#hex",
  "copy": [
   "Pick screen samples a pixel from your screen and uses that color for the selected part of the ball.",
   "The example applies a demo green to Highlight. To sample your own screen, click Pick screen, then a color; Escape cancels. Reference Image offers image sampling if screen picking is unavailable."
  ]
 },
 {
  "id": "pick-lock",
  "title": "🔒 Color-picking lock",
  "view": "balls",
  "target": "#color-pick-lock",
  "copy": [
   "The lock beside Pick screen decides whether choosing a color changes one part or moves linked colors together.",
   "Click it to toggle: 🔓 changes only the selected part; 🔒 moves linked colors with it. This lock applies to picked colors, separately from wheel movement settings."
  ]
 },
 {
  "id": "ball-gray",
  "title": "◐ Ball grayscale",
  "view": "balls",
  "target": "#gallery .ball-card.active .ball-gray",
  "focus": "#gallery .ball-card.active > canvas",
  "copy": [
   "The first icon under each ball previews that ball in grayscale, helping you judge its light and dark structure.",
   "Click ◐ under the ball to toggle the preview. Click again to restore color; the stored colors are preserved."
  ]
 },
 {
  "id": "background",
  "title": "▧ Ball background",
  "view": "background",
  "target": "#gallery .ball-card.active .bg-card-edit",
  "focus": "#gallery .ball-card.active > canvas",
  "copy": [
   "The patterned-square icon under a ball edits its surrounding background color.",
   "A light background is shown for you. Use the main picker to change it. Click ▧ again or select a ball part to return to its colors. The eye hides/shows it; × clears it."
  ]
 },
 {
  "id": "strength",
  "title": "◒ Shading strength",
  "view": "strength",
  "target": "#gallery .ball-card.active [data-sl-strength]",
  "focus": "#strength",
  "copy": [
   "Shading strength scales how far linked light and shadow colors move from their source color.",
   "Strength is open at 3×; compare it with 1× above. Move Strength to try other amounts. ◒ opens this panel and its comparison previews. Changes apply live."
  ]
 },
 {
  "id": "blending",
  "title": "◌ Soft blending",
  "view": "blending",
  "target": "#gallery .ball-card.active [data-sl-blend]",
  "focus": "#softness",
  "copy": [
   "Soft blending softens the transitions between the ball’s colored regions.",
   "Soft blending is open at 75%; the example compares it with hard edges. Move the slider to try it. ◌ opens this panel; changes apply live."
  ]
 },
 {
  "id": "swap",
  "title": "⇄ Swap light and shadow hues",
  "view": "balls",
  "target": "#wheel-swap",
  "focus": "#gallery .ball-card.active > canvas",
  "copy": [
   "The ⇄ icon beside Channels exchanges Highlight and Shadow hues while keeping their saturation and lightness.",
   "Click it to swap the checked balls. If none are checked, it uses the ball you are editing."
  ]
 }
];
