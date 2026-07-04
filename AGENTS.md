# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Chromium extension (Manifest V3) that enhances SAS Studio 3.8 (a legacy Dojo 1.x web app) by monkey-patching in the page's MAIN world. Two main features: toggling SAS Studio's built-in editor for a modern Ace editor at runtime, and ~25 independent UX fixes (formerly a Tampermonkey userscript, now fully absorbed into the extension — nothing to install separately anymore). Everything works by reverse-engineered runtime patching — there is no build step, bundler, or test suite.

A live SAS Studio instance for testing runs at `http://192.168.1.72/SASStudio/38/`.

## Components

Everything below lives in one extension (`manifest.json`, `sw.js`, `editor-swap.js`, `ss-fixes.js`, `tools-meta.js`, `defaults.js`, `popup.html`/`popup.js`, `options.html`/`options.js`, `lib/`), all patching the same app:

- `sw.js` — service worker, three jobs:
  1. Editor toggle: on `toggle_editor` (Alt+Period, or the popup's toggle button) / `browse_files`/`browse_library`/`browse_tabs` commands, injects `editor-swap.js` into the tab's MAIN world (idempotent — a no-op if already present), then calls `window.__ssExt.toggle(libPath, snippetsText)` or `window.__ssExt.browse(kind, libPath, snippetsText)` there and sets the per-tab toolbar badge (`ON`/empty) from the returned `{ active }`.
  2. ss-fixes injection: on every `tabs.onUpdated` for a `/SASStudio/` URL, injects `tools-meta.js` + `ss-fixes.js` into the MAIN world and calls `window.__ssf.init(settings)` with the persisted patch/hotkey settings from `chrome.storage.local`.
  3. Live snippet apply: on `chrome.storage.local`'s `snippets` key changing, pushes the new text into every open SASStudio tab via `window.__ssExt.applySnippets`.
- `editor-swap.js` — defines `AceEditorAdapter` (full reimplementation of the `SAS.Editor` API on top of Ace) and the `window.__ssExt` singleton (`active`, `activate`, `deactivate`, `toggle`, `loadNewAce`, `browse`, `applySnippets`). On first injection it installs one-time dispatcher patches: `SAS.Editor` becomes a function returning either an `AceEditorAdapter` or the original editor depending on `__ssExt.active`, and `DMSEditor.prototype.createCodeEditor` is wrapped the same way (original saved on `__ssExt`, guarded by `_aceReplacementPatched`). `loadNewAce()` loads the newer Ace library from `lib/ace/src-noconflict/` once (its CSS stays attached permanently — SAS Studio renders its own editor DOM via EditorView.js and never references any `.ace_*` class, so the vendored ace's own styles are inert either way). `activate()`/`deactivate()` swap only the `window.ace` global between the app's original bundled Ace and the newer one — that global still matters because runtime `ace.require(...)` calls (Mode.js/SyntaxColorerAdapter.js) resolve against it for tokenization — then walk every open tab converting its editor in place and re-binding `textChanged`/`selectionChanged`/`caretMoved`. Undo history does not survive a toggle in either direction. `browse(kind, libPath, snippetsText)` (used by `window.__ssExt.browse` for browse_ss prompts) only calls `loadNewAce()`, not `activate()` — it works without activating the editor replacement. `applySnippets(text)` registers the user's custom Ace snippets (`ace/snippets` snippetManager, additive over the built-in set) — no-op until the new Ace lib is loaded. `appDMS.createFileView` is also wrapped once (`_createFileViewPatched`): while active, the "View file as text" viewer gets a read-only `AceEditorAdapter` overlay (registry in `__ssExt._textViewers`) laid over the real `SimpleTextarea`, which is kept alive in the widget tree (just visually hidden) so AppDMS's positional load/refresh code (`AppDMS.js:3931`/`3985`, which indexes `pane.getChildren()[1].getChildren()[0]` rather than going through `tabHolder.simpleTextArea`) keeps working untouched; the widget's `.set("value", ...)` is patched to also mirror writes into Ace. TXT/LOG viewers get a toolbar `ToggleButton` ("Edit") next to Refresh plus a `Save` button that POSTs the edited text to the workspace endpoint (mirrors `DMSEditor.saveFile`'s plain-file path); `deactivate()` disposes the adapter, unhides the textarea, and restores its original `.set`, and viewers opened while inactive are unaffected by activation.
- `ss-fixes.js` — ~25 independent SAS Studio UX fixes/features (tab management, tree navigation, keyboard shortcuts, clipboard, context menus), split into `ACTIONS` (one-shot commands, e.g. `reloadCurrentFile`) and `PATCHES` (passive monkey-patches applied once at init, e.g. `keepAlive`). Exposes `window.__ssf = { init(settings), run(name) }`; `init()` waits for `.dijitTreeNode`, applies enabled patches, runs any action `setup()`s, and binds hotkeys; `run(name)` invokes a single action on demand (used by the popup). The dominant pattern for patches is wrap-and-delegate: save the original method (e.g. `tabs.closeTab`), replace it with a wrapper that calls through.
- `tools-meta.js` — shared `SSF_TOOLS` array (`{name, kind, label, title, hotkey}`), one entry per `ss-fixes.js` action/patch. Plain script (no modules) loaded both as an extension-page `<script>` (popup/options) and injected into the page's MAIN world alongside `ss-fixes.js`.
- `defaults.js` — shared `DEFAULT_SAS_SNIPPETS` (the custom snippet text, additive over ace's own built-in SAS snippets), loaded via `importScripts()` in `sw.js` and a `<script>` tag in `options.html`.
- `popup.html`/`popup.js` (`action.default_popup`) — quick actions only: the editor toggle + one button per `SSF_TOOLS` action (label + hotkey hint), plus a link to the options page. Clicking an action button files-injects `tools-meta.js`+`ss-fixes.js` (idempotent) then calls `window.__ssf.run(name)` — works even if `tabs.onUpdated` hasn't injected yet.
- `options.html`/`options.js` — all configuration: a checkbox per patch (`chrome.storage.local.fixes`), a hotkey table with per-action record/clear (`chrome.storage.local.hotkeys`), and an Ace-editor-backed snippet text box (`chrome.storage.local.snippets.sas`, live-applied on Save via the storage-change listener in `sw.js`). Patch/hotkey changes apply on next page reload; snippet changes apply immediately.
- `lib/ace/src-noconflict/ext-browse_ss.js` — custom Ace extension (not upstream) for browsing SAS Studio files/tabs from within the editor. Other files under `lib/ace/` are stock Ace; don't hand-edit them (this includes `snippets/sas.js` — user snippet customization lives in `defaults.js`/`chrome.storage.local` now, not vendored in).
- The editor toggle is idempotent and repeatable — no page refresh needed to switch back and forth.

## Key SAS Studio integration points

- `window.appDMS` — main app controller; `.tabs` (SASStudioTabs), `.projects`, `.dialogs`, `.sessionId`, `.baseURL`.
- `SAS.Editor` — the editor API surface the adapter must implement (defined in `SASStudio-3.82/resources/js/sas-commons/controls/CodeEditor.js`).
- `dijit.byId(...)` / `dijit.registry` — Dojo widget access (trees are `projects.tree`, `library.tree`, `destination.tree`).
- Beware: some SAS Studio methods are subtly broken by the app itself (e.g. `dijit.Tree._expandNode` is overridden to return undefined; `ss-fixes.js` re-binds the prototype original).

## Reference documentation (read before touching the adapter)

- `SAS_EDITOR_API.md` — full `SAS.Editor` API reference (60+ methods).
- `sas-editor.d.ts` — TypeScript definitions for that API.
- `EDITOR_USAGE_MAP.md` — which SAS Studio files call which editor methods (DMSEditor is the heaviest consumer); use this to check compatibility impact of adapter changes.
- `SASStudio-3.82/` — extracted SAS Studio source (its own git repo, gitignored from this one, with its own CLAUDE.md). Ground truth for how the app behaves; explore it rather than guessing.

## Development

No build, no Tampermonkey needed anymore. Smoke test: `node test/smoke.js` — launches headless Chromium with the unpacked extension against the live instance and exercises injection, middle-click close (raw CDP input — catches event-suppression bugs synthetic dispatch can't), reopen, and the context-menu toggle; see the file header for `SS_URL`/`CHROME_BIN` env vars and the playwright requirement. To test changes manually: `chrome://extensions/` → reload the unpacked extension → refresh the SAS Studio page → toggle (Alt+Period) or use the popup. All extension logs are prefixed `[SS Ext]`; expect one line per toggle (`activated`/`deactivated ... N tab(s) ...`) plus errors/warnings only.
