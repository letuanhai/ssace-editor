// @ts-check
/**
 * @typedef {import('../types/ext-browse_ss')}
 */


ace.define("ace/ext/browse_ss", [], function (require, exports, module) {
    "use strict";

    const config = require("ace/config");
    const dom = require("../lib/dom");
    const FilteredList = require("../autocomplete").FilteredList;
    const AcePopup = require('../autocomplete/popup').AcePopup;
    const $singleLineEditor = require('../autocomplete/popup').$singleLineEditor;
    const UndoManager = require("../undomanager").UndoManager;

    // Track existing prompt
    // Since the prompt command-line itself is an Editor instance, prompt can be opened from it
    // This variable is to track the open prompt created by this module to close it and open the new prompt
    // BUG: since the openPrompt is tracked at module level and this module is separate from ace/ext/prompt,
    // the default ace prompt can be opened on the FS prompt
    /** * @type {{ close: () => void; } | null} */
    let openPrompt;

    const DEFAULT_PATH = '/applis/12201-esmb0-sasbasic/data/DEN/';
    const PLACEHOLDER_TEXT = 'Enter a path to browse';
    const MAX_HISTORY = 50;
    const HISTORY_KEY = 'BrowseSsFilesHistory';

    /**
     * @typedef  PromptOptions
     * @property {String} defaultPath           Default initial path
     * @property {String} placeholder           Placeholder text
     * @property {Number} maxHistory            Maximum number of history entries
     * @property {String} historyKey            Key to store history items in localStorage
     */
    /**
     * Browse and open SAS Studio hierarchical items (files, libraries) using the prompt
     *
     * @param {Partial<PromptOptions>} options  Cusomizable options for this prompt.
     * */
    function browse_ss(options) {
        // If there is already existing browse_ss instance
        if (openPrompt) {
            console.debug('browse_ss: already open');
            // Exit early, this makes sure only 1 browse_ss is running across all editors
            return;
        }

        // Initialize prompt
        var cmdLine = $singleLineEditor();
        cmdLine.session.setUndoManager(new UndoManager());
        cmdLine.setOption("fontSize", 14);
        // Set initial prompt value
        cmdLine.setValue(options.defaultPath ?? DEFAULT_PATH, 1);
        cmdLine.setOption("placeholder", options.placeholder ?? PLACEHOLDER_TEXT);

        // Create overlay to dim the page
        /**@type {HTMLElement}*/
        const el = dom.buildDom(["div", { class: "ace_browse_ss_container input-box-with-description" }]);
        const overlay = Utils.overlayPage(el, done);
        el.appendChild(cmdLine.container);
        overlay.setIgnoreFocusOut(false); // Close prompt when lose focus

        // Create description box to show loading status
        /**@type {HTMLElement}*/
        const promptTextContainer = dom.buildDom(["div", { class: "ace_prompt_text_container" }]);
        dom.buildDom("Loading...", promptTextContainer);
        el.appendChild(promptTextContainer);
        promptTextContainer.hidden = false;

        // Initialize data model
        let dataLoading = true;
        let curDirItemPromise = getFSItem(options.defaultPath ?? DEFAULT_PATH);

        // Initialize completions popup
        const popup = new AcePopup();
        popup.renderer.setStyle("ace_autocomplete_inline");
        popup.container.style.display = "block";
        popup.container.style.maxWidth = "800px";
        popup.container.style.width = "100%";
        popup.container.style.marginTop = "3px";
        popup.renderer.setScrollMargin(2, 2, 0, 0);
        popup.autoSelect = false;
        popup.renderer.$maxLines = 15;
        popup.setRow(-1);
        popup.setOption("fontSize", 15);
        popup.on("click", function (/** @type {Editor}} */ e) {
            if (dataLoading) return;
            const data = popup.getData(popup.getRow());
            if (!data["error"]) {
                cmdLine.setValue(data.value || data["name"] || data, 1);
                accept();
                e.stop();
            }
        });
        el.appendChild(popup.container);
        curDirItemPromise.then(() => updateCompletions());

        // Initialize key bindings
        const keys = {
            "Enter": accept,
            "Shift-Enter": function () {
                const val = popup.getCursorPosition().row > 0 ? valueFromPopup() : cmdLine.getValue();
                const curData = popup.getData(popup.getRow());
                const cleanedPath = Utils.normalizeFilePath(curData.uri || val);
                done();
                Utils.focusItemOnTree(cleanedPath);
            },
            "Ctrl-L": function () { cmdLine.setValue(''); },
            "Esc": function () {
                const cmdLineValue = cmdLine.getValue().trimStart();
                if (cmdLineValue === '' || cmdLineValue.endsWith('/')) { done(); }
                else cmdLine.setValue(cmdLineValue.slice(0, cmdLineValue.lastIndexOf('/') + 1), 1);
            },
            "Shift-Esc": done,
            "Shift-Space": function () {
                // Go to parent directory
                const cmdLineValue = cmdLine.getValue();
                // Replace multiple consecutive slashes
                const cleaned = cmdLineValue.replace(/\/+/g, '/');
                const secondToLastSlashIndex = cleaned.lastIndexOf('/', cleaned.lastIndexOf('/') - 1);

                const parentPath = cleaned.slice(0, secondToLastSlashIndex) + '/';
                curDirItemPromise = getFSItem(parentPath);
                cmdLine.setValue(parentPath, 1);
                updateCompletions();
            },
            "Up": function () { popup.goTo("up"); valueFromPopup(); },
            "Down": function () { popup.goTo("down"); valueFromPopup(); },
            "Ctrl-Up|Ctrl-Home": function () { popup.goTo("start"); valueFromPopup(); },
            "Ctrl-Down|Ctrl-End": function () { popup.goTo("end"); valueFromPopup(); },
            "Tab": function () {
                const curData = popup.getData(popup.getRow());
                cmdLine.setValue(curData.uri, 1);
                updateCompletions();
            },
            "PageUp": function () { popup.gotoPageUp(); valueFromPopup(); },
            "PageDown": function () { popup.gotoPageDown(); valueFromPopup(); }
        };
        cmdLine.commands.bindKeys(keys);
        // Add event listener
        cmdLine.on("input", function () { updateCompletions(); });

        // Finalizing prompt creation
        cmdLine.resize(true);
        cmdLine.focus();
        // Store existing prompt
        openPrompt = {
            close: done,
        };


        /**
         * Get history list @returns {Array<Partial<dataItem>>} */
        function getHistory() {
            return JSON.parse(localStorage.getItem(options.historyKey ?? HISTORY_KEY) ?? '[]');
        }

        /**
         * Add new item to history @param {dataItem} item data item to add to history */
        function addToHistory(item) {
            const history = getHistory();
            const filteredHistory = history.filter(
                data => data.value !== item.uri && data.value !== item.value
            );
            filteredHistory.unshift({
                value: Utils.normalizeFilePath(item.uri || item.value),
                meta: item.meta,
                isDirectory: item.isDirectory,
            });
            localStorage.setItem(options.historyKey ?? HISTORY_KEY, JSON.stringify(filteredHistory.slice(0, options.maxHistory ?? MAX_HISTORY)));
        }

        function updateCompletions() {
            /**
             * @param {Partial<dataItem>[]} itemList
             * @param {String?} prefix
             * @returns {Partial<dataItem>[]}
             */
            function getFilteredCompletions(itemList, prefix) {
                const resultItems = JSON.parse(JSON.stringify(itemList));
                const filtered = new FilteredList(resultItems);
                return filtered.filterCompletions(resultItems, prefix);
            }

            curDirItemPromise.then(curDirItem => {

                /** @returns {Array<Partial<dataItem>>} */
                function getChildrenList() {
                    return (curDirItem.children ?? []).map(item => ({
                        value: item.name,
                        uri: item.uri,
                        meta: item.isDirectory ? '>' : '',
                        isDirectory: item.isDirectory,
                        keepPrompt: false,
                    }))
                }

                const cmdLineValue = cmdLine.getValue().trimStart();
                const curDirPath = Utils.getCurDirPath(cmdLineValue);

                // Get completions using curDirItem if loaded
                if (curDirPath === Utils.normalizeFilePath(curDirItem.uri)) {
                    // Get the prefix to update completions
                    // Only use the last component of the path for completions
                    const prefix = cmdLineValue.split('/').at(-1);
                    const filteredCompletions = getFilteredCompletions(getChildrenList(), prefix);
                    const completions = filteredCompletions.length > 0 ? filteredCompletions : [
                        {
                            uri: curDirItem.uri,
                            value: 'Reload directory...',
                            meta: '>',
                            isDirectory: true,
                            keepPrompt: true,
                        },
                    ];
                    popup.setData(completions, prefix);
                }
                // Else prompt to load curDirItem and load history
                else {
                    const prefix = cmdLineValue;
                    const history = getHistory();
                    /** * @type {Partial<dataItem>[]} */
                    let filteredCompletions = [];
                    if (history.length > 0) {
                        filteredCompletions = getFilteredCompletions(history, prefix);
                        if (filteredCompletions.length > 0) filteredCompletions[0].message = 'Recent';
                        filteredCompletions.forEach(item => {
                            item.uri = item.value;
                            item.value = (item.isDirectory ? '📁 ' : '') + item.uri;
                        });
                    }
                    const completions = [{
                        uri: curDirPath,
                        value: 'Load directory content...',
                        meta: '>',
                        isDirectory: true,
                        keepPrompt: true,
                    }, ...filteredCompletions];
                    popup.setData(completions, prefix);
                }
                popup.resize(true);
            })
        }

        // Get value from popup
        function valueFromPopup() {
            var current = popup.getData(popup.getRow());
            if (current && !current["error"])
                return current.value || current.caption || current;
        }

        function accept() {
            if (dataLoading) return;
            const val = popup.getCursorPosition().row > 0 ? valueFromPopup() : cmdLine.getValue();
            const curData = popup.getData(popup.getRow());
            const cleanedPath = Utils.normalizeFilePath(curData.uri || val);
            console.debug('browse_ss: accepted', val, curData);
            addToHistory(curData);
            if (curData.isDirectory) {
                const directoryPath = cleanedPath + '/';
                curDirItemPromise = getFSItem(directoryPath);
                if (!curData.keepPrompt) cmdLine.setValue(directoryPath, 1);
                updateCompletions();
            } else {
                Utils.openFile(cleanedPath);
                done();
            }
        }

        /**
         * Get FSItem from provided path
         * @param {String} filePath Absolute file path
         * @returns {Promise<FSItem>}
         */
        function getFSItem(filePath) {
            dataLoading = true;
            promptTextContainer.hidden = false;
            const fsItemPromise = Utils.getFSItemFromApp(filePath);
            fsItemPromise.then(() => { dataLoading = false; promptTextContainer.hidden = true; });
            return fsItemPromise;
        }

        // Cleanup
        function done() {
            overlay.close();
            openPrompt = null;
        }
    }

    dom.importCssString(`.ace_browse_ss_container {
        max-width: 800px;
        width: 100%;
        margin: 50px auto;
        padding: 3px;
        background: white;
        border-radius: 2px;
        box-shadow: 0px 2px 3px 0px #555;
        }`,
        "browse_ss.css",
        false
    );
    exports.browse_ss = browse_ss;

    config.loadModule("ace/commands/default_commands", function (module) {
        module.commands.push({
            name: "browseSs",
            description: "Browse SAS Studio files",
            bindKey: { win: "Alt-p", mac: "Option-p" },
            readOnly: true,
            exec: function () {
                config.loadModule("ace/ext/browse_ss", function (module) {
                    module.browse_ss({});
                })
            }
        });
    });

    window._browseSsListener = function (event) {
        if (event.key !== 'p' || !event.altKey || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        event.stopPropagation();
        browse_ss({});
    }
    window.addEventListener('keydown', window._browseSsListener, true);

    class Utils {
        /**
         * @param {HTMLElement} contentElement
         * @param {Function} callback
         */
        static overlayPage(contentElement, callback) {
            /**
             * @type {HTMLElement?}
             */
            let closer = document.createElement('div');
            var ignoreFocusOut = false;
            /**
             * @param {KeyboardEvent} e
             */
            function documentEscListener(e) {
                if (e.key === "Escape" || e.key === "Esc") {
                    close();
                }
            }
            function close() {
                if (!closer)
                    return;
                document.removeEventListener('keydown', documentEscListener);
                closer.parentNode?.removeChild(closer);
                closer = null;
                callback && callback();
            }
            /**
             * @param {boolean} ignore
             */
            function setIgnoreFocusOut(ignore) {
                ignoreFocusOut = ignore;
                if (ignore) {
                    closer.style.pointerEvents = "none";
                    contentElement.style.pointerEvents = "auto";
                }
            }
            closer.style.cssText = 'margin: 0; padding: 0; ' +
                'position: fixed; top:0; bottom:0; left:0; right:0;' +
                'z-index: 9990; ' +
                'background-color: rgba(0, 0, 0, 0.3);';
            closer.addEventListener('click', function (e) {
                if (!ignoreFocusOut) {
                    close();
                }
            });
            document.addEventListener('keydown', documentEscListener);
            contentElement.addEventListener('click', function (e) {
                e.stopPropagation();
            });
            closer.appendChild(contentElement);
            document.body.appendChild(closer);
            return {
                close: close,
                setIgnoreFocusOut: setIgnoreFocusOut
            };
        }

        /**
         * Get FSItem from provided path
         * @param {String} filePath Absolute file path
         * @returns {Promise<FSItem>}
         */
        static getFSItemFromApp(filePath) {
            console.debug('browse_ss: filePath is ', filePath);
            const cleanedPath = Utils.normalizeFilePath(filePath);
            const convertedPath = cleanedPath.replace(/\/+/g, '~ps~');
            /**
             * @type {Promise<FSItem>}
             */
            const fsItem = window.appDMS.projects.projectTreeStore.query(convertedPath);
            fsItem.then(item => {
                item.children?.forEach(item => {
                    item.name = (item.isDirectory ? '📁 ' : '') + item.name;
                });
                item.children?.unshift(
                    {
                        uri: item.uriParent,
                        name: '⬆️..',
                        isDirectory: true
                    },
                );
            })
            console.debug('browse_ss: got item ', fsItem);
            return fsItem
        }

        /**
         * Open the FSItem in SAS Studio
         * @param {String} filePath Absolute file path
         */
        static openFile(filePath) {
            console.debug('browse_ss: opening file ', filePath);
            function openItem(targetItem) {
                const action = targetItem.type === 'DATA' ?
                    'TableOpen' :
                    (targetItem.fileType === 'TXT' ?
                        'FileOpenWithTextViewer' : (
                            targetItem.fileType === 'EXT' ?
                                'FileOpenWithExternalProgram' :
                                'FileOpen'
                        )
                    );
                window.appDMS.handleWebOneEvent(action, targetItem);
            }
            const targetItem = {
                uri: filePath,
                name: filePath.split('/').at(-1),
                type: 'FILE',
            }
            openItem(targetItem);
        }

        /**
         * Focus the project tree to the provided FSItem
         * @param {String} filePath Absolute file path
         */
        static focusItemOnTree(filePath) {
            console.debug('browse_ss: focusing tree on item ', filePath);
            function selectTreePane(targetTreeId) {
                const paneId = `${targetTreeId}Pane`;
                const accContainer = window.dijit.byId('accContainer');
                const targetPane = accContainer.getChildren().filter(p => p.id === paneId)?.[0];
                if (targetPane) accContainer.selectChild(targetPane);
            }
            function scrollTreeToSelectedNode(tree) {
                selectTreePane(tree.id.split('.')[0]);
                const targetNode = tree.get('selectedNode')?.labelNode;
                if (targetNode?.scrollIntoViewIfNeeded) {
                    targetNode.scrollIntoViewIfNeeded();
                } else {
                    targetNode.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                }
            }
            function scrollTreeToPath(targetPath, targetTreeId) {
                if (!targetPath) return;
                const treeId = targetTreeId ?? (targetPath.startsWith('libraries') ? 'library' : 'projects');
                const tree = window.dijit.byId(`${treeId}.tree`);

                if (treeId === 'library') targetPath = targetPath.replace(/[.~]/g, '/');

                // dojo provide tree.set('path',...) for this purpose but it does not work
                // => because DMSProject modified the method ._expandNode(), making it return undefined instead of a Promise
                // DMSProject backup the original method as ._expandNodeStash() but sometimes it messes up, likely during refreshes
                // Create a version of the original method for our own usage
                const expandNodeOrig = window.dijit.Tree.prototype._expandNode.bind(tree);

                function expandRecursively(node, path) {
                    return expandNodeOrig(node).then(() => {
                        for (const child of node.getChildren()) {
                            const childUri = (treeId === 'library') ?
                                (child.item.uri ?? 'libraries').replace(/[.~]/g, '/') :
                                child.item.uri;
                            const isTarget = childUri === path;
                            const isAncestor = path.startsWith(childUri + '/');
                            if (!(isTarget || isAncestor)) continue;
                            // Select current child node
                            tree.set('selectedNode', child);
                            if (isAncestor) return expandRecursively(child, path);
                        }
                    });
                }
                return expandRecursively(tree.rootNode, targetPath).then(() => {
                    scrollTreeToSelectedNode(tree);
                });
            }
            scrollTreeToPath(filePath, 'projects');
        }

        /**
         * Cleanup file path
         * @param {String} filePath Absolute file path
         * @returns {String}
         */
        static normalizeFilePath(filePath) {
            const trimmed = filePath.trimStart();
            const replacedConsecutiveSlashes = trimmed.replace(/\/+/g, '/');
            if (trimmed === '' || replacedConsecutiveSlashes === '/') return '/';
            const replacedEndingSlash = replacedConsecutiveSlashes.replace(/\/+$/, '');
            return replacedEndingSlash;
        }

        /**
         * Get path to current directory
         * @param {String} filePath Absolute file path
         * @returns {String}
         */
        static getCurDirPath(filePath) {
            const trimmed = filePath.trimStart();
            const replacedConsecutiveSlashes = trimmed.replace(/\/+/g, '/');
            if (trimmed === '' || replacedConsecutiveSlashes === '/') return '/';
            return replacedConsecutiveSlashes.slice(0, replacedConsecutiveSlashes.lastIndexOf('/'));
        }

    }

});
(function () {
    ace.require(["ace/ext/browse_ss"], function (m) {
        if (typeof module == "object" && typeof exports == "object" && module) {
            module.exports = m;
        }
    });
})();

function _reloadBrowseSs() {
    const moduleId = 'ace/ext/browse_ss';
    const srcPath = ace.config.moduleUrl(moduleId);
    window.removeEventListener('keydown', window._browseSsListener, true);
    Array.from(document.body.getElementsByTagName('script')).filter(el => el.src && el.src === srcPath).forEach(el => el.remove());
    delete ace.define.modules[moduleId];
    const el = document.createElement('script');
    el.src = srcPath;
    el.onload = function () {
        console.debug(`${moduleId}: reloaded`);
        el.parentNode?.removeChild(el);
    }
    document.body.appendChild(el);
}

/**
 * @typedef FSItem
 * @property {String} uri Absolute file path
 * @property {String} uriParent Absolute parent path
 * @property {String} name File name
 * @property {String} id Item id
 * @property {Boolean} isDirectory Whether the item is a directory or a file
 * @property {Array<Partial<FSItem>>?} children Children items
 */

/**
 * @typedef dataItem
 * @property {String?} uri Absolute file path
 * @property {String} value Display name for the item (uri in case of history item)
 * @property {Boolean} isDirectory Whether the item is a directory or a file
 * @property {String} meta Secondary description, '>' for directory
 * @property {Boolean?} keepPrompt Whether to keep current prompt value when select this item
 * @property {String?} message Message on item
 */