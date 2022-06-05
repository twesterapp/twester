const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        myPing() {
            ipcRenderer.send('ipc-example', 'ping');
        },
        sendVersion() {
            ipcRenderer.send('app_version');
        },
        sendLog(log) {
            ipcRenderer.send('logging', log);
        },
        sendSettings(settings) {
            ipcRenderer.send('settings', settings);
        },
        on(channel, func) {
            const validChannels = [
                'ipc-example',
                'app_version',
                'logging',
                'update_available',
                'update_downloaded',
                'update_failed',
                'settings',
                'get_settings',
            ];
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender`
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        },
        once(channel, func) {
            const validChannels = [
                'ipc-example',
                'app_version',
                'logging',
                'update_available',
                'update_downloaded',
                'update_failed',
                'settings',
                'get_settings',
            ];
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender`
                ipcRenderer.once(channel, (event, ...args) => func(...args));
            }
        },
    },
});
