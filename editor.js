const editorContainer = document.getElementById('ssace-editor');
const editor = ace.edit("ssace-editor", {
    mode: "ace/mode/sql",
    keyboardHandler: "ace/keyboard/vim",
    fontSize: 20,
    showLineNumbers: true,
    showGutter: true,
    behavioursEnabled: true,
    autoScrollEditorIntoView: true,
    displayIndentGuides: true,
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: true,
    enableMultiselect: true,
    highlightActiveLine: true,
    highlightIndentGuides: true,
    highlightSelectedWord: true,

});
editorContainer.style.fontSize = "medium";

// Handle resize events to update editor size
const resizeObserver = new ResizeObserver(() => {
    editor.resize();
});
resizeObserver.observe(editorContainer);
