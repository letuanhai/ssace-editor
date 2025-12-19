/**
 * TypeScript Definition File for SAS.Editor
 *
 * This file provides type definitions for the original SAS Studio code editor interface.
 * Use this for IDE autocomplete and type checking when implementing editor replacements.
 *
 * Based on: SAS.Editor from sas-commons/controls/CodeEditor.js (SAS Studio 3.82)
 * Version: 1.9
 */

declare namespace SAS {
  /**
   * Language modes supported by the SAS Editor
   */
  interface LanguageMode {
    Unset: "none";
    Text: "text";
    Html: "html";
    SclCode: "scl";
    SasCode: "sas";
    Xml: "xml";
    Log: "log";
    Lst: "lst";
    Mdx: "mdx";
    R: "r";
  }

  /**
   * Event data structures for editor events
   */
  interface EditorEventData {
    /** Event type: textChanged, selectionChanged, caretMoved, or editAttempted */
    type: "textChanged" | "selectionChanged" | "caretMoved" | "editAttempted";
    /** Event-specific data */
    data?: any;
  }

  /**
   * Position in the editor (line and column)
   */
  interface Position {
    /** Line number (0-based) */
    line: number;
    /** Column number (0-based) */
    column: number;
  }

  /**
   * Selection range in the editor
   */
  interface SelectionRange {
    /** Start position of selection */
    start: Position;
    /** End position of selection */
    end: Position;
  }

  /**
   * Caret moved event data
   */
  interface CaretMovedEventData extends EditorEventData {
    type: "caretMoved";
    data: Position;
  }

  /**
   * Selection changed event data
   */
  interface SelectionChangedEventData extends EditorEventData {
    type: "selectionChanged";
    data: SelectionRange;
  }

  /**
   * Text changed event data
   */
  interface TextChangedEventData extends EditorEventData {
    type: "textChanged";
    data: undefined;
  }

  /**
   * Edit attempted event data (for read-only editors)
   */
  interface EditAttemptedEventData extends EditorEventData {
    type: "editAttempted";
    data: undefined;
  }

  /**
   * Search/replace configuration options
   */
  interface SearchConfig {
    /** Search direction: "forward" or "backward" */
    direction?: "forward" | "backward";
    /** Whether to ignore case */
    caseIgnored?: boolean;
    /** Whether to wrap around when reaching end/start */
    wrapped?: boolean;
    /** Whether to search/replace all occurrences */
    all?: boolean;
  }

  /**
   * Shortcut key configuration
   */
  interface ShortcutConfig {
    /** Whether Ctrl key must be pressed */
    ctrlKey: boolean;
    /** Whether Shift key must be pressed */
    shiftKey: boolean;
    /** Whether Alt key must be pressed */
    altKey: boolean;
    /** Key code of the key to bind */
    keyCode: number;
    /** Handler function to execute */
    handle: (event: KeyboardEvent) => void;
  }

  /**
   * HTML export options
   */
  interface HTMLExportOptions {
    /** Whether to include line numbers in exported HTML */
    lineNumber?: boolean;
    /** Whether to export only visible portion */
    onlyVisible?: boolean;
  }

  /**
   * Context menu interface (limited documentation available)
   */
  interface ContextMenu {
    /** Remove menu items */
    removeItems?(startIndex: number, count: number): void;
    /** Insert menu items */
    insertItems?(index: number, items: ContextMenuItem[]): void;
  }

  /**
   * Context menu item
   */
  interface ContextMenuItem {
    type: "entry" | "separator";
    label?: string;
    onClick?: () => void;
  }

  /**
   * SAS Enhanced Editor (HTML5)
   *
   * Main editor class that provides SAS code editing capabilities in the browser.
   * This is the interface that needs to be implemented by any replacement editor.
   */
  class Editor {
    /**
     * Language modes supported by the editor
     */
    static LanguageMode: LanguageMode;

    /**
     * Creates a new editor instance
     * @param id - The ID of the container element (e.g., a div) that will hold the editor
     * @param content - Initial text content to display in the editor
     * @param langMode - Language mode for syntax highlighting (from SAS.Editor.LanguageMode)
     */
    constructor(id: string, content?: string, langMode?: string);

    // ============================================================================
    // LIFECYCLE METHODS
    // ============================================================================

    /**
     * Frees resources held by the editor object
     */
    dispose(): void;

    /**
     * Makes the editor instance active (for find/replace, tab switching, etc.)
     */
    activate(): void;

    /**
     * Cancels the active status of the editor
     */
    deactivate(): void;

    /**
     * Gives focus to the editor
     */
    focus(): void;

    // ============================================================================
    // CONTENT METHODS
    // ============================================================================

    /**
     * Gets all content from the editor
     * @returns The complete text content
     */
    getText(): string;

    /**
     * Gets the currently selected text
     * @returns The selected text, or empty string if no selection
     */
    getSelectedText(): string;

    /**
     * Replaces all content in the editor (resets undo/redo history)
     * @param content - New content to set
     */
    setText(content: string): void;

    /**
     * Inserts content at cursor position or replaces selection
     * @param content - Content to insert
     */
    insert(content: string): void;

    /**
     * Clears all content from the editor (can be undone)
     */
    clear(): void;

    /**
     * Gets the total number of lines in the editor
     * @returns Line count
     */
    lineCount(): number;

    // ============================================================================
    // SELECTION AND NAVIGATION
    // ============================================================================

    /**
     * Selects all text in the editor
     */
    selectAll(): void;

    /**
     * Moves cursor to the specified line
     * @param line - Line number (1-based)
     */
    gotoLine(line: number): void;

    // ============================================================================
    // CLIPBOARD OPERATIONS
    // ============================================================================

    /**
     * Cuts selected content to clipboard
     */
    cut(): void;

    /**
     * Copies selected content to clipboard
     */
    copy(): void;

    /**
     * Pastes content from clipboard
     */
    paste(): void;

    /**
     * Checks if paste operation is available
     * @returns True if paste is available
     */
    canPaste(): boolean;

    // ============================================================================
    // UNDO/REDO
    // ============================================================================

    /**
     * Undoes the last action
     */
    undo(): void;

    /**
     * Redoes the last undone action
     */
    redo(): void;

    /**
     * Checks if undo is available
     * @returns True if there are actions to undo
     */
    canUndo(): boolean;

    /**
     * Checks if redo is available
     * @returns True if there are actions to redo
     */
    canRedo(): boolean;

    // ============================================================================
    // SEARCH AND REPLACE
    // ============================================================================

    /**
     * Searches for text in the editor
     * @param key - Text to search for
     * @param config - Search configuration options
     * @returns Search result (implementation-specific)
     */
    search(key: string, config?: SearchConfig): any;

    /**
     * Replaces text in the editor
     * @param key - Text to search for
     * @param value - Replacement text
     * @param config - Replace configuration options
     */
    replace(key: string, value: string, config?: SearchConfig): void;

    /**
     * Shows the find and replace dialog
     */
    showFindReplaceDialog(): void;

    /**
     * Hides the find and replace dialog
     */
    hideFindReplaceDialog(): void;

    /**
     * Shows the go-to-line dialog
     */
    showGoToLineDialog(): void;

    /**
     * Hides the go-to-line dialog
     */
    hideGoToLineDialog(): void;

    // ============================================================================
    // SETTINGS AND OPTIONS
    // ============================================================================

    /**
     * Gets or sets the font size
     * @param size - Font size in pixels (optional, omit to get current value)
     * @returns Current font size
     */
    fontSize(size?: number): number;

    /**
     * Gets or sets line number visibility
     * @param enable - True to show line numbers, false to hide (optional)
     * @param temporary - If true, setting only affects current instance (optional)
     * @returns True if line numbers are enabled
     */
    lineNumber(enable?: boolean, temporary?: boolean): boolean;

    /**
     * Gets or sets auto-completion feature
     * @param enable - True to enable, false to disable (optional)
     * @returns True if auto-completion is enabled
     */
    autoComplete(enable?: boolean): boolean;

    /**
     * Gets or sets hint feature
     * @param enable - True to enable, false to disable (optional)
     * @returns True if hints are enabled
     */
    enableHint(enable?: boolean): boolean;

    /**
     * Gets or sets syntax highlighting
     * @param enable - True to enable, false to disable (optional)
     * @returns True if syntax highlighting is enabled
     */
    syntaxHighlighting(enable?: boolean): boolean;

    /**
     * Gets or sets tab size
     * @param tabSize - Tab size in spaces (optional)
     * @returns Current tab size
     */
    tabSize(tabSize?: number): number;

    /**
     * Gets or sets whether tabs are converted to spaces
     * @param enable - True to use spaces, false to use tabs (optional)
     * @returns True if tabs are converted to spaces
     */
    tabAsSpaces(enable?: boolean): boolean;

    /**
     * Gets or sets line wrapping
     * @param enable - True to enable line wrapping, false to disable (optional)
     * @returns True if line wrapping is enabled
     */
    lineWrapped(enable?: boolean): boolean;

    /**
     * Gets or sets read-only mode
     * @param enable - True for read-only, false for editable (optional)
     * @returns True if editor is read-only
     */
    readOnly(enable?: boolean): boolean;

    /**
     * Gets or sets the prompt text (placeholder)
     * @param text - Prompt text to display (optional)
     * @returns Current prompt text
     */
    promptText(text?: string): string;

    // ============================================================================
    // EVENT HANDLING
    // ============================================================================

    /**
     * Binds an event listener to the editor
     *
     * Available events:
     * - textChanged: Fired when text content changes (e.data.type = 'textChanged', e.data.data = undefined)
     * - selectionChanged: Fired when selection changes (e.data.type = 'selectionChanged', e.data.data = {start: {line, column}, end: {line, column}})
     * - caretMoved: Fired when cursor position changes (e.data.type = 'caretMoved', e.data.data = {line, column})
     * - editAttempted: Fired when user tries to edit read-only editor (e.data.type = 'editAttempted', e.data.data = undefined)
     *
     * @param evt - Event name
     * @param listener - Event handler function
     */
    bind(evt: string, listener: (event: EditorEventData) => void): void;

    /**
     * Unbinds an event listener from the editor
     * @param evt - Event name
     * @param listener - Event handler function to remove
     */
    unbind(evt: string, listener: (event: EditorEventData) => void): void;

    // ============================================================================
    // KEYBOARD SHORTCUTS
    // ============================================================================

    /**
     * Registers keyboard shortcuts
     * @param config - Array of shortcut configurations
     */
    regShortcuts(config: ShortcutConfig[]): void;

    // ============================================================================
    // LAYOUT AND RESIZE
    // ============================================================================

    /**
     * Resizes the editor
     * @param width - New width in pixels
     * @param height - New height in pixels
     */
    resize(width?: number, height?: number): void;

    /**
     * Resizes only the editor content (not implemented in all versions)
     * This is an extension to the base API used in some contexts
     * @param width - New width in pixels
     * @param height - New height in pixels
     */
    resizeOnly?(width: number, height: number): void;

    // ============================================================================
    // ADVANCED FEATURES
    // ============================================================================

    /**
     * Gets the context menu object for customization
     * @returns Context menu object, or null if not available
     */
    getContextMenu(): ContextMenu | null;

    /**
     * Sets the next focus handler for tab navigation
     * @param nextFunction - Function to call when tabbing forward
     */
    setNextFocusHandler(nextFunction: () => void): void;

    /**
     * Sets the previous focus handler for tab navigation
     * @param prevFunction - Function to call when tabbing backward
     */
    setPreviousFocusHandler(prevFunction: () => void): void;

    /**
     * Sets the library service function (for autocomplete)
     * @param fn - Function that provides library list
     */
    setLibService(fn: () => any): void;

    /**
     * Exports editor content as color-coded HTML
     * @param option - Export options
     * @returns HTML string with syntax highlighting
     */
    getHTML(option?: HTMLExportOptions): string;

    // ============================================================================
    // INTERNAL PROPERTIES (accessed by DMSEditor)
    // ============================================================================

    /**
     * Reference to log area content pane (set by DMSEditor)
     * This is a property that DMSEditor sets on the editor instance
     */
    log?: any;

    /**
     * Internal controller (accessed for advanced operations)
     * Warning: This is an internal property and may not be stable
     */
    ctrl_?: {
      /** Inserts text at cursor position */
      insertText?(text: string): void;
      /** Sets selection range */
      selection?(startLine: number, startColumn: number, endLine?: number, endColumn?: number): void;
    };
  }
}

// Export for ES modules
export default SAS.Editor;
export { SAS };
