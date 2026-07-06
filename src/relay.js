/**
 * ISOLATED-world content script: MAIN-world code (editor-swap.js) can't touch
 * chrome.storage or chrome.action, so it posts via window.postMessage and this
 * relay forwards to the privileged side:
 * - `__ssextAceConfig`: persisted to chrome.storage.local (sw.js's
 *   storage.onChanged then pushes it to every open SASStudio tab).
 * - `__ssextBadge`: sent to sw.js, which sets the per-tab ON/OFF toolbar badge
 *   (content scripts can't call chrome.action themselves).
 */
window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data) return;
  if (event.data.__ssextAceConfig !== undefined) {
    chrome.storage.local.set({ aceConfig: event.data.__ssextAceConfig });
  } else if (event.data.__ssextBadge !== undefined) {
    chrome.runtime.sendMessage({ ssextBadge: !!event.data.__ssextBadge });
  }
});
