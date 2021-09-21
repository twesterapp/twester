import { useState } from 'react';

export function useAppVersion() {
    const [version, setVersion] = useState('');
    // @ts-ignore
    const ipc = window.electron.ipcRenderer;

    if (!version) {
        ipc.sendVersion();
    }

    ipc.once('app_version', (event: { version: string }) => {
        setVersion(event.version);
    });

    return version;
}
