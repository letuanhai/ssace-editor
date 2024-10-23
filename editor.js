const editorContainer = document.getElementById('ssace-editor');
const editor = ace.edit("ssace-editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/sql");
editor.setKeyboardHandler("ace/keyboard/vim");
editorContainer.style.fontSize = "medium";
editor.setOptions({
    fontSize: "14px"
});

// Handle resize events to update editor size
const resizeObserver = new ResizeObserver(() => {
    editor.resize();
});
resizeObserver.observe(editorContainer);
