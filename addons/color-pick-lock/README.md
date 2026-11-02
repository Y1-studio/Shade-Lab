# Color picking lock

The lock beside Pick screen starts unlocked for every ball, including older saves. Unlocked picking changes only the selected recipe color and holds its linked ancestors/descendants at their current colors. This covers HEX, the system color picker, screen/reference samples and history samples. It uses measured links at 1×, preserving source IDs and channel models. Locked picking moves linked recipe colors together. Sliders retain the separate existing group-move preference. Active surface, harmony and filter constraints still apply.

Settings are saved per ball under `addons.color-pick-lock`, support Undo/Redo, duplication and reusable types, and are created only when the lock is changed. Auxiliary paint/background targets already edit their own color; the lock is disabled for those targets. All implementation, styling and tests live in this package. The generic host `colorPick` slot places the control beside the picker without accessing private app state.
