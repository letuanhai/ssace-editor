function addListenerToMain(extension_id) {
    if (window.__editorListenerAdded === true) return;

    const extension_origin = `chrome-extension://${extension_id}`;

    window.addEventListener('message', (msg) => {
        if (msg.origin !== extension_origin) return;


        console.debug('MAIN: got message from iframe: ', msg);
        switch (msg.data.action) {
            case 'GetTextFromSS':
                msg.source.postMessage({
                    action: 'TextResultFromSS',
                    textContent: window.appDMS.tabs.getFocusedTab().editor.editor.getText(),
                    lineNumber: document.querySelector('.textviewLeftRuler > div.ruler.lines > div:nth-child(2)').textContent,
                }, extension_origin);
                break;
            case 'SetTextInSS':
                window.appDMS.tabs.getFocusedTab().editor.editor.setText(msg.data.textContent);
                window.appDMS.tabs.getFocusedTab().editor.editor.gotoLine(msg.data.lineNumber);
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

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => { window.createSSAceEditor() },
    });
});
