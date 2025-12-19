# SAS.Editor API Documentation

Complete interface documentation for the SAS Studio code editor (SAS.Editor). This document describes all methods and properties that must be implemented by any replacement editor.

## Table of Contents

- [Overview](#overview)
- [Constructor](#constructor)
- [Lifecycle Methods](#lifecycle-methods)
- [Content Methods](#content-methods)
- [Selection and Navigation](#selection-and-navigation)
- [Clipboard Operations](#clipboard-operations)
- [Undo/Redo](#undoredo)
- [Search and Replace](#search-and-replace)
- [Settings and Options](#settings-and-options)
- [Event Handling](#event-handling)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Layout and Resize](#layout-and-resize)
- [Advanced Features](#advanced-features)
- [Internal Properties](#internal-properties)
- [Usage Patterns in DMSEditor](#usage-patterns-in-dmseditor)

---

## Overview

**Source**: `resources/js/sas-commons/controls/CodeEditor.js`
**Version**: 1.9
**Namespace**: `SAS.Editor`

The SAS.Editor is an HTML5 Enhanced Editor that provides SAS code editing capabilities in the browser. It meets SAS' internationalization (i18n) and accessibility (a11y) requirements.

---

## Constructor

### `new SAS.Editor(id, content, langMode)`

Creates a new editor instance.

**Parameters:**

- `id` (string) - The ID of the container element (typically a `<div>`) that will hold the editor
- `content` (string, optional) - Initial text content to display in the editor
- `langMode` (string, optional) - Language mode for syntax highlighting (from `SAS.Editor.LanguageMode`)

**Example:**

```javascript
const editor = new SAS.Editor(
  "editorContainer",
  "data work.test;\n  x = 1;\nrun;",
  SAS.Editor.LanguageMode.SasCode,
);
```

### Language Modes

`SAS.Editor.LanguageMode` object contains:

- `Unset: "none"`
- `Text: "text"`
- `Html: "html"`
- `SclCode: "scl"`
- `SasCode: "sas"` ← Most commonly used
- `Xml: "xml"`
- `Log: "log"`
- `Lst: "lst"`
- `Mdx: "mdx"`
- `R: "r"`

---

## Lifecycle Methods

### `activate()`

Makes the editor instance active. Required for find/replace operations and proper tab switching.

**Used in DMSEditor**: Lines 1894, 2601, 4271, 9767

**Example:**

```javascript
editor.activate();
```

---

### `deactivate()`

Cancels the active status of the editor.

**Example:**

```javascript
editor.deactivate();
```

---

### `dispose()`

Frees resources held by the editor object. Should be called when removing the editor.

**Example:**

```javascript
editor.dispose();
```

---

### `focus()`

Gives keyboard focus to the editor.

**Used in DMSEditor**: Line 4350

**Example:**

```javascript
editor.focus();
```

---

## Content Methods

### `getText()`

Gets all content from the editor.

**Returns**: String containing all editor text

**Used in DMSEditor**: Lines 4223, 4236, 5732, 5797, 6392, 6552, 6660, 6750, 6936, 7478, 7731, 8856, 10209

**Example:**

```javascript
const code = editor.getText();
console.log(code); // "data work.test;\n  x = 1;\nrun;"
```

---

### `getSelectedText()`

Gets the currently selected text.

**Returns**: String containing selected text, or empty string if no selection

**Used in DMSEditor**: Lines 5809, 6394, 6551, 6659, 7729, 8855

**Example:**

```javascript
const selected = editor.getSelectedText();
if (selected) {
  console.log("Selected:", selected);
}
```

---

### `setText(content)`

Replaces all content in the editor. This resets the undo/redo history.

**Parameters:**

- `content` (string) - New content to set

**Used in DMSEditor**: Lines 7962, 10252

**Example:**

```javascript
editor.setText("proc print data=sashelp.class;\nrun;");
```

---

### `insert(content)`

Inserts content at the cursor position. If there's a selection, replaces the selection.
This action can be undone.

**Parameters:**

- `content` (string) - Content to insert

**Used in DMSEditor**: Line 2666

**Example:**

```javascript
editor.insert("/* New comment */\n");
```

---

### `clear()`

Clears all content from the editor. This action can be undone.

**Used in DMSEditor**: Lines 2665, 8068

**Example:**

```javascript
editor.clear();
```

---

### `lineCount()`

Gets the total number of lines in the editor.

**Returns**: Integer line count

**Used in DMSEditor**: Lines 4417, 5141, 5182

**Example:**

```javascript
const maxLine = editor.lineCount();
console.log(`Editor has ${maxLine} lines`);
```

---

## Selection and Navigation

### `selectAll()`

Selects all text in the editor.

**Used in DMSEditor**: Lines 6761, 7886

**Example:**

```javascript
editor.selectAll();
```

---

### `gotoLine(line)`

Moves the cursor to the specified line.

**Parameters:**

- `line` (integer) - Line number (1-based, not 0-based!)

**Used in DMSEditor**: Lines 4265, 4351, 5146, 5183

**Example:**

```javascript
editor.gotoLine(1); // Go to first line
editor.gotoLine(10); // Go to line 10
```

---

## Clipboard Operations

### `cut()`

Cuts the selected content to the clipboard.

**Used in DMSEditor**: Line 5226

**Example:**

```javascript
editor.cut();
```

---

### `copy()`

Copies the selected content to the clipboard.

**Used in DMSEditor**: Line 5236

**Example:**

```javascript
editor.copy();
```

---

### `paste()`

Pastes content from the clipboard to the editor.

**Used in DMSEditor**: Line 5246

**Example:**

```javascript
editor.paste();
```

---

### `canPaste()`

Checks if paste operation is currently available.

**Returns**: Boolean indicating if paste is available

**Used in DMSEditor**: Lines 5805, 5909

**Example:**

```javascript
if (editor.canPaste()) {
  pasteButton.disabled = false;
}
```

---

## Undo/Redo

### `undo()`

Undoes the last action.

**Used in DMSEditor**: Line 5108

**Example:**

```javascript
editor.undo();
```

---

### `redo()`

Redoes the last undone action.

**Used in DMSEditor**: Line 5118

**Example:**

```javascript
editor.redo();
```

---

### `canUndo()`

Checks if undo is available.

**Returns**: Boolean indicating if there are actions to undo

**Used in DMSEditor**: Lines 5798, 5907

**Example:**

```javascript
if (editor.canUndo()) {
  undoButton.disabled = false;
}
```

---

### `canRedo()`

Checks if redo is available.

**Returns**: Boolean indicating if there are actions to redo

**Used in DMSEditor**: Line 5801

**Example:**

```javascript
if (editor.canRedo()) {
  redoButton.disabled = false;
}
```

---

## Search and Replace

### `search(key, config)`

Searches for text in the editor.

**Parameters:**

- `key` (string) - Text to search for
- `config` (object, optional) - Search configuration:
  - `direction` (string) - "forward" or "backward"
  - `caseIgnored` (boolean) - Whether to ignore case
  - `wrapped` (boolean) - Whether to wrap around at document end
  - `all` (boolean) - Whether to find all occurrences

**Returns**: Implementation-specific search result

**Example:**

```javascript
editor.search("proc print", {
  direction: "forward",
  caseIgnored: true,
  wrapped: false,
  all: false,
});
```

---

### `replace(key, value, config)`

Replaces text in the editor.

**Parameters:**

- `key` (string) - Text to search for
- `value` (string) - Replacement text
- `config` (object, optional) - Same as search config

**Example:**

```javascript
editor.replace("oldvar", "newvar", {
  direction: "forward",
  caseIgnored: false,
  wrapped: false,
  all: true,
});
```

---

### `showFindReplaceDialog()`

Shows the find and replace dialog.

**Used in DMSEditor**: Line 5665

**Example:**

```javascript
editor.showFindReplaceDialog();
```

---

### `hideFindReplaceDialog()`

Hides the find and replace dialog.

**Example:**

```javascript
editor.hideFindReplaceDialog();
```

---

### `showGoToLineDialog()`

Shows the go-to-line dialog.

**Example:**

```javascript
editor.showGoToLineDialog();
```

---

### `hideGoToLineDialog()`

Hides the go-to-line dialog.

**Example:**

```javascript
editor.hideGoToLineDialog();
```

---

## Settings and Options

All settings methods follow the getter/setter pattern: call with no arguments to get, call with argument to set.

### `fontSize(size?)`

Gets or sets the font size.

**Parameters:**

- `size` (integer, optional) - Font size in pixels

**Returns**: Current font size (integer)

**Example:**

```javascript
const current = editor.fontSize(); // Get
editor.fontSize(14); // Set to 14px
```

---

### `lineNumber(enable?, temporary?)`

Gets or sets line number visibility.

**Parameters:**

- `enable` (boolean, optional) - True to show line numbers
- `temporary` (boolean, optional) - If true, setting only affects current instance

**Returns**: Boolean indicating if line numbers are enabled

**Used in DMSEditor**: Line 9027

**Example:**

```javascript
const showing = editor.lineNumber(); // Get
editor.lineNumber(true); // Show line numbers
```

---

### `autoComplete(enable?)`

Gets or sets auto-completion feature.

**Parameters:**

- `enable` (boolean, optional) - True to enable auto-completion

**Returns**: Boolean indicating if auto-completion is enabled

**Example:**

```javascript
editor.autoComplete(true); // Enable autocomplete
```

---

### `enableHint(enable?)`

Gets or sets hint feature.

**Parameters:**

- `enable` (boolean, optional) - True to enable hints

**Returns**: Boolean indicating if hints are enabled

**Example:**

```javascript
editor.enableHint(true);
```

---

### `syntaxHighlighting(enable?)`

Gets or sets syntax highlighting.

**Parameters:**

- `enable` (boolean, optional) - True to enable syntax highlighting

**Returns**: Boolean indicating if syntax highlighting is enabled

**Example:**

```javascript
editor.syntaxHighlighting(true);
```

---

### `tabSize(tabSize?)`

Gets or sets tab size.

**Parameters:**

- `tabSize` (integer, optional) - Tab size in spaces

**Returns**: Current tab size (integer)

**Example:**

```javascript
editor.tabSize(4); // Set tab size to 4 spaces
```

---

### `tabAsSpaces(enable?)`

Gets or sets whether tabs are converted to spaces.

**Parameters:**

- `enable` (boolean, optional) - True to use spaces instead of tabs

**Returns**: Boolean indicating if tabs are converted to spaces

**Example:**

```javascript
editor.tabAsSpaces(true); // Convert tabs to spaces
```

---

### `lineWrapped(enable?)`

Gets or sets line wrapping.

**Parameters:**

- `enable` (boolean, optional) - True to enable line wrapping

**Returns**: Boolean indicating if line wrapping is enabled

**Example:**

```javascript
editor.lineWrapped(false); // Disable line wrapping
```

---

### `readOnly(enable?)`

Gets or sets read-only mode.

**Parameters:**

- `enable` (boolean, optional) - True for read-only, false for editable

**Returns**: Boolean indicating if editor is read-only

**Used in DMSEditor**: Lines 4190, 4912, 5738, 6745, 6760, 6761, 6767, 6769, 6785, 7961

**Example:**

```javascript
editor.readOnly(true); // Make read-only
const isReadOnly = editor.readOnly(); // Check status
```

---

### `promptText(text?)`

Gets or sets the prompt text (placeholder).

**Parameters:**

- `text` (string, optional) - Prompt text to display

**Returns**: Current prompt text (string)

**Example:**

```javascript
editor.promptText("Enter SAS code here...");
```

---

## Event Handling

### `bind(evt, listener)`

Binds an event listener to the editor.

**Parameters:**

- `evt` (string) - Event name: "textChanged", "selectionChanged", "caretMoved", or "editAttempted"
- `listener` (function) - Event handler function

**Event Data Structure:**

```javascript
{
  type: "textChanged" | "selectionChanged" | "caretMoved" | "editAttempted",
  data: <event-specific data>
}
```

**Event Details:**

- **textChanged**: `data` is `undefined`
- **selectionChanged**: `data` is `{start: {line: 1, column: 2}, end: {line: 2, column: 4}}`
- **caretMoved**: `data` is `{line: 3, column: 4}`
- **editAttempted**: `data` is `undefined`

**Used in DMSEditor**: Lines 4257, 4258, 4262, 4269

**Example:**

```javascript
editor.bind("textChanged", function (e) {
  console.log("Text changed!");
  // e.data is undefined for textChanged
});

editor.bind("caretMoved", function (e) {
  console.log(`Cursor at line ${e.data.line}, col ${e.data.column}`);
});
```

---

### `unbind(evt, listener)`

Unbinds an event listener from the editor.

**Parameters:**

- `evt` (string) - Event name
- `listener` (function) - Event handler function to remove (must be same reference)

**Example:**

```javascript
function myHandler(e) {
  console.log("Text changed");
}

editor.bind("textChanged", myHandler);
// Later...
editor.unbind("textChanged", myHandler);
```

---

## Keyboard Shortcuts

### `regShortcuts(config)`

Registers keyboard shortcuts to the editor.

**Parameters:**

- `config` (array) - Array of shortcut configuration objects

**Shortcut Configuration Object:**

```javascript
{
  ctrlKey: boolean,   // Whether Ctrl must be pressed
  shiftKey: boolean,  // Whether Shift must be pressed
  altKey: boolean,    // Whether Alt must be pressed
  keyCode: number,    // JavaScript key code
  handle: function(e) // Handler function
}
```

**Example:**

```javascript
editor.regShortcuts([
  {
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    keyCode: 9, // Tab key
    handle: function (e) {
      console.log("Tab pressed");
    },
  },
  {
    ctrlKey: true,
    altKey: false,
    shiftKey: false,
    keyCode: 83, // Ctrl+S
    handle: function (e) {
      e.preventDefault();
      console.log("Save requested");
    },
  },
]);
```

---

## Layout and Resize

### `resize(width?, height?)`

Resizes the editor.

**Parameters:**

- `width` (integer, optional) - New width in pixels
- `height` (integer, optional) - New height in pixels

**Used in DMSEditor**: Lines 4369, 4371

**Example:**

```javascript
editor.resize(800, 600);
```

---

### `resizeOnly(width, height)` ⚠️

Resizes only the editor content (not the container). This is an **extension** to the base API, not documented in CodeEditor.js but used in practice.

**Parameters:**

- `width` (integer) - New width in pixels
- `height` (integer) - New height in pixels

**Used in**: DMSEditor.js:4368, TaskRuntime.js:658, SASStudioInteractiveConsole.js:684, MobileEditor.js:1031, TaskEditor.js:245, XMLEditor.js:667, SASStudioCASConsole.js:1838

**Example:**

```javascript
if (editor.resizeOnly) {
  editor.resizeOnly(width, height);
} else {
  editor.resize(width, height);
}
```

---

## Advanced Features

### `getContextMenu()`

Gets the context menu object for customization.

**Returns**: Context menu object with methods:

- `removeItems(startIndex, count)` - Remove menu items
- `insertItems(index, items)` - Insert menu items

**Used in DMSEditor**: Line 4192

**Example:**

```javascript
const contextMenu = editor.getContextMenu();
if (contextMenu) {
  contextMenu.removeItems(11, 2);
  contextMenu.insertItems(9, [
    {
      type: "entry",
      label: "Custom Action",
      onClick: function () {
        console.log("Custom action clicked");
      },
    },
  ]);
}
```

---

### `setNextFocusHandler(nextFunction)`

Sets the next focus handler for tab navigation (tabbing forward).

**Parameters:**

- `nextFunction` (function) - Function to call when user presses Tab

**Used in DMSEditor**: Line 4248

**Example:**

```javascript
editor.setNextFocusHandler(function () {
  logArea.focus(); // Tab moves to log area
});
```

---

### `setPreviousFocusHandler(prevFunction)`

Sets the previous focus handler for reverse tab navigation (Shift+Tab).

**Parameters:**

- `prevFunction` (function) - Function to call when user presses Shift+Tab

**Used in DMSEditor**: Line 4249

**Example:**

```javascript
editor.setPreviousFocusHandler(function () {
  toolbar.focus(); // Shift+Tab moves to toolbar
});
```

---

### `setLibService(fn)`

Sets the library service function (used for autocomplete).

**Parameters:**

- `fn` (function) - Function that returns library information

**Used in DMSEditor**: Line 4270

**Example:**

```javascript
editor.setLibService(function () {
  return {
    libraries: ["work", "sashelp", "mylib"],
    datasets: ["class", "cars", "baseball"],
  };
});
```

---

### `getHTML(option?)`

Exports editor content as color-coded HTML.

**Parameters:**

- `option` (object, optional):
  - `lineNumber` (boolean) - Include line numbers in HTML
  - `onlyVisible` (boolean) - Export only visible portion

**Returns**: HTML string with syntax highlighting

**Used in DMSEditor**: Lines 9030, 10492

**Example:**

```javascript
const html = editor.getHTML({
  lineNumber: true,
  onlyVisible: false,
});
console.log(html); // "<pre>...</pre>" with color-coded SAS code
```

---

## Internal Properties

### `log`

Reference to the log area content pane. This property is **set by DMSEditor** on the editor instance.

**Type**: ContentPane or similar widget

**Used in DMSEditor**: Line 4188

**Example:**

```javascript
// DMSEditor sets this:
this.editor.log = this.logAreaContentPane;
```

---

### `ctrl_` ⚠️

Internal controller object. **Warning**: This is an internal property and may not be stable across versions.

**Methods accessed:**

- `ctrl_.insertText(text)` - Inserts text at cursor (DMSEditor.js:6768)
- `ctrl_.selection(line, column)` - Sets selection (DMSTask.js:500, 3399, 3458)

**Example:**

```javascript
// Direct internal access (not recommended, but used in practice):
editor.ctrl_.insertText("/* Inserted via ctrl_ */\n");
editor.ctrl_.selection(0, 0); // Select from start
```

---

## Usage Patterns in DMSEditor

### Initialization Pattern

```javascript
// From DMSEditor.prototype.createCodeEditor (line ~4179)
this.editor = new SAS.Editor(
  this.editorDiv.id,
  this.editorContent,
  SAS.Editor.LanguageMode.SasCode,
);

this.editor.log = this.logAreaContentPane;

if (appDMS.currentPerspectiveKey === "interactivePP") {
  this.editor.readOnly(true);
}

appDMS.applyOptionsToEditor(this.editor);

// Event bindings
this.editor.bind("textChanged", lang.hitch(this, this.editorChanged));
this.editor.bind("selectionChanged", lang.hitch(this, this.selectionChanged));
this.editor.bind("caretMoved", lang.hitch(this, this.caretMoved));

this.editor.gotoLine(1);
this.editor.activate();
```

### Common Operations

```javascript
// Get code for submission
const code = this.editor.getText();

// Check if file is modified
if (this.editor.canUndo()) {
  // File has unsaved changes
}

// Enable/disable buttons based on editor state
undoButton.disabled = !this.editor.canUndo();
redoButton.disabled = !this.editor.canRedo();
pasteButton.disabled = !this.editor.canPaste();

// Get selected code or all code
const code = this.editor.getSelectedText() || this.editor.getText();

// Resize handling
if (this.editor.resizeOnly) {
  this.editor.resizeOnly(width, height);
} else {
  this.editor.resize(width, height);
}
```

---

## Implementation Checklist

When implementing a replacement for SAS.Editor, ensure all these methods are implemented:

### Critical (Must Have)

- [x] `getText()` - Used extensively throughout DMSEditor
- [x] `setText(content)` - Used for loading files
- [x] `focus()` - Used for UI interaction
- [x] `bind(evt, listener)` - Used for textChanged, selectionChanged, caretMoved
- [x] `gotoLine(line)` - Used for navigation
- [x] `activate()` - Used for tab switching
- [x] `readOnly(enable?)` - Used in multiple contexts
- [x] `canUndo()` - Used for button state
- [x] `canRedo()` - Used for button state
- [x] `canPaste()` - Used for button state

### Important (Should Have)

- [x] `undo()`, `redo()` - Used for edit operations
- [x] `cut()`, `copy()`, `paste()` - Used for clipboard
- [x] `getSelectedText()` - Used for running selected code
- [x] `selectAll()` - Used in various contexts
- [x] `insert(content)` - Used for inserting text
- [x] `clear()` - Used for clearing content
- [x] `lineCount()` - Used for goto line validation
- [x] `resize(width, height)` - Used for layout
- [x] `resizeOnly(width, height)` - Extension, but widely used

### Settings (Should Have)

- [x] `fontSize(size?)`
- [x] `lineNumber(enable?)` - Used in getHTML
- [x] `autoComplete(enable?)`
- [x] `syntaxHighlighting(enable?)`
- [x] `tabSize(size?)`
- [x] `tabAsSpaces(enable?)`
- [x] `lineWrapped(enable?)`

### Dialogs (Nice to Have)

- [x] `showFindReplaceDialog()` - Used in DMSEditor
- [x] `hideFindReplaceDialog()`
- [x] `showGoToLineDialog()`
- [x] `hideGoToLineDialog()`
- [x] `search(key, config)`
- [x] `replace(key, value, config)`

### Advanced (Nice to Have)

- [x] `getContextMenu()` - Used for customization
- [x] `setNextFocusHandler(fn)` - Used for tab navigation
- [x] `setPreviousFocusHandler(fn)` - Used for tab navigation
- [x] `setLibService(fn)` - Used for autocomplete
- [x] `getHTML(option)` - Used for exporting
- [x] `promptText(text?)`
- [x] `enableHint(enable?)`
- [x] `regShortcuts(config)`

### Internal (Advanced)

- [x] `ctrl_.insertText(text)` - Used in DMSEditor:6768
- [x] `ctrl_.selection(line, col)` - Used in DMSTask

### Lifecycle

- [x] `dispose()` - Used for cleanup
- [x] `deactivate()` - Used for tab switching
- [x] `unbind(evt, listener)` - Used for cleanup

---

## References

- **Source File**: `resources/js/sas-commons/controls/CodeEditor.js`
- **Main Consumer**: `resources/js/webdms/DMSEditor.js`
- **Other Consumers**: TaskEditor.js, XMLEditor.js, SASStudioInteractiveConsole.js, MobileEditor.js, TaskRuntime.js, and more
- **Type Definitions**: [sas-editor.d.ts](./sas-editor.d.ts) - TypeScript definitions for IDE support
- **Usage Map**: [EDITOR_USAGE_MAP.md](./EDITOR_USAGE_MAP.md) - Complete map of all 20+ files that use the editor API
- **Extension Guide**: [README.md](./README.md) - Chrome extension usage and development guide

## See Also

For a comprehensive view of where and how the editor API is used across the entire SAS Studio codebase:

- **[EDITOR_USAGE_MAP.md](./EDITOR_USAGE_MAP.md)** - Detailed map showing:
  - All 20+ files that use the editor API
  - File-by-file breakdown with line numbers
  - Internal API usage (ctrl*.insertText, ctrl*.selection)
  - Language mode usage patterns
  - Editor access patterns across different components
  - Quick reference links to all relevant source files
