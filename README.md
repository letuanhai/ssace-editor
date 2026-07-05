# SS Ext

A browser extension that toggles SAS Studio 3.8's built-in editor for a modern Ace
editor at runtime (SAS syntax highlighting, configurable snippets), plus ~25
independent UX fixes for the rest of SAS Studio. No Tampermonkey install needed —
everything lives in the extension.

## Features

- Toggle on/off with one click (popup, or Alt+Period) — no page refresh needed either direction
- Toolbar badge shows `ON` while Ace is active for that tab
- SAS syntax highlighting (`ace/mode/sas`) and snippets, user-configurable from the options page
- Applies to every open tab and to new tabs opened while active
- Text, cursor position, and dirty (`*`) state are preserved across a toggle;
  undo history is not (see Known Limitations)
- ~25 UX fixes/quick actions (tab management, tree navigation, keyboard shortcuts,
  clipboard, context menus) — quick actions live in the command palette, on/off
  toggles and hotkey rebinding live in the options page
- Command palette (popup button, global hotkey **Alt+Shift+P** — rebindable in
  the options page like any other action — or an unassigned
  `chrome://extensions/shortcuts` command) works even with no Ace editor focused:
  it lists every `SS-Ext: ...` action plus, if an Ace editor (code or text
  viewer) was focused when it opened, that editor's own commands applied to it
- While Ace is active, "View file as text" opens in an editable Ace editor that
  mirrors the underlying (hidden) SimpleTextarea so SAS Studio's own load/refresh
  code keeps working. Editing marks the tab dirty (`*` in the title, like the code
  editor); save with the Save button next to Refresh, `Ctrl/Cmd+S`, or vim `:w` —
  Save POSTs to the workspace endpoint. Vim `:q`/`:wq`/`:x` close (and save) the tab

## Installation

1. Clone this repository
2. `chrome://extensions/` → enable **Developer mode** → **Load unpacked** → select this directory
3. (optional) Pin the extension from the puzzle-piece menu

## Usage

1. Open SAS Studio and let it fully load
2. Click the extension icon to open the popup, then "Toggle Ace editor" (or press
   **Alt+Period** directly) to toggle Ace on
3. Click again (or Alt+Period again) to toggle back to the original editor
4. Use the popup's "Command palette…" button (**Alt+Shift+P**, or bind the
   `command_palette` command at `chrome://extensions/shortcuts`) for quick actions (reload file,
   focus tree, close tab, ...) and, when an Ace editor is focused, that editor's
   own commands; use the options page (link in the popup, or right-click the
   icon → Options) to turn UX patches on/off, rebind hotkeys, or edit custom
   snippets

## How It Works

Clicking the toolbar button injects `editor-swap.js` into the page's MAIN world
(a no-op if it's already there) and calls `window.__ssExt.toggle(libPath)`:

- **First load** fetches the newer Ace library from `lib/ace/src-noconflict/`
  (`ace.js`, `ext-language_tools.js`, `ext-browse_ss.js`) and backs up a
  reference to the app's original bundled Ace so `window.ace` can be swapped
  back later. The new library's CSS stays attached permanently once loaded —
  SAS Studio renders its own editor DOM and never references any Ace CSS
  class, so neither build's stylesheet actually matters. This load can happen
  without activating anything (see Browsing, below).
- **Activating** swaps the `window.ace` global to the new library (it's still
  needed as the registry runtime `ace.require(...)` calls resolve tokenization
  against), installs one-time dispatcher patches on `SAS.Editor` and
  `DMSEditor.prototype.createCodeEditor` (so both existing and future tabs route
  to the right editor based on current state), then converts every open tab's
  editor to an `AceEditorAdapter`, re-binding `textChanged`/`selectionChanged`/
  `caretMoved`.
- **Deactivating** swaps `window.ace` back, captures each Ace tab's text,
  cursor, and dirty state, destroys the Ace instance, and recreates the original
  editor via the (now-dispatched) `createCodeEditor`, restoring what it captured.

## Browsing

`window.__ssExt.browse(kind, libPath, snippetsText)` (used for browse_ss prompts)
only loads the new Ace library if needed — it does not activate the editor
replacement, so browse prompts work even while the built-in editor is still in use.

## UX fixes and configuration

`ss-fixes.js` (injected automatically on every SAS Studio page load) provides
~25 independent fixes on top of the editor toggle: tab management, tree
navigation, keyboard shortcuts, clipboard, context menus. Quick actions
(reload file, close tab, focus tree, ...) are one click away in the popup, each
with its default hotkey shown alongside. Passive patches (confirm-on-drop,
middle-click-close, keep-alive, ...) and hotkey bindings are configured from
the options page (`chrome.runtime.openOptionsPage()`, linked from the popup) —
patch/hotkey changes apply on the next page reload.

## Snippets

The options page also hosts an Ace-editor-backed snippet editor
(`chrome.storage.local.snippets.sas`, native Ace snippet format). Saved
snippets are additive over ace's own built-in SAS snippets and live-apply to
every open SAS Studio tab immediately (no reload needed) via a
`chrome.storage.onChanged` listener in `sw.js`.

## Known Limitations

- Only tested with SAS Studio 3.82
- Undo/redo history does not survive a toggle in either direction
- `getHTML()` (used by print/summary views) returns plain escaped text rather
  than syntax-highlighted markup — Ace has no built-in HTML export loaded
- Some advanced context-menu customization is limited
- Duplicate snippet triggers (built-in vs. user-defined) both appear in the
  completion list rather than the user one taking priority

## Files

- `manifest.json`, `sw.js` — extension config + service worker (editor toggle,
  ss-fixes injection, live snippet apply)
- `editor-swap.js` — `AceEditorAdapter`, the `window.__ssExt` singleton, and the
  one-time SAS.Editor/DMSEditor patches
- `ss-fixes.js` — ~25 UX fixes, split into one-shot `ACTIONS` and passive `PATCHES`
- `tools-meta.js` — shared `SSF_TOOLS` metadata (labels/titles/hotkeys) for
  ss-fixes, the popup, and the options page
- `defaults.js` — shared `DEFAULT_SAS_SNIPPETS` default snippet text
- `popup.html`/`popup.js` — editor toggle, native-mouse toggle, command palette button
- `options.html`/`options.js` — patch toggles, hotkey rebinding, snippet editor
- `lib/ace/src-noconflict/` — the newer Ace library; `ext-browse_ss.js` is
  custom, everything else is stock Ace (don't hand-edit, including
  `snippets/sas.js` — custom snippets live in `defaults.js`/storage now).
  The command palette is built on the stock `ext-prompt.js` module, not a
  custom one.
- `SAS_EDITOR_API.md`, `sas-editor.d.ts`, `EDITOR_USAGE_MAP.md` — reference docs
  for the `SAS.Editor` API surface `AceEditorAdapter` implements

## Development

No build step, no Tampermonkey needed. To test changes: reload the unpacked
extension in `chrome://extensions/`, refresh the SAS Studio page, and toggle
(popup or Alt+Period). Logs are prefixed `[SS Ext]` — one line per toggle
(`activated`/`deactivated ... N tab(s) ...`), plus errors and warnings for
unexpected states.

## Credits

- **SAS Studio** — original application
- **Ace Editor** — the code editor library ([ace.c9.io](https://ace.c9.io))

---

**Note**: This is a reverse engineering project for educational and personal use. Use at your own risk.
