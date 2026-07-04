/**
 * Options page: patches (on/off), hotkeys (record/clear), snippets (Ace editor + save).
 * Everything persists to chrome.storage.local; ss-fixes.js reads it back via
 * sw.js's tabs.onUpdated injection (see DESIGN.md Phase 3).
 */
(function () {
  "use strict";

  const MODIFIER_KEYS = new Set(["Alt", "Control", "Meta", "Shift"]);

  function hotkeyLabel(hotkey) {
    if (!hotkey || !hotkey.key) return "(unbound)";
    let name = hotkey.key;
    name = (hotkey.altKey ? "Alt+" : "") + name;
    name = (hotkey.metaKey ? "Meta+" : "") + name;
    name = (hotkey.ctrlKey ? "Ctrl+" : "") + name;
    return name;
  }

  // -- Patches --------------------------------------------------------------------

  async function renderPatches() {
    const { fixes } = await chrome.storage.local.get("fixes");
    const saved = fixes || {};
    const container = document.getElementById("patches-list");

    window.SSF_TOOLS.filter((t) => t.kind === "patch").forEach((tool) => {
      const enabled = saved[tool.name] !== false; // default: enabled

      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = enabled;
      checkbox.addEventListener("change", async () => {
        const { fixes } = await chrome.storage.local.get("fixes");
        const updated = fixes || {};
        updated[tool.name] = checkbox.checked;
        await chrome.storage.local.set({ fixes: updated });
      });

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(tool.label));
      label.title = tool.title || "";
      container.appendChild(label);
    });
  }

  // -- Hotkeys ----------------------------------------------------------------------

  async function renderHotkeys() {
    const { hotkeys } = await chrome.storage.local.get("hotkeys");
    const saved = hotkeys || {};
    const tbody = document.getElementById("hotkeys-list");

    window.SSF_TOOLS.filter((t) => t.kind === "action").forEach((tool) => {
      const current = Object.prototype.hasOwnProperty.call(saved, tool.name) ? saved[tool.name] : tool.hotkey;

      const row = document.createElement("tr");

      const nameCell = document.createElement("td");
      nameCell.textContent = tool.label;
      nameCell.title = tool.title || "";
      row.appendChild(nameCell);

      const hotkeyCell = document.createElement("td");
      hotkeyCell.className = "hotkey-value";
      hotkeyCell.textContent = hotkeyLabel(current);
      row.appendChild(hotkeyCell);

      const actionsCell = document.createElement("td");

      const recordBtn = document.createElement("button");
      recordBtn.textContent = "Record";
      actionsCell.appendChild(recordBtn);

      const clearBtn = document.createElement("button");
      clearBtn.textContent = "Clear";
      clearBtn.style.marginLeft = "6px";
      actionsCell.appendChild(clearBtn);

      row.appendChild(actionsCell);
      tbody.appendChild(row);

      async function saveHotkey(keymap) {
        const { hotkeys } = await chrome.storage.local.get("hotkeys");
        const updated = hotkeys || {};
        updated[tool.name] = keymap;
        await chrome.storage.local.set({ hotkeys: updated });
        hotkeyCell.textContent = hotkeyLabel(keymap);
      }

      clearBtn.addEventListener("click", () => saveHotkey(null));

      recordBtn.addEventListener("click", () => {
        recordBtn.textContent = "Press a key...";
        recordBtn.classList.add("recording");

        function onKeydown(event) {
          if (MODIFIER_KEYS.has(event.key)) return; // wait for a non-modifier key
          event.preventDefault();
          window.removeEventListener("keydown", onKeydown, true);
          recordBtn.textContent = "Record";
          recordBtn.classList.remove("recording");

          const keymap = {
            key: event.key,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
          };
          saveHotkey(keymap);
        }
        window.addEventListener("keydown", onKeydown, true);
      });
    });
  }

  // -- Snippets ---------------------------------------------------------------------

  async function initSnippets() {
    const editor = ace.edit("snippets-editor");
    editor.session.setMode("ace/mode/snippets");

    // Follow OS dark/light, matching the main editor's theme pair (editor-swap.js).
    const darkMql = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => editor.setTheme(darkMql.matches ? "ace/theme/gruvbox" : "ace/theme/iplastic");
    darkMql.addEventListener("change", applyTheme);
    applyTheme();

    const { snippets } = await chrome.storage.local.get("snippets");
    // Unset -> defaults; a saved value wins even when empty (user cleared).
    const text = snippets && typeof snippets.sas === "string" ? snippets.sas : window.DEFAULT_SAS_SNIPPETS || "";
    editor.setValue(text, -1);

    const status = document.getElementById("save-status");
    document.getElementById("save-snippets").addEventListener("click", async () => {
      const text = editor.getValue();
      await chrome.storage.local.set({ snippets: { sas: text } });
      status.textContent = "Saved.";
      setTimeout(() => (status.textContent = ""), 2000);
    });
  }

  renderPatches();
  renderHotkeys();
  initSnippets();
})();
