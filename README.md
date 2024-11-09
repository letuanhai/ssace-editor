# SAS Studio - Ace Editor

This is a Chrome extension that inject an [ace.js](https://github.com/ajaxorg/ace) editor window into the SAS Studio page to edit the currently opened file.

## Installation
Chrome Web Store (Unlisted): [SAS Studio - Ace Editor](https://chromewebstore.google.com/detail/sas-studio-ace-editor/ghfdjdpkpoliilhmmghddafppejefgoh)

## Usage
Click on the "Edit with Ace" button to open the editor window (or close the existing one). The editor window will be populated with the content of the currently opened file. Make your changes and click on the "Save" button to save the changes back to SAS Studio.

### Keybindings
- `Alt/Opt + .` (can be changed in Extensions > Keyboard shortcuts): Open/Close the editor window
- `Ctrl + s`: Save the changes to SAS Studio editor window
- `Ctrl + Alt/Opt + m`: Toggle maximized editor window or default size

By default, the editor use vim keybinding. It can be changed in the editor settings (`Ctrl/Cmd + ,`).
A few `vim` commands defined besides the default:
- `:w` or `:write`: Save the changes to SAS Studio editor window
- `:q` or `:quit`: Close the editor window
- `:wq` : Save the changes and close the editor window
- `:ma` or `:maximize`: Toggle maximized editor window or default size