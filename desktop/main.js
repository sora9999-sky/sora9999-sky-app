// Avicenna Pharmacy — Electron main process
// Wraps the deployed web app inside a native Windows window.

const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');

// You can override the URL by setting AVICENNA_URL env var, otherwise
// the production deployment is used.
const APP_URL = process.env.AVICENNA_URL || 'https://rx-inventory-hub-6.emergent.host';

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: 'Avicenna Pharmacy',
        icon: path.join(__dirname, 'assets', 'icon.ico'),
        backgroundColor: '#F9FAFB',
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            // Camera (barcode scanner) needs these
            webSecurity: true,
        },
    });

    // Camera permission for the html5-qrcode barcode scanner
    mainWindow.webContents.session.setPermissionRequestHandler(
        (webContents, permission, callback) => {
            if (permission === 'media' || permission === 'camera') {
                callback(true);
            } else {
                callback(false);
            }
        }
    );

    mainWindow.loadURL(APP_URL).catch((err) => {
        dialog.showErrorBox(
            'Cannot reach Avicenna Pharmacy',
            `Failed to load ${APP_URL}\n\n${err.message}\n\nMake sure you have an internet connection, or set AVICENNA_URL to your local server.`
        );
    });

    // Open external links in default browser instead of inside app
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Simple File menu with reload / quit
function buildMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                { role: 'reload', label: 'Reload' },
                { role: 'forceReload', label: 'Force Reload' },
                { type: 'separator' },
                { role: 'quit', label: 'Exit' },
            ],
        },
        {
            label: 'View',
            submenu: [
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { role: 'resetZoom' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
            ],
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About Avicenna Pharmacy',
                            message: 'Avicenna Pharmacy Desktop',
                            detail: `Version 1.0.0\nLoading: ${APP_URL}`,
                        });
                    },
                },
            ],
        },
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
    buildMenu();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
