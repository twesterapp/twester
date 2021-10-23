import { useState } from 'react';
import { getIpc } from 'renderer/utils/ipc';

export function useAppVersion() {
    const [version, setVersion] = useState('');
    const ipc = getIpc();

    if (!version) {
        ipc.sendVersion();
    }

    ipc.once('app_version', (event: { version: string }) => {
        setVersion(event.version);
    });

    return version;
}
