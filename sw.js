function addListenerToMain(extension_id) {
    if (window.__editorListenerAdded === true) return;

    const extension_origin = `chrome-extension://${extension_id}`;

    window.addEventListener('message', (msg) => {
        if (msg.origin !== extension_origin) return;


        switch (msg.data.action) {
            case 'GetTextFromSS':
                var ctrl = window.appDMS.tabs.getFocusedTab().editor.editor.ctrl_;
                msg.source.postMessage({
                    action: 'TextResultFromSS',
                    textContent: ctrl.getText(),
                    lineNumber: ctrl.model().toTextRange(ctrl.selection()).start.line + 1,
                }, extension_origin);
                break;
            case 'SetTextInSS':
                var ctrl = window.appDMS.tabs.getFocusedTab().editor.editor.ctrl_;
                ctrl.setText(msg.data.textContent);
                ctrl.gotoline(msg.data.lineNumber + 1);
                break;
            case 'CloseEditorContainer':
                document.getElementById('ssace-editor-container').remove();
                break;
        }
    });
    window.__editorListenerAdded = true;
}

chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: addListenerToMain,
        args: [chrome.runtime.id],
        world: "MAIN"
    });

    chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['editor-container.css']
    });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['editor-container.js']
    });
});
