// @ts-check

ace.define("ace/ext/prompt_fs", [], function (require, exports, module) {
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
    let openPrompt;

    const DEFAULT_PATH = '/applis/12201-esmb0-sasbasic/data/DEN/';
    const PLACEHOLDER_TEXT = 'Enter absolute file path on the server';
    const MAX_HISTORY_COUNT = 50;
    const HISTORY_KEY = 'PromptFSHistory';

    /**
     * Browse and open file paths using the prompt
     *
     * @param {Function?} [callback]               Function called after done.
     * */
    function prompt_fs(callback) {
        // If there is already existing prompt_fs instance
        if (openPrompt) {
            console.log('already open');
            // Exit early, this makes sure only 1 prompt_fs is running across all editors
            return;
        }

        // Initialize prompt
        var cmdLine = $singleLineEditor();
        cmdLine.session.setUndoManager(new UndoManager());
        cmdLine.setOption("fontSize", 14);
        // Set initial prompt value
        cmdLine.setValue(DEFAULT_PATH, 1);
        // Set initial selection
        // cmdLine.selection.setRange({
        //     start: cmdLine.session.doc.indexToPosition(0),
        //     end: cmdLine.session.doc.indexToPosition(Number.MAX_VALUE)
        // });
        cmdLine.setOption("placeholder", PLACEHOLDER_TEXT);

        // Create overlay to dim the page
        /**@type {HTMLElement}*/
        const el = dom.buildDom(["div", { class: "ace_prompt_fs_container input-box-with-description" }]);
        const overlay = overlayPage(el, done);
        el.appendChild(cmdLine.container);
        overlay.setIgnoreFocusOut(false); // Close prompt when lose focus

        // Create description box to show loading status
        /**@type {HTMLElement}*/
        const promptTextContainer = dom.buildDom(["div", { class: "ace_prompt_text_container" }]);
        dom.buildDom("Loading directory content...", promptTextContainer);
        el.appendChild(promptTextContainer);
        promptTextContainer.hidden = false;

        // Initialize data model
        let dataLoading = true;
        let curDirItemPromise = getFSItem(DEFAULT_PATH);

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
                const cleanedPath = normalizeFilePath(curData.uri || val);
                done();
                focusItemOnTree(cleanedPath);
            },
            "Ctrl-L": function () { cmdLine.setValue(''); },
            "Esc": function () {
                const cmdLineValue = cmdLine.getValue().trimStart();
                if (cmdLineValue === '' || cmdLineValue.endsWith('/')) { done(); }
                else cmdLine.setValue(cmdLineValue.slice(0, cmdLineValue.lastIndexOf('/') + 1), 1);
            },
            "Shift-Esc": done,
            "Shift-Space": async function () {
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
        if (popup) {
            // popup.resize(true);
        }
        cmdLine.focus();
        // Store existing prompt
        openPrompt = {
            close: done,
        };


        /**
         * Get history list
         *
         * @returns {Array<Partial<dataItem>>}
         */
        function getHistory() {
            return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
        }

        /**
         * Add new item to history
         * 
         * @param {dataItem} item data item to add to history
         */
        function addToHistory(item) {
            const history = getHistory();
            const filteredHistory = history.filter(
                data => data.value !== item.uri && data.value !== item.value
            );
            filteredHistory.unshift({
                value: normalizeFilePath(item.uri || item.value),
                meta: item.meta,
                isDirectory: item.isDirectory,
            });
            localStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory.slice(0, MAX_HISTORY_COUNT)));
        }

        function updateCompletions() {
            /**
             * @param {Partial<dataItem>[]} itemList
             * @param {String?} prefix
             */
            function getFilteredCompletions(itemList, prefix) {
                const resultItems = JSON.parse(JSON.stringify(itemList));
                const filtered = new FilteredList(resultItems);
                return filtered.filterCompletions(resultItems, prefix);
            }

            curDirItemPromise.then(curDirItem => {

                /**
                 * @returns {Array<Partial<dataItem>>} 
                 */
                function getChildrenList() {
                    return (curDirItem.children??[]).map(item => ({
                        value: item.name,
                        uri: item.uri,
                        meta: item.isDirectory ? '>' : '',
                        isDirectory: item.isDirectory,
                        keepPrompt: false,
                    }))
                }

                const cmdLineValue = cmdLine.getValue().trimStart();
                const curDirPath = getCurDirPath(cmdLineValue);

                // Get completions using curDirItem if loaded
                if (curDirPath === normalizeFilePath(curDirItem.uri)) {
                    // Get the prefix to update completions
                    // Only use the last component of the path for completions
                    const prefix = cmdLineValue.split('/').at(-1);
                    /** @type {Array<Partial<dataItem>>} */
                    const filteredCompletions = getFilteredCompletions(getChildrenList(), prefix);
                    /** @type {Array<Partial<dataItem>>} */
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
                // Else prompt to load curDirItem
                else {
                    const history = getHistory();
                    if (history.length > 0) history[0].message = 'Recent';
                    /** @type {Array<Partial<dataItem>>} */
                    const completions = [{
                        uri: curDirPath,
                        value: 'Load directory...',
                        meta: '>',
                        isDirectory: true,
                        keepPrompt: true,
                    }, ...history];
                    popup.setData(completions);
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
            const cleanedPath = normalizeFilePath(curData.uri || val);
            console.log('accepted', val, curData);
            addToHistory(curData);
            if (curData.isDirectory) {
                const directoryPath = cleanedPath + '/';
                curDirItemPromise = getFSItem(directoryPath);
                if (!curData.keepPrompt) cmdLine.setValue(directoryPath, 1);
                updateCompletions();
            } else {
                openFile(cleanedPath);
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
            const fsItemPromise = getFSItemFromApp(filePath);
            fsItemPromise.then(() => { dataLoading = false; promptTextContainer.hidden = true; });
            return fsItemPromise;
        }

        // Cleanup
        function done() {
            overlay.close();
            callback && callback();
            openPrompt = null;
        }
    }

    dom.importCssString(`.ace_prompt_fs_container {
        max-width: 800px;
        width: 100%;
        margin: 50px auto;
        padding: 3px;
        background: white;
        border-radius: 2px;
        box-shadow: 0px 2px 3px 0px #555;
        }`,
        "prompt_fs.css",
        false
    );
    exports.prompt_fs = prompt_fs;

    config.loadModule("ace/commands/default_commands", function (module) {
        module.commands.push({
            name: "promptFs",
            description: "Browse files",
            bindKey: { win: "Alt-p", mac: "Option-p" },
            readOnly: true,
            exec: function () {
                prompt_fs();
            }
        });
    });
    window.addEventListener('keydown', (event) => {
        if (event.key !== 'p' || !event.altKey || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        event.stopPropagation();

        prompt_fs();
    }, true);

    /**
     * @param {HTMLElement} contentElement
     * @param {Function} callback
     */
    function overlayPage(contentElement, callback) {
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
    function getFSItemFromApp(filePath) {
        console.log('filePath is ', filePath);
        const cleanedPath = normalizeFilePath(filePath);
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
        console.log('got item ', fsItem);
        return fsItem
    }

    /**
     * Open the FSItem in SAS Studio
     * @param {String} filePath Absolute file path
     */
    function openFile(filePath) {
        console.log('opening file ', filePath);
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
    function focusItemOnTree(filePath) {
        console.log('focusing tree on item ', filePath);
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
    function normalizeFilePath(filePath) {
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
    function getCurDirPath(filePath) {
        const trimmed = filePath.trimStart();
        const replacedConsecutiveSlashes = trimmed.replace(/\/+/g, '/');
        if (trimmed === '' || replacedConsecutiveSlashes === '/') return '/';
        return replacedConsecutiveSlashes.slice(0, replacedConsecutiveSlashes.lastIndexOf('/'));
    }
});
(function () {
    ace.require(["ace/ext/prompt_fs"], function (m) {
        if (typeof module == "object" && typeof exports == "object" && module) {
            module.exports = m;
        }
    });
})();


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