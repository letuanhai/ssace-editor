/**
 * Runtime replacement of SAS Studio's custom editor with Ace Editor
 *
 * Usage: Paste this entire script into the browser console and hit Enter
 *
 * This MVP:
 * - Creates a minimal Ace Editor adapter
 * - Replaces the SAS.Editor constructor globally
 * - Replaces all existing editor instances in open tabs
 */

(function () {
  'use strict';

  console.log('[Ace Replacement] Starting editor replacement...');

  // Check if Ace is available
  if (typeof ace === 'undefined') {
    console.error('[Ace Replacement] ERROR: ace is not defined. The app should have Ace loaded already.');
    return;
  }

  // Check if SAS.Editor exists
  if (typeof SAS === 'undefined' || typeof SAS.Editor === 'undefined') {
    console.error('[Ace Replacement] ERROR: SAS.Editor not found. Make sure SAS Studio is loaded.');
    return;
  }

  console.log('[Ace Replacement] Found ace and SAS.Editor, proceeding...');

  /**
   * AceEditorAdapter - Minimal adapter that wraps Ace Editor to mimic SAS.Editor API
   */
  class AceEditorAdapter {
    constructor(containerId, content, langMode) {
      console.log(`[Ace Replacement] Creating Ace editor in container: ${containerId}`);

      this.containerId = containerId;
      this.container = document.getElementById(containerId);

      // Mark this as an AceEditorAdapter for detection on subsequent runs
      this._isAceEditorAdapter = true;

      if (!this.container) {
        console.error(`[Ace Replacement] ERROR: Container ${containerId} not found!`);
        throw new Error(`Container ${containerId} not found`);
      }

      // Clear existing content (remove old SAS editor DOM)
      this.container.innerHTML = '';

      // Make sure container has dimensions for Ace to render
      this.container.style.width = '100%';
      this.container.style.height = '100%';

      // Create Ace editor instance
      try {
        // Set default dark and light theme
        const darkTheme = 'ace/theme/gruvbox';
        const lightTheme = 'ace/theme/iplastic';
        // Choose theme based on system dark mode
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const editorTheme = isDarkMode ? darkTheme : lightTheme;
        const defaultEditorConfig = {
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
        };

        this.aceEditor = ace.edit(containerId, defaultEditorConfig);
        // Watch for dark mode change
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
          const newEditorTheme = event.matches ? darkTheme : lightTheme;
          this.aceEditor.setTheme(newEditorTheme);
        });
        // Key bindings
        this.aceEditor.commands.addCommand({
          name: "openCommandPalette",
          description: "Open command palette",
          bindKey: {
            win: 'Alt-Shift-P',
            mac: 'Command-Shift-P'
          },
          exec: function (editor) {
            editor.prompt({ $type: "commands" });
          },
          readOnly: true
        });
        // Remove F3 and F4 key bindings to allow SAS Studio to handle them
        // F3 is typically bound to "findNext" in Ace
        this.aceEditor.commands.bindKey("F3", null);
        this.aceEditor.commands.bindKey("F4", null);

        // Set initial content
        if (content) {
          this.aceEditor.setValue(content, -1); // -1 moves cursor to start
        }

        // Setup event handlers storage
        this.eventHandlers = {
          textChanged: [],
          selectionChanged: [],
          caretMoved: []
        };

        // Bind Ace events to our event system
        this.setupAceEventBindings();

        // Force resize to ensure proper rendering
        setTimeout(() => {
          this.aceEditor.resize();
        }, 10);

        console.log(`[Ace Replacement] Successfully created Ace editor in ${containerId}`);
      } catch (error) {
        console.error('[Ace Replacement] ERROR creating Ace editor:', error);
        throw error;
      }

      // Property that DMSEditor sets (line 4200 in DMSEditor.js)
      this.log = null;
    }

    /**
     * Setup Ace event listeners to trigger our bound callbacks
     */
    setupAceEventBindings() {
      // Text changed event
      this.aceEditor.session.on('change', (delta) => {
        this.triggerEvent('textChanged', { delta });
      });

      // Selection changed event
      this.aceEditor.session.selection.on('changeSelection', () => {
        this.triggerEvent('selectionChanged');
      });

      // Cursor moved event
      this.aceEditor.session.selection.on('changeCursor', () => {
        const cursor = this.aceEditor.getCursorPosition();
        // DMSEditor.caretMoved expects e.data.line and e.data.column (0-indexed)
        this.triggerEvent('caretMoved', {
          data: {
            line: cursor.row,
            column: cursor.column
          }
        });
      });
    }

    /**
     * Trigger all callbacks registered for an event
     */
    triggerEvent(eventName, data) {
      const handlers = this.eventHandlers[eventName] || [];
      handlers.forEach(callback => {
        try {
          callback.call(this, data);
        } catch (error) {
          console.error(`[Ace Replacement] Error in ${eventName} handler:`, error);
        }
      });
    }

    // ============================================================================
    // CRITICAL API METHODS (must implement for basic functionality)
    // ============================================================================

    /**
     * Get all editor content
     */
    getText() {
      return this.aceEditor.getValue();
    }

    /**
     * Set all editor content
     */
    setText(content) {
      this.aceEditor.setValue(content || '', -1);
    }

    /**
     * Focus the editor
     */
    focus() {
      this.aceEditor.focus();
    }

    /**
     * Bind event listener
     * Events: textChanged, selectionChanged, caretMoved
     */
    bind(eventName, callback) {
      if (this.eventHandlers[eventName]) {
        this.eventHandlers[eventName].push(callback);
      } else {
        console.warn(`[Ace Replacement] Unknown event: ${eventName}`);
      }
    }

    /**
     * Unbind event listener
     */
    unbind(eventName, callback) {
      if (this.eventHandlers[eventName]) {
        const index = this.eventHandlers[eventName].indexOf(callback);
        if (index > -1) {
          this.eventHandlers[eventName].splice(index, 1);
        }
      }
    }

    /**
     * Dispose/cleanup the editor
     */
    dispose() {
      if (this.aceEditor) {
        this.aceEditor.destroy();
        this.aceEditor.container.remove();
      }
    }

    // ============================================================================
    // STUB METHODS (called by applyOptionsToEditor, no-ops for MVP)
    // ============================================================================

    fontSize(size) {
      if (size !== undefined) {
        this.aceEditor.setFontSize(size);
      }
      return this.aceEditor.getFontSize();
    }

    lineNumber(enable) {
      if (enable !== undefined) {
        this.aceEditor.setOption('showLineNumbers', enable);
      }
      return this.aceEditor.getOption('showLineNumbers');
    }

    syntaxHighlighting(enable) {
      // Ace always has syntax highlighting, just stub
      return true;
    }

    autoComplete(enable) {
      if (enable !== undefined) {
        this.aceEditor.setOption('enableBasicAutocompletion', enable);
        this.aceEditor.setOption('enableLiveAutocompletion', enable);
      }
      return this.aceEditor.getOption('enableBasicAutocompletion');
    }

    lineWrapped(enable) {
      if (enable !== undefined) {
        this.aceEditor.session.setUseWrapMode(enable);
      }
      return this.aceEditor.session.getUseWrapMode();
    }

    tabSize(size) {
      if (size !== undefined) {
        this.aceEditor.session.setTabSize(size);
      }
      return this.aceEditor.session.getTabSize();
    }

    tabAsSpaces(enable) {
      if (enable !== undefined) {
        this.aceEditor.session.setUseSoftTabs(enable);
      }
      return this.aceEditor.session.getUseSoftTabs();
    }

    readOnly(enable) {
      if (enable !== undefined) {
        this.aceEditor.setReadOnly(enable);
      }
      return this.aceEditor.getReadOnly();
    }

    // Additional stub methods that might be called
    activate() { /* no-op for MVP */ }
    deactivate() { /* no-op for MVP */ }
    insert(text) { this.aceEditor.insert(text); }
    clear() { this.aceEditor.setValue('', -1); }
    selectAll() { this.aceEditor.selectAll(); }
    gotoLine(line) { this.aceEditor.gotoLine(line); }
    getSelectedText() { return this.aceEditor.getSelectedText(); }
    lineCount() { return this.aceEditor.session.getLength(); }
    resize(width, height) { this.aceEditor.resize(); }

    // Stub methods that return no-op values
    undo() { this.aceEditor.undo(); }
    redo() { this.aceEditor.redo(); }
    canUndo() { return this.aceEditor.session.getUndoManager().hasUndo(); }
    canRedo() { return this.aceEditor.session.getUndoManager().hasRedo(); }
    getContextMenu() { return null; }
    setNextFocusHandler(fn) { /* no-op */ }
    setPreviousFocusHandler(fn) { /* no-op */ }
    setLibService(fn) { /* no-op */ }
    promptText(text) { /* no-op */ }
    enableHint(enable) { /* no-op */ }
    regShortcuts(config) { /* no-op */ }
    showFindReplaceDialog() { this.aceEditor.execCommand('find'); }
    hideFindReplaceDialog() { /* no-op */ }
    showGoToLineDialog() { this.aceEditor.execCommand('gotoline'); }
    hideGoToLineDialog() { /* no-op */ }
    search(key, config) { this.aceEditor.find(key, config); }
    replace(key, value, config) { this.aceEditor.replaceAll(value); }
    cut() { /* no-op - browser handles */ }
    copy() { /* no-op - browser handles */ }
    paste() { /* no-op - browser handles */ }
    canPaste() { return true; }
    getHTML(option) { return ''; }
  }

  // ============================================================================
  // STEP 1: Store original SAS.Editor constructor
  // ============================================================================

  const OriginalSASEditor = SAS.Editor;
  console.log('[Ace Replacement] Stored original SAS.Editor constructor');

  // ============================================================================
  // STEP 2: Replace SAS.Editor constructor globally
  // ============================================================================

  SAS.Editor = function (containerId, content, langMode) {
    console.log('[Ace Replacement] SAS.Editor constructor called, returning AceEditorAdapter');
    return new AceEditorAdapter(containerId, content, langMode);
  };

  // Preserve static properties from original constructor
  SAS.Editor.LanguageMode = OriginalSASEditor.LanguageMode;

  console.log('[Ace Replacement] Replaced SAS.Editor constructor');

  // ============================================================================
  // STEP 3: Patch DMSEditor.prototype.createCodeEditor for new tabs
  // ============================================================================

  try {
    // Get DMSEditor constructor from an existing editor instance
    const tabs = appDMS.getCurrentPerspectiveSASStudioTabs();
    let DMSEditor = null;

    if (tabs && tabs.mainTabs && tabs.mainTabs.length > 0) {
      // Find first tab with an editor to get the DMSEditor class
      for (let i = 0; i < tabs.mainTabs.length; i++) {
        if (tabs.mainTabs[i].editor) {
          DMSEditor = tabs.mainTabs[i].editor.constructor;
          break;
        }
      }
    }

    if (DMSEditor && DMSEditor.prototype.createCodeEditor) {
      // Check if already patched
      if (DMSEditor.prototype._aceReplacementPatched) {
        console.log('[Ace Replacement] DMSEditor.createCodeEditor already patched, skipping');
      } else {
        console.log('[Ace Replacement] Found DMSEditor class, patching createCodeEditor...');

        // Store original method
        const originalCreateCodeEditor = DMSEditor.prototype.createCodeEditor;

        // Replace with our version that uses Ace
        DMSEditor.prototype.createCodeEditor = function () {
          console.log('[Ace Replacement] createCodeEditor called for new tab');

          // Verify editorDiv exists
          if (!this.editorDiv || !this.editorDiv.id) {
            console.error('[Ace Replacement] ERROR: editorDiv not found in DMSEditor instance!');
            console.log('[Ace Replacement] DMSEditor state:', {
              hasEditorDiv: !!this.editorDiv,
              editorDivId: this.editorDiv ? this.editorDiv.id : 'N/A'
            });
            throw new Error('editorDiv not found');
          }

          console.log(`[Ace Replacement] Creating editor for container: ${this.editorDiv.id}`);

          // Handle CPK files (from original code line 4179)
          if (this.fileType == "CPK" && this.editorContent && this.editorContent.length > 0) {
            this.setPackage(this.editorContent);
          }

          // Create Ace editor instead of original Editor
          try {
            this.editor = new AceEditorAdapter(
              this.editorDiv.id,
              this.editorContent,
              SAS.Editor.LanguageMode.SasCode,
            );
          } catch (error) {
            console.error('[Ace Replacement] ERROR in createCodeEditor - failed to create AceEditorAdapter:', error);
            throw error;
          }

          // Continue with original setup (from line 4188 onwards)
          try {
            this.editor.log = this.logAreaContentPane;

            if (appDMS.currentPerspectiveKey === "interactivePP") {
              this.editor.readOnly(true);
            }

            // Apply preferences
            appDMS.applyOptionsToEditor(this.editor);
            console.log('[Ace Replacement] Applied options to new editor');

            // Context menu customization (simplified - skip for MVP)
            try {
              const contextMenu = this.editor.getContextMenu();
              if (contextMenu && contextMenu.removeItems && contextMenu.insertItems) {
                const lang = require('dojo/_base/lang');
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
              console.warn('[Ace Replacement] Could not customize context menu:', e);
            }

            // Event bindings (from line 4257-4262)
            const lang = require('dojo/_base/lang');
            this.editor.bind("textChanged", lang.hitch(this, this.editorChanged));
            this.editor.bind("selectionChanged", lang.hitch(this, this.selectionChanged));
            this.editor.bind("caretMoved", lang.hitch(this, this.caretMoved));
            console.log('[Ace Replacement] Bound event handlers for new tab');

            // Remaining setup (from line 4264-4272)
            this.setButtonStates();
            this.editor.gotoLine(1);
            setTimeout(lang.hitch(this, this.setInitialFocus), 100);
            this.setGoToLineConstraints();

            // Additional bindings
            if (this.editor.bind && window.appDMS && window.appDMS.dropFromDesktop) {
              this.editor.bind("drop", window.appDMS.dropFromDesktop);
            }
            if (this.editor.setLibService && this.getLibList) {
              this.editor.setLibService(this.getLibList);
            }
            this.editor.activate();
            this.setFinalized(true);

            console.log('[Ace Replacement] New tab editor created with Ace successfully');
          } catch (error) {
            console.error('[Ace Replacement] ERROR in createCodeEditor setup:', error);
            throw error;
          }
        };

        // Mark as patched to avoid double-patching
        DMSEditor.prototype._aceReplacementPatched = true;

        console.log('[Ace Replacement] Successfully patched DMSEditor.prototype.createCodeEditor');
      }
    } else {
      console.warn('[Ace Replacement] Could not find DMSEditor class to patch');
    }
  } catch (error) {
    console.error('[Ace Replacement] Error patching DMSEditor.createCodeEditor:', error);
  }

  // ============================================================================
  // STEP 4: Replace existing editor instances in open tabs
  // ============================================================================

  try {
    // Get the tab manager
    const tabs = appDMS.getCurrentPerspectiveSASStudioTabs();

    if (!tabs || !tabs.mainTabs) {
      console.warn('[Ace Replacement] No tabs found to replace');
    } else {
      console.log(`[Ace Replacement] Found ${tabs.mainTabs.length} tabs, replacing editors...`);

      let replacedCount = 0;

      tabs.mainTabs.forEach((tabObj, index) => {
        // Check if this tab has an editor
        if (tabObj.editor && tabObj.editor.editor && tabObj.editor.editorDiv) {
          try {
            const dmsEditor = tabObj.editor;
            const oldEditor = dmsEditor.editor;
            const containerId = dmsEditor.editorDiv.id;

            // Skip if already replaced with AceEditorAdapter
            if (oldEditor._isAceEditorAdapter) {
              console.log(`[Ace Replacement] Tab ${index} already using Ace, skipping`);
              return;
            }

            // Get current content from old editor
            let content = '';
            try {
              content = oldEditor.getText();
            } catch (e) {
              console.warn(`[Ace Replacement] Could not get text from old editor in tab ${index}:`, e);
            }

            console.log(`[Ace Replacement] Replacing editor in tab ${index} (${tabObj.name || 'unnamed'}), container: ${containerId}`);

            // Create new Ace editor adapter
            const newEditor = new AceEditorAdapter(
              containerId,
              content,
              SAS.Editor.LanguageMode.SasCode
            );

            // Replace the reference
            dmsEditor.editor = newEditor;

            // CRITICAL: Re-bind DMSEditor event handlers
            // These were bound to the old editor and need to be re-bound to the new one
            try {
              // Get dojo's lang.hitch utility
              const lang = require('dojo/_base/lang');

              // Re-bind the three critical events that DMSEditor expects
              newEditor.bind("textChanged", lang.hitch(dmsEditor, dmsEditor.editorChanged));
              newEditor.bind("selectionChanged", lang.hitch(dmsEditor, dmsEditor.selectionChanged));
              newEditor.bind("caretMoved", lang.hitch(dmsEditor, dmsEditor.caretMoved));

              console.log(`[Ace Replacement] Re-bound event handlers for tab ${index}`);
            } catch (e) {
              console.error(`[Ace Replacement] Failed to re-bind event handlers for tab ${index}:`, e);
            }

            // Re-apply preferences if possible
            if (typeof appDMS.applyOptionsToEditor === 'function') {
              try {
                appDMS.applyOptionsToEditor(newEditor);
              } catch (e) {
                console.warn(`[Ace Replacement] Could not apply options to new editor in tab ${index}:`, e);
              }
            }

            replacedCount++;
          } catch (error) {
            console.error(`[Ace Replacement] Error replacing editor in tab ${index}:`, error);
          }
        }
      });

      console.log(`[Ace Replacement] Successfully replaced ${replacedCount} editor(s)`);
    }
  } catch (error) {
    console.error('[Ace Replacement] Error during tab editor replacement:', error);
  }

  // ============================================================================
  // DONE!
  // ============================================================================

  console.log('[Ace Replacement] ✓ Editor replacement complete!');
  console.log('[Ace Replacement] ✓ DMSEditor.prototype.createCodeEditor patched');
  console.log('[Ace Replacement] ✓ New tabs will automatically use Ace Editor');
  console.log('[Ace Replacement] ✓ Existing tabs have been replaced with Ace Editor');
  console.log('[Ace Replacement] - Try typing in the editor to test!');
  console.log('[Ace Replacement] - Open a new code tab to test!');

})();
