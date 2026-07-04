# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Chromium extension (Manifest V3) plus a standalone userscript that enhance SAS Studio 3.8 (a legacy Dojo 1.x web app). The extension's main feature is toggling SAS Studio's built-in editor for a modern Ace editor at runtime, via monkey-patching in the page's MAIN world. Everything works by reverse-engineered runtime patching — there is no build step, bundler, or test suite.

A live SAS Studio instance for testing runs at `http://192.168.1.72/SASStudio/38/`.

## Components

Two independent delivery mechanisms, both patching the same app:

1. **Extension** (root: `manifest.json`, `sw.js`, `editor-swap.js`, `lib/`)
   - `sw.js` — service worker; on toolbar click (or Alt+Period) injects `editor-swap.js` into the tab's MAIN world (idempotent — a no-op if already present), then calls `window.__ssExt.toggle(libPath)` there and sets the per-tab toolbar badge (`ON`/empty) from the returned `{ active }`.
   - `editor-swap.js` — defines `AceEditorAdapter` (full reimplementation of the `SAS.Editor` API on top of Ace) and the `window.__ssExt` singleton (`active`, `activate`, `deactivate`, `toggle`, `loadNewAce`, `browse`). On first injection it installs one-time dispatcher patches: `SAS.Editor` becomes a function returning either an `AceEditorAdapter` or the original editor depending on `__ssExt.active`, and `DMSEditor.prototype.createCodeEditor` is wrapped the same way (original saved on `__ssExt`, guarded by `_aceReplacementPatched`). `loadNewAce()` loads the newer Ace library from `lib/ace/src-noconflict/` once (its CSS stays attached permanently — SAS Studio renders its own editor DOM via EditorView.js and never references any `.ace_*` class, so the vendored ace's own styles are inert either way). `activate()`/`deactivate()` swap only the `window.ace` global between the app's original bundled Ace and the newer one — that global still matters because runtime `ace.require(...)` calls (Mode.js/SyntaxColorerAdapter.js) resolve against it for tokenization — then walk every open tab converting its editor in place and re-binding `textChanged`/`selectionChanged`/`caretMoved`. Undo history does not survive a toggle in either direction. `browse(kind, libPath)` (used by `window.__ssExt.browse` for browse_ss prompts) only calls `loadNewAce()`, not `activate()` — it works without activating the editor replacement.
   - `lib/ace/src-noconflict/ext-browse_ss.js` — custom Ace extension (not upstream) for browsing SAS Studio files/tabs from within the editor. Other files under `lib/ace/` are stock Ace; don't hand-edit them.
   - The toggle is idempotent and repeatable — no page refresh needed to switch back and forth.

2. **Userscript** (`ss-fixes.user.js`) — Tampermonkey-style script with ~25 independent fixes/features (tab management, tree navigation, keyboard shortcuts, clipboard, context menus). Each feature is a function in the `ALL_TOOLS` object, all invoked on startup after `.dijitTreeNode` appears. Features register buttons/hotkeys through the shared `toolBar.createToolBtn(callback, btn, keyMap)` helper. The dominant pattern is wrap-and-delegate: save the original method (e.g. `tabs.closeTab`), replace it with a wrapper that calls through.

## Key SAS Studio integration points

- `window.appDMS` — main app controller; `.tabs` (SASStudioTabs), `.projects`, `.dialogs`, `.sessionId`, `.baseURL`.
- `SAS.Editor` — the editor API surface the adapter must implement (defined in `SASStudio-3.82/resources/js/sas-commons/controls/CodeEditor.js`).
- `dijit.byId(...)` / `dijit.registry` — Dojo widget access (trees are `projects.tree`, `library.tree`, `destination.tree`).
- Beware: some SAS Studio methods are subtly broken by the app itself (e.g. `dijit.Tree._expandNode` is overridden to return undefined; the userscript re-binds the prototype original).

## Reference documentation (read before touching the adapter)

- `SAS_EDITOR_API.md` — full `SAS.Editor` API reference (60+ methods).
- `sas-editor.d.ts` — TypeScript definitions for that API.
- `EDITOR_USAGE_MAP.md` — which SAS Studio files call which editor methods (DMSEditor is the heaviest consumer); use this to check compatibility impact of adapter changes.
- `SASStudio-3.82/` — extracted SAS Studio source (its own git repo, gitignored from this one, with its own CLAUDE.md). Ground truth for how the app behaves; explore it rather than guessing.

## Development

No build. To test extension changes: `chrome://extensions/` → reload the unpacked extension → refresh the SAS Studio page → toggle (Alt+Period). Userscript changes: update the script in Tampermonkey and refresh. All extension logs are prefixed `[SS Ext]`; expect one line per toggle (`activated`/`deactivated ... N tab(s) ...`) plus errors/warnings only.
