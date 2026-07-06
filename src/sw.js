/**
 * Background service worker.
 *
 * Four independent jobs:
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
 *    The same handler pre-injects editor-swap.js and seeds
 *    libPath/userSnippets/aceConfig so the global command-palette hotkey works
 *    without a prior toggle.
 *
 * 3. Live snippet apply: when chrome.storage.local's `snippets` changes, push
 *    the new text into every open SASStudio tab via window.__ssExt.applySnippets.
 *
 * 4. Live ace config apply: when chrome.storage.local's `aceConfig` changes
 *    (from the in-page settings panel via relay.js, or from options.html),
 *    push the merged config into every open SASStudio tab via
 *    window.__ssExt.applyAceConfig.
 */

importScripts("defaults.js");

const LIB_PATH = "/lib/ace/src-noconflict";

async function injectAndRun(tabId, func, args) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["src/ace-patches.js", "src/editor-swap.js"],
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

// Stored value wins per-key over DEFAULT_ACE_CONFIG (shallow merge of the top
// level and of `options`). Shared by the onUpdated seed and the live-apply
// storage listener below.
function mergeAceConfig(stored) {
  stored = stored || {};
  return {
    darkTheme: stored.darkTheme || DEFAULT_ACE_CONFIG.darkTheme,
    lightTheme: stored.lightTheme || DEFAULT_ACE_CONFIG.lightTheme,
    options: Object.assign({}, DEFAULT_ACE_CONFIG.options, stored.options || {}),
    // Unset -> default; a saved value wins even when empty (user cleared it).
    vimrc: typeof stored.vimrc === "string" ? stored.vimrc : DEFAULT_ACE_CONFIG.vimrc,
  };
}

async function getAceConfig() {
  const { aceConfig } = await chrome.storage.local.get("aceConfig");
  return mergeAceConfig(aceConfig);
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

    if (command === "command_palette") {
      await injectAndRun(tab.id, (path) => window.__ssExt.commandPalette(path), [libPath]);
      return;
    }

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
      files: ["src/tools-meta.js", "src/ss-fixes.js"],
      world: "MAIN",
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (s) => window.__ssf.init(s),
      args: [settings],
      world: "MAIN",
    });

    // Pre-inject editor-swap.js (idempotent) with libPath/snippets/aceConfig known,
    // so the global command-palette hotkey (ss-fixes.js's commandPalette action)
    // can call window.__ssExt.commandPalette() with no args and it'll have what
    // it needs to load the Ace lib on demand.
    const libPath = chrome.runtime.getURL(LIB_PATH);
    const snippetsText = await getSnippetsText();
    const aceConfig = await getAceConfig();
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/ace-patches.js", "src/editor-swap.js"],
      world: "MAIN",
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (path, snippets, config) => {
        // Unconditional: libPath is always this same constant, and userSnippets/
        // aceConfig just mirror current storage - re-setting any of them to the
        // same value on repeat onUpdated firings is harmless (ace/toggle() aren't
        // touched here).
        window.__ssExt.libPath = path;
        window.__ssExt.userSnippets = snippets;
        window.__ssExt.aceConfig = config;
      },
      args: [libPath, snippetsText, aceConfig],
      world: "MAIN",
    });
  } catch (error) {
    console.error("[SS Ext] Error injecting ss-fixes:", error);
  }
});

// -- Live snippet apply on storage change --------------------------------------

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== "local") return;

  if (changes.snippets) {
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
  }

  if (changes.aceConfig) {
    const config = mergeAceConfig(changes.aceConfig.newValue);

    try {
      const tabs = await chrome.tabs.query({ url: "*://*/SASStudio/*" });
      await Promise.all(
        tabs.map((tab) =>
          chrome.scripting
            .executeScript({
              target: { tabId: tab.id },
              func: (cfg) => {
                window.__ssExt && window.__ssExt.applyAceConfig && window.__ssExt.applyAceConfig(cfg);
              },
              args: [config],
              world: "MAIN",
            })
            .catch(() => {}), // no-op if editor-swap.js isn't loaded in that tab
        ),
      );
    } catch (error) {
      console.error("[SS Ext] Error live-applying ace config:", error);
    }
  }
});
