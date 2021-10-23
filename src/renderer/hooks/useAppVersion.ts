import { useState, useEffect } from 'react';

export function useAppVersion() {
    const [version, setVersion] = useState('');
    // @ts-ignore
    const ipc = window.electron.ipcRenderer;

    if (!version) {
        ipc.sendVersion();
    }

    useEffect(() => {
        ipc.once('app_version', (event: { version: string }) => {
            setVersion(event.version);
        });
    }, [ipc]);

    return version;
}
