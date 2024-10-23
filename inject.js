(function() {
  if (document.getElementById('ace-editor-container')) {
    const container = document.getElementById('ace-editor-container');
    container.remove();
    return;
  }

  // Create container
  const container = document.createElement('div');
  container.id = 'ace-editor-container';
  document.body.appendChild(container);

  // Create editor frame
  const frame = document.createElement('iframe');
  frame.id = 'ace-editor-frame';
  container.appendChild(frame);

  // Load editor HTML
  frame.src = chrome.runtime.getURL('editor.html');

  // Make the editor draggable
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;

  container.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
      if (e.target === container || e.target.parentNode === container) {
          initialX = e.clientX - container.offsetLeft;
          initialY = e.clientY - container.offsetTop;
          isDragging = true;
      }
  }

  function drag(e) {
      if (isDragging) {
          e.preventDefault();
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;
          container.style.left = currentX + "px";
          container.style.top = currentY + "px";
      }
  }

  function dragEnd() {
      isDragging = false;
  }

})();
