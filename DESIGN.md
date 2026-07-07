# Design plan

> **Status (2026-07): historical.** Phases 1–4 all shipped (Phase 4, LSP, was
> optional and is done too — see CLAUDE.md's `editor-swap.js` bullet and README.md's
> "SAS language server" section). Several features were added after this plan was
> written (command
> palette on stock ext-prompt with a global Alt+Shift+P hotkey, editable Ace text
> viewer for "View file as text", native mouse handling toggle, persistent Ace
> config with settings-menu persistence + vimrc via relay.js). Some names below
> differ from the implementation (`replace-editor.js` → `editor-swap.js`,
> `window.__ssExtActive` → `window.__ssExt.active`, popup action buttons → command
> palette entries). See README.md / AGENTS.md for the current architecture.

Goal: extension replaces SAS Studio's editor with modern Ace + SAS language support, with
a toggle back to the original editor; userscript fixes folded into the extension with a
feature-selection popup. LSP is a possible later addition, not a priority.

## Current state

Done already:
- One-shot editor replacement (`sw.js` 3-step injection, `AceEditorAdapter` in
  `replace-editor.js` implementing the full `SAS.Editor` API).
- SAS syntax highlighting (`mode-sas.js`) and snippets (`snippets/sas.js`) — the adapter
  already sets `ace/mode/sas`.
- Original Ace backed up to `window._origAceLib`, original `SAS.Editor` constructor saved.
- ~25 UX fixes in `ss-fixes.user.js` (Tampermonkey), each a function in `ALL_TOOLS`,
  exposed via the injected 🛠 dropdown menu + hotkeys.
- Standalone proof that the SAS LSP runs in a web worker via ace-linters
  (`SASStudio-3.82/sas-lsp-demo`) — parked, see Phase 4.

## Phase 1 — Toggle back to original editor (top priority)

All the state needed is already backed up.

- Toolbar click becomes a per-tab toggle instead of one-shot. Track activation state in
  the page (`window.__ssExtActive`), not in the sw.
- Restore path (new `restore-editor.js`, mirror of `replace-editor.js`):
  1. Put back `window.ace` / `require` / `define` and the two style elements from
     `window._origAceLib`.
  2. Restore the original `SAS.Editor` constructor and un-patch
     `DMSEditor.prototype.createCodeEditor` (originals are already saved).
  3. For each open tab with an `AceEditorAdapter`: capture text + cursor, destroy the Ace
     instance, recreate via the original `createCodeEditor`, restore text + cursor, re-mark
     dirty state, re-bind handlers.
- Undo history is not carried across a toggle in either direction — acceptable ceiling;
  document it.
- Switching back to Ace after a restore = re-run existing replace path (loosen the
  "once per page load" guard: skip lib re-injection if already loaded, only re-swap
  instances).

## Phase 2 — Review + clean up design/implementation

With toggle working, both directions of the swap exercise every seam — the right moment
to review before building on top:

- Review `AceEditorAdapter` against `SAS_EDITOR_API.md` / `EDITOR_USAGE_MAP.md`: stub
  methods that matter vs dead ones, event re-binding correctness, destroy/teardown path
  (Phase 1 makes teardown load-bearing).
- Deduplicate replace/restore logic; strip the verbose step-by-step console logging down
  to errors + one line per state change.
- Sync the README with reality (it undersells what exists: SAS mode, snippets, toggle).

## Phase 3 — Integrate userscript fixes into the extension

Goal: retire the Tampermonkey install entirely. `ss-fixes.user.js` becomes an extension
file (`ss-fixes.js`, userscript header dropped, no dual-use), and the injected 🛠
dropdown disappears in favor of the extension popup.

**Split `ALL_TOOLS` into its two real categories:**

- **Actions** — one-shot commands the user triggers (reload file, reopen closed tab,
  focus tree, copy URI, …). Today: buttons in the injected dropdown + hotkeys.
- **Passive patches** — monkey-patches applied once at load (confirm-on-drop,
  middle-click close, keep-alive, context-menu items, maximize-editor, …). Today:
  always on.

Refactor the file into two registries, each entry carrying its metadata
(`{ name, label, title, hotkey?, fn }`). A small shared `tools-meta.js` (or a
`getToolsMeta()` call into the page) gives the popup the same list — no duplicated
labels.

**Injection (replaces Tampermonkey):** reuse the existing sw instead of adding content
scripts. On `tabs.onUpdated` matching the SASStudio URL patterns, the sw reads settings
from `chrome.storage.local` and injects `ss-fixes.js` into the MAIN world, then calls its
`init(settings)` via `executeScript` `args`. This avoids the ISOLATED-bridge/postMessage
dance entirely — settings travel as plain arguments. Requires adding `host_permissions`
for the SASStudio URL patterns (e.g. `*://*/SASStudio/*`) to the manifest; the script
keeps its existing `.dijitTreeNode` wait as the readiness gate.

**Popup (`action.default_popup`) — quick actions only:**

- One button per action, labels + hotkey hints from the shared metadata.
  Click → `chrome.scripting.executeScript({ world: 'MAIN', func: n => window.__ssf.run(n),
  args: [name] })` — opening the popup grants `activeTab`, so no extra permission.
  Popup closing on click is fine for one-shot commands.
- The editor replace/restore toggle (Phase 1) lives here too as a button + state
  indicator, plus a link to the options page. Nothing else — all configuration moves
  to the options page.

**Options page (`options.html`) — all configuration:**

- *Passive patches*: a checkbox per patch, persisted to `chrome.storage.local`
  (default: all on). Applied by `init(settings)` at page load — **no live-unpatching**;
  changes take effect on next page reload. Page says so in one line.
- *Hotkeys*: stay as in-page capture-phase listeners (not `chrome.commands` — its key
  set can't express Alt+{ / Alt+[ / Alt+| and it can't preempt page handlers), but
  become reconfigurable: a hotkey table with a per-action "record next keypress"
  control; overrides stored in `chrome.storage.local`, merged over the defaults from
  the tool metadata, delivered through the same `init(settings)`; applies on next
  reload. Only `_execute_action` (Alt+Period) and the three browse_ss commands remain
  browser-level `chrome.commands`.
- A later "auto-activate Ace on page load" checkbox slots in here naturally.

**Configurable Ace snippets (options page):**

- Storage gains `snippets: { sas: "<ace snippet file text>" }` — native Ace snippet
  format (`snippet trigger` / tab-indented body), no invented schema.
- The options page hosts the snippet editor: an Ace editor loaded from `lib/` with
  `ace/mode/snippets` highlighting and a Save-to-storage button.
- Apply path: `editor-swap.js` `loadNewAce()` gains `applySnippets(text)` — after
  ext-language_tools loads, `snippetManager.parseSnippetFile(text)` +
  `register(parsed, 'sas')`. Additive over the built-in set; ponytail ceiling:
  duplicate triggers appear twice, dedupe-by-trigger is the upgrade path.
- Live-apply on storage change (unregister old, register new) — snippets are the one
  setting where this is nearly free and iteration speed matters; everything else stays
  apply-on-reload.
- Migration: the hand-edited custom snippets in `lib/ace/src-noconflict/snippets/sas.js`
  move into the options page's default snippet text; the vendored file returns to stock
  so ace upgrades stay drop-in.

Per-feature behavior is untouched; this phase relocates the menu and adds the on/off
switches and snippet config, nothing more.

## Phase 4 — SAS language server integration (optional, last) — done

Only if still wanted after Phases 1–3. Port the sas-lsp-demo wiring:

- Ship `lib/sas-lsp/sas-server.js` (built by `./build_lib.sh`, ~22 MB, stays generated/gitignored)
  and the ace-linters client as web-accessible resources.
- Spike first: a page can't construct a `Worker` from a `chrome-extension://` URL —
  verify the blob-URL workaround against the live instance's CSP
  (http://192.168.1.72/SASStudio/38/) before committing to the phase.
- One shared worker/LanguageProvider per page; register editors in `AceEditorAdapter`,
  tear down in its destroy path so the Phase 1 toggle keeps working.
- Additive only: if the worker fails, the editor works as before (mode + snippets +
  keyword completion).

## Order & rationale

1 → 2 → 3 → 4. Toggle is the stated requirement and smallest diff; cleanup happens while
the swap seams are fresh and before the userscript merge builds on them; LSP sits behind
a CSP/worker spike and stays optional.

Non-goals: settings page beyond the popup, support for SAS Studio versions other than
3.8x, Firefox.
