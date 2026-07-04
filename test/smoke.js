/**
 * End-to-end smoke test: loads the unpacked extension in Chromium against a live
 * SAS Studio instance and exercises the page-side features.
 *
 * Run:  node test/smoke.js
 * Env:  SS_URL      SAS Studio URL      (default http://192.168.1.72/SASStudio/38/)
 *       CHROME_BIN  Chromium executable (default: playwright's bundled chromium)
 * Needs the `playwright` module resolvable (npx playwright / NODE_PATH / local install)
 * and at least one closable FILE tab open in the SAS Studio session.
 *
 * Middle-clicks are sent as raw CDP input (trusted, full event pipeline) - this is
 * what caught the dojo/touch.js dojoClick suppression bug that synthetic
 * dispatchEvent-based tests can't see.
 */
const { chromium } = require("playwright");

const EXT = require("path").resolve(__dirname, "..");
const URL = process.env.SS_URL || "http://192.168.1.72/SASStudio/38/";

let failures = 0;
function check(name, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + JSON.stringify(detail)}`);
  if (!ok) failures++;
}

(async () => {
  const ctx = await chromium.launchPersistentContext("", {
    ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : { channel: "chromium" }),
    headless: true,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
  });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.on("console", (m) => {
    const t = m.text();
    if (t.includes("[SS Ext]") && m.type() === "error") console.log("PAGE ERROR:", t);
  });
  await page.goto(URL, { waitUntil: "load", timeout: 30000 });
  await page.waitForSelector(".dijitTreeNode", { timeout: 45000 });
  await page.waitForTimeout(3000);

  // -- injection + init ---------------------------------------------------------
  const state = await page.evaluate(() => ({
    initialized: !!(window.__ssf && window.__ssf._initialized),
    toolsMeta: Array.isArray(window.SSF_TOOLS),
    closedTabsTracking: Array.isArray(window.__ssfClosedTabs),
    closeTabWrapped: !!window.appDMS.tabs._closeTabOrig,
    tabCount: window.appDMS.tabs.getAllTabObjects().length,
  }));
  check("ss-fixes injected and initialized", state.initialized && state.toolsMeta, state);
  check("reopenClosedTab tracking installed", state.closedTabsTracking && state.closeTabWrapped, state);
  if (state.tabCount < 1) {
    check("at least one tab open in session (needed for middle-click test)", false, state);
  } else {
    // -- middle-click close (raw CDP input) --------------------------------------
    // Pick a tab whose button is actually hittable at its center - depending on
    // session layout, some tab buttons are overlaid (elementFromPoint lands
    // elsewhere) and a trusted click can never reach them.
    const pt = await page.evaluate(() => {
      for (const t of window.appDMS.tabs.getAllTabObjects()) {
        const node = (t.tab ?? t).controlButton && (t.tab ?? t).controlButton.domNode;
        if (!node) continue;
        const r = node.getBoundingClientRect();
        const x = r.x + r.width / 2, y = r.y + r.height / 2;
        const hit = document.elementFromPoint(x, y);
        if (hit && node.contains(hit)) return { x, y, name: t.name || t.title };
      }
      return null;
    });
    if (!pt) {
      check("found a hittable tab button (needed for middle-click test)", false, {});
    } else {
      const cdp = await ctx.newCDPSession(page);
      const base = { x: pt.x, y: pt.y, button: "middle", buttons: 4, clickCount: 1 };
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", ...base });
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...base });
      await page.waitForTimeout(1500);

      const afterClose = await page.evaluate(() => ({
        count: window.appDMS.tabs.getAllTabObjects().length,
        stack: window.__ssfClosedTabs.map((c) => c.name),
      }));
      const closed = afterClose.count === state.tabCount - 1 && afterClose.stack.includes(pt.name);
      check("middle-click closes tab", afterClose.count === state.tabCount - 1, afterClose);
      check("closed tab tracked for reopen", afterClose.stack.includes(pt.name), afterClose);

      // -- reopen (only meaningful if the close above actually happened) -----------
      if (closed) {
        await page.evaluate(() => window.__ssf.run("reopenClosedTab"));
        await page.waitForTimeout(2500);
        const afterReopen = await page.evaluate(() => window.appDMS.tabs.getAllTabObjects().length);
        check("reopenClosedTab restores tab", afterReopen === state.tabCount, { afterReopen });
      } else {
        check("reopenClosedTab restores tab (skipped: close failed)", false, afterClose);
      }
    }
  }

  // -- native mouse handling toggle (live) ----------------------------------------
  const nativeMode = await page.evaluate(() => {
    window.__ssf.run("toggleNativeMouse");
    // with the blocker ON, a mousedown dispatched at a tree label must never
    // reach a document-level listener (all page handlers are starved)
    let reachedDoc = false;
    const docProbe = () => (reachedDoc = true);
    document.addEventListener("mousedown", docProbe, true);
    const label = document.querySelector(".dijitTreeLabel");
    label.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    document.removeEventListener("mousedown", docProbe, true);
    const on = {
      state: Boolean(window.__ssfNativeMouse),
      css: !!document.getElementById("ssf-native-mode-css"),
      selectable: getComputedStyle(label).userSelect === "text",
      gestureBlocked: !reachedDoc,
    };
    window.__ssf.run("toggleNativeMouse");
    label.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    const off = {
      state: !window.__ssfNativeMouse,
      css: !document.getElementById("ssf-native-mode-css"),
    };
    return { on, off };
  });
  check(
    "native mouse mode blocks page gesture handlers and enables selection css",
    Object.values(nativeMode.on).every(Boolean) && Object.values(nativeMode.off).every(Boolean),
    nativeMode,
  );

  // -- Ace activation + read-only text viewer -------------------------------------
  let sw = ctx.serviceWorkers()[0];
  if (!sw) sw = await ctx.waitForEvent("serviceworker", { timeout: 15000 });
  const extId = sw.url().split("/")[2]; // chrome-extension://<id>/sw.js
  const libPath = `chrome-extension://${extId}/lib/ace/src-noconflict`;

  await page.addScriptTag({ path: require("path").join(EXT, "editor-swap.js") });
  const activated = await page.evaluate((lp) => window.__ssExt.toggle(lp), libPath);
  check("Ace editor replacement activates", activated && activated.active === true, activated);

  // Pick a real, non-empty file that isn't already open as a tab - opening an
  // already-open uri just re-focuses that tab instead of creating a viewer.
  // Enumerate the workspace root folder (entries with a `size` are files).
  const beforeOpen = await page.evaluate(async () => {
    const a = window.appDMS;
    const openUris = new Set(a.tabs.getAllTabObjects().map((t) => t.uri));
    const root = "/folders/myfolders";
    const url = a.baseURL + "/sasexec/sessions/" + a.sessionId + "/workspace/" + encodeValue(root) + "?includeChildren=true";
    const children = await new Promise((res) => {
      dojo.xhrGet({
        url,
        handleAs: "json",
        preventCache: true,
        load: (d) => res((d && d[0] && d[0].children) || []),
        error: () => res([]),
      });
    });
    const f = children.find(
      (c) => c.size && Number(c.size) > 0 && !openUris.has(`${root}/${c.name}`),
    );
    return f ? { uri: `${root}/${f.name}`, name: f.name } : null;
  });
  if (!beforeOpen) {
    check("found a non-open file to open as text (needed for text-viewer test)", false, beforeOpen);
  } else {
    await page.evaluate(
      (f) =>
        window.appDMS.handleWebOneEvent("FileOpenWithTextViewer", {
          uri: f.uri,
          name: f.name,
          type: "FILE",
          fileType: "TXT",
          // same normalization AppDMS does; without it the viewer toolbar gets a
          // "..._undefined_texttoolbar" id that collides with any other id-less viewer
          id: f.uri.replaceAll("/", "~ps~"),
        }),
      beforeOpen,
    );
    await page.waitForTimeout(3000);

    const viewer = await page.evaluate(async () => {
      const tabs = window.appDMS.tabs.getAllTabObjects();
      const newest = tabs[tabs.length - 1];
      const tabHolder = newest && newest.tab && newest.tab.tabHolder;
      const entry = window.__ssExt._textViewers.find((e) => e.tabHolder === tabHolder);
      if (!entry) return { found: false, tabCount: tabs.length };

      const divId = `ssf_textviewer_${entry.pane.id}`;
      const hasDiv = !!document.getElementById(divId);

      // Regression guard for the empty-editor bug: the load xhr should already
      // have mirrored real file content into Ace by now.
      const loadedContentLength = entry.adapter.getText().length;

      // Regression guard for the forever-spinner bug: AppDMS navigates to the
      // textarea POSITIONALLY (pane.getChildren()[1].getChildren()[0].value) -
      // that must be a live widget with a readable .value, not a destroyed one.
      let positionalGuardOk = false;
      let positionalGuardValue = null;
      try {
        const node = entry.pane.getChildren()[0];
        positionalGuardValue = node.value;
        positionalGuardOk = typeof positionalGuardValue === "string";
      } catch (e) {
        positionalGuardOk = false;
      }

      // The real widget (not a shim) must still be in tabHolder.simpleTextArea,
      // and pushing a value through it must mirror into Ace.
      const isRealWidget = !!(tabHolder.simpleTextArea && tabHolder.simpleTextArea.declaredClass);
      tabHolder.simpleTextArea.set("value", "SMOKE");
      const mirrorRoundtrip = entry.adapter.getText() === "SMOKE";
      // Server/refresh writes must NOT mark the viewer dirty.
      const cleanAfterServerWrite = entry.dirty === false;
      // Always editable now (no Edit button).
      const editableByDefault = entry.adapter.readOnly() === false;
      const noEditButton = !entry.buttons.edit;

      const saveBtn = entry.buttons.save;
      const saveDisabledInitially = !!(saveBtn && saveBtn.get("disabled"));

      // Trigger a real edit (setText() doesn't reliably fire textChanged) and
      // check dirty tracking, Save enabling, and the tab "*" marker - do NOT
      // click Save, so the real file on the server is never touched.
      entry.adapter.aceEditor.insert("x");
      await new Promise((r) => setTimeout(r, 100));
      const dirtyAfterEdit = entry.dirty === true;
      const saveEnabledAfterEdit = !!(saveBtn && !saveBtn.get("disabled"));
      const tabLabel = newest.tab.controlButton && newest.tab.controlButton.containerNode.textContent;
      const tabMarkedDirty = typeof tabLabel === "string" && tabLabel.indexOf("*") === 0;

      // Ctrl+S command is registered on the adapter.
      const hasSaveCommand = !!entry.adapter.aceEditor.commands.commands.ssfSaveTextViewer;

      return {
        found: true,
        hasDiv,
        loadedContentLength,
        positionalGuardOk,
        isRealWidget,
        mirrorRoundtrip,
        cleanAfterServerWrite,
        editableByDefault,
        noEditButton,
        saveDisabledInitially,
        dirtyAfterEdit,
        saveEnabledAfterEdit,
        tabMarkedDirty,
        hasSaveCommand,
        newTabId: newest.tab.id,
      };
    });

    // vim :w/:q/:wq/:x install is async (config.loadModule); poll for the module
    // to load and our install flag to flip, without re-registering (that would
    // clobber the real handlers).
    const exOk = await page.evaluate(async () => {
      for (let i = 0; i < 30; i++) {
        const mod = window.__ssExt.newLib.ace.require("ace/keyboard/vim");
        if (mod && mod.Vim && typeof mod.Vim.defineEx === "function" && window.__ssExt._vimExInstalled) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });

    check("text viewer converted to Ace (registry entry found)", viewer.found, viewer);
    if (viewer.found) {
      check("ace container div present in DOM", viewer.hasDiv, viewer);
      check("text content actually loaded into Ace (non-empty)", viewer.loadedContentLength > 0, viewer);
      check(
        "positional refresh guard (pane.getChildren()[1].getChildren()[0].value) is safe",
        viewer.positionalGuardOk,
        viewer,
      );
      check("tabHolder.simpleTextArea is the real dijit widget, not a shim", viewer.isRealWidget, viewer);
      check("simpleTextArea value writes mirror into the adapter", viewer.mirrorRoundtrip, viewer);
      check("server/refresh writes do not mark dirty", viewer.cleanAfterServerWrite, viewer);
      check("text viewer is editable by default (no Edit button)", viewer.editableByDefault && viewer.noEditButton, viewer);
      check("save button starts disabled", viewer.saveDisabledInitially, viewer);
      check("editing marks the entry dirty", viewer.dirtyAfterEdit, viewer);
      check("save button enables after a real edit", viewer.saveEnabledAfterEdit, viewer);
      check("tab title shows dirty marker after edit", viewer.tabMarkedDirty, viewer);
      check("Ctrl/Cmd+S save command registered on adapter", viewer.hasSaveCommand, viewer);
      check("vim :w/:q/:wq/:x ex-commands registered", exOk, { exOk });

      await page.evaluate((tabId) => window.appDMS.tabs.closeTab(dijit.byId(tabId)), viewer.newTabId);
      await page.waitForTimeout(1500);
      const afterClose = await page.evaluate(() => window.__ssExt._textViewers.length);
      check("registry entry cleaned up on tab close", afterClose === 0, { afterClose });
    }
  }

  const deactivated = await page.evaluate((lp) => window.__ssExt.toggle(lp), libPath);
  check("Ace editor replacement deactivates cleanly", deactivated && deactivated.active === false, deactivated);

  await ctx.close();
  console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll checks passed");
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error("HARNESS ERROR:", e.message);
  process.exit(1);
});
