/**
 * Background service worker for SAS Studio Ace Editor Replacement
 *
 * This script:
 * 1. Backs up and removes the old Ace library included with SAS Studio
 * 2. Loads the newer Ace library from the extension
 * 3. Replaces the SAS Studio editor with the new Ace editor
 */

chrome.action.onClicked.addListener(async (tab) => {
  console.log('[Extension] Button clicked for tab', tab.id);

  try {
    // Step 1: Backup and remove old Ace library
    console.log('[Extension] Step 1: Backing up and removing old Ace library...');
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: backupAndRemoveOldAce,
      world: 'MAIN'
    });

    // Step 2: Load new Ace library from extension
    console.log('[Extension] Step 2: Loading new Ace library from extension...');
    const libPath = chrome.runtime.getURL('/lib/ace/src-noconflict');

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: loadNewAceLibrary,
      args: [libPath],
      world: 'MAIN'
    });

    // Give the library time to fully load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 3: Inject the editor replacement script
    console.log('[Extension] Step 3: Injecting editor replacement script...');
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['replace-editor.js'],
      world: 'MAIN'
    });

    console.log('[Extension] ✓ All steps completed successfully');

  } catch (error) {
    console.error('[Extension] Error during replacement:', error);

    // Try to show error to user
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (errorMsg) => {
          console.error('[Extension Error]', errorMsg);
          alert(`Failed to replace editor:\n${errorMsg}\n\nCheck the browser console for details.`);
        },
        args: [error.message],
        world: 'MAIN'
      });
    } catch (e) {
      console.error('[Extension] Could not show error to user:', e);
    }
  }
});

/**
 * Step 1: Backup and remove the old Ace library that came with SAS Studio
 * This runs in the MAIN world to access the page's window object
 */
function backupAndRemoveOldAce() {
  console.log('[Ace Cleanup] Starting backup and removal of old Ace library...');

  try {
    // Backup original Ace library to window._origAceLib (only if not already backed up)
    if (!window._origAceLib) {
      console.log('[Ace Cleanup] Backing up original Ace library...');

      const origAceEditorCssStyleEl = document.getElementById('ace_editor.css');
      const origAceTmStyleEl = document.getElementById('ace-tm');

      window._origAceLib = {
        ace: window.ace,
        require: window.require,
        define: window.define,
        AceEditorCssStyle: origAceEditorCssStyleEl?.textContent || null,
        AceTmStyle: origAceTmStyleEl?.textContent || null,
      };

      console.log('[Ace Cleanup] Backed up:', {
        hasAce: !!window._origAceLib.ace,
        hasRequire: !!window._origAceLib.require,
        hasDefine: !!window._origAceLib.define,
        hasAceEditorCss: !!window._origAceLib.AceEditorCssStyle,
        hasAceTmStyle: !!window._origAceLib.AceTmStyle
      });
    } else {
      console.log('[Ace Cleanup] Original Ace already backed up, skipping backup');
    }

    // Remove old Ace from window
    if (window.ace) {
      console.log('[Ace Cleanup] Removing window.ace...');
      delete window.ace;
    }

    // Remove old Ace style elements
    const styleEls = [
      document.getElementById('ace_editor.css'),
      document.getElementById('ace-tm')
    ];

    styleEls.forEach(el => {
      if (el) {
        console.log('[Ace Cleanup] Removing style element:', el.id);
        el.remove();
      }
    });

    // Remove old Ace script elements
    const aceScripts = Array.from(document.head.getElementsByTagName('script'))
      .filter(el => el.src && el.src.match(/\/ace\/.*\.js$/));

    console.log(`[Ace Cleanup] Found ${aceScripts.length} Ace script elements to remove`);
    aceScripts.forEach(el => {
      console.log('[Ace Cleanup] Removing script:', el.src);
      el.remove();
    });

    console.log('[Ace Cleanup] ✓ Old Ace library removed successfully');

  } catch (error) {
    console.error('[Ace Cleanup] Error during backup/removal:', error);
    throw error;
  }
}

/**
 * Step 2: Load the new Ace library from the extension
 * This runs in the MAIN world to load into the page context
 */
function loadNewAceLibrary(libPath) {
  console.log('[Ace Loader] Loading new Ace library from:', libPath);

  return new Promise((resolve, reject) => {
    try {
      // Create script element for ace.js
      const aceScriptEl = document.createElement('script');
      aceScriptEl.src = `${libPath}/ace.js`;

      aceScriptEl.onload = function () {
        console.log('[Ace Loader] ace.js loaded successfully');

        try {
          // Configure Ace base path
          if (window.ace && window.ace.config) {
            window.ace.config.set("basePath", libPath);
            console.log('[Ace Loader] Set Ace basePath to:', libPath);
          } else {
            console.warn('[Ace Loader] window.ace or window.ace.config not found after loading');
          }

          // Load language tools extension (for autocomplete)
          const langToolScriptEl = document.createElement('script');
          langToolScriptEl.src = `${libPath}/ext-language_tools.js`;
          const promptFsScriptEl = document.createElement('script');
          promptFsScriptEl.src = `${libPath}/ext-browse_ss.js`;

          langToolScriptEl.onload = function () {
            console.log('[Ace Loader] ext-language_tools.js loaded successfully');
            console.log('[Ace Loader] ✓ New Ace library loaded completely');
            document.body.appendChild(promptFsScriptEl);
            promptFsScriptEl.onload = function () {
              console.log('[Ace Loader] ext-browse_ss.js loaded successfully');
              console.log('[Ace Loader] ✓ New Ace library loaded completely');
              resolve();
            };
          };

          langToolScriptEl.onerror = function (error) {
            console.error('[Ace Loader] Failed to load ext-language_tools.js:', error);
            reject(new Error('Failed to load ext-language_tools.js'));
          };


          promptFsScriptEl.onerror = function (error) {
            console.error('[Ace Loader] Failed to load ext-browse_ss.js:', error);
            reject(new Error('Failed to load ext-browse_ss.js'));
          };

          document.body.appendChild(langToolScriptEl);

        } catch (error) {
          console.error('[Ace Loader] Error during ace.js onload:', error);
          reject(error);
        }
      };

      aceScriptEl.onerror = function (error) {
        console.error('[Ace Loader] Failed to load ace.js:', error);
        reject(new Error('Failed to load ace.js'));
      };

      document.body.appendChild(aceScriptEl);

    } catch (error) {
      console.error('[Ace Loader] Error creating script elements:', error);
      reject(error);
    }
  });
}
