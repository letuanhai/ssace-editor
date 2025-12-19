# SAS.Editor API Usage Map

This document provides a comprehensive map of all files in the SAS Studio codebase that use the SAS.Editor API or interact with editor instances. Use this to understand the full scope of editor integration across the application.

## Table of Contents

- [Overview](#overview)
- [Primary Editor Components](#primary-editor-components)
- [Editor Consumers](#editor-consumers)
- [Perspective Files](#perspective-files)
- [Mobile Components](#mobile-components)
- [Task System](#task-system)
- [Other Components](#other-components)
- [API Method Usage Summary](#api-method-usage-summary)
- [Internal API Usage](#internal-api-usage)

---

## Overview

The SAS.Editor API is used extensively throughout the SAS Studio application. This map identifies:

- **14 files** that directly interact with editor instances
- **10 files** that instantiate or reference `SAS.Editor`
- **Multiple perspectives** that manage editor lifecycle
- **Mobile variants** with their own editor implementations

---

## Primary Editor Components

### 1. SAS.Editor Class Definition

**File**: [`resources/js/sas-commons/controls/CodeEditor.js`](../../resources/js/sas-commons/controls/CodeEditor.js)

**Purpose**: Defines the SAS.Editor class and all its methods

**Key Components**:

- Class constructor: `SAS.Editor(id, content, langMode)`
- Language modes: `SAS.Editor.LanguageMode.*`
- All public API methods (~60 methods)
- Internal components: EditorCore, EditorController, Settings

**Related Files**:

- [`resources/js/sas-commons/controls/_codeEditor/EditorCore.js`](../../resources/js/sas-commons/controls/_codeEditor/EditorCore.js) - Core editor logic
- [`resources/js/sas-commons/controls/_codeEditor/EditorController.js`](../../resources/js/sas-commons/controls/_codeEditor/EditorController.js) - Controller
- [`resources/js/sas-commons/controls/_codeEditor/Settings.js`](../../resources/js/sas-commons/controls/_codeEditor/Settings.js) - Settings management
- [`resources/js/sas-commons/controls/_codeEditor/CodeChecker.js`](../../resources/js/sas-commons/controls/_codeEditor/CodeChecker.js) - Syntax validation
- [`resources/js/sas-commons/controls/_codeEditor/SyntaxColorerFactory.js`](../../resources/js/sas-commons/controls/_codeEditor/SyntaxColorerFactory.js) - Syntax highlighting
- [`resources/js/sas-commons/controls/_codeEditor/TransFactory.js`](../../resources/js/sas-commons/controls/_codeEditor/TransFactory.js) - Transformations

---

## Editor Consumers

### 2. DMSEditor (Main Code Editor)

**File**: [`resources/js/webdms/DMSEditor.js`](../../resources/js/webdms/DMSEditor.js)

**Purpose**: Primary editor component for SAS code files

**Editor Instantiation**:

- Line ~4179: `createCodeEditor()` - Creates new `SAS.Editor` instance
- Uses `SAS.Editor.LanguageMode.SasCode`

**Heavy API Usage** (100+ editor method calls):

- **Content**: `getText()` (13 calls), `setText()` (2 calls), `getSelectedText()` (6 calls)
- **Navigation**: `gotoLine()` (4 calls), `selectAll()` (2 calls), `focus()` (1 call)
- **State**: `canUndo()` (2 calls), `canRedo()` (1 call), `canPaste()` (2 calls)
- **Clipboard**: `cut()`, `copy()`, `paste()`, `undo()`, `redo()`
- **Events**: `bind()` (4 calls for textChanged, selectionChanged, caretMoved, drop)
- **Settings**: `readOnly()` (10 calls), `lineNumber()` (1 call)
- **Advanced**: `getContextMenu()`, `setNextFocusHandler()`, `setPreviousFocusHandler()`, `setLibService()`
- **Layout**: `resize()` (2 calls), `resizeOnly()` (1 call)
- **Dialogs**: `showFindReplaceDialog()` (1 call)
- **Export**: `getHTML()` (2 calls)
- **Lifecycle**: `activate()` (4 calls)

**Internal API Usage**:

- Line 6768: `this.editor.ctrl_.insertText(data.trim())` - Direct controller access

**Key Methods**:

- `createCodeEditor()` - Creates and initializes the editor
- `editorChanged()` - Handler for text changes
- `selectionChanged()` - Handler for selection changes
- `caretMoved()` - Handler for cursor movement
- `applyOptionsToEditor()` - Applies user preferences

**Line Numbers Reference**: 1894, 2601, 2665, 2666, 4188, 4190, 4192, 4223, 4236, 4247-4249, 4257-4262, 4265, 4269-4271, 4350-4351, 4368-4369, 4371, 4417, 4912, 5108, 5118, 5141, 5146, 5182-5183, 5226, 5236, 5246, 5665, 5732, 5738, 5797-5801, 5805, 5809, 5907, 5909, 6392, 6394, 6551-6552, 6659-6660, 6745, 6750, 6760-6761, 6767-6769, 6785, 6936, 7478, 7729, 7731, 7886, 7961-7962, 8068, 8855-8856, 9027, 9030, 9767, 10209, 10252, 10492, 10501

---

### 3. XMLEditor

**File**: [`resources/js/webdms/XMLEditor.js`](../../resources/js/webdms/XMLEditor.js)

**Purpose**: Editor for XML files (extends from DMSEditor-like functionality)

**Editor Instantiation**:

- Creates `SAS.Editor` with `SAS.Editor.LanguageMode.Xml`

**API Usage**:

- `getText()` - Get XML content
- `setText()` - Set XML content
- `resize()` / `resizeOnly()` - Layout management (Line ~667-668)
- `bind()` - Event handling for text changes
- `activate()` - Editor activation

**Key Difference**: Uses XML language mode instead of SAS

---

### 4. TaskEditor

**File**: [`resources/js/webdms/TaskEditor.js`](../../resources/js/webdms/TaskEditor.js)

**Purpose**: Editor for task definitions

**Editor Instantiation**:

- Creates `SAS.Editor` for task code editing

**API Usage**:

- `getText()` - Get task code
- `setText()` - Set task code
- `resize()` / `resizeOnly()` - Layout (Lines ~245-246, ~285-286)
- `bind()` - Event handling
- `focus()` - Focus management
- `readOnly()` - Read-only mode for certain tasks

---

### 5. SASStudioInteractiveConsole

**File**: [`resources/js/webdms/SASStudioInteractiveConsole.js`](../../resources/js/webdms/SASStudioInteractiveConsole.js)

**Purpose**: Interactive console for submitting SAS code

**Editor Instantiation**:

- Creates `SAS.Editor` for console input
- Uses `SAS.Editor.LanguageMode.SasCode`

**API Usage**:

- `getText()` - Get console input
- `setText()` - Set console content
- `clear()` - Clear console
- `insert()` - Insert code snippets
- `resize()` / `resizeOnly()` - Layout (Line ~684-685)
- `bind()` - Event handling
- `readOnly()` - Control input state
- `focus()` - Focus console input

---

### 6. SASStudioCASConsole (CAS Console)

**File**: [`resources/js/webdms/cas/SASStudioCASConsole.js`](../../resources/js/webdms/cas/SASStudioCASConsole.js)

**Purpose**: CAS (Cloud Analytic Services) console editor

**Editor Instantiation**:

- Creates `SAS.Editor` with `SAS.Editor.LanguageMode.SasCode`

**API Usage**:

- `getText()` - Get CAS code
- `setText()` - Set CAS code
- `resize()` / `resizeOnly()` - Layout (Line ~1838)
- `bind()` - Event handling
- `focus()` - Focus management
- `readOnly()` - Read-only mode

---

## Perspective Files

Perspectives manage the overall application layout and editor lifecycle.

### 7. AppDMS (Main Application Controller)

**File**: [`resources/js/webdms/AppDMS.js`](../../resources/js/webdms/AppDMS.js)

**Purpose**: Main application controller, manages editors across perspectives

**Key Methods**:

- `applyOptionsToEditor(editor)` - Applies user preferences to any editor instance
  - Calls: `fontSize()`, `lineNumber()`, `autoComplete()`, `syntaxHighlighting()`, `tabSize()`, `tabAsSpaces()`, `lineWrapped()`
- `getCurrentPerspectiveSASStudioTabs()` - Gets current tab manager with editors

**Editor Access Pattern**:

```javascript
const tabs = appDMS.getCurrentPerspectiveSASStudioTabs();
tabs.mainTabs[i].editor.editor; // Access to SAS.Editor instance
```

---

### 8. SASStudioTabs (Tab Management)

**File**: [`resources/js/webdms/SASStudioTabs.js`](../../resources/js/webdms/SASStudioTabs.js)

**Purpose**: Manages tabs containing editors

**Editor Access**:

- Maintains `mainTabs` array where each tab has `editor.editor` (SAS.Editor instance)
- Manages editor lifecycle when tabs open/close
- Handles editor activation when switching tabs

---

### 9. Perspective: AAD (Advanced Analytics & Data)

**File**: [`resources/js/webdms/perspectives/js/aad.js`](../../resources/js/webdms/perspectives/js/aad.js)

**Purpose**: AAD perspective configuration

**Editor Usage**:

- Accesses editor instances through tab management
- Applies perspective-specific editor settings

---

### 10. Perspective: CASPP (CAS Perspective)

**File**: [`resources/js/webdms/perspectives/js/CASPP.js`](../../resources/js/webdms/perspectives/js/CASPP.js)

**Purpose**: CAS perspective with CAS console editor

**Editor Usage**:

- Manages CAS console editor instances
- Configures CAS-specific editor settings

---

### 11. Perspective: interactivePP (Interactive)

**File**: [`resources/js/webdms/perspectives/js/interactivePP.js`](../../resources/js/webdms/perspectives/js/interactivePP.js)

**Purpose**: Interactive perspective with console

**Editor Usage**:

- Manages interactive console editor
- Often sets editors to `readOnly(true)` in this perspective

---

### 12. Perspective: vp (Visual Programming)

**File**: [`resources/js/webdms/perspectives/js/vp.js`](../../resources/js/webdms/perspectives/js/vp.js)

**Purpose**: Visual programming perspective

**Editor Usage**:

- Manages code editors within visual programming context
- May use read-only editors for generated code

---

### 13. Perspective: test

**File**: [`resources/js/webdms/perspectives/js/test.js`](../../resources/js/webdms/perspectives/js/test.js)

**Purpose**: Test perspective (development/testing)

**Editor Usage**:

- Test configurations for editor instances

---

## Mobile Components

### 14. MobileEditor

**File**: [`resources/js/webdms/mobile/webdms/MobileEditor.js`](../../resources/js/webdms/mobile/webdms/MobileEditor.js)

**Purpose**: Mobile-optimized editor component

**Editor Instantiation**:

- Creates `SAS.Editor` for mobile interface
- Uses `SAS.Editor.LanguageMode.SasCode`

**API Usage**:

- Similar to DMSEditor but with mobile-specific adaptations
- `resize()` / `resizeOnly()` - Mobile layout (Lines ~1031-1032, ~1073-1074)
- `getText()`, `setText()`, `bind()`, `focus()`, etc.
- Mobile-specific touch event handling

---

### 15. MobileAppDMS

**File**: [`resources/js/webdms/mobile/webdms/MobileAppDMS.js`](../../resources/js/webdms/mobile/webdms/MobileAppDMS.js)

**Purpose**: Mobile app controller

**Editor Access**:

- Similar to AppDMS but for mobile
- Manages mobile editor instances

---

### 16. MobileDMSLibraries

**File**: [`resources/js/webdms/mobile/webdms/MobileDMSLibraries.js`](../../resources/js/webdms/mobile/webdms/MobileDMSLibraries.js)

**Purpose**: Mobile library browser

**Editor Usage**:

- May access editor for library content preview

---

### 17. MobileDMSProjects

**File**: [`resources/js/webdms/mobile/webdms/MobileDMSProjects.js`](../../resources/js/webdms/mobile/webdms/MobileDMSProjects.js)

**Purpose**: Mobile project management

**Editor Usage**:

- Manages editors for project files

---

## Task System

### 18. DMSTask

**File**: [`resources/js/webdms/DMSTask.js`](../../resources/js/webdms/DMSTask.js)

**Purpose**: Task execution and management

**Internal API Usage** (⚠️ Uses internal `ctrl_` API):

- Line 500: `this.codeEditor.ctrl_.selection(0, 0)` - Sets cursor position
- Line 3399: `this.codeEditor.ctrl_.selection(0, 0)` - Sets cursor position
- Line 3458: `this.codeEditor.ctrl_.selection(0, 0)` - Sets cursor position

**Public API Usage**:

- `getText()` - Get task code
- `setText()` - Set task code
- `focus()` - Focus task editor

---

### 19. DMSTasks

**File**: [`resources/js/webdms/DMSTasks.js`](../../resources/js/webdms/DMSTasks.js)

**Purpose**: Task collection management

**Editor Access**:

- Accesses editors through task instances
- Manages task editor lifecycle

---

### 20. TaskRuntime

**File**: [`resources/js/webdms/TaskRuntime.js`](../../resources/js/webdms/TaskRuntime.js)

**Purpose**: Task runtime execution

**API Usage**:

- Line ~658-659: `resize()` / `resizeOnly()` - Layout during task execution
- `getText()` - Get code to execute
- `readOnly()` - Control execution state

---

## Other Components

### 21. CTMColorPicker

**File**: [`resources/js/webdms/ctmControls/CTMColorPicker.js`](../../resources/js/webdms/ctmControls/CTMColorPicker.js)

**Purpose**: Color picker control (may interact with editor for code insertion)

**Editor Usage**:

- May access editor to insert color codes
- Limited direct editor API usage

---

## API Method Usage Summary

This table shows which files use which editor methods:

| Method                      | DMSEditor | XMLEditor | TaskEditor | InteractiveConsole | CASConsole | MobileEditor | DMSTask | AppDMS | TaskRuntime |
| --------------------------- | --------- | --------- | ---------- | ------------------ | ---------- | ------------ | ------- | ------ | ----------- |
| `getText()`                 | ✓✓✓       | ✓         | ✓          | ✓                  | ✓          | ✓            | ✓       | -      | ✓           |
| `setText()`                 | ✓         | ✓         | ✓          | ✓                  | ✓          | ✓            | ✓       | -      | -           |
| `focus()`                   | ✓         | ✓         | ✓          | ✓                  | ✓          | ✓            | ✓       | -      | -           |
| `bind()`                    | ✓✓✓✓      | ✓         | ✓          | ✓                  | ✓          | ✓            | -       | -      | -           |
| `gotoLine()`                | ✓✓✓✓      | -         | -          | -                  | -          | -            | -       | -      | -           |
| `activate()`                | ✓✓✓✓      | ✓         | -          | -                  | -          | -            | -       | -      | -           |
| `readOnly()`                | ✓✓✓       | -         | ✓          | ✓                  | ✓          | -            | -       | -      | ✓           |
| `canUndo()`                 | ✓✓        | -         | -          | -                  | -          | -            | -       | -      | -           |
| `canRedo()`                 | ✓         | -         | -          | -                  | -          | -            | -       | -      | -           |
| `canPaste()`                | ✓✓        | -         | -          | -                  | -          | -            | -       | -      | -           |
| `undo()`                    | ✓         | -         | -          | -                  | -          | -            | -       | -      | -           |
| `redo()`                    | ✓         | -         | -          | -                  | -          | -            | -       | -      | -           |
| `cut()`                     | ✓         | -         | -          | -                  | -          | -            | -       | -      | -           |
| `copy()`                    | ✓         | -         | -          | -                  | -          | -            | -       | -      | -           |
| `paste()`                   | ✓         | -         | -          | -                  | -          | -            | -       | -      | -           |
| `selectAll()`               | ✓✓        | -         | -          | -                  | -          | -            | -       | -      | -           |
| `getSelectedText()`         | ✓✓✓       | -         | -          | -                  | -          | -            | -       | -      | -           |
| `insert()`                  | ✓         | -         | -          | ✓                  | -          | -            | -       | -      | -           |
| `clear()`                   | ✓         | -         | -          | ✓                  | -          | -            | -       | -      | -           |
| `lineCount()`               | ✓✓✓       | -         | -          | -                  | -          | -            | -       | -      | -           |
| `resize()`                  | ✓✓        | ✓         | ✓          | ✓                  | ✓          | ✓            | -       | -      | ✓           |
| `resizeOnly()`              | ✓         | ✓         | ✓          | ✓                  | ✓          | ✓            | -       | -      | ✓           |
| `fontSize()`                | -         | -         | -          | -                  | -          | -            | -       | ✓      | -           |
| `lineNumber()`              | ✓         | -         | -          | -                  | -          | -            | -       | ✓      | -           |
| `autoComplete()`            | -         | -         | -          | -                  | -          | -            | -       | ✓      | -           |
| `syntaxHighlighting()`      | -         | -         | -          | -                  | -          | -            | -       | ✓      | -           |
| `tabSize()`                 | -         | -         | -          | -                  | -          | -            | -       | ✓      | -           |
| `tabAsSpaces()`             | -         | -         | -          | -                  | -          | -            | -       | ✓      | -           |
| `lineWrapped()`             | -         | -         | -          | -                  | -          | -            | -       | ✓      | -           |
| `getContextMenu()`          | ✓         | -         | -          | -                  | -          | -            | -       | -      | -           |
| `setNextFocusHandler()`     | ✓         | -         | -          | -                  | -          | -            | -       | -      | -           |
| `setPreviousFocusHandler()` | ✓         | -         | -          | -                  | -          | -            | -       | -      | -           |
| `setLibService()`           | ✓         | -         | -          | -                  | -          | -            | -       | -      | -           |
| `getHTML()`                 | ✓✓        | -         | -          | -                  | -          | -            | -       | -      | -           |
| `showFindReplaceDialog()`   | ✓         | -         | -          | -                  | -          | -            | -       | -      | -           |

**Legend**:

- ✓ = Used 1-2 times
- ✓✓ = Used 3-5 times
- ✓✓✓ = Used 6-10 times
- ✓✓✓✓ = Used 11+ times

---

## Internal API Usage

### ctrl\_ Object (Internal Controller)

**⚠️ Warning**: These are internal APIs that are not part of the official SAS.Editor interface but are used in practice.

#### ctrl\_.insertText(text)

**Used in**:

- [`DMSEditor.js:6768`](../../resources/js/webdms/DMSEditor.js#L6768) - Direct text insertion for drag-and-drop

**Usage Pattern**:

```javascript
this.editor.ctrl_.insertText(data.trim());
```

#### ctrl\_.selection(line, column)

**Used in**:

- [`DMSTask.js:500`](../../resources/js/webdms/DMSTask.js#L500) - Reset cursor position
- [`DMSTask.js:3399`](../../resources/js/webdms/DMSTask.js#L3399) - Reset cursor position
- [`DMSTask.js:3458`](../../resources/js/webdms/DMSTask.js#L3458) - Reset cursor position

**Usage Pattern**:

```javascript
this.codeEditor.ctrl_.selection(0, 0); // Move cursor to start
```

---

## Editor Instance Access Patterns

### Pattern 1: Direct Editor Reference

```javascript
// In DMSEditor, XMLEditor, TaskEditor, etc.
this.editor = new SAS.Editor(containerId, content, langMode);
this.editor.getText();
```

### Pattern 2: Through Tab Manager

```javascript
// In perspectives and tab management
const tabs = appDMS.getCurrentPerspectiveSASStudioTabs();
const editorInstance = tabs.mainTabs[0].editor.editor; // Note: double .editor
editorInstance.getText();
```

### Pattern 3: Through Task

```javascript
// In task system
this.codeEditor = new SAS.Editor(...);
this.codeEditor.getText();
```

---

## Language Mode Usage

Different editor instances use different language modes:

| Component          | Language Mode                     | File Type        |
| ------------------ | --------------------------------- | ---------------- |
| DMSEditor          | `SAS.Editor.LanguageMode.SasCode` | .sas, .sas7bpgm  |
| XMLEditor          | `SAS.Editor.LanguageMode.Xml`     | .xml             |
| TaskEditor         | `SAS.Editor.LanguageMode.SasCode` | Task definitions |
| InteractiveConsole | `SAS.Editor.LanguageMode.SasCode` | Console input    |
| CASConsole         | `SAS.Editor.LanguageMode.SasCode` | CAS code         |
| MobileEditor       | `SAS.Editor.LanguageMode.SasCode` | Mobile SAS files |

Other available modes (may be used in other contexts):

- `SAS.Editor.LanguageMode.Text` - Plain text
- `SAS.Editor.LanguageMode.Html` - HTML files
- `SAS.Editor.LanguageMode.SclCode` - SCL code
- `SAS.Editor.LanguageMode.Log` - SAS log output
- `SAS.Editor.LanguageMode.Lst` - SAS listing output
- `SAS.Editor.LanguageMode.Mdx` - MDX queries
- `SAS.Editor.LanguageMode.R` - R code

---

## Key Takeaways for Editor Replacement

When implementing a replacement for SAS.Editor, you must ensure compatibility with:

1. **Primary Consumer**: DMSEditor (100+ API calls)
2. **Secondary Consumers**: XMLEditor, TaskEditor, InteractiveConsole, CASConsole
3. **Mobile Variants**: MobileEditor and mobile app components
4. **Task System**: DMSTask, TaskRuntime
5. **Application Controller**: AppDMS.applyOptionsToEditor()
6. **Tab Management**: SASStudioTabs
7. **Perspectives**: All perspective files that manage editor lifecycle

### Critical Integration Points

1. **Event System**: Must properly implement `bind()` for textChanged, selectionChanged, caretMoved
2. **Settings Application**: Must support all settings called by `AppDMS.applyOptionsToEditor()`
3. **Layout Management**: Must implement both `resize()` and `resizeOnly()`
4. **Internal API**: Should implement `ctrl_.insertText()` and `ctrl_.selection()` for compatibility
5. **Language Modes**: Must support multiple language modes (primarily SasCode and Xml)
6. **Read-Only State**: Must properly handle `readOnly()` mode switching
7. **Undo/Redo**: Must implement full undo/redo stack with `canUndo()`, `canRedo()`

---

## File Links Quick Reference

### Core Files

- [CodeEditor.js](../../resources/js/sas-commons/controls/CodeEditor.js) - SAS.Editor class definition
- [DMSEditor.js](../../resources/js/webdms/DMSEditor.js) - Main code editor component
- [AppDMS.js](../../resources/js/webdms/AppDMS.js) - Application controller

### Editor Types

- [XMLEditor.js](../../resources/js/webdms/XMLEditor.js) - XML file editor
- [TaskEditor.js](../../resources/js/webdms/TaskEditor.js) - Task definition editor
- [SASStudioInteractiveConsole.js](../../resources/js/webdms/SASStudioInteractiveConsole.js) - Interactive console
- [SASStudioCASConsole.js](../../resources/js/webdms/cas/SASStudioCASConsole.js) - CAS console

### Management

- [SASStudioTabs.js](../../resources/js/webdms/SASStudioTabs.js) - Tab management

### Task System

- [DMSTask.js](../../resources/js/webdms/DMSTask.js) - Task execution (uses internal ctrl\_ API)
- [DMSTasks.js](../../resources/js/webdms/DMSTasks.js) - Task collection
- [TaskRuntime.js](../../resources/js/webdms/TaskRuntime.js) - Task runtime

### Mobile

- [MobileEditor.js](../../resources/js/webdms/mobile/webdms/MobileEditor.js) - Mobile editor
- [MobileAppDMS.js](../../resources/js/webdms/mobile/webdms/MobileAppDMS.js) - Mobile app controller
- [MobileDMSLibraries.js](../../resources/js/webdms/mobile/webdms/MobileDMSLibraries.js) - Mobile libraries
- [MobileDMSProjects.js](../../resources/js/webdms/mobile/webdms/MobileDMSProjects.js) - Mobile projects

### Perspectives

- [aad.js](../../resources/js/webdms/perspectives/js/aad.js) - AAD perspective
- [CASPP.js](../../resources/js/webdms/perspectives/js/CASPP.js) - CAS perspective
- [interactivePP.js](../../resources/js/webdms/perspectives/js/interactivePP.js) - Interactive perspective
- [vp.js](../../resources/js/webdms/perspectives/js/vp.js) - Visual programming perspective
- [test.js](../../resources/js/webdms/perspectives/js/test.js) - Test perspective

---

## Related Documentation

- [SAS_EDITOR_API.md](./SAS_EDITOR_API.md) - Complete API reference with examples
- [sas-editor.d.ts](./sas-editor.d.ts) - TypeScript type definitions
- [README.md](./README.md) - Extension overview and usage guide

---

**Last Updated**: 2025-10-30
**SAS Studio Version**: 3.82
