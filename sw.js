/**
 * Background service worker for the SAS Studio editor toggle.
 *
 * On toolbar click: inject editor-swap.js (idempotent - no-ops if already present),
 * then call window.__ssExt.toggle(libPath) in the page to flip Ace on/off. The
 * returned { active } state drives the per-tab badge.
 */

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["editor-swap.js"],
      world: "MAIN",
    });

    const libPath = chrome.runtime.getURL("/lib/ace/src-noconflict");

    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (path) => window.__ssExt.toggle(path),
      args: [libPath],
      world: "MAIN",
    });

    await chrome.action.setBadgeText({
      tabId: tab.id,
      text: result && result.active ? "ON" : "",
    });
  } catch (error) {
    console.error("[SS Ext] Error toggling editor:", error);

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (errorMsg) => {
          console.error("[SS Ext]", errorMsg);
          alert(`Failed to toggle editor:\n${errorMsg}\n\nCheck the browser console for details.`);
        },
        args: [error.message],
        world: "MAIN",
      });
    } catch (e) {
      console.error("[SS Ext] Could not show error to user:", e);
    }
  }
});
