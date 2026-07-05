/**
 * ISOLATED-world content script: MAIN-world code (editor-swap.js) can't touch
 * chrome.storage, so the in-page Ace settings panel posts config changes via
 * window.postMessage and this relay persists them to chrome.storage.local.
 * sw.js's storage.onChanged listener then pushes the new config to every open
 * SASStudio tab (including options.html's snippet editor). Nothing else here.
 */
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (!event.data || event.data.__ssextAceConfig === undefined) return;
  chrome.storage.local.set({ aceConfig: event.data.__ssextAceConfig });
});
