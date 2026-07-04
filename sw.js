/**
 * Background service worker.
 *
 * Three independent jobs:
 *
 * 1. Editor toggle (Alt+Period / toggle_editor command, or the popup's toggle
 *    button): inject editor-swap.js (idempotent - no-ops if already present),
 *    then call window.__ssExt.toggle(libPath, snippetsText) in the page to flip
 *    Ace on/off. The returned { active } state drives the per-tab badge.
 *    browse_files/library/tabs commands do the same inject step, then call
 *    window.__ssExt.browse(kind, libPath, snippetsText) instead.
 *
 * 2. ss-fixes injection: on every SASStudio page load (tabs.onUpdated), inject
 *    tools-meta.js + ss-fixes.js into the MAIN world and call
 *    window.__ssf.init(settings) with the persisted patch/hotkey settings.
 *
 * 3. Live snippet apply: when chrome.storage.local's `snippets` changes, push
 *    the new text into every open SASStudio tab via window.__ssExt.applySnippets.
 */

importScripts("defaults.js");

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

// Unset storage -> defaults; a saved value wins even when empty (user cleared).
async function getSnippetsText() {
  const { snippets } = await chrome.storage.local.get("snippets");
  return snippets && typeof snippets.sas === "string" ? snippets.sas : DEFAULT_SAS_SNIPPETS;
}

const BROWSE_COMMANDS = {
  browse_files: "files",
  browse_library: "library",
  browse_tabs: "tabs",
};

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (!tab || tab.id === undefined) return;

  try {
    const libPath = chrome.runtime.getURL(LIB_PATH);
    const snippetsText = await getSnippetsText();

    let result;
    if (command === "toggle_editor") {
      result = await injectAndRun(tab.id, (path, snippets) => window.__ssExt.toggle(path, snippets), [libPath, snippetsText]);
    } else {
      const kind = BROWSE_COMMANDS[command];
      if (!kind) return;
      result = await injectAndRun(tab.id, (browseKind, path, snippets) => window.__ssExt.browse(browseKind, path, snippets), [
        kind,
        libPath,
        snippetsText,
      ]);
    }
    await setBadge(tab.id, result && result.active);
  } catch (error) {
    console.error("[SS Ext] Error handling command:", command, error);
    await showErrorAlert(tab.id, error.message);
  }
});

// -- ss-fixes injection on every SASStudio page load ---------------------------

const SASSTUDIO_URL_PATTERN = /\/SASStudio\//;

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tab.url || !SASSTUDIO_URL_PATTERN.test(tab.url)) return;

  try {
    const { fixes, hotkeys } = await chrome.storage.local.get(["fixes", "hotkeys"]);
    const settings = { fixes: fixes || {}, hotkeys: hotkeys || {} };

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["tools-meta.js", "ss-fixes.js"],
      world: "MAIN",
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (s) => window.__ssf.init(s),
      args: [settings],
      world: "MAIN",
    });
  } catch (error) {
    console.error("[SS Ext] Error injecting ss-fixes:", error);
  }
});

// -- Live snippet apply on storage change --------------------------------------

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== "local" || !changes.snippets) return;

  const newValue = changes.snippets.newValue;
  const text = newValue && typeof newValue.sas === "string" ? newValue.sas : DEFAULT_SAS_SNIPPETS;

  try {
    const tabs = await chrome.tabs.query({ url: "*://*/SASStudio/*" });
    await Promise.all(
      tabs.map((tab) =>
        chrome.scripting
          .executeScript({
            target: { tabId: tab.id },
            func: (snippetsText) => {
              window.__ssExt && window.__ssExt.applySnippets && window.__ssExt.applySnippets(snippetsText);
            },
            args: [text],
            world: "MAIN",
          })
          .catch(() => {}), // no-op if editor-swap.js isn't loaded in that tab
      ),
    );
  } catch (error) {
    console.error("[SS Ext] Error live-applying snippets:", error);
  }
});
