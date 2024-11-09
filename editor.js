function initEditor(input, onwrite, onclose, onmaximize) {
    const editorEl = document.getElementById("ssace-editor");
    editorEl.style.fontSize = '14px';
    // Initialize Ace editor
    const editor = ace.edit("ssace-editor", {
        mode: "ace/mode/sas",
        keyboardHandler: "ace/keyboard/vim",
        // theme:"ace/theme/monokai",
        fontSize: 14,
        showLineNumbers: true,
        showGutter: true,
        displayIndentGuides: true,
        behavioursEnabled: true,
        autoScrollEditorIntoView: true,
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,   // Shows completion list as you type
        enableSnippets: true,
        tooltipFollowsMouse: true,
        highlightActiveLine: true,
        highlightIndentGuides: true,
        highlightSelectedWord: true,
    });
    // Focus on editor on launch
    editor.focus();

    // Key bindings
    editor.commands.addCommand({
        name: 'Save and quit',
        bindKey: 'Ctrl-S',
        exec: function (editor) {
            onwrite(editor);
            onclose(editor);
        },
    });
    editor.commands.addCommand({
        name: 'Maximize/Restore editor container',
        bindKey: 'Ctrl-Alt-M',
        exec: function (editor) {
            onmaximize(editor);
        },
    });

    // Set up Vim
    const VimApi = ace.require("ace/keyboard/vim").Vim;
    VimApi.defineEx("write", "w", function (cm, input) {
        onwrite(editor);
    });
    VimApi.defineEx("quit", "q", function (cm, input) {
        onclose(editor);
    });
    VimApi.defineEx("wquit", "wq", function (cm, input) {
        onwrite(editor);
        onclose(editor);
    });
    VimApi.defineEx("maximize", "ma", function (cm, input) {
        onmaximize(editor);
    });

    // Handle resize events to update editor size
    const resizeObserver = new ResizeObserver(() => {
        editor.resize();
    });
    resizeObserver.observe(editorEl);

    // Set editor text value and line number if provided
    if (input) editor.setValue(input.textContent || input.value || input);
    if (input.lineNumber != undefined) editor.gotoLine(input.lineNumber);

    // Listen to save request from container
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.action == 'SaveEditor') onwrite(editor)
    });
}


// Listen to init request from container and request input from SAS Studio
chrome.runtime.onMessage.addListener((msg, sender) => {

    if (msg.action == 'InitEditor') {


        // Listen to input result from SAS Studio
        window.addEventListener('message', (event) => {

            if (event.origin !== sender.origin) return;
            if (event.data.action !== 'TextResultFromSS') return;

            initEditor(event.data,
                onwrite=(editor) => {
                    window.parent.postMessage({
                        action: 'SetTextInSS',
                        textContent: editor.getValue(),
                        lineNumber: editor.getSelectionRange().start.row,
                    }, sender.origin);
                },
                onclose=(editor) => {
                    window.parent.postMessage({
                        action: 'CloseEditorContainer',
                    }, sender.origin);
                },
                onmaximize=(editor) => {
                    window.parent.postMessage({
                        action: 'MaximizeRestoreEditorContainer',
                    }, sender.origin);
                },
            );
        });

        // Request input from SAS Studio
        window.parent.postMessage({ action: 'GetTextFromSS', }, sender.origin);
    }
});
