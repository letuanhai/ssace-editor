export type KeyboardEventListener = (ev: KeyboardEvent) => any;
declare global {
    interface Window {
        _browseSsFilesListener: KeyboardEventListener;
    }
}