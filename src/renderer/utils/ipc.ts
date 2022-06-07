// This interface should be updated whenever `preload.js` is changed.
// This interface is just for some intellisense benefits.
interface Ipc {
    myPing: () => void;
    on: (channel: any, func: any) => void;
    once: (channel: any, func: any) => void;
    sendVersion: () => void;
    sendLog: (log: any) => void;
    sendSettings: (settings: any) => void;
}

export function getIpc(): Ipc {
    // @ts-ignore
    return window.electron.ipcRenderer;
}
