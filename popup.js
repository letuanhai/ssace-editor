/**
 * Popup: quick actions only. All configuration lives on the options page.
 *
 * Loaded after tools-meta.js (script tag in popup.html), so window.SSF_TOOLS
 * is already defined here.
 */
(function () {
  "use strict";

  const LIB_PATH = "/lib/ace/src-noconflict";

  function hotkeyHint(hotkey) {
    if (!hotkey || !hotkey.key) return "";
    let name = hotkey.key;
    name = (hotkey.altKey ? "Alt+" : "") + name;
    name = (hotkey.metaKey ? "Meta+" : "") + name;
    name = (hotkey.ctrlKey ? "Ctrl+" : "") + name;
    return name;
  }

  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  // Same semantics as sw.js: unset -> defaults, saved value wins even when empty.
  async function getSnippetsText() {
    const { snippets } = await chrome.storage.local.get("snippets");
    return snippets && typeof snippets.sas === "string" ? snippets.sas : window.DEFAULT_SAS_SNIPPETS || "";
  }

  async function getHotkeySettings() {
    const { hotkeys } = await chrome.storage.local.get("hotkeys");
    return hotkeys || {};
  }

  async function injectAndRun(tabId, files, func, args) {
    if (files && files.length) {
      await chrome.scripting.executeScript({ target: { tabId }, files, world: "MAIN" });
    }
    const [{ result }] = await chrome.scripting.executeScript({ target: { tabId }, func, args, world: "MAIN" });
    return result;
  }

  function setToggleState(active) {
    const el = document.getElementById("toggle-state");
    el.textContent = active ? "ON" : "OFF";
    el.classList.toggle("on", Boolean(active));
  }

  function setCtxMenuState(nativeOn) {
    const el = document.getElementById("ctxmenu-state");
    el.textContent = nativeOn ? "ON" : "OFF";
    el.classList.toggle("on", Boolean(nativeOn));
  }

  async function handleCtxMenuClick() {
    const tab = await getActiveTab();
    if (!tab || tab.id === undefined) return;
    try {
      const nativeOn = await injectAndRun(
        tab.id,
        ["tools-meta.js", "ss-fixes.js"],
        () => {
          window.__ssf.run("toggleNativeMouse");
          return Boolean(window.__ssfNativeMouse);
        },
        [],
      );
      setCtxMenuState(nativeOn);
    } catch (e) {
      console.error("[SS Ext] popup context-menu toggle failed:", e);
    }
  }

  async function handleToggleClick() {
    const tab = await getActiveTab();
    if (!tab || tab.id === undefined) return;
    try {
      const libPath = chrome.runtime.getURL(LIB_PATH);
      const snippetsText = await getSnippetsText();
      const result = await injectAndRun(
        tab.id,
        ["editor-swap.js"],
        (path, snippets) => window.__ssExt.toggle(path, snippets),
        [libPath, snippetsText],
      );
      setToggleState(result && result.active);
      await chrome.action.setBadgeText({ tabId: tab.id, text: result && result.active ? "ON" : "" });
    } catch (e) {
      console.error("[SS Ext] popup toggle failed:", e);
    }
  }

  async function handleActionClick(name) {
    const tab = await getActiveTab();
    if (!tab || tab.id === undefined) return;
    try {
      // Files-inject tools-meta+ss-fixes first - idempotent, so this works even
      // on a tab where sw's tabs.onUpdated injection hasn't fired yet.
      await injectAndRun(tab.id, ["tools-meta.js", "ss-fixes.js"], (n) => window.__ssf && window.__ssf.run(n), [name]);
    } catch (e) {
      console.error(`[SS Ext] popup action "${name}" failed:`, e);
    }
  }

  function renderActions(hotkeySettings) {
    const container = document.getElementById("actions");
    (window.SSF_TOOLS || [])
      .filter((t) => t.kind === "action")
      .forEach((tool) => {
        const hotkey = Object.prototype.hasOwnProperty.call(hotkeySettings, tool.name) ? hotkeySettings[tool.name] : tool.hotkey;
        const btn = document.createElement("button");
        btn.className = "action-btn";
        btn.title = tool.title || tool.label;

        const label = document.createElement("span");
        label.textContent = tool.label;
        btn.appendChild(label);

        const hint = hotkeyHint(hotkey);
        if (hint) {
          const hintEl = document.createElement("span");
          hintEl.className = "hotkey-hint";
          hintEl.textContent = hint;
          btn.appendChild(hintEl);
        }

        btn.addEventListener("click", () => handleActionClick(tool.name));
        container.appendChild(btn);
      });
  }

  document.getElementById("toggle-btn").addEventListener("click", handleToggleClick);
  document.getElementById("ctxmenu-btn").addEventListener("click", handleCtxMenuClick);
  document.getElementById("options-link").addEventListener("click", () => chrome.runtime.openOptionsPage());

  getHotkeySettings().then(renderActions);

  // Show the actual toggle state on open (opening the popup grants activeTab).
  (async () => {
    try {
      const tab = await getActiveTab();
      if (!tab || tab.id === undefined) return;
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => ({
          ace: Boolean(window.__ssExt && window.__ssExt.active),
          nativeCtxMenu: Boolean(window.__ssfNativeMouse),
        }),
        world: "MAIN",
      });
      setToggleState(result && result.ace);
      setCtxMenuState(result && result.nativeCtxMenu);
    } catch {
      // not a SAS Studio tab / nothing injected yet
      setToggleState(false);
      setCtxMenuState(false);
    }
  })();
})();
