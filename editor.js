async function initEditor(input, onwrite, onclose, onmaximize) {
    // Get user editor settings from storage
    let userSettings = {};
    await chrome.storage.sync.get(["editorSettings"]).then((result) => {
        userSettings = result.editorSettings || userSettings;
    });

    // Set default dark and light theme
    const darkTheme = userSettings.darkTheme || 'ace/theme/gruvbox';
    const lightTheme = userSettings.lightTheme || 'ace/theme/iplastic';
    // Remove the properties to avoid warning messages
    delete userSettings.darkTheme;
    delete userSettings.lightTheme;

    // Choose theme based on system dark mode
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const editorTheme = isDarkMode ? darkTheme : lightTheme;

    // Initialize Ace editor
    const editor = ace.edit("ssace-editor", {
        mode: "ace/mode/sas",
        keyboardHandler: "ace/keyboard/vim",
        theme: editorTheme,
        fontSize: 15,
        showLineNumbers: true,
        showGutter: true,
        displayIndentGuides: true,
        behavioursEnabled: true,
        autoScrollEditorIntoView: true,
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        tooltipFollowsMouse: true,
        highlightActiveLine: true,
        highlightIndentGuides: true,
        highlightSelectedWord: true,
        ...userSettings, // Use user settings if available
    });
    // Focus on editor on launch
    editor.focus();

    // Watch for dark mode change
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        const newEditorTheme = event.matches ? darkTheme : lightTheme;
        editor.setTheme(newEditorTheme);
    });

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
    editor.commands.addCommand({
        name: 'Save current editor settings',
        bindKey: 'Ctrl-Alt-S',
        exec: function (editor) {
            let currentSettings = {
                mode: editor.getOption("mode"),
                keyboardHandler: editor.getOption("keyboardHandler"),
                fontSize: editor.getOption("fontSize"),
                wrap: editor.getOption("wrap"),
                cursorStyle: editor.getOption("cursorStyle"),
                foldStyle: editor.getOption("foldStyle"),
                useSoftTabs: editor.getOption("useSoftTabs"),
                tabSize: editor.getOption("tabSize"),
                scrollPastEnd: editor.getOption("scrollPastEnd"),
                navigateWithinSoftTabs: editor.getOption("navigateWithinSoftTabs"),
                behavioursEnabled: editor.getOption("behavioursEnabled"),
                wrapBehavioursEnabled: editor.getOption("wrapBehavioursEnabled"),
                enableAutoIndent: editor.getOption("enableAutoIndent"),
                selectionStyle: editor.getOption("selectionStyle"),
                highlightActiveLine: editor.getOption("highlightActiveLine"),
                showInvisibles: editor.getOption("showInvisibles"),
                displayIndentGuides: editor.getOption("displayIndentGuides"),
                highlightIndentGuides: editor.getOption("highlightIndentGuides"),
                hScrollBarAlwaysVisible: editor.getOption("hScrollBarAlwaysVisible"),
                vScrollBarAlwaysVisible: editor.getOption("vScrollBarAlwaysVisible"),
                animatedScroll: editor.getOption("animatedScroll"),
                showGutter: editor.getOption("showGutter"),
                showLineNumbers: editor.getOption("showLineNumbers"),
                relativeLineNumbers: editor.getOption("relativeLineNumbers"),
                fixedWidthGutter: editor.getOption("fixedWidthGutter"),
                showPrintMargin: editor.getOption("showPrintMargin"),
                printMarginColumn: editor.getOption("printMarginColumn"),
                indentedSoftWrap: editor.getOption("indentedSoftWrap"),
                highlightSelectedWord: editor.getOption("highlightSelectedWord"),
                fadeFoldWidgets: editor.getOption("fadeFoldWidgets"),
                useTextareaForIME: editor.getOption("useTextareaForIME"),
                mergeUndoDeltas: editor.getOption("mergeUndoDeltas"),
                useElasticTabstops: editor.getOption("useElasticTabstops"),
                useIncrementalSearch: editor.getOption("useIncrementalSearch"),
                readOnly: editor.getOption("readOnly"),
                copyWithEmptySelection: editor.getOption("copyWithEmptySelection"),
                enableLiveAutocompletion: editor.getOption("enableLiveAutocompletion"),
                customScrollbar: editor.getOption("customScrollbar"),
                useSvgGutterIcons: editor.getOption("useSvgGutterIcons"),
                showFoldedAnnotations: editor.getOption("showFoldedAnnotations"),
                enableKeyboardAccessibility: editor.getOption("enableKeyboardAccessibility"),
                tooltipFollowsMouse: editor.getOption("tooltipFollowsMouse"),
            };

            // Save dark or light theme based on system dark mode
            const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            const currentTheme = isDarkMode ? 'darkTheme' : 'lightTheme';
            currentSettings[currentTheme] = editor.getTheme();

            chrome.storage.sync.set({
                editorSettings: currentSettings
            }).then(() => {
                window.alert('Editor settings saved!')
            });
        },
    });
    editor.commands.addCommand({
        name: 'Clear saved editor settings',
        exec: function () {
            chrome.storage.sync.remove(["editorSettings"])
                .then(() => {
                    window.alert('Editor settings cleared!')
                });
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
    const editorEl = document.getElementById("ssace-editor");
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
                onwrite = (editor) => {
                    window.parent.postMessage({
                        action: 'SetTextInSS',
                        textContent: editor.getValue(),
                        lineNumber: editor.getSelectionRange().start.row,
                    }, sender.origin);
                },
                onclose = (editor) => {
                    window.parent.postMessage({
                        action: 'CloseEditorContainer',
                    }, sender.origin);
                },
                onmaximize = (editor) => {
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
