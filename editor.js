const editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/sql");
editor.setKeyboardHandler("ace/keyboard/vim");
editor.setOptions({
    fontSize: "14px"
});