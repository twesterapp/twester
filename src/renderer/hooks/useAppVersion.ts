import { useState, useEffect } from 'react';

export function useAppVersion() {
    const [version, setVersion] = useState('');
    // @ts-ignore
    const ipc = window.electron.ipcRenderer;

    if (!version) {
        ipc.sendVersion();
    }

    useEffect(() => {
        // We should listen for the `ipc` event after mounting, otherwise we
        // will get "Can't perform a React state update on an unmounted
        // component" error on unmount.
        ipc.once('app_version', (event: { version: string }) => {
            setVersion(event.version);
        });
    }, [ipc]);

    return version;
}
