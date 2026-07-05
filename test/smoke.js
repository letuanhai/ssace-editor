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

  await page.addScriptTag({ path: require("path").join(EXT, "src", "editor-swap.js") });
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

      // focus-code-editor + reload-file actions on the focused text-viewer tab.
      const focusResult = await page.evaluate(async () => {
        const tabs = window.appDMS.tabs.getAllTabObjects();
        const newest = tabs[tabs.length - 1];
        window.appDMS.tabs.selectTab(newest);
        const entry = window.__ssExt._textViewers.find((e) => e.tabHolder === newest.tab.tabHolder);
        window.__ssf.run("focusCodeEditor");
        await new Promise((r) => setTimeout(r, 200));
        return { focused: entry.adapter.aceEditor.isFocused(), dirtyBeforeReload: entry.dirty };
      });
      check("focus-code-editor focuses the text viewer's Ace adapter", focusResult.focused, focusResult);

      // Reload (same path as the Refresh button) must clear the dirty state.
      await page.evaluate(() => window.__ssf.run("reloadCurrentFile"));
      await page.waitForTimeout(3500);
      const afterReload = await page.evaluate(() => {
        const tabs = window.appDMS.tabs.getAllTabObjects();
        const newest = tabs[tabs.length - 1];
        const entry = window.__ssExt._textViewers.find((e) => e.tabHolder === newest.tab.tabHolder);
        if (!entry) return { gone: true };
        const label = newest.tab.controlButton && newest.tab.controlButton.containerNode.textContent;
        return {
          dirty: entry.dirty,
          saveDisabled: !!(entry.buttons.save && entry.buttons.save.get("disabled")),
          markerCleared: !(typeof label === "string" && label.indexOf("*") === 0),
        };
      });
      check(
        "reload clears text viewer dirty marker and disables save",
        !afterReload.dirty && afterReload.saveDisabled && afterReload.markerCleared,
        afterReload,
      );

      await page.evaluate((tabId) => window.appDMS.tabs.closeTab(dijit.byId(tabId)), viewer.newTabId);
      await page.waitForTimeout(1500);
      const afterClose = await page.evaluate(() => window.__ssExt._textViewers.length);
      check("registry entry cleaned up on tab close", afterClose === 0, { afterClose });
    }
  }

  // -- Command palette -------------------------------------------------------------
  // Nothing focused: only SS-Ext entries should show up.
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.evaluate((lp) => {
    window.__ssExt.commandPalette(lp);
  }, libPath);
  await page.waitForTimeout(500);
  const paletteNoFocusState = await page.evaluate(() => {
    const overlay = document.querySelector(".ace_prompt_container");
    const list = window.__ssCmdPalette_lastList || [];
    return {
      overlayPresent: !!overlay,
      hasSsExtEntry: list.some((c) => c.value.startsWith("SS-Ext: ")),
      hasBareAceCommand: list.some((c) => !c.value.startsWith("SS-Ext: ")),
      hasBrowseEntries: ["SS-Ext: Browse files", "SS-Ext: Browse library", "SS-Ext: Browse tabs"].every((v) =>
        list.some((c) => c.value === v),
      ),
      count: list.length,
    };
  });
  check("command palette (no focus) shows overlay", paletteNoFocusState.overlayPresent, paletteNoFocusState);
  check("command palette (no focus) lists SS-Ext entries", paletteNoFocusState.hasSsExtEntry, paletteNoFocusState);
  check("command palette (no focus) has no editor commands", !paletteNoFocusState.hasBareAceCommand, paletteNoFocusState);
  check("command palette lists SS-Ext browse entries", paletteNoFocusState.hasBrowseEntries, paletteNoFocusState);
  await page.evaluate(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", keyCode: 27 })));
  await page.waitForTimeout(300);
  const paletteClosedAfterEsc = await page.evaluate(() => !document.querySelector(".ace_prompt_container"));
  check("command palette closes on Esc", paletteClosedAfterEsc, { paletteClosedAfterEsc });

  // browseFiles action opens the browse_ss prompt (its own container).
  await page.evaluate(() => window.__ssf.run("browseFiles"));
  await page.waitForTimeout(600);
  const browseOpened = await page.evaluate(() => !!document.querySelector(".ace_browse_ss_container"));
  check("browseFiles action opens the file browser prompt", browseOpened, { browseOpened });
  await page.evaluate(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", keyCode: 27 })));
  await page.waitForTimeout(300);

  // With a code editor (an Ace instance) focused: editor commands should also
  // show up. Reuses any currently-open code tab rather than the (now-closed)
  // text viewer from the block above.
  const focusedForPalette = await page.evaluate(async () => {
    const tabObj = window.appDMS.tabs
      .getAllTabObjects()
      .find((t) => t.editor && t.editor.editor && t.editor.editor.aceEditor);
    if (!tabObj) return false;
    window.appDMS.tabs.selectTab(tabObj);
    tabObj.editor.editor.aceEditor.focus();
    await new Promise((r) => setTimeout(r, 100));
    return tabObj.editor.editor.aceEditor.isFocused();
  });
  if (!focusedForPalette) {
    check("command palette (editor focused) test setup - a code editor is focused (skipped: no code tab open)", false, {
      focusedForPalette,
    });
  } else {
    await page.evaluate((lp) => {
      window.__ssExt.commandPalette(lp);
    }, libPath);
    await page.waitForTimeout(500);
    const paletteWithFocusState = await page.evaluate((baselineCount) => {
      const overlay = document.querySelector(".ace_prompt_container");
      const list = window.__ssCmdPalette_lastList || [];
      return {
        overlayPresent: !!overlay,
        count: list.length,
        moreThanBaseline: list.length > baselineCount,
        // entries display description text now, not command ids
        hasKnownAceCommand: list.some((c) => c.command === "find" || c.command === "gotoline"),
        displaysDescriptionText: list.some((c) => c.command === "find" && c.value !== "find"),
        hasNoCustomPrefsEntry: !list.some((c) => c.value === "SS-Ext: Editor preferences"),
        // browseSs* editor commands are excluded (browsing is listed globally as SS-Ext entries)
        hasNoEditorBrowseCmds: !list.some((c) =>
          ["browseSsFiles", "browseSsLibrary", "browseSsTabs"].includes(c.command),
        ),
      };
    }, paletteNoFocusState.count);
    check("command palette (editor focused) shows overlay", paletteWithFocusState.overlayPresent, paletteWithFocusState);
    check(
      "command palette (editor focused) includes editor commands with description text",
      paletteWithFocusState.moreThanBaseline &&
        paletteWithFocusState.hasKnownAceCommand &&
        paletteWithFocusState.displaysDescriptionText,
      paletteWithFocusState,
    );
    check(
      "command palette has no custom 'SS-Ext: Editor preferences' entry (removed)",
      paletteWithFocusState.hasNoCustomPrefsEntry,
      paletteWithFocusState,
    );
    check(
      "command palette (editor focused) excludes browseSs* editor commands",
      paletteWithFocusState.hasNoEditorBrowseCmds,
      paletteWithFocusState,
    );
    await page.evaluate(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", keyCode: 27 })));
    await page.waitForTimeout(300);
  }

  // -- Persistent Ace editor configuration -----------------------------------------
  // (a) a freshly-constructed adapter picks up whatever's seeded on ssExt.aceConfig
  // (mirrors sw.js's onUpdated seed) - probed directly against a scratch div rather
  // than round-tripping deactivate()/activate() on real SAS Studio tabs, which would
  // reuse the same container id ace.edit() caches an editor instance against.
  const seededTabSize = await page.evaluate(() => {
    window.__ssExt.aceConfig = {
      darkTheme: "ace/theme/gruvbox",
      lightTheme: "ace/theme/iplastic",
      options: { fontSize: 15, keyboardHandler: "ace/keyboard/vim", useSoftTabs: true, tabSize: 9 },
    };
    const div = document.createElement("div");
    div.id = "ssext_smoke_config_probe";
    document.body.appendChild(div);
    const adapter = new window.__ssExt.AceEditorAdapter(div.id, "", "sas");
    const tabSize = adapter.aceEditor.getOption("tabSize");
    adapter.dispose();
    div.remove();
    return tabSize;
  });
  check("adapter picks up seeded aceConfig for a new editor", seededTabSize === 9, { seededTabSize });

  // (b) applyAceConfig live-applies an option change to already-open adapters.
  await page.evaluate(() => {
    window.__ssExt.applyAceConfig({
      darkTheme: "ace/theme/gruvbox",
      lightTheme: "ace/theme/iplastic",
      options: { fontSize: 15, keyboardHandler: "ace/keyboard/vim", useSoftTabs: true, tabSize: 12 },
    });
  });
  const liveAppliedTabSize = await page.evaluate(() => {
    const tabObj = window.appDMS.tabs.getAllTabObjects().find((t) => t.editor && t.editor.editor && t.editor.editor.aceEditor);
    return tabObj ? tabObj.editor.editor.aceEditor.getOption("tabSize") : null;
  });
  check("applyAceConfig live-applies to already-open adapters", liveAppliedTabSize === 12, { liveAppliedTabSize });

  // (c) the stock settings menu (Ctrl-,/showSettingsMenu, no custom panel anymore)
  // opens for a focused editor via the real command, not a direct function call.
  const focusedForPrefs = await page.evaluate(async () => {
    const tabObj = window.appDMS.tabs.getAllTabObjects().find((t) => t.editor && t.editor.editor && t.editor.editor.aceEditor);
    if (!tabObj) return false;
    window.appDMS.tabs.selectTab(tabObj);
    const aceEditor = tabObj.editor.editor.aceEditor;
    aceEditor.focus();
    await new Promise((r) => setTimeout(r, 100));
    aceEditor.execCommand("showSettingsMenu");
    return true;
  });
  await page.waitForTimeout(300);
  const panelOpen = await page.evaluate(() => !!document.getElementById("ace_settingsmenu"));
  check("stock settings menu opens for a focused editor (execCommand)", focusedForPrefs && panelOpen, { focusedForPrefs, panelOpen });

  // (d) driving a real panel control (not calling setOption directly) persists to
  // chrome.storage.local.aceConfig via the OptionPanel.prototype.setOption hook + relay.js.
  let persistedAceConfig = null;
  if (panelOpen) {
    await page.evaluate(() => {
      const input = document.querySelector('#ace_settingsmenu input[type="number"]');
      input.value = "22";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.waitForTimeout(500);
    persistedAceConfig = await sw.evaluate(async () => {
      const { aceConfig } = await chrome.storage.local.get("aceConfig");
      return aceConfig || null;
    });
  }
  check(
    "settings menu control change persists via relay.js to chrome.storage.local.aceConfig",
    !!persistedAceConfig && persistedAceConfig.options && persistedAceConfig.options.fontSize === 22,
    persistedAceConfig,
  );
  await page.evaluate(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", keyCode: 27 })));
  await page.waitForTimeout(200);

  // (e) vimrc: pushing a config with a vimrc string through applyAceConfig applies
  // it against the (already-loaded, from the toggle above) vim module.
  const vimrcApplied = await page.evaluate(async () => {
    const before = window.__ssExt._vimrcApplied || 0;
    window.__ssExt.applyAceConfig({
      darkTheme: "ace/theme/gruvbox",
      lightTheme: "ace/theme/iplastic",
      options: { fontSize: 15, keyboardHandler: "ace/keyboard/vim", useSoftTabs: true, tabSize: 4 },
      vimrc: "imap jj <Esc>",
    });
    for (let i = 0; i < 30; i++) {
      if ((window.__ssExt._vimrcApplied || 0) > before) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    return { applied: (window.__ssExt._vimrcApplied || 0) > before, lastText: window.__ssExt._vimrcLastText };
  });
  check("vimrc applies via applyAceConfig", vimrcApplied.applied && vimrcApplied.lastText === "imap jj <Esc>", vimrcApplied);

  // Clean up storage state so reruns are deterministic.
  await sw.evaluate(() => chrome.storage.local.remove("aceConfig"));

  const deactivated = await page.evaluate((lp) => window.__ssExt.toggle(lp), libPath);
  check("Ace editor replacement deactivates cleanly", deactivated && deactivated.active === false, deactivated);

  // -- Global command-palette hotkey (Alt+Shift+P), Ace NOT activated ------------
  // Exercises sw.js's tabs.onUpdated pre-injection (editor-swap.js + seeded
  // ssExt.libPath/userSnippets) - the ss-fixes.js hotkey calls
  // window.__ssExt.commandPalette() with no args, so it only works if that
  // pre-injection already ran.
  await page.evaluate(() =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "P", altKey: true, shiftKey: true, bubbles: true }),
    ),
  );
  await page.waitForTimeout(500);
  const hotkeyPaletteState = await page.evaluate(() => ({
    active: window.__ssExt.active,
    overlayPresent: !!document.querySelector(".ace_prompt_container"),
  }));
  check(
    "global Alt+Shift+P hotkey opens the command palette with Ace not activated",
    !hotkeyPaletteState.active && hotkeyPaletteState.overlayPresent,
    hotkeyPaletteState,
  );
  await page.evaluate(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", keyCode: 27 })));
  await page.waitForTimeout(300);

  await ctx.close();
  console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll checks passed");
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error("HARNESS ERROR:", e.message);
  process.exit(1);
});
