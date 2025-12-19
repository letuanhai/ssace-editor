# SAS Studio Ace Editor Replacement Extension

A Chrome extension that replaces SAS Studio's outdated built-in Ace Editor library with a newer version and replaces the custom SAS editor with Ace Editor inline.

## Features

- ✅ **Replaces old Ace library** - Removes SAS Studio's outdated Ace library and loads a newer version
- ✅ **Preserves original library** - Backs up the original Ace library in `window._origAceLib`
- ✅ **Replaces all editors** - Works on all existing open tabs
- ✅ **Automatically applies to new tabs** - New tabs automatically use Ace Editor
- ✅ **Full functionality** - Preserves all SAS Studio functionality (save, undo/redo, etc.)
- ✅ **One-click activation** - Simple button click to activate
- ✅ **Modern Ace Editor** - Uses the latest Ace Editor with all modern features

## How It Works

The extension performs three steps when you click the extension button:

### Step 1: Backup and Remove Old Ace Library

- Backs up the original Ace library to `window._origAceLib`
- Removes `window.ace` object
- Removes Ace-related style elements (`ace_editor.css`, `ace-tm`)
- Removes all Ace script elements from the page

### Step 2: Load New Ace Library

- Loads `ace.js` from the extension's `/lib` directory
- Configures Ace's `basePath` to point to the extension
- Loads `ext-language_tools.js` for autocomplete functionality
- Waits for all scripts to fully load

### Step 3: Replace SAS Studio Editor

- Injects the editor replacement script (`replace-editor.js`)
- Creates `AceEditorAdapter` class that mimics SAS.Editor API
- Replaces `SAS.Editor` constructor globally
- Patches `DMSEditor.prototype.createCodeEditor` for new tabs
- Replaces all existing editor instances in open tabs
- Re-binds event handlers (textChanged, selectionChanged, caretMoved)

## Installation

### Prerequisites

- Chrome browser (or Chromium-based browser like Edge, Brave, etc.)
- SAS Studio access

### Steps

1. **Download or clone this repository**

   ```bash
   cd /home/lth/browser-extensions/SASStudio-3.82/replace-sasstudio-editor
   ```

2. **Open Chrome Extensions page**
   - Navigate to `chrome://extensions/`
   - Or Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the extension**
   - Click "Load unpacked"
   - Select the `replace-sasstudio-editor` directory
   - The extension should appear in your extensions list

5. **Pin the extension (optional)**
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Replace SAS Studio Editor"
   - Click the pin icon to keep it visible

## Usage

1. **Open SAS Studio** in your Chrome browser
2. **Wait for the page to fully load** (make sure you can see the editor)
3. **Click the extension icon** in Chrome's toolbar
4. **Watch the browser console** (F12 → Console tab) to see the progress
5. **All editors** should now be using the new Ace Editor!

### Keyboard Shortcut

The extension supports a keyboard shortcut:

- **Alt+Period** (Alt+.) - Activate the extension

You can customize this in Chrome's extension settings (chrome://extensions/shortcuts).

### Expected Console Output

When you click the extension button, you should see:

```
[Extension] Button clicked for tab 123456
[Extension] Step 1: Backing up and removing old Ace library...
[Ace Cleanup] Starting backup and removal of old Ace library...
[Ace Cleanup] Backing up original Ace library...
[Ace Cleanup] Backed up: {hasAce: true, hasRequire: true, ...}
[Ace Cleanup] Removing window.ace...
[Ace Cleanup] Removing style element: ace_editor.css
[Ace Cleanup] Removing style element: ace-tm
[Ace Cleanup] Found 15 Ace script elements to remove
[Ace Cleanup] ✓ Old Ace library removed successfully

[Extension] Step 2: Loading new Ace library from extension...
[Ace Loader] Loading new Ace library from: chrome-extension://...
[Ace Loader] ace.js loaded successfully
[Ace Loader] Set Ace basePath to: chrome-extension://...
[Ace Loader] ext-language_tools.js loaded successfully
[Ace Loader] ✓ New Ace library loaded completely

[Extension] Step 3: Injecting editor replacement script...
[Ace Replacement] Starting editor replacement...
[Ace Replacement] Found ace and SAS.Editor, proceeding...
[Ace Replacement] Stored original SAS.Editor constructor
[Ace Replacement] Replaced SAS.Editor constructor
[Ace Replacement] Found DMSEditor class, patching createCodeEditor...
[Ace Replacement] Successfully patched DMSEditor.prototype.createCodeEditor
[Ace Replacement] Found 2 tabs, replacing editors...
[Ace Replacement] Replacing editor in tab 0 (Program1.sas), container: editContentPane123_editor
[Ace Replacement] Creating Ace editor in container: editContentPane123_editor
[Ace Replacement] Successfully created Ace editor in editContentPane123_editor
[Ace Replacement] Re-bound event handlers for tab 0
[Ace Replacement] Successfully replaced 2 editor(s)
[Ace Replacement] ✓ Editor replacement complete!

[Extension] ✓ All steps completed successfully
```

### Verification

After running the extension:

- ✅ Type in the editor - text should appear
- ✅ Make changes - tab title should show `*` (unsaved indicator)
- ✅ Save button should become enabled when you edit
- ✅ Undo/redo should work (Ctrl+Z / Ctrl+Shift+Z)
- ✅ Line/column indicator should update in the status bar
- ✅ Open new tabs - they should also use Ace Editor
- ✅ Switch between tabs - all should show content with Ace Editor

## Troubleshooting

### Extension button does nothing

- **Check the browser console** (F12 → Console) for error messages
- Make sure you're on the SAS Studio page
- Make sure SAS Studio has fully loaded before clicking
- Try refreshing the page and clicking the extension button again

### "Failed to load ace.js" error

- The extension needs the `/lib` directory with Ace files
- Check that `lib/ace.js` and `lib/ext-language_tools.js` exist
- Check the `manifest.json` has correct `web_accessible_resources`

### Editors appear blank after replacement

- Check the console for detailed error messages
- The old Ace library might not have been removed properly
- Try refreshing the page and running the extension again
- Make sure no other extensions are interfering

### Second click breaks the editor

- The script is designed to be run once per page load
- If you need to run it again, refresh the page first
- The backup is stored in `window._origAceLib` for future restoration

## Files in this Extension

### Extension Files

- **manifest.json** - Extension configuration
- **sw.js** - Background service worker (handles button clicks and orchestrates the 3 steps)
- **replace-editor.js** - Editor replacement script (step 3, contains AceEditorAdapter class)
- **lib/** - Newer Ace Editor library files
  - `ace.js` - Main Ace Editor library
  - `ext-language_tools.js` - Autocomplete extension
  - `mode-*.js` - Language mode files
  - Other extensions and themes
- **assets/** - Extension icons
  - `icon16.png`, `icon48.png`, `icon128.png`
- **LICENSE** - License file
- **README.md** - This file

### Documentation Files

- **[SAS_EDITOR_API.md](./SAS_EDITOR_API.md)** - Complete API reference (60+ methods with examples)
- **[sas-editor.d.ts](./sas-editor.d.ts)** - TypeScript type definitions for IDE support
- **[EDITOR_USAGE_MAP.md](./EDITOR_USAGE_MAP.md)** - Map of 20+ files using the editor API

## API Documentation

This extension provides comprehensive documentation of the SAS.Editor interface:

### SAS_EDITOR_API.md

Complete reference documentation for the original SAS Studio editor interface, including:

- All public methods with descriptions and examples
- Event handling system (textChanged, selectionChanged, caretMoved)
- Settings and configuration options
- Usage patterns from DMSEditor
- Implementation checklist for replacement editors

This is essential reading for understanding what the AceEditorAdapter needs to implement.

### sas-editor.d.ts

TypeScript definition file that provides:

- Full type definitions for SAS.Editor class and all its methods
- Event data structure types
- Configuration object interfaces
- IDE autocomplete support when working with the editor API

You can use this file in your IDE (VSCode, WebStorm, etc.) for better autocomplete and type checking when developing editor replacements or working with the SAS Studio editor API.

**To use in your IDE:**

```javascript
/// <reference path="./sas-editor.d.ts" />

// Now you get autocomplete for editor methods
const editor = new SAS.Editor(
  "container",
  "content",
  SAS.Editor.LanguageMode.SasCode,
);
editor.getText(); // ← IDE shows type: string
editor.bind("textChanged", (e) => {
  // ← IDE shows event type
  console.log(e.type); // ← Autocomplete works here
});
```

### EDITOR_USAGE_MAP.md

Comprehensive map of all files in the SAS Studio codebase that use the editor API:

- **20+ files** documented with specific usage patterns
- File-by-file breakdown showing which methods are used where
- Line number references for precise location of API calls
- Internal API usage (`ctrl_.insertText`, `ctrl_.selection`)
- Language mode usage across different components
- Editor access patterns (direct, through tabs, through tasks)
- Quick reference table showing method usage frequency by file

This is invaluable for understanding the full scope of editor integration and ensuring your replacement implementation is compatible with all consumers of the API.

**Key files documented:**

- DMSEditor.js - Main code editor (100+ API calls)
- XMLEditor.js, TaskEditor.js - Specialized editors
- SASStudioInteractiveConsole.js, SASStudioCASConsole.js - Console editors
- MobileEditor.js - Mobile variant
- DMSTask.js - Uses internal `ctrl_` API
- AppDMS.js - Applies settings to all editors
- Plus 13 more files with complete usage details

## Development

### Testing Changes

1. Edit the files in the extension directory
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Refresh the SAS Studio page
5. Click the extension button again to test

### Debugging

- **Service Worker Console**: Click "service worker" link in `chrome://extensions/`
- **Page Console**: Open browser DevTools (F12) on the SAS Studio page
- All log messages are prefixed with `[Extension]`, `[Ace Cleanup]`, `[Ace Loader]`, or `[Ace Replacement]`

### Modifying the Replacement Logic

The editor replacement logic is in `replace-editor.js`. Key components:

- **AceEditorAdapter** - Wrapper class that implements SAS.Editor API using Ace
- **Constructor replacement** - Replaces `SAS.Editor` globally
- **Prototype patching** - Modifies `DMSEditor.prototype.createCodeEditor`
- **Instance replacement** - Replaces existing editor instances in open tabs
- **Event rebinding** - Reconnects SAS Studio event handlers

## Known Limitations

- Only tested with SAS Studio 3.82
- Requires page refresh to reset after running
- Some advanced SAS Editor features may not be fully implemented
- Context menu customization is limited in MVP

## License

See LICENSE file for details.

## Credits

- **SAS Studio** - Original application
- **Ace Editor** - The code editor library ([ace.c9.io](https://ace.c9.io))
- **Chrome Extensions API** - For injection capabilities

---

**Note**: This is a reverse engineering project for educational and personal use purposes. Use at your own risk.
