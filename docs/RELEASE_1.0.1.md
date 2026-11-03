# Shade Lab 1.0.1 — CSP square fix

This patch corrects the ordinary color square to match CSP's HSV saturation/value layout. The upper-left corner is white, the upper-right is the pure hue, and the bottom edge is black. Picking, point positions and locked group movement use the corrected layout.

**The six existing hue color-limit shapes, cutouts and masks are unchanged.** Their rendered output was compared with version 1.0 and is byte-for-byte identical. Saved colors, recipes and project formats remain compatible. Existing HSL area/line settings keep their colors and coordinates; their guides can curve in the HSV view.

## Download and open

1. Download **Shade-Lab-HTML-v1.0.1.zip** under Assets.
2. Extract the ZIP into a folder.
3. Open **Shade Lab.html** in your desktop browser. Reload an already-open app tab after replacing its files.

Before updating, use **Save project** for an independent JSON backup of your work. Reopen it with **Open JSON** if needed. No installer, server or account is required.

[Installation guide](https://github.com/Y1-studio/Shade-Lab/blob/main/INSTALLATION.md) covers setup, saving and updates. Installation Guide.html is included for offline use.

**Firefox:** screen color picking (**Pick screen**) does not work in Firefox.

## Assets and verification

- **Shade-Lab-HTML-v1.0.1.zip:** ready-to-open offline app, guides, examples, screenshots and credits.
- **Shade-Lab-Source-v1.0.1.zip:** current source, build scripts and tests.
- **SHA256SUMS.txt:** checksums for both downloads.

The square correction passed 350 named checks per build in source and standalone form, plus both blend-math suites. Fresh live CSP captures covered all six main hues. All six protected color-limit shapes matched the previous renders exactly. The patch-version build and exported source are checked again before publication.

The illustrated tutorial and its original transparent sprites are retained. Sprite art: [@nerukka38261](https://x.com/nerukka38261).
