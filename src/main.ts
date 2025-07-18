// this file is for actually running the app and completely separate from testing
// in src/main.ts
//
import "dotenv/config"; // Load env vars before anything else
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';

// Import your IPC handlers from the backend directory
import '../backend/src/ipc/filesIpc';
import '../backend/src/ipc/ai';
import '../backend/src/ipc/tavily';

// These are magic constants injected by the Vite plugin.
// They tell us the URL of the dev server and the name of the renderer window.
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;


function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the dev server URL if it exists, otherwise load the local file.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    // This is for production builds
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Automatically open the DevTools
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  // Setup the directory dialog handler
  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return canceled ? null : filePaths[0];
  });
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
