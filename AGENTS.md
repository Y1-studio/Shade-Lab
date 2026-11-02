# Shade Lab development rules

- The active product is the HTML app. Leave `archive/python-version/` archived.
- The user requires every new feature from this point onward to be an actual add-on in `addons/<feature-id>/`. Keep its implementation, UI construction, scoped styles, documentation, and feature tests together there. Split large features into multiple files inside their package.
- Keep the existing features in their current `web/` modules. Bug fixes may edit the module that owns the bug; do not move or rewrite working features merely to prepare future features.
- Use `addons/README.md` and `_template/` for the manifest, lifecycle, host API, and build conventions. Register packages explicitly in `addons/registry.json`. The template must stay uninstalled.
- Core changes for new features should be limited to small, reusable extension points that the add-on needs. Feature-specific math, controls, and state belong in its package. Do not reach into private app variables, replace core functions, or add special cases for a particular add-on to core rendering.
- Part 2 is implemented in `addons/wheel-harmonies/`. Keep its math, guides, controls, styles, and tests in that package. Part 3 uses `addons/surface-tools/` for shared geometry, solver and editors, plus `addons/point-layouts/`, `addons/color-areas/`, and `addons/line-guides/`. Comparison and hue-only Highlight/Shadow swapping live in `addons/ball-comparison/` and `addons/wheel-position-swap/`. Do not create empty installed placeholders.
- Color add-ons use the generic engine extension API for a shared resolved result across all views and exports. Keep recipe evaluation separate. Tool hue gestures must not overwrite recipes; disabled tools reveal the underlying recipe. Use detached preview dialogs and one validated transaction for Apply.
- Preserve the fixed, non-draggable 90°/270° warm/cool guideline and all current Part 1/New ball behavior.
- Run the relevant source and standalone tests. Rebuild `Shade Lab.html` and the browser guides with `npm run build:html`; never manually edit generated HTML or `addons/bundle.js`. The portable app must remain fully offline and self-contained.
- Update the guide, validation record, and current HTML distribution ZIP when delivering a changed app. Keep backups and previous dated releases. Keep development dependencies, tests, archives, backups, and book extracts out of the user distribution ZIP.

## Current studio layout (3.5.0)

- Production navigation, contextual panels, help, disclosures and committed color history belong to `addons/studio-layout/`. The navigation-redesign prototype stays uninstalled and separate.
- Use the generic contextual dialog API for tool editors and the shared `Shade.wheelAngle`, `wheelPoint` and `wheelHue` mapping for every hue-ring view/input. CSP orientation has red at 10 o’clock; the non-draggable guide still uses 90°/270° boundary hues and defaults on unless explicitly saved off.
- Recipe edits stay live. Tool and Filter Lab edits stay detached until Apply. Color history records completed successful edits in the same transaction; transient paint is recorded only on Apply.

## Local Git history (required for every update)

- The user requires this project to have its own local Git repository and a commit for every completed update. Reuse this repository; do not create a repository per update or combine it with another project's repository.
- Before editing, inspect git status and the latest commit. Preserve unrelated changes. If relevant work is not yet recorded, save an appropriate baseline before making further changes.
- After an update, run the checks appropriate to the change and follow this project's build, guide, validation, and distribution requirements. Review the diff, stage the files belonging to the update, and make a descriptive local commit before delivering it.
- Include source, project instructions, relevant tests, and validation records in the update's commit. Follow .gitignore for dependencies, generated test output, runtime builds, archives, backups, and personal library data. Keep required standalone product files tracked where the project uses them.
- Keep current distribution ZIPs in the shared ../ZIPs folder. A source commit does not replace building and verifying the runnable distribution when application behavior changes.
- Do not commit credentials, discard unrelated work, rewrite existing history, or push to a remote unless the user explicitly requests it. No remote is needed for this workflow.
- Report the project's final commit hash when delivering an update. If there is no file change, do not make an empty commit.
