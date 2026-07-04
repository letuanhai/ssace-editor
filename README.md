# SS Ext

A browser extension that toggles SAS Studio 3.8's built-in editor for a modern Ace
editor at runtime, with SAS syntax highlighting and snippets.

## Features

- Toggle on/off with one click (or Alt+Period) — no page refresh needed either direction
- Toolbar badge shows `ON` while Ace is active for that tab
- SAS syntax highlighting (`ace/mode/sas`) and snippets
- Applies to every open tab and to new tabs opened while active
- Text, cursor position, and dirty (`*`) state are preserved across a toggle;
  undo history is not (see Known Limitations)

## Installation

1. Clone this repository
2. `chrome://extensions/` → enable **Developer mode** → **Load unpacked** → select this directory
3. (optional) Pin the extension from the puzzle-piece menu

## Usage

1. Open SAS Studio and let it fully load
2. Click the extension icon, or press **Alt+Period**, to toggle Ace on
3. Click again (or Alt+Period again) to toggle back to the original editor

## How It Works

Clicking the toolbar button injects `editor-swap.js` into the page's MAIN world
(a no-op if it's already there) and calls `window.__ssExt.toggle(libPath)`:

- **First activation** loads the newer Ace library from `lib/ace/src-noconflict/`
  (`ace.js`, `ext-language_tools.js`, `ext-browse_ss.js`), backing up the app's
  original bundled Ace (and its `ace_editor.css`/`ace-tm` style elements) by
  reference so it can be swapped back in later.
- **Activating** swaps `window.ace` and those style elements to the new library,
  installs one-time dispatcher patches on `SAS.Editor` and
  `DMSEditor.prototype.createCodeEditor` (so both existing and future tabs route
  to the right editor based on current state), then converts every open tab's
  editor to an `AceEditorAdapter`, re-binding `textChanged`/`selectionChanged`/
  `caretMoved`.
- **Deactivating** swaps `window.ace`/styles back, captures each Ace tab's text,
  cursor, and dirty state, destroys the Ace instance, and recreates the original
  editor via the (now-dispatched) `createCodeEditor`, restoring what it captured.

## Known Limitations

- Only tested with SAS Studio 3.82
- Undo/redo history does not survive a toggle in either direction
- `getHTML()` (used by print/summary views) returns plain escaped text rather
  than syntax-highlighted markup — Ace has no built-in HTML export loaded
- Some advanced context-menu customization is limited

## Files

- `manifest.json`, `sw.js` — extension config + service worker (toggle + badge)
- `editor-swap.js` — `AceEditorAdapter`, the `window.__ssExt` singleton, and the
  one-time SAS.Editor/DMSEditor patches
- `lib/ace/src-noconflict/` — the newer Ace library; `ext-browse_ss.js` is custom,
  everything else is stock Ace (don't hand-edit)
- `ss-fixes.user.js` — separate Tampermonkey userscript with ~25 unrelated UX fixes
- `SAS_EDITOR_API.md`, `sas-editor.d.ts`, `EDITOR_USAGE_MAP.md` — reference docs
  for the `SAS.Editor` API surface `AceEditorAdapter` implements

## Development

No build step. To test changes: reload the unpacked extension in
`chrome://extensions/`, refresh the SAS Studio page, and toggle. Logs are
prefixed `[SS Ext]` — one line per toggle (`activated`/`deactivated ... N
tab(s) ...`), plus errors and warnings for unexpected states.

## Credits

- **SAS Studio** — original application
- **Ace Editor** — the code editor library ([ace.c9.io](https://ace.c9.io))

---

**Note**: This is a reverse engineering project for educational and personal use. Use at your own risk.
