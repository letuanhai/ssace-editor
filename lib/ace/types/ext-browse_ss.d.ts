export type KeyboardEventListener = (ev: KeyboardEvent) => any;
declare global {
    interface Window {
        appDMS: any,
        _browseSsFilesListener: KeyboardEventListener;
        _browseSsLibraryListener: KeyboardEventListener;
        _browseSsTabsListener: KeyboardEventListener;
    }
}