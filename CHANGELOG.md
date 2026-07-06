# Changelog

## 0.3

- New file action (Alt+N / command palette): create a new SAS program, same as F4.
- Save file at path action (Alt+Shift+S / command palette): drives SAS Studio's own
  Save As dialog from a typed absolute path (destination tree + filename), then
  confirms it, so tab rename/dirty-clearing/uri update all go through SAS Studio's
  own code.
- Editor: pick the Ace syntax mode from the file's extension instead of always
  defaulting to SAS.

## 0.2

- In-page hotkeys for editor/native-mouse toggles, badge bridge, browser-command cleanup.
- Re-vendored pristine ace 1.43.3; fork changes reproduced at runtime (`src/ace-patches.js`).
- browse_ss in-page hotkeys + SS-Ext palette entries for files/library/tabs.
- Hotkeys capture, display, and match the Shift modifier.
- browse_ss: Ctrl+Enter opens file as text.
- Popup: show the SAS Studio auth cookies (path `/SASStudio`, httpOnly) with a copy button.

## 0.1

Initial release, growing a Tampermonkey userscript (floating Ace container) into
a full Manifest V3 extension that monkey-patches SAS Studio in the page's MAIN world.

- **Editor swap**: replace SAS Studio's built-in editor with Ace at runtime, toggled
  repeatably with no page refresh (`AceEditorAdapter` reimplementing the `SAS.Editor`
  API). Originally a draggable/resizable floating container synced to the host page;
  later reworked to swap the editor in place (`SAS.Editor`/`DMSEditor.createCodeEditor`
  dispatcher patch) instead.
- **SAS language support**: custom Ace mode (`mode-sas.js`) and snippets
  (`snippets-sas.js`), dark/light theme following system preference, persisted editor
  config (theme pair, Ace options, vimrc) applied live and on load.
- **Command palette & browse_ss**: `ext-browse_ss.js` extension for browsing/opening
  files, library items, and open tabs from a prompt UI (icons, children counts, start
  path from current tab, filterable history); later rebuilt on Ace's stock
  `ext/prompt` module with a global hotkey and per-editor command list.
- **Text viewer**: read-only Ace overlay over "View file as text", made editable with
  dirty-tab marking, save (toolbar button, Ctrl/Cmd+S, vim `:w`/`:wq`/`:x`).
- **~25 SAS Studio UX fixes** absorbed from the standalone userscript into the
  extension (nothing to install separately anymore): tab management, tree navigation,
  keyboard shortcuts, clipboard, context menus, middle-click/auxclick tab close,
  native-mouse-handling toggle, keep-alive, etc.
- **Configuration UI**: popup (editor toggle, native-mouse toggle, command palette
  button) and options page (per-patch checkboxes, rebindable hotkey table, editor
  theme/vimrc settings, custom snippet editor).
- Repo reorganized around a stable extension layout: source under `src/`, vendored
  Ace kept byte-identical to upstream under `lib/`, `package.sh` to build the
  publishable zip.
