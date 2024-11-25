(function () {
    // Create and initialize the editor
    function createEditorContainer() {
        // Remove editorContainer if existed
        const existingEditorContainer = document.getElementById('ssace-editor-container');
        if (existingEditorContainer) {
            existingEditorContainer.remove();
            return;
        }

        // Create container for the editor
        const editorContainer = document.createElement('div');
        editorContainer.id = 'ssace-editor-container';

        // Add a header bar with controls
        const headerBar = document.createElement('div');
        headerBar.id = 'ssace-editor-header';

        // Button container
        const btnContainer = document.createElement('div');
        btnContainer.id = 'ssace-editor-btn-container';

        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.id = 'ssace-editor-btn-save';
        saveBtn.className = 'ssace-editor-btn';

        // Maximize/restore button
        const maximizeBtn = document.createElement('button');
        maximizeBtn.textContent = '≣';
        maximizeBtn.id = 'ssace-editor-btn-maximize';
        maximizeBtn.className = 'ssace-editor-btn';

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.id = 'ssace-editor-btn-close';
        closeBtn.className = 'ssace-editor-btn';

        // Create editor within iframe
        const editorFrame = document.createElement("iframe");
        editorFrame.id = 'ssace-editor-frame';
        editorFrame.src = chrome.runtime.getURL("editor.html");

        // Assemble the components
        btnContainer.appendChild(saveBtn);
        btnContainer.appendChild(maximizeBtn);
        btnContainer.appendChild(closeBtn);
        headerBar.appendChild(document.createElement('div')); // Spacer
        headerBar.appendChild(btnContainer);
        editorContainer.appendChild(headerBar);
        editorContainer.appendChild(editorFrame);
        document.body.appendChild(editorContainer);

        // Handle dragging
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        headerBar.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            initialX = e.clientX - editorContainer.offsetLeft;
            initialY = e.clientY - editorContainer.offsetTop;
            isDragging = true;
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                editorContainer.style.left = Math.min(
                    Math.max(currentX, 0), window.innerWidth - 30
                ) + "px";
                editorContainer.style.top = Math.min(
                    Math.max(currentY, 0), window.innerHeight - 30
                ) + "px";
            }
        }

        function dragEnd() {
            isDragging = false;
        }

        closeBtn.onclick = () => {
            editorContainer.remove();
        };

        saveBtn.onclick = () => {
            chrome.runtime.sendMessage({
                action: 'SaveEditor',
            });
        };

        maximizeBtn.onclick = () => {
            // Resize editor container to cover whole page
            //  and restore to default size and position if already maximized
            if (editorContainer.style.width !== '100%') {
                editorContainer.style.width = '100%';
                editorContainer.style.height = '100%';
                editorContainer.style.top = '0';
                editorContainer.style.left = '0';
            } else {
                editorContainer.style.width = '';
                editorContainer.style.height = '';
                editorContainer.style.top = '';
                editorContainer.style.left = '';
            }
        };

        editorFrame.onload = () => {
            chrome.runtime.sendMessage({
                action: 'InitEditor',
            });
        };
    }

    createEditorContainer();

})();
