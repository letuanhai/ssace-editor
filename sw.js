/**
 * Background service worker for the SAS Studio editor toggle.
 *
 * On toolbar click: inject editor-swap.js (idempotent - no-ops if already present),
 * then call window.__ssExt.toggle(libPath) in the page to flip Ace on/off. The
 * returned { active } state drives the per-tab badge.
 *
 * chrome.commands (Alt+P/O/T) do the same inject step, then call
 * window.__ssExt.browse(kind, libPath) instead, which may trigger a first-time
 * activation (see editor-swap.js's doBrowse()).
 */

const LIB_PATH = "/lib/ace/src-noconflict";

async function injectAndRun(tabId, func, args) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["editor-swap.js"],
    world: "MAIN",
  });

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func,
    args,
    world: "MAIN",
  });
  return result;
}

async function setBadge(tabId, active) {
  await chrome.action.setBadgeText({ tabId, text: active ? "ON" : "" });
}

async function showErrorAlert(tabId, message) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (errorMsg) => {
        console.error("[SS Ext]", errorMsg);
        alert(`SS Ext error:\n${errorMsg}\n\nCheck the browser console for details.`);
      },
      args: [message],
      world: "MAIN",
    });
  } catch (e) {
    console.error("[SS Ext] Could not show error to user:", e);
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  try {
    const libPath = chrome.runtime.getURL(LIB_PATH);
    const result = await injectAndRun(
      tab.id,
      (path) => window.__ssExt.toggle(path),
      [libPath],
    );
    await setBadge(tab.id, result && result.active);
  } catch (error) {
    console.error("[SS Ext] Error toggling editor:", error);
    await showErrorAlert(tab.id, error.message);
  }
});

const BROWSE_COMMANDS = {
  browse_files: "files",
  browse_library: "library",
  browse_tabs: "tabs",
};

chrome.commands.onCommand.addListener(async (command, tab) => {
  const kind = BROWSE_COMMANDS[command];
  if (!kind || !tab || tab.id === undefined) return;

  try {
    const libPath = chrome.runtime.getURL(LIB_PATH);
    const result = await injectAndRun(
      tab.id,
      (browseKind, path) => window.__ssExt.browse(browseKind, path),
      [kind, libPath],
    );
    await setBadge(tab.id, result && result.active);
  } catch (error) {
    console.error("[SS Ext] Error browsing:", error);
    await showErrorAlert(tab.id, error.message);
  }
});
