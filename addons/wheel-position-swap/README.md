# Highlight / Shadow hue-wheel swap

The user clarified: swap positions **on the wheel**. This package exchanges Highlight and Shadow hues only. S/L positions, formulas, design-layer roles and other region colors remain attached to their original regions. It is independent of the harmony dialog's assignment swap.

A versioned boolean under `ball.addons['wheel-position-swap']` controls the permutation. Resolution order 50 follows harmony and precedes surface constraints. Edit order −50 maps hue requests to the other region before delegation; S/L requests keep their original region and explicitly limit channels so harmony does not rotate twice. The active or selected-ball operation is atomic and undoable. Both named role IDs must exist. A resulting area conflict rejects the operation; it never moves S/L to make the exchange fit.

Files separate math/edit routing, controls, entry and focused tests. Project/type serialization preserves the setting; disabling the package reveals unpermuted hues while retaining data.

Since 3.4.0, edit routing reads the pipeline before this package; accepted surface snapshots resolve through `surface-tools` rather than including later filters. Filtered outputs cannot be captured as the original swap/surface colors.

Run `node addons/wheel-position-swap/tests/swap.cjs [--portable]`.

Since 3.3.2, the compact **⇄ Swap hue** button and Active ball / Selected balls selector use the host actions slot immediately below Pick screen. They remain visible when Tools is collapsed. The button has a full accessible name and explanatory status; calculation and transaction behavior are unchanged.

## ShadeLab 3.5.0

The control is an icon next to Channels. It uses checked balls first, falling back to the edited ball when none are checked. The Active / Selected scope selector has been removed. The atomic hue-only transaction is unchanged.
