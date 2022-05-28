/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, Tray, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
import electronDebug from 'electron-debug';
import { resolveHtmlPath, print, Level, Hex } from './util';
import { startServer } from './server';

startServer();

electronDebug({ isEnabled: true, showDevTools: false });

// We add some functions to the `Tray` object, hence `MyTray` to help with TS.
interface MyTray extends Tray {
    updateContextMenu?: () => void;
    toggleWindowVisibility?: () => void;
}

let mainWindow: BrowserWindow | null = null;
let isQuiting = false;
let tray: MyTray | null = null;
let trayContextMenu: Menu | null = null;

ipcMain.on('logging', async (_, args) => {
    print(args.date, args.level, args.hex, ...args.content);
});

ipcMain.on('ipc-example', async (event, arg) => {
    const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
    console.info(msgTemplate(arg));
    event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
}

const isDevelopment =
    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

const installExtensions = async () => {
    const installer = require('electron-devtools-installer');
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = ['REACT_DEVELOPER_TOOLS'];

    return installer
        .default(
            extensions.map((name) => installer[name]),
            forceDownload
        )
        .catch(console.info);
};

const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
};

const createWindow = async () => {
    if (isDevelopment) {
        await installExtensions();
    }

    mainWindow = new BrowserWindow({
        show: false,
        width: 1100,
        height: 700,
        autoHideMenuBar: false,
        icon: getAssetPath('/icons/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.removeMenu();
    mainWindow.loadURL(resolveHtmlPath('index.html'));

    // @TODO: Use 'ready-to-show' event
    //        https://github.com/electron/electron/blob/main/docs/api/browser-window.md#using-ready-to-show-event
    mainWindow.webContents.on('did-finish-load', () => {
        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined');
        }
        if (process.env.START_MINIMIZED) {
            mainWindow.minimize();
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Open urls in the user's browser
    mainWindow.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });

    // Check for update once app is loading
    mainWindow.once('ready-to-show', () => {
        // We don't want to check for updates on macOS as our releases are not
        // code signed and it's a requirement for macOS.
        if (process.platform !== 'darwin') {
            autoUpdater.checkForUpdatesAndNotify();
        }
    });

    // Emitted when the window is about to be closed.
    mainWindow.on('close', (event: any) => {
        // If the application is terminating, just do the default
        if (isQuiting) {
            return;
        }

        // On Mac, or on other platforms when the tray icon is in use, the window
        // should be only hidden, not closed, when the user clicks the close button
        if (process.platform === 'darwin') {
            event.preventDefault();
            if (mainWindow) {
                mainWindow.hide();
            }

            // toggle the visibility of the show/hide tray icon menu entries
            if (tray) {
                tray?.updateContextMenu?.();
            }
        }
    });

    mainWindow.on('restore', () => {
        mainWindow?.show();
        tray?.destroy();
    });
};

/**
 * Add event listeners...
 */

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
let ready = false;
app.on('ready', () => {
    print(new Date(), Level.DEBUG, Hex.DEBUG, 'Electron app is ready');
    ready = true;
    createWindow();
    tray = createTray();
});

app.on('window-all-closed', () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (!ready) {
        return;
    }

    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow) {
        mainWindow.show();
    } else {
        createWindow();
    }
});

app.on('before-quit', () => {
    isQuiting = true;
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    // Create window, load the rest of the app, etc...
    app.whenReady().then(createWindow).catch(console.info);
}

ipcMain.on('app_version', (event) => {
    event.sender.send('app_version', { version: app.getVersion() });
});

ipcMain.on('show-window', () => {
    // Using focus() instead of show() seems to be important on Windows when our window
    //   has been docked using Aero Snap/Snap Assist. A full .show() call here will cause
    //   the window to reposition:
    //   https://github.com/WhisperSystems/Signal-Desktop/issues/1429
    if (mainWindow) {
        if (mainWindow.isVisible()) {
            mainWindow.focus();
        } else {
            mainWindow.show();
        }
    }

    // toggle the visibility of the show/hide tray icon menu entries
    if (tray) {
        tray?.updateContextMenu?.();
    }
});

autoUpdater.on('update-available', () => {
    if (mainWindow) {
        mainWindow.webContents.send('update_available');
    }
});

autoUpdater.on('update-downloaded', () => {
    if (mainWindow) {
        mainWindow.webContents.send('update_downloaded');
    }
});

autoUpdater.on('error', (message) => {
    console.error('There was a problem updating the application');
    console.error(message);
    if (mainWindow) {
        mainWindow.webContents.send('update_failed');
    }
});

const createTray = () => {
    // A smaller ion is needed on macOS
    tray = new Tray(getAssetPath('/icons/icon_16.ico'));

    tray.toggleWindowVisibility = () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();

                // On some versions of GNOME the window may not be on top when restored.
                // This trick should fix it.
                // Thanks to: https://github.com/Enrico204/Whatsapp-Desktop/commit/6b0dc86b64e481b455f8fce9b4d797e86d000dc1
                mainWindow.setAlwaysOnTop(true);
                mainWindow.focus();
                mainWindow.setAlwaysOnTop(false);
            }
        }

        tray?.updateContextMenu?.();
    };

    tray.updateContextMenu = () => {
        // NOTE: we want to have the show/hide entry available in the tray icon
        // context menu, since the 'click' event may not work on all platforms.
        // For details please refer to:
        // https://github.com/electron/electron/blob/master/docs/api/tray.md.
        trayContextMenu = Menu.buildFromTemplate([
            {
                id: 'toggleWindowVisibility',
                label: mainWindow?.isVisible() ? 'hide' : 'show',
                click: tray?.toggleWindowVisibility,
            },
            {
                id: 'quit',
                label: 'Quit',
                click: app.quit.bind(app),
            },
        ]);

        tray?.setContextMenu(trayContextMenu);
    };

    tray.on('click', tray.toggleWindowVisibility);

    tray.setToolTip('Twester');
    tray.updateContextMenu();

    return tray;
};
