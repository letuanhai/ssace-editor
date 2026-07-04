/**
 * SAS Studio editor toggle: swap the built-in editor for Ace, and back again.
 *
 * Injected into the page's MAIN world by sw.js on every toolbar click. Idempotent —
 * a second injection is a no-op because of the `window.__ssExt` guard below; the sw
 * then calls `window.__ssExt.toggle(libPath)` to actually flip state.
 *
 * Docs (read before touching AceEditorAdapter):
 * - SAS_EDITOR_API.md   - SAS.Editor API reference
 * - sas-editor.d.ts     - TypeScript definitions for that API
 * - EDITOR_USAGE_MAP.md - which SAS Studio files call which editor methods
 */
(function () {
  "use strict";

  if (window.__ssExt) return;

  // ==========================================================================
  // AceEditorAdapter - implements the SAS.Editor API on top of Ace
  //
  // Known-stubbed methods (audited against EDITOR_USAGE_MAP.md - only DMSEditor
  // consumes these, and none of it depends on a real return value except getHTML):
  //   cut/copy/paste()     - browser handles native clipboard, no-op
  //   canPaste()            - always true, no consumer branches on false
  //   setNextFocusHandler/setPreviousFocusHandler/setLibService/promptText/
  //   enableHint/regShortcuts - DMSEditor calls these defensively (`if (fn) ...`)
  //     but never reads a return value
  //   getContextMenu()      - returns null; the only caller (createCodeEditor's
  //     Ace path below) already try/catches around it
  //   getHTML()             - used by onPrintCode()/getSummary() for a printable
  //     export; Ace has no built-in HTML export without ext-static_highlight, so
  //     this returns escaped plain text instead of syntax-highlighted markup.
  //     ponytail: plaintext fallback, upgrade to ext-static_highlight if anyone
  //     actually complains about print output.
  // ==========================================================================
  class AceEditorAdapter {
    constructor(containerId, content, langMode) {
      this.containerId = containerId;
      this.container = document.getElementById(containerId);
      this._isAceEditorAdapter = true;

      if (!this.container) {
        throw new Error(`[SS Ext] Container ${containerId} not found`);
      }

      this.container.innerHTML = "";
      this.container.style.width = "100%";
      this.container.style.height = "100%";

      const darkTheme = "ace/theme/gruvbox";
      const lightTheme = "ace/theme/iplastic";
      const isDarkMode =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const editorTheme = isDarkMode ? darkTheme : lightTheme;

      this.aceEditor = ace.edit(containerId, {
        mode: "ace/mode/sas",
        keyboardHandler: "ace/keyboard/vim",
        theme: editorTheme,
        fontSize: 15,
        showLineNumbers: true,
        showGutter: true,
        displayIndentGuides: true,
        behavioursEnabled: true,
        autoScrollEditorIntoView: true,
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        tooltipFollowsMouse: true,
        highlightActiveLine: true,
        highlightIndentGuides: true,
        highlightSelectedWord: true,
      });

      // Watch for OS dark-mode changes; handler + mql kept for dispose() cleanup.
      this._darkModeMql = window.matchMedia("(prefers-color-scheme: dark)");
      this._darkModeHandler = (event) => {
        this.aceEditor.setTheme(event.matches ? darkTheme : lightTheme);
      };
      this._darkModeMql.addEventListener("change", this._darkModeHandler);

      this.aceEditor.commands.addCommand({
        name: "openCommandPalette",
        description: "Open command palette",
        bindKey: { win: "Alt-Shift-P", mac: "Command-Shift-P" },
        exec: (editor) => editor.prompt({ $type: "commands" }),
        readOnly: true,
      });
      // Let SAS Studio handle F3/F4 instead of Ace's find-next/find-prev.
      this.aceEditor.commands.bindKey("F3", null);
      this.aceEditor.commands.bindKey("F4", null);

      if (content) {
        this.aceEditor.setValue(content, -1); // -1 -> cursor to start
      }

      this.eventHandlers = { textChanged: [], selectionChanged: [], caretMoved: [] };
      this.setupAceEventBindings();

      setTimeout(() => this.aceEditor.resize(), 10);

      // Property DMSEditor sets directly (DMSEditor.js:4188).
      this.log = null;

      // Internal controller object accessed directly by DMSEditor/DMSTask.
      this.ctrl_ = {
        insertText: (text) => this.aceEditor.insert(text),
        selection: (startLine, startCol, endLine, endCol) => {
          if (endLine === undefined && endCol === undefined) {
            this.aceEditor.moveCursorTo(startLine, startCol);
          } else {
            const Range = ace.require("ace/range").Range;
            this.aceEditor.selection.setRange(
              new Range(startLine, startCol, endLine, endCol),
            );
          }
        },
      };
    }

    setupAceEventBindings() {
      this.aceEditor.session.on("change", (delta) => {
        this.triggerEvent("textChanged", { delta });
      });
      this.aceEditor.session.selection.on("changeSelection", () => {
        this.triggerEvent("selectionChanged");
      });
      this.aceEditor.session.selection.on("changeCursor", () => {
        const cursor = this.aceEditor.getCursorPosition();
        this.triggerEvent("caretMoved", {
          data: { line: cursor.row, column: cursor.column },
        });
      });
    }

    triggerEvent(eventName, data) {
      const handlers = this.eventHandlers[eventName] || [];
      handlers.forEach((callback) => {
        try {
          callback.call(this, data);
        } catch (error) {
          console.error(`[SS Ext] Error in ${eventName} handler:`, error);
        }
      });
    }

    // -- Content -------------------------------------------------------------
    getText() {
      return this.aceEditor.getValue();
    }
    setText(content) {
      this.aceEditor.setValue(content || "", -1);
    }
    insert(text) {
      this.aceEditor.insert(text);
    }
    clear() {
      this.aceEditor.setValue("", -1);
    }
    getSelectedText() {
      return this.aceEditor.getSelectedText();
    }
    lineCount() {
      return this.aceEditor.session.getLength();
    }

    // -- Navigation / focus ----------------------------------------------------
    focus() {
      this.aceEditor.focus();
    }
    selectAll() {
      this.aceEditor.selectAll();
    }
    gotoLine(line) {
      this.aceEditor.gotoLine(line);
    }

    // -- Events ----------------------------------------------------------------
    bind(eventName, callback) {
      if (this.eventHandlers[eventName]) {
        this.eventHandlers[eventName].push(callback);
      } else {
        console.warn(`[SS Ext] Unknown editor event: ${eventName}`);
      }
    }
    unbind(eventName, callback) {
      const handlers = this.eventHandlers[eventName];
      if (!handlers) return;
      const index = handlers.indexOf(callback);
      if (index > -1) handlers.splice(index, 1);
    }

    // -- Lifecycle ---------------------------------------------------------------
    activate() {
      /* no-op - Ace doesn't need activation */
    }
    deactivate() {
      /* no-op - Ace doesn't need deactivation */
    }
    dispose() {
      if (this._darkModeMql) {
        this._darkModeMql.removeEventListener("change", this._darkModeHandler);
      }
      if (this.aceEditor) {
        this.aceEditor.destroy();
      }
      if (this.container) {
        this.container.innerHTML = "";
        this.container.style.width = "";
        this.container.style.height = "";
      }
    }

    // -- Settings (all called by appDMS.applyOptionsToEditor) --------------------
    fontSize(size) {
      if (size !== undefined) this.aceEditor.setFontSize(size);
      return this.aceEditor.getFontSize();
    }
    lineNumber(enable) {
      if (enable !== undefined) this.aceEditor.setOption("showLineNumbers", enable);
      return this.aceEditor.getOption("showLineNumbers");
    }
    syntaxHighlighting() {
      return true; // Ace always highlights
    }
    autoComplete(enable) {
      if (enable !== undefined) {
        this.aceEditor.setOption("enableBasicAutocompletion", enable);
        this.aceEditor.setOption("enableLiveAutocompletion", enable);
      }
      return this.aceEditor.getOption("enableBasicAutocompletion");
    }
    lineWrapped(enable) {
      if (enable !== undefined) this.aceEditor.session.setUseWrapMode(enable);
      return this.aceEditor.session.getUseWrapMode();
    }
    tabSize(size) {
      if (size !== undefined) this.aceEditor.session.setTabSize(size);
      return this.aceEditor.session.getTabSize();
    }
    tabAsSpaces(enable) {
      if (enable !== undefined) this.aceEditor.session.setUseSoftTabs(enable);
      return this.aceEditor.session.getUseSoftTabs();
    }
    readOnly(enable) {
      if (enable !== undefined) this.aceEditor.setReadOnly(enable);
      return this.aceEditor.getReadOnly();
    }

    // -- Layout ------------------------------------------------------------------
    resize() {
      this.aceEditor.resize();
    }
    resizeOnly() {
      // Not in the base API; checked with `if (editor.resizeOnly)` in several places.
      this.aceEditor.resize();
    }

    // -- Undo/redo ---------------------------------------------------------------
    undo() {
      this.aceEditor.undo();
    }
    redo() {
      this.aceEditor.redo();
    }
    canUndo() {
      return this.aceEditor.session.getUndoManager().hasUndo();
    }
    canRedo() {
      return this.aceEditor.session.getUndoManager().hasRedo();
    }

    // -- Find/replace --------------------------------------------------------------
    showFindReplaceDialog() {
      this.aceEditor.execCommand("find");
    }
    hideFindReplaceDialog() {
      /* no-op */
    }
    showGoToLineDialog() {
      this.aceEditor.execCommand("gotoline");
    }
    hideGoToLineDialog() {
      /* no-op */
    }
    search(key, config) {
      this.aceEditor.find(key, config);
    }
    replace(key, value, config) {
      if (key) this.aceEditor.find(key, config);
      this.aceEditor.replaceAll(value);
    }

    // -- Clipboard (browser handles these natively) ---------------------------------
    cut() {}
    copy() {}
    paste() {}
    canPaste() {
      return true;
    }

    // -- Misc stubs -------------------------------------------------------------------
    getContextMenu() {
      return null;
    }
    setNextFocusHandler() {}
    setPreviousFocusHandler() {}
    setLibService() {}
    promptText() {}
    enableHint() {}
    regShortcuts() {}
    getHTML() {
      // ponytail: plaintext fallback (no ext-static_highlight loaded); good enough
      // for the print/summary consumers, upgrade if syntax-highlighted print matters.
      const div = document.createElement("div");
      div.textContent = this.aceEditor.getValue();
      return div.innerHTML;
    }
  }

  // ==========================================================================
  // Singleton state + public API
  // ==========================================================================
  const ssExt = {
    active: false,
    newAceLoaded: false,
    patchesInstalled: false,
    origLib: null, // { ace }
    newLib: null, // { ace }
    userSnippets: "", // stashed by toggle()/browse() before the ace lib loads
    _userSnippetsParsed: null, // previously-registered parsed snippets, for unregister
    _textViewers: [], // live { pane, tabHolder, adapter, item, textarea, origSet, origResize, editable, dirty, buttons } entries
    activate,
    deactivate,
    toggle,
    loadNewAce,
    browse,
    applySnippets,
  };
  window.__ssExt = ssExt;

  // -- Ace library management ---------------------------------------------------
  // The original ace build's #ace_editor.css/#ace-tm style elements are inert:
  // SAS Studio renders its own editor DOM (EditorView.js) and never references
  // any .ace_* class or calls ace.edit - the vendored ace is only ever used via
  // runtime ace.require(...) for tokenization (Mode.js/SyntaxColorerAdapter.js).
  // So those old style elements are just discarded here (avoids duplicate-rule
  // edge cases once the new build's same-named styles are attached). The
  // window.ace GLOBAL still has to be swapped between builds though, whenever
  // the toggle is inactive - it's the registry those ace.require calls resolve
  // against, and it needs to keep pointing at the version-matched library.

  function backupOrigAce() {
    if (ssExt.origLib) return;
    ["ace_editor.css", "ace-tm"]
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .forEach((el) => el.remove());
    ssExt.origLib = { ace: window.ace };
    delete window.ace;
    Array.from(document.head.querySelectorAll("script[src]"))
      .filter((el) => /\/ace\/.*\.js$/.test(el.src))
      .forEach((el) => el.remove());
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error(`[SS Ext] Failed to load ${src}`));
      document.body.appendChild(el);
    });
  }

  async function loadNewAce(libPath) {
    if (ssExt.newAceLoaded) return;
    backupOrigAce();

    await loadScript(`${libPath}/ace.js`);
    if (window.ace && window.ace.config) {
      window.ace.config.set("basePath", libPath);
      // This build resolves "ace/keyboard/vim" to keyboard-vim.js, but the bundled
      // file is keybinding-vim.js - without this override vim mode (and its :w/:q
      // ex-commands) 404s and silently never loads. The adapter requests vim as its
      // keyboardHandler, so fix the URL before any editor is created.
      window.ace.config.setModuleUrl("ace/keyboard/vim", `${libPath}/keybinding-vim.js`);
    }
    // Note: the src-noconflict build only ever assigns window.ace - its internal
    // require/define are closure-local, so window.require/window.define (Dojo's
    // AMD loader) are never touched and don't need swapping either direction.
    // Its #ace_editor.css/#ace-tm style elements stay attached permanently from
    // here on - they're harmless since nothing in SAS Studio references .ace_*.

    await loadScript(`${libPath}/ext-language_tools.js`);
    await loadScript(`${libPath}/ext-browse_ss.js`);

    ssExt.newLib = { ace: window.ace };
    ssExt.newAceLoaded = true;

    // Register vim :w/:q/:wq/:x once the new ace (and its vim module) is available.
    installVimExCommands();

    // loadNewAce can run while the toggle is inactive (browse-before-activate);
    // ace.js just clobbered window.ace with the new build, so put the global
    // back on whichever side is actually active.
    window.ace = ssExt.active ? ssExt.newLib.ace : ssExt.origLib.ace;
  }

  // -- User-configurable snippets -------------------------------------------------
  // Additive over ace's built-in SAS snippets - parseSnippetFile + register don't
  // replace anything. ponytail: duplicate triggers appear twice in the completion
  // list; dedupe-by-trigger is the upgrade path if that ever bites someone.
  function applySnippets(text) {
    if (!ssExt.newAceLoaded) return; // nothing to apply against yet
    ssExt.userSnippets = text || "";

    try {
      ssExt.newLib.ace.require("ace/ext/language_tools"); // ensure snippet manager is wired up
      const sm = ssExt.newLib.ace.require("ace/snippets").snippetManager;

      if (ssExt._userSnippetsParsed) {
        sm.unregister(ssExt._userSnippetsParsed, "sas");
        ssExt._userSnippetsParsed = null;
      }

      if (text) {
        const parsed = sm.parseSnippetFile(text);
        sm.register(parsed, "sas");
        ssExt._userSnippetsParsed = parsed;
      }
    } catch (e) {
      console.error("[SS Ext] Failed to apply user snippets:", e);
    }
  }

  // -- One-time SAS.Editor / DMSEditor patches -----------------------------------

  function installPatches() {
    if (ssExt.patchesInstalled) return;

    if (!ssExt.OriginalSASEditor) {
      if (typeof SAS === "undefined" || typeof SAS.Editor === "undefined") {
        console.error("[SS Ext] SAS.Editor not found, cannot install patches");
        return;
      }

      const OriginalSASEditor = SAS.Editor;
      ssExt.OriginalSASEditor = OriginalSASEditor;

      function EditorDispatcher(containerId, content, langMode) {
        return ssExt.active
          ? new AceEditorAdapter(containerId, content, langMode)
          : new OriginalSASEditor(containerId, content, langMode);
      }
      Object.keys(OriginalSASEditor).forEach((key) => {
        EditorDispatcher[key] = OriginalSASEditor[key];
      });
      SAS.Editor = EditorDispatcher;
    }

    installCreateFileViewPatch();

    const tabs = appDMS.getCurrentPerspectiveSASStudioTabs();
    let DMSEditor = null;
    if (tabs && tabs.mainTabs) {
      for (const tab of tabs.mainTabs) {
        if (tab.editor) {
          DMSEditor = tab.editor.constructor;
          break;
        }
      }
    }

    if (!DMSEditor || !DMSEditor.prototype.createCodeEditor) {
      console.warn("[SS Ext] Could not find DMSEditor class to patch");
      return;
    }

    if (DMSEditor.prototype._aceReplacementPatched) {
      ssExt.patchesInstalled = true;
      return;
    }

    const originalCreateCodeEditor = DMSEditor.prototype.createCodeEditor;
    ssExt.originalCreateCodeEditor = originalCreateCodeEditor;

    DMSEditor.prototype.createCodeEditor = function () {
      if (!ssExt.active) {
        return originalCreateCodeEditor.call(this);
      }

      // Ace path, ported from the original one-shot patch to createCodeEditor.
      if (!this.editorDiv || !this.editorDiv.id) {
        throw new Error("[SS Ext] editorDiv not found on DMSEditor instance");
      }

      if (this.fileType === "CPK" && this.editorContent && this.editorContent.length > 0) {
        this.setPackage(this.editorContent);
      }

      this.editor = new AceEditorAdapter(
        this.editorDiv.id,
        this.editorContent,
        SAS.Editor.LanguageMode.SasCode,
      );
      this.editor.log = this.logAreaContentPane;

      if (appDMS.currentPerspectiveKey === "interactivePP") {
        this.editor.readOnly(true);
      }

      appDMS.applyOptionsToEditor(this.editor);

      try {
        const contextMenu = this.editor.getContextMenu();
        if (contextMenu && contextMenu.removeItems && contextMenu.insertItems) {
          const lang = require("dojo/_base/lang");
          contextMenu.removeItems(11, 2);
          contextMenu.removeItems(9, 2);
          contextMenu.insertItems(9, [
            {
              type: "entry",
              label: this.resourceBundle.gotoToolbarLabel,
              onClick: lang.hitch(this, this.setPreviousFocus),
            },
            {
              type: "entry",
              label: this.resourceBundle.goToLogLabel,
              onClick: lang.hitch(this, this.setNextFocus),
            },
          ]);
        }
      } catch (e) {
        console.warn("[SS Ext] Could not customize context menu:", e);
      }

      const lang = require("dojo/_base/lang");
      this.editor.bind("textChanged", lang.hitch(this, this.editorChanged));
      this.editor.bind("selectionChanged", lang.hitch(this, this.selectionChanged));
      this.editor.bind("caretMoved", lang.hitch(this, this.caretMoved));

      this.setButtonStates();
      this.editor.gotoLine(1);
      setTimeout(lang.hitch(this, this.setInitialFocus), 100);
      this.setGoToLineConstraints();

      if (this.editor.bind && window.appDMS && window.appDMS.dropFromDesktop) {
        this.editor.bind("drop", window.appDMS.dropFromDesktop);
      }
      if (this.editor.setLibService && this.getLibList) {
        this.editor.setLibService(this.getLibList);
      }

      this.editor.activate();
      this.setFinalized(true);
    };

    DMSEditor.prototype._aceReplacementPatched = true;
    ssExt.patchesInstalled = true;
  }

  // -- "View file as text" -> read-only Ace ----------------------------------------
  // AppDMS.createFileView (AppDMS.js:4248) always builds a read-only SimpleTextarea
  // for TXT/LOG/etc. viewers. The load/refresh flows navigate to it POSITIONALLY,
  // not via tabHolder.simpleTextArea:
  //   - perspectiveFileOpen refresh guard (AppDMS.js:3927-3932):
  //       pane.getChildren()[1].getChildren()[0].value
  //   - xhr load handler (AppDMS.js:3979-3985):
  //       this.getChildren()[1].getChildren()[0].set("value", data)  (falls back
  //       to this.tabHolder.simpleTextArea.set("value", data) only if that path
  //       is absent)
  // A shim that isn't a real widget in the tree breaks both: destroying the
  // widget leaves getChildren()[0] undefined, so `.value` throws before the busy
  // dialog is hidden (forever-spinner) and the load's `.set("value", data)`
  // never happens (empty editor). Fix: keep the real SimpleTextarea alive and in
  // the widget tree, hide it visually, and mirror its value writes into Ace.
  function installCreateFileViewPatch() {
    if (ssExt._createFileViewPatched) return;
    if (typeof appDMS.createFileView !== "function") return;

    const originalCreateFileView = appDMS.createFileView.bind(appDMS);
    ssExt.originalCreateFileView = originalCreateFileView;

    appDMS.createFileView = function (item, targetComponent, content, paneId) {
      const tabHolder = originalCreateFileView(item, targetComponent, content, paneId);
      if (ssExt.active) {
        try {
          convertTextViewerToAce(item, tabHolder);
        } catch (e) {
          console.error("[SS Ext] Failed to convert text viewer to Ace:", e);
        }
      }
      return tabHolder;
    };
    ssExt._createFileViewPatched = true;
  }

  function convertTextViewerToAce(item, tabHolder) {
    const pane = tabHolder.textContainer;
    const textarea = tabHolder.simpleTextArea;
    if (textarea && textarea.domNode) textarea.domNode.style.display = "none";

    const divId = `ssf_textviewer_${pane.id}`;
    const div = document.createElement("div");
    div.id = divId;
    div.style.width = "100%";
    div.style.height = "100%";
    pane.domNode.appendChild(div);

    const adapter = new AceEditorAdapter(
      divId,
      textarea ? textarea.get("value") : "",
      SAS.Editor.LanguageMode.SasCode,
    );
    // Always editable (like a normal editor); the dirty state drives the tab
    // marker and Save button, and Ctrl/Cmd+S / vim :w save.
    adapter.readOnly(false);

    const entry = {
      pane,
      tabHolder,
      adapter,
      item,
      textarea,
      origSet: null,
      origResize: null,
      dirty: false,
      _suppressDirty: false,
      baseLabel: null, // captured lazily from the tab control button on first dirty
      buttons: {},
    };

    // Mirror server writes (load + refresh, both positional and via
    // tabHolder.simpleTextArea) into Ace without touching the widget's own
    // value storage - the positional `.value` reads still see the real thing.
    if (textarea) {
      const origSet = textarea.set.bind(textarea);
      entry.origSet = origSet;
      textarea.set = function (name, val) {
        const r = origSet(name, val);
        if (name === "value") {
          entry._suppressDirty = true;
          adapter.setText(val == null ? "" : val);
          entry._suppressDirty = false;
        }
        return r;
      };
    }

    const origResize = pane.resize;
    entry.origResize = origResize;
    pane.resize = function (...args) {
      const result = origResize.apply(this, args);
      adapter.resize();
      return result;
    };

    adapter.bind("textChanged", () => {
      if (entry._suppressDirty) return;
      setViewerDirty(entry, true);
    });

    // Ctrl/Cmd+S saves, same as the code editor. An Ace command intercepts and
    // preventDefaults the browser's own save dialog.
    adapter.aceEditor.commands.addCommand({
      name: "ssfSaveTextViewer",
      bindKey: { win: "Ctrl-S", mac: "Command-S" },
      exec: () => saveTextViewer(entry),
    });

    ssExt._textViewers.push(entry);

    // Leak safety: dijit destroys the ContentPane's dijit children on tab close
    // but knows nothing about the adapter - own() runs our cleanup alongside it.
    // Guarded by array membership so a later restoreTextViewers() (deactivate)
    // doesn't get double-disposed when the pane is eventually closed for real.
    pane.own({
      destroy() {
        const idx = ssExt._textViewers.indexOf(entry);
        if (idx === -1) return;
        adapter.dispose();
        ssExt._textViewers.splice(idx, 1);
      },
    });

    // Toolbar Save button - only TXT/LOG viewers get a toolbar (AppDMS.js:4247-4262).
    // Other file types that fall through to createFileView still get an editable
    // Ace viewer with mirrored content (Ctrl+S / vim :w still save), just no button.
    const toolbar = dijit.byId(`${appDMS.currentPerspectiveKey}_${item.id}_texttoolbar`);
    if (toolbar) {
      entry.buttons.save = makeSaveButton(entry);
      toolbar.addChild(entry.buttons.save);
    }
  }

  // Tab control button widget for a viewer, resolved via its tabHolder (the tab
  // object's .tab.tabHolder is the same object we hold in the entry).
  function viewerTabControlButton(entry) {
    const tabObj = appDMS.tabs
      .getAllTabObjects()
      .find((t) => t.tab && t.tab.tabHolder === entry.tabHolder);
    return tabObj && tabObj.tab && tabObj.tab.controlButton;
  }

  // Reflect dirty state into the Save button and the tab title marker, matching
  // the code editor's "*name" convention (DMSEditor.applyChangedIndicationToTab).
  function setViewerDirty(entry, dirty) {
    entry.dirty = dirty;
    if (entry.buttons.save) entry.buttons.save.set("disabled", !dirty);
    const btn = viewerTabControlButton(entry);
    if (btn && btn.containerNode) {
      if (entry.baseLabel == null) {
        entry.baseLabel = btn.containerNode.textContent.replace(/^\*/, "");
      }
      const label = (dirty ? "*" : "") + entry.baseLabel;
      btn.containerNode.innerHTML = appDMS.encodeHtml ? appDMS.encodeHtml(label) : label;
    }
  }

  function makeSaveButton(entry) {
    return new dijit.form.Button({
      iconClass: "sasSaveIcon",
      label: "Save",
      showLabel: false,
      disabled: true,
      onClick() {
        saveTextViewer(entry);
      },
    });
  }

  // Minimal mirror of DMSEditor.prototype.saveFile's core POST (DMSEditor.js
  // ~6791-6976) - just the plain "workspace" save path. No autosave/backup
  // cleanup (viewers never created a backup file), no MVS/ftp/CTK/CPK branches,
  // since text viewers only ever come from plain workspace files.
  function saveTextViewer(entry) {
    const uri = entry.item && entry.item.uri;
    if (!uri) {
      console.error("[SS Ext] Cannot save text viewer: no item.uri", entry.item);
      if (typeof dojoAlert === "function") dojoAlert("Save failed: no file URI");
      else alert("Save failed: no file URI");
      return;
    }

    let url =
      appDMS.baseURL +
      "/sasexec/sessions/" +
      appDMS.sessionId +
      "/workspace/" +
      encodeValue(uri, false, "/", false);
    const encoding = entry.item.encoding;
    if (typeof encoding === "string" && encoding) url += "?encoding=" + encoding;

    dojo.xhrPost({
      postData: entry.adapter.getText(),
      url,
      contentType: "text/file",
      handleAs: "json",
      headers: { ObjectType: "" },
      preventCache: true,
      load: () => {
        setViewerDirty(entry, false);
      },
      error: (err) => {
        // DMSEditor treats HTTP 499 as a successful save too.
        if (err && err.status === 499) {
          setViewerDirty(entry, false);
          return;
        }
        try {
          dojoAlert(err.response.xhr.getResponseHeader("Exception"));
        } catch (_) {
          alert("Save failed");
        }
      },
    });
  }

  // -- Vim :w / :q / :wq / :x ------------------------------------------------------
  // Registered once on the shared vim module (ace/keyboard/vim), so they apply to
  // every vim-mode Ace instance - text viewers and the code editors alike. The Ex
  // handler gets `cm.ace` (the acting Ace editor); resolve it back to either a text
  // viewer entry or a DMSEditor code tab and save/close accordingly.
  function resolveAceContext(aceEditor) {
    const viewer = ssExt._textViewers.find((e) => e.adapter && e.adapter.aceEditor === aceEditor);
    if (viewer) return { type: "viewer", entry: viewer };
    const tabObj = appDMS.tabs
      .getAllTabObjects()
      .find((t) => t.editor && t.editor.editor && t.editor.editor.aceEditor === aceEditor);
    if (tabObj) return { type: "code", tabObj };
    return null;
  }

  function vimSave(ctx) {
    if (!ctx) return;
    if (ctx.type === "viewer") saveTextViewer(ctx.entry);
    else if (ctx.tabObj.editor.saveFile) ctx.tabObj.editor.saveFile();
  }

  function vimClose(ctx) {
    if (!ctx) return;
    const tabObj =
      ctx.type === "viewer"
        ? appDMS.tabs.getAllTabObjects().find((t) => t.tab && t.tab.tabHolder === ctx.entry.tabHolder)
        : ctx.tabObj;
    if (tabObj) appDMS.tabs.closeTab(tabObj);
  }

  function installVimExCommands() {
    if (ssExt._vimExInstalled) return;
    ssExt._vimExInstalled = true; // guard now so concurrent loads don't double-register
    ssExt.newLib.ace.config.loadModule("ace/keyboard/vim", (vim) => {
      const Vim = vim && vim.Vim;
      if (!Vim || !Vim.defineEx) {
        ssExt._vimExInstalled = false;
        return;
      }
      const saveAndClose = (cm) => {
        const ctx = resolveAceContext(cm.ace);
        vimSave(ctx);
        vimClose(ctx);
      };
      Vim.defineEx("write", "w", (cm) => vimSave(resolveAceContext(cm.ace)));
      Vim.defineEx("quit", "q", (cm) => vimClose(resolveAceContext(cm.ace)));
      Vim.defineEx("wq", "wq", saveAndClose);
      Vim.defineEx("xit", "x", saveAndClose);
    });
  }

  function restoreTextViewers() {
    // ponytail: viewers opened while INACTIVE were never converted, so they stay
    // original editors - activation only affects viewers opened afterwards.
    const entries = ssExt._textViewers.splice(0, ssExt._textViewers.length);
    entries.forEach((entry) => {
      const { pane, adapter, textarea, origSet, origResize, buttons } = entry;
      try {
        // Clear the dirty "*" marker from the tab title before we let go.
        if (entry.dirty && entry.baseLabel != null) {
          const btn = viewerTabControlButton(entry);
          if (btn && btn.containerNode) {
            btn.containerNode.innerHTML = appDMS.encodeHtml
              ? appDMS.encodeHtml(entry.baseLabel)
              : entry.baseLabel;
          }
        }

        adapter.dispose();

        const div = document.getElementById(`ssf_textviewer_${pane.id}`);
        if (div) div.remove();

        if (textarea) {
          if (origSet) textarea.set = origSet;
          if (textarea.domNode) textarea.domNode.style.display = "";
        }
        pane.resize = origResize;

        if (buttons.save) buttons.save.destroy();
      } catch (e) {
        console.error("[SS Ext] Failed to restore text viewer:", e);
      }
    });
  }

  // -- Per-tab swap ---------------------------------------------------------------

  function swapTabsToAce() {
    let swapped = 0;
    const tabs = appDMS.getCurrentPerspectiveSASStudioTabs();
    if (!tabs || !tabs.mainTabs) return swapped;

    const lang = require("dojo/_base/lang");

    tabs.mainTabs.forEach((tabObj) => {
      const dmsEditor = tabObj.editor;
      if (!dmsEditor || !dmsEditor.editor || !dmsEditor.editorDiv) return;

      const oldEditor = dmsEditor.editor;
      if (oldEditor._isAceEditorAdapter) return;

      let content = "";
      try {
        content = oldEditor.getText();
      } catch (e) {
        console.warn("[SS Ext] Could not read text from original editor:", e);
      }

      try {
        const newEditor = new AceEditorAdapter(
          dmsEditor.editorDiv.id,
          content,
          SAS.Editor.LanguageMode.SasCode,
        );
        dmsEditor.editor = newEditor;

        newEditor.bind("textChanged", lang.hitch(dmsEditor, dmsEditor.editorChanged));
        newEditor.bind("selectionChanged", lang.hitch(dmsEditor, dmsEditor.selectionChanged));
        newEditor.bind("caretMoved", lang.hitch(dmsEditor, dmsEditor.caretMoved));

        if (typeof appDMS.applyOptionsToEditor === "function") {
          appDMS.applyOptionsToEditor(newEditor);
        }
        swapped++;
      } catch (e) {
        console.error("[SS Ext] Failed to swap tab to Ace:", e);
      }
    });

    return swapped;
  }

  function restoreTabsToOriginal() {
    let restored = 0;
    const tabs = appDMS.getCurrentPerspectiveSASStudioTabs();
    if (!tabs || !tabs.mainTabs) return restored;

    tabs.mainTabs.forEach((tabObj) => {
      const dmsEditor = tabObj.editor;
      const adapter = dmsEditor && dmsEditor.editor;
      if (!adapter || !adapter._isAceEditorAdapter) return;

      try {
        // Capture state. Undo history is intentionally dropped in both directions.
        const text = adapter.getText();
        const cursor = adapter.aceEditor.getCursorPosition();
        const wasDirty = dmsEditor.editorContentChanged;

        adapter.dispose(); // destroys ace instance, clears container in place

        dmsEditor.editorContent = text;
        dmsEditor.createCodeEditor(); // dispatcher routes to the original method

        // createCodeEditor doesn't touch editorContentChanged itself, but restore
        // it explicitly as a safety net against future changes to that method.
        dmsEditor.editorContentChanged = wasDirty;

        try {
          dmsEditor.editor.gotoLine(cursor.row + 1); // 1-indexed, also scrolls
          if (dmsEditor.editor.ctrl_ && dmsEditor.editor.ctrl_.selection) {
            dmsEditor.editor.ctrl_.selection(cursor.row, cursor.column);
          }
        } catch (e) {
          console.warn("[SS Ext] Could not restore cursor position:", e);
        }

        restored++;
      } catch (e) {
        console.error("[SS Ext] Failed to restore tab to original editor:", e);
      }
    });

    return restored;
  }

  // -- Public API -------------------------------------------------------------------

  async function activate(libPath) {
    if (ssExt.active) return { active: true };

    await loadNewAce(libPath);
    applySnippets(ssExt.userSnippets);
    // Global still needs to point at the tokenizer's ace.require registry.
    window.ace = ssExt.newLib.ace;
    ssExt.active = true;
    installPatches();

    const swapped = swapTabsToAce();
    console.log(`[SS Ext] activated Ace editor, ${swapped} tab(s) swapped`);
    return { active: true };
  }

  async function deactivate() {
    if (!ssExt.active) return { active: false };

    ssExt.active = false;
    // Global still needs to point at the tokenizer's ace.require registry.
    window.ace = ssExt.origLib.ace;

    const restored = restoreTabsToOriginal();
    restoreTextViewers();
    console.log(`[SS Ext] deactivated Ace editor, ${restored} tab(s) restored`);
    return { active: false };
  }

  function toggle(libPath, snippetsText) {
    if (snippetsText !== undefined) ssExt.userSnippets = snippetsText;
    ssExt._pending = (ssExt._pending || Promise.resolve()).then(
      () => (ssExt.active ? deactivate() : activate(libPath)),
      () => (ssExt.active ? deactivate() : activate(libPath)),
    );
    return ssExt._pending;
  }

  async function doBrowse(kind, libPath) {
    // browse only needs the new ace lib loaded (its css stays attached
    // permanently once loaded) - it doesn't need activation of the editor
    // replacement itself. loadNewAce no-ops if already loaded.
    await loadNewAce(libPath);
    applySnippets(ssExt.userSnippets);
    // Resolve through the NEW ace instance, not window.ace - the global is the
    // original library whenever the toggle is off.
    const browseSsModule = ssExt.newLib && ssExt.newLib.ace.require("ace/ext/browse_ss");
    const method = browseSsModule && browseSsModule.browse_ss && browseSsModule.browse_ss["browse_" + kind];
    if (typeof method !== "function") {
      console.error(`[SS Ext] browse_ss.browse_${kind} not found`);
      return { active: ssExt.active };
    }
    method();
    return { active: ssExt.active };
  }

  function browse(kind, libPath, snippetsText) {
    if (snippetsText !== undefined) ssExt.userSnippets = snippetsText;
    // Serialize through the same _pending chain as toggle() so browse can't
    // race a concurrent toggle/activation.
    ssExt._pending = (ssExt._pending || Promise.resolve()).then(
      () => doBrowse(kind, libPath),
      () => doBrowse(kind, libPath),
    );
    return ssExt._pending;
  }
})();
