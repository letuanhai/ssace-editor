// @ts-check
/**
 * @typedef {import('../types/ext-browse_ss')}
 */


// @ts-ignore
ace.define("ace/ext/browse_ss", [], function (require, exports, module) {
    "use strict";

    // @ts-ignore
    const config = require("ace/config");
    // @ts-ignore
    const dom = require("../lib/dom");
    // @ts-ignore
    const FilteredList = require("../autocomplete").FilteredList;
    // @ts-ignore
    const AcePopup = require('../autocomplete/popup').AcePopup;
    // @ts-ignore
    const $singleLineEditor = require('../autocomplete/popup').$singleLineEditor;
    // @ts-ignore
    const UndoManager = require("../undomanager").UndoManager;

    // Track existing prompt
    // Since the prompt command-line itself is an Editor instance, prompt can be opened from it
    // This variable is to track the open prompt created by this module to close it and open the new prompt
    // BUG: since the openPrompt is tracked at module level and this module is separate from ace/ext/prompt,
    // the default ace prompt can be opened on the FS prompt
    /** * @type {{ close: () => void; } | null} */
    let openPrompt;

    const DEFAULT_PATH = '';
    const PLACEHOLDER_TEXT = 'Enter a path to browse';
    const MAX_HISTORY = 50;
    const HISTORY_KEY = 'BrowseSsHistory';

    /**
     * @typedef  PromptOptions
     * @property {String} defaultPath                 Default initial path
     * @property {String} placeholder                 Placeholder text
     * @property {Number} maxHistory                  Maximum number of history entries
     * @property {String} historyKey                  Key to store history items in localStorage
     * @property {(item: DataItem) => void} openItem  Function to open the selected item
     * @property {(itemPath: String) => Promise<Partial<DataItem>>} queryItemPath       Function to query item path for DataItem
     * @property {Function} scrollTreeToItem          Function to scroll the tree to the selected item
     */
    /**
     * Browse and open SAS Studio hierarchical items (files, libraries) using the prompt
     *
     * @param {PromptOptions} options  Cusomizable options for this prompt.
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
        let curCollectionPromise = getDataItem(options.defaultPath ?? DEFAULT_PATH);

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

        // @ts-ignore
        popup.on("click", function (e) {
            if (dataLoading) return;
            const data = popup.getData(popup.getRow());
            if (!data["error"]) {
                cmdLine.setValue(data.value || data["name"] || data, 1);
                accept();
                e.stop();
            }
        });
        el.appendChild(popup.container);
        curCollectionPromise.then(() => updateCompletions());

        // Initialize key bindings
        const keys = {
            "Enter": accept,
            "Shift-Enter": function () {
                const curData = popup.getData(popup.getRow());
                const cleanedPath = Utils.normalizeItemPath(curData.uri);
                done();
                options.scrollTreeToItem(cleanedPath);
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
                curCollectionPromise = getDataItem(parentPath);
                cmdLine.setValue(parentPath, 1);
                updateCompletions();
            },
            "Up": function () { popup.goTo("up"); },
            "Down": function () { popup.goTo("down"); },
            "Ctrl-Up|Ctrl-Home": function () { popup.goTo("start"); },
            "Ctrl-Down|Ctrl-End": function () { popup.goTo("end"); },
            "Tab": function () {
                const curData = popup.getData(popup.getRow());
                cmdLine.setValue(curData.uri, 1);
                updateCompletions();
            },
            "PageUp": function () { popup.gotoPageUp(); },
            "PageDown": function () { popup.gotoPageDown(); },
            "Alt-C": function () {
                /** @type {DataItem} */
                const curData = popup.getData(popup.getRow());
                const itemName = curData.prefix ? curData.value.replace(curData.prefix, '') : curData.value;
                window.navigator.clipboard.writeText(itemName);
            },
            "Alt-Ctrl-C": function () {
                /** @type {DataItem} */
                const curData = popup.getData(popup.getRow());
                window.navigator.clipboard.writeText(curData.uri);
            },
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
         * Get history list @returns {Partial<DataItem>[]} */
        function getHistory() {
            return JSON.parse(localStorage.getItem(options.historyKey ?? HISTORY_KEY) ?? '[]');
        }

        /**
         * Add new item to history @param {DataItem} item data item to add to history */
        function addToHistory(item) {
            const history = getHistory();
            const filteredHistory = history.filter(
                data => data.value !== item.uri && data.value !== item.value
            );
            filteredHistory.unshift({
                value: Utils.normalizeItemPath(item.uri || item.value),
                meta: item.meta,
                prefix: item.prefix,
            });
            localStorage.setItem(options.historyKey ?? HISTORY_KEY, JSON.stringify(filteredHistory.slice(0, options.maxHistory ?? MAX_HISTORY)));
        }

        function updateCompletions() {
            /**
             * @param {Partial<DataItem>[]} itemList
             * @param {String?} filterText
             * @returns {Partial<DataItem>[]}
             */
            function getFilteredCompletions(itemList, filterText) {
                const resultItems = JSON.parse(JSON.stringify(itemList));
                const filtered = new FilteredList(resultItems);
                return filtered.filterCompletions(resultItems, filterText);
            }

            curCollectionPromise.then(curCollection => {

                const cmdLineValue = cmdLine.getValue().trimStart();
                const curDirPath = Utils.getCurCollPath(cmdLineValue);

                // Get completions using curDirItem if loaded
                if (curDirPath === Utils.normalizeItemPath(curCollection.uri ?? '')) {
                    // Get the input value to update completions
                    // Only use the last component of the path for completions
                    const filterText = cmdLineValue.split('/').at(-1);
                    const filteredCompletions = getFilteredCompletions(curCollection.children ?? [], filterText);
                    const completions = filteredCompletions.length > 0 ? filteredCompletions : [
                        {
                            uri: curCollection.uri,
                            value: '🔄️ Reload data...',
                            meta: '>',
                            keepPrompt: true,
                        },
                    ];
                    popup.setData(completions, filterText);
                }
                // Else prompt to load curDirItem and load history
                else {
                    const history = getHistory();
                    /** * @type {Partial<DataItem>[]} */
                    let filteredCompletions = [];
                    if (history.length > 0) {
                        filteredCompletions = getFilteredCompletions(history, cmdLineValue);
                        if (filteredCompletions.length > 0) filteredCompletions[0].message = 'Recent';
                        filteredCompletions.forEach(item => {
                            item.uri = item.value;
                            item.value = (item.prefix ?? '') + item.uri;
                        });
                    }
                    const completions = [{
                        uri: curDirPath,
                        value: '⬇️ Load content...',
                        meta: '>',
                        keepPrompt: true,
                    }, ...filteredCompletions];
                    popup.setData(completions, cmdLineValue);
                }
                popup.resize(true);
            })
        }

        function accept() {
            if (dataLoading) return;
            /** @type DataItem */
            const curData = popup.getData(popup.getRow());
            const cleanedPath = Utils.normalizeItemPath(curData.uri);
            console.debug('browse_ss: accepted', curData);
            addToHistory(curData);
            if (curData.meta?.endsWith('>')) {
                const directoryPath = cleanedPath + '/';
                curCollectionPromise = getDataItem(directoryPath);
                if (!curData.keepPrompt) cmdLine.setValue(directoryPath, 1);
                updateCompletions();
            } else {
                try {
                    options.openItem(curData);
                } finally {
                    done();
                }
            }
        }

        /**
         * Get DataItem from provided path
         * @param {String} itemPath Absolute item path
         * @returns {Promise<Partial<DataItem>>}
         */
        function getDataItem(itemPath) {
            dataLoading = true;
            promptTextContainer.hidden = false;
            const dataItemPromise = options.queryItemPath(itemPath);
            dataItemPromise.then(() => { dataLoading = false; promptTextContainer.hidden = true; })
                .catch(e => { promptTextContainer.textContent = `❌ Error loading data: ${e}`; console.error(e) });
            return dataItemPromise;
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
        margin: 100px auto;
        padding: 3px;
        background: white;
        border-radius: 2px;
        box-shadow: 0px 2px 3px 0px #555;
        }`,
        "browse_ss.css",
        false
    );
    exports.browse_ss = browse_ss;

    browse_ss.browse_files = function () {
        browse_ss({
            defaultPath: SsFiles.getStartPath(),
            historyKey: SsFiles.historyKey,
            placeholder: SsFiles.placeholder,
            maxHistory: SsFiles.maxHistory,
            openItem: SsFiles.openFile,
            queryItemPath: SsFiles.getFileDataItem,
            scrollTreeToItem: Utils.focusItemOnTree,
        });
    }

    browse_ss.browse_library = function () {
        browse_ss({
            defaultPath: SsLibrary.getStartPath(),
            historyKey: SsLibrary.historyKey,
            placeholder: SsLibrary.placeholder,
            maxHistory: SsLibrary.maxHistory,
            openItem: SsLibrary.openTable,
            queryItemPath: SsLibrary.getLibraryDataItem,
            scrollTreeToItem: Utils.focusItemOnTree,
        });
    }

    // @ts-ignore
    config.loadModule("ace/commands/default_commands", function (module) {
        module.commands.push({
            name: "browseSsFiles",
            description: "Browse SAS Studio files",
            bindKey: { win: "Alt-p", mac: "Option-p" },
            readOnly: true,
            exec: function () {
                // @ts-ignore
                config.loadModule("ace/ext/browse_ss", function (module) {
                    module.browse_ss.browse_files();
                })
            }
        });
        module.commands.push({
            name: "browseSsLibrary",
            description: "Browse SAS Studio library items",
            bindKey: { win: "Alt-o", mac: "Option-o" },
            readOnly: true,
            exec: function () {
                // @ts-ignore
                config.loadModule("ace/ext/browse_ss", function (module) {
                    module.browse_ss.browse_library();
                })
            }
        });
    });

    window._browseSsFilesListener = function (event) {
        if (event.key !== 'p' || !event.altKey || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        event.stopPropagation();
        browse_ss.browse_files();
    }
    window.addEventListener('keydown', window._browseSsFilesListener, true);
    window._browseSsLibraryListener = function (event) {
        if (event.key !== 'o' || !event.altKey || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        event.stopPropagation();
        browse_ss.browse_library();
    }
    window.addEventListener('keydown', window._browseSsLibraryListener, true);

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
                if (ignore && closer) {
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

        // @ts-ignore
        static openItemInSs(targetItem) {
            const action = ['DATA', 'VIEW'].includes(targetItem.type) ? 'TableOpen' :
                targetItem.fileType === 'TXT' ? 'FileOpenWithTextViewer' :
                    targetItem.fileType === 'EXT' ? 'FileOpenWithExternalProgram' :
                        'FileOpen';
            // @ts-ignore
            window.appDMS.handleWebOneEvent(action, targetItem);
        }

        /**
         * Focus the project tree to the provided item path,
         *  if the path start with 'libraries' then use the library tree,
         *  otherwise use the project (files) tree
         * @param {String} itemPath Absolute item path
         */
        static focusItemOnTree(itemPath) {
            console.debug('browse_ss: focusing tree on item ', itemPath);
            /** * @param {string} targetTreeId */
            function selectTreePane(targetTreeId) {
                const paneId = `${targetTreeId}Pane`;
                // @ts-ignore
                const accContainer = window.dijit.byId('accContainer');
                const targetPane = accContainer.getChildren().filter((/** @type {{ id: string; }} */ p) => p.id === paneId)?.[0];
                if (targetPane) accContainer.selectChild(targetPane);
            }
            // @ts-ignore
            function scrollTreeToSelectedNode(tree) {
                selectTreePane(tree.id.split('.')[0]);
                const targetNode = tree.get('selectedNode')?.labelNode;
                if (targetNode?.scrollIntoViewIfNeeded) {
                    targetNode.scrollIntoViewIfNeeded();
                } else {
                    targetNode.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                }
            }
            /**
             * @param {string} targetPath
             * @param {string=} targetTreeId
             */
            function scrollTreeToPath(targetPath, targetTreeId) {
                if (!targetPath) return;
                const treeId = targetTreeId ?? (targetPath.startsWith('libraries') ? 'library' : 'projects');
                // @ts-ignore
                const tree = window.dijit.byId(`${treeId}.tree`);

                if (treeId === 'library') targetPath = targetPath.replace(/[.~]/g, '/');

                // dojo provide tree.set('path',...) for this purpose but it does not work
                // => because DMSProject modified the method ._expandNode(), making it return undefined instead of a Promise
                // DMSProject backup the original method as ._expandNodeStash() but sometimes it messes up, likely during refreshes
                // Create a version of the original method for our own usage
                // @ts-ignore
                const expandNodeOrig = window.dijit.Tree.prototype._expandNode.bind(tree);

                /**
                 * @param {{ getChildren: () => any; }} node
                 * @param {string} path
                 */
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
            scrollTreeToPath(itemPath);
        }

        /**
         * Normalize the provided item path: each components is separated by
         *  a single slash, no blank at begining, no slash at the end,
         *  blank is converted to root path '/'
         * @param {String} itemPath Absolute item path
         * @returns {String}
         */
        static normalizeItemPath(itemPath) {
            const trimmed = itemPath.trimStart();
            const replacedConsecutiveSlashes = trimmed.replace(/\/+/g, '/');
            if (trimmed === '' || replacedConsecutiveSlashes === '/') return '/';
            const replacedEndingSlash = replacedConsecutiveSlashes.replace(/\/+$/, '');
            return replacedEndingSlash;
        }

        /**
         * Get path to current collection without slash at the end:
         *  if path ends with a slash then return the current collection,
         *  otherwise return the parent path
         * @param {String} itemPath Absolute item path
         * @returns {String}
         */
        static getCurCollPath(itemPath) {
            const trimmed = itemPath.trimStart();
            const replacedConsecutiveSlashes = trimmed.replace(/\/+/g, '/');
            if (trimmed === '' || replacedConsecutiveSlashes === '/') return '/';
            return replacedConsecutiveSlashes.includes('/') ?
                replacedConsecutiveSlashes.slice(0, replacedConsecutiveSlashes.lastIndexOf('/')) :
                replacedConsecutiveSlashes;
        }

    }

    class SsFiles {
        static defaultPath = '/applis/12201-esmb0-sasbasic/data/DEN/';
        static placeholder = 'Enter a path to browse';
        static maxHistory = 100;
        static historyKey = 'BrowseSsFilesHistory';

        /** @returns {String} */
        static getStartPath() {
            // If current open tab is a file then use the file path
            //  This allow to get information about the file
            const currentTab = window.appDMS.tabs.getFocusedTab();
            return (currentTab?.type === 'FILE' && currentTab?.uri) ?
                currentTab.uri : SsFiles.defaultPath;
        }

        /**
         * Get DataItem from provided file path
         * @param {String} filePath Absolute file path
         * @returns {Promise<Partial<DataItem>>}
         */
        static getFileDataItem(filePath) {
            console.debug('browse_ss: filePath is ', filePath);
            const cleanedPath = Utils.normalizeItemPath(filePath);
            const convertedPath = cleanedPath.replace(/\/+/g, '~ps~');
            /**
             * @type {Promise<SsFileItem>}
             */
            // @ts-ignore
            const fsItem = window.appDMS.projects.projectTreeStore.query(convertedPath);
            return fsItem.then(item => {
                console.debug('browse_ss: get file item', item);
                /** @type Partial<DataItem> */
                const dataItem = {
                    uri: item.uri,
                };
                dataItem.children = item.children?.map(childItem => {
                    const prefix = childItem.isDirectory ? '📁 ' :
                        childItem.name?.endsWith('.sas') ? '📘 ' :
                            childItem.name?.endsWith('.sas7bdat') ? '📅 ' :
                                childItem.name?.endsWith('.log') ? '📜 ' :
                                    childItem.name?.endsWith('.txt') ? '📝 ' :
                                        childItem.name?.endsWith('.xls') ? '📊 ' :
                                            childItem.name?.endsWith('.xlsx') ? '📊 ' :
                                                childItem.name?.endsWith('.csv') ? '📋 ' :
                                                    childItem.name?.endsWith('.sh') ? '💲 ' :
                                                        '';
                    return {
                        value: prefix + childItem.name,
                        prefix: prefix,
                        uri: childItem.uri,
                        keepPrompt: false,
                        meta: childItem.isDirectory ? '>' :
                            `${SsFiles.bytesToSize(childItem.size)}┊${SsFiles.modifiedDateString(childItem)}`,
                    };
                });
                dataItem.children?.unshift(
                    {
                        uri: item.uriParent,
                        value: '⬆️.. ' + SsFiles.childrenItemsCount(item.children ?? []),
                        meta: '>',
                        keepPrompt: false,
                    },
                );

                return dataItem
            })
        }

        /**
         * Open the file in SAS Studio
         * @param {DataItem} fileDataItem DataItem pointing to the file
         */
        static openFile(fileDataItem) {
            console.debug('browse_ss: opening file ', fileDataItem);
            const targetItem = {
                uri: fileDataItem,
                name: Utils.normalizeItemPath(fileDataItem.uri).split('/').at(-1),
                type: 'FILE',
            }
            Utils.openItemInSs(targetItem);
        }

        /**
         * @param {SsFileItem[]} childrenItems
         * @returns {String}
         */
        static childrenItemsCount(childrenItems) {
            if (childrenItems.length == 0) return '';
            let [fileCount, directoryCount] = [0, 0];
            childrenItems.forEach(item => {
                if (item.isDirectory) directoryCount++;
                else fileCount++;
            });
            const allCountTexts = [
                directoryCount > 0 ? directoryCount + (directoryCount > 1 ? ' directories' : ' directory') : '',
                fileCount > 0 ? fileCount + (fileCount > 1 ? ' files' : ' file') : '',
            ].filter(i => Boolean(i));
            let result = allCountTexts.length > 1 ? `${childrenItems.length} children: ` : '';
            result += allCountTexts.join(', ');
            return result;
        }


        /**
         * @param {Partial<SsFileItem>} fileItem 
         * @returns {String}
         */
        static modifiedDateString(fileItem) {
            if (fileItem.originalModifiedDateString) return fileItem.originalModifiedDateString;
            const ts = fileItem.modifiedDate ?? 0;
            if (ts > 0) {
                const localTs = ts + new Date().getTimezoneOffset() * 60000;
                const modifiedDate = new Date(localTs);
                return modifiedDate.toLocaleString('en-CA', { hour12: false, timeZoneName: 'short' });
            }
            return '';
        }

        /**
         * @param {String} sizeInBytesStr
         * @returns {String}
         */
        static bytesToSize(sizeInBytesStr) {
            const units = ["B", "KB", "MB", "GB", "TB"];
            const sizeInBytes = parseInt(sizeInBytesStr.split(' ')[0]);
            if (sizeInBytes == 0) {
                return "0 " + "B";
            }
            const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
            if (i == 0) {
                return sizeInBytes + " " + units[i];
            }
            return (
                parseFloat((sizeInBytes / Math.pow(1024, i)).toFixed(1)) +
                " " + units[i]
            );
        }
    }

    class SsLibrary {
        static defaultPath = 'libraries/';
        static placeholder = 'Enter a path to browse';
        static maxHistory = 100;
        static historyKey = 'BrowseSsLibraryHistory';

        /** @returns {String} */
        static getStartPath() {
            // If current open tab is a table or a view then use the current path
            //  This allow to get information about the table/view columns
            const currentTab = window.appDMS.tabs.getFocusedTab();
            return (['DATA', 'VIEW'].includes(currentTab?.type) && (currentTab?.id ?? currentTab?.uri)) ?
                (currentTab.id ?? currentTab.uri).replaceAll('~', '/') + '/'
                : SsLibrary.defaultPath;
        }

        /**
         * Get DataItem from provided file path
         * @param {String} libraryItemPath Absolute item path
         * @returns {Promise<Partial<DataItem>>}
         */
        static getLibraryDataItem(libraryItemPath) {
            console.debug('browse_ss: libraryItemPath is ', libraryItemPath);
            const cleanedPath = Utils.normalizeItemPath(libraryItemPath);
            const convertedPath = cleanedPath.replace(/\/+/g, '~');
            console.debug('browse_ss: query library item', convertedPath);
            /** * @type {Promise<SsLibraryItem>} */
            const sSItem = window.appDMS.libraries.treeModel.query(convertedPath);
            return sSItem.then(item => {
                console.debug('browse_ss: got item', item);
                // item.id is only library name when querying library item directly
                // item.id is null when querying table item directly
                // Easier to use cleanedPath than handle all issue with item.id
                /** @type Partial<DataItem> */
                const dataItem = { uri: cleanedPath };
                dataItem.children = item.children?.map(childItem => {
                    const prefix = childItem.isLibrary ?
                        (childItem.engine === "V9" ? '📚️ ' : childItem.engine === 'ORACLE' ? '📕️ ' : '❔ ') :
                        childItem.table ? (childItem.type === 'VIEW' ? '🔍 ' : '📅 ') :
                            childItem.library === 'columns' ? (childItem.type === 'Numeric' ? '💯 ' : '©️️ ') :
                                '';
                    return {
                        value: prefix + childItem.name,
                        prefix: prefix,
                        uri: childItem.id.replaceAll('~', '/'),
                        keepPrompt: false,
                        meta: (childItem.isLibrary || childItem.table) ? '>' :
                            `${item.dataType === 'VIEW' ? 'V' : ''}${childItem.type} ${childItem.format}`,
                    };
                });
                const parentUri = cleanedPath.indexOf('/') >= 0 ?
                    cleanedPath.slice(0, cleanedPath.lastIndexOf('/')) : 'libraries';
                dataItem.children?.unshift(
                    {
                        uri: parentUri,
                        value: '⬆️.. ' + SsLibrary.childrenItemsCount(item.children ?? []),
                        meta: '>',
                        keepPrompt: false,
                    },
                );
                console.debug('browse_ss: return data item', dataItem);
                return dataItem
            })
        }

        /**
         * Open the library table in SAS Studio
         * @param {DataItem} tableDataItem DataItem pointing to the table/view
         */
        static openTable(tableDataItem) {
            console.debug('browse_ss: opening table ', tableDataItem);
            const [root, library, table] = Utils.normalizeItemPath(tableDataItem.uri).split('/');
            const targetItem = {
                type: tableDataItem.meta?.startsWith('V') ? 'VIEW' : 'DATA',
                uri: `${root}~${library}/${table}`,
                library: library,
                name: table
            }
            Utils.openItemInSs(targetItem);
        }

        /**
         * @param {SsLibraryItem[]} childrenItems
         * @returns {String}
         */
        static childrenItemsCount(childrenItems) {
            if (childrenItems.length == 0) return '';
            let [libraryCount, tableCount, columnCount] = [0, 0, 0];
            childrenItems.forEach(item => {
                if (item.isLibrary) libraryCount++;
                else if (item.table) tableCount++;
                else if (item.library === 'columns') columnCount++;
            });
            const allCountTexts = [
                libraryCount > 0 ? libraryCount + (libraryCount > 1 ? ' libraries' : ' library') : '',
                tableCount > 0 ? tableCount + (tableCount > 1 ? ' tables' : ' table') : '',
                columnCount > 0 ? columnCount + (columnCount > 1 ? ' columns' : ' column') : '',
            ].filter(i => Boolean(i));
            let result = allCountTexts.length > 1 ? `${childrenItems.length} children: ` : '';
            result += allCountTexts.join(', ');
            return result;
        }
    }

});
(function () {
    // @ts-ignore
    ace.require(["ace/ext/browse_ss"], function (m) {
        if (typeof module == "object" && typeof exports == "object" && module) {
            module.exports = m;
        }
    });
})();

function _reloadBrowseSs() {
    const moduleId = 'ace/ext/browse_ss';
    // @ts-ignore
    const srcPath = ace.config.moduleUrl(moduleId);
    window.removeEventListener('keydown', window._browseSsFilesListener, true);
    window.removeEventListener('keydown', window._browseSsLibraryListener, true);
    Array.from(document.body.getElementsByTagName('script')).filter(el => el.src && el.src === srcPath).forEach(el => el.remove());
    document.getElementById('browse_ss.css')?.remove();
    // @ts-ignore
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
 * @typedef DataItem
 * @property {String} uri Absolute item path
 * @property {String} value Display name for the item (uri in case of history item)
 * @property {String?} meta Secondary description, '>' for collection
 * @property {Boolean?} keepPrompt Whether to keep current prompt value when select this item
 * @property {String?} message Message on item
 * @property {String?} prefix Prefix to item name, mainly for history item icon
 * @property {Partial<DataItem>[]?} children Children items
 */

/**
 * @typedef SsFileItem File Item retrieved from SAS Studio
 * @property {String} uri Absolute file path
 * @property {String} uriParent Absolute parent path
 * @property {String} name File name
 * @property {String} id Item id
 * @property {Boolean} isDirectory Whether the item is a directory or a file
 * @property {Number} modifiedDate Modified date timestamp
 * @property {String} size Item size
 * @property {String} originalModifiedDateString Original modified date in string
 * @property {SsFileItem[]?} children Children items
 */

/**
 * @typedef SsLibraryItem Library Item retrieved from SAS Studio
 * @property {String} name Item name
 * @property {String} id Item id
 * @property {String} engine Library engine name
 * @property {String?} library Library name this item belong to, all columns belong to the 'columns' library
 * @property {Boolean} table Whether the item is a table
 * @property {Boolean} isDBMS Whether the item is a DBMS item
 * @property {Boolean} isLibrary Whether the item is a library
 * @property {String?} type Column data type
 * @property {String?} dataType Only seems to be set to 'VIEW' when item is a view
 * @property {String?} format Column data format
 * @property {SsLibraryItem[]?} children Children items
 */