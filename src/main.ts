// This is the electron app's entry point

import { app, BrowserWindow } from 'electron';
import path from 'path';

// Import IPC handlers
import './ipc/ai';
import './ipc/filesIpc';
import './ipc/tavily';

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false, // Disable web security for local development
        },
    });

    win.loadURL(`file://${path.resolve(process.cwd(), 'dist/renderer/index.html')}`);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
