# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Chromium extension (Manifest V3) plus a standalone userscript that enhance SAS Studio 3.8 (a legacy Dojo 1.x web app). The extension's main feature is replacing SAS Studio's built-in editor with a modern Ace editor at runtime, via monkey-patching in the page's MAIN world. Everything works by reverse-engineered runtime patching — there is no build step, bundler, or test suite.

A live SAS Studio instance for testing runs at `http://192.168.1.72/SASStudio/38/`.

## Components

Two independent delivery mechanisms, both patching the same app:

1. **Extension** (root: `manifest.json`, `sw.js`, `replace-editor.js`, `lib/`)
   - `sw.js` — service worker; on toolbar click (or Alt+Period) runs three steps in the tab's MAIN world: (1) back up the app's bundled old Ace to `window._origAceLib` and remove it, (2) inject the newer Ace from `lib/ace/src-noconflict/` (plus `ext-language_tools.js` and the custom `ext-browse_ss.js`), (3) inject `replace-editor.js`.
   - `replace-editor.js` — defines `AceEditorAdapter`, a full reimplementation of the `SAS.Editor` API on top of Ace. It replaces the `SAS.Editor` constructor globally, patches `DMSEditor.prototype.createCodeEditor` so new tabs get Ace, and swaps the editor in already-open tabs while re-binding SAS Studio's event handlers (`textChanged`, `selectionChanged`, `caretMoved`).
   - `lib/ace/src-noconflict/ext-browse_ss.js` — custom Ace extension (not upstream) for browsing SAS Studio files/tabs from within the editor. Other files under `lib/ace/` are stock Ace; don't hand-edit them.
   - Designed to run once per page load; a second activation requires a page refresh.

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

No build. To test extension changes: `chrome://extensions/` → reload the unpacked extension → refresh the SAS Studio page → activate (Alt+Period). Userscript changes: update the script in Tampermonkey and refresh. All extension logs are prefixed `[Extension]`, `[Ace Cleanup]`, `[Ace Loader]`, `[Ace Replacement]`.
