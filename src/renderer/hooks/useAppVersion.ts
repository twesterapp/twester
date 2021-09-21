import { useState } from 'react';

export function useAppVersion() {
    const [version, setVersion] = useState('');
    const ipc = window.electron.ipcRenderer;

    if (!version) {
        ipc.sendVersion();
    }

    ipc.on('app_version', (event: { version: string }) => {
        setVersion(event.version);
    });

    return version;
}
