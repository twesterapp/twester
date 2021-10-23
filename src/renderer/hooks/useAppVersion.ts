import { getIpc } from 'renderer/utils/ipc';
import { useState, useEffect } from 'react';

export function useAppVersion() {
    const [version, setVersion] = useState('');
    const ipc = getIpc();

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
