(function () {
  if (document.getElementById('ssace-editor-container')) {
    const container = document.getElementById('ssace-editor-container');
    container.remove();
    return;
  }

  // Create container
  const editorContainer = document.createElement('div');
  editorContainer.id = 'ssace-editor-container';
  document.body.appendChild(editorContainer);

  // Create header bar
  const headerBar = document.createElement('div');
  headerBar.id = 'ssace-editor-header';
  editorContainer.appendChild(headerBar);
  headerBar.appendChild(document.createElement('div')); // Spacer

  // Button container
  const btnContainer = document.createElement('div');
  btnContainer.id = 'ssace-editor-btn-container';
  headerBar.appendChild(btnContainer);


  // Save button
  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.id = 'ssace-editor-btn-save';
  btnContainer.appendChild(saveBtn);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.id = 'ssace-editor-btn-close';
  btnContainer.appendChild(closeBtn);
  closeBtn.onclick = () => editorContainer.remove();

  // Create editor frame
  const editorFrame = document.createElement('iframe');
  editorFrame.id = 'ssace-editor-frame';
  editorContainer.appendChild(editorFrame);

  // Load editor HTML
  editorFrame.src = chrome.runtime.getURL('editor.html');

  // Make the editor draggable
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;

  headerBar.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    if (e.target === headerBar || e.target.parentNode === headerBar) {
      initialX = e.clientX - editorContainer.offsetLeft;
      initialY = e.clientY - editorContainer.offsetTop;
      isDragging = true;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      editorContainer.style.left = currentX + "px";
      editorContainer.style.top = currentY + "px";
    }
  }

  function dragEnd() {
    isDragging = false;
  }

})();
