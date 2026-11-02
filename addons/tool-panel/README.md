# Collapsible tools

Wraps the host's `tools` slot in a native, keyboard-accessible Details disclosure. It starts collapsed and retains its open state during edits for the current page. Collapsing hides controls without changing project data, active constraints, or Undo history.

Contains Hue harmony, shared Square / triangle tools, Allowed color area, Line guide and Compare balls. Grayscale mounts in the separate `view` slot; Highlight / Shadow swap mounts in `actions` below Pick screen. Neither belongs to the disclosure.

The generic `api.wrapSlot(slot, wrapper, content)` hook restores the slot and its existing controls in place on disable/failure. Tool packages remain independent and need no dependency on this layout package. No project settings or color-engine hooks are used.

Run `node addons/tool-panel/tests/panel.cjs [--portable]` for collapse behavior, swap access and lifecycle checks.
