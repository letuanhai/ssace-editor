function initEditor(input, onwrite, onclose) {
    const editorEl = document.getElementById("ssace-editor");
    editorEl.style.fontSize = '14px';
    // Initialize Ace editor
    const editor = ace.edit("ssace-editor", {
        mode: "ace/mode/sql",
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

    editor.focus();

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
    console.debug('iframe: got message: ', msg);

    if (msg.action == 'InitEditor') {

        console.debug('iframe: init editor');

        // Listen to input result from SAS Studio
        window.addEventListener('message', (event) => {
            console.debug('iframe: got message from MAIN: ', event);

            if (event.origin !== sender.origin) return;
            if (event.data.action !== 'TextResultFromSS') return;

            initEditor(event.data,
                (editor) => {
                    console.log('Editor received save request from ', sender);
                    window.parent.postMessage({
                        action: 'SetTextInSS',
                        textContent: editor.getValue(),
                        lineNumber: editor.getSelectionRange().start.row,
                    }, sender.origin);
                },
                (editor) => {
                    window.parent.postMessage({
                        action: 'CloseEditorContainer',
                    }, sender.origin);
                }
            );
        });

        // Request input from SAS Studio
        window.parent.postMessage({ action: 'GetTextFromSS', }, sender.origin);
    }
});
