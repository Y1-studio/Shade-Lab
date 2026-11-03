# Shade Lab 1.0.1 — patch release — 3 November 2026

Version 1.0.1 publishes the CSP HSV-square correction as a patch release. Package metadata, the app footer, current guides, download filenames and GitHub links use 1.0.1. Saved-document and add-on schema versions are unchanged. The six hue color-limit shapes remain unchanged. Previous 1.0 archives and the v1.0 release are retained.

The source export is reviewed separately from local development history, rebuilds to identical app/guide bytes and excludes private data, backups, dependencies and book extracts. App/source archives and SHA256SUMS.txt are prepared for the new v1.0.1 release. Focused source/portable regression, add-on and CSP-square checks are repeated for the versioned build.

# CSP-style square correction — 3 November 2026

The ordinary square now uses HSV saturation/value, matching the CSP Color Wheel palette. The upper-left corner is white, the upper-right is the pure hue, and the bottom edge is black. Recipes and saved colors retain their existing HSL format. Saved HSL area/line guides retain their coordinates and can curve in the HSV view.

The six existing hue color-limit cutouts and masks are unchanged: each matches the previous app's rendered output byte for byte. Source and standalone suites pass 350 named checks per build, plus the two blend-math suites. Fresh live CSP captures cover all six main hues; 18 interior RGB samples match within two byte levels. Portable archive entries, CRC and checksums are verified. Reload an already-open local app tab to use the update.

# Shade Lab 1.0 — release checks

The release contains the offline HTML app, browser-readable guides, editable examples, screenshots and credits. The app retains the verified tutorial behavior and now displays the public release version 1.0.

- Version 1.0 rename: 14 regression checks and 15 add-on checks passed for both source and standalone builds (58 checks). The rebuilt guides, package metadata, app footer, release filenames and links use version 1.0. Saved-document schemas and add-on versions retain their existing compatibility.
- 20 tutorial checks passed against the source app and again against the standalone HTML.
- 22 studio-layout checks and 15 add-on checks passed per build: 114 checks in total across these suites.
- Brave's browser add-on checked all 31 lessons at five viewport sizes: 155 rendered lesson layouts.
- Checks cover embedded original sprites, the regular-menu/glasses-lesson mapping, artist links, illustrated lessons, category navigation, freely available Next, reachable ×/Escape, workspace restoration and Undo/Redo context.
- The public source snapshot is rebuilt separately and compared with the tested HTML. Portable ZIP entries and checksums are verified before publication.

Screenshots show the real app and optional tutorial practice examples. Custom-ball comparisons use the included reference-inspired geometry; the gray cast shadow is separate background artwork. The public source snapshot excludes local backups, book scans and personal library data.

The previous development and dated release history remains preserved locally. This public repository starts with the current source snapshot.
