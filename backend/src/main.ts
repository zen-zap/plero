// this file is for actually running the app and completely separate from testing
// in src/main.ts
//
import "dotenv/config"; // Load env vars before anything else

import { app, BrowserWindow } from "electron";
import * as path from "path";

// Register all IPC handlers (each file registers its own handlers)
import "./ipc/filesIpc";
import "./ipc/tavily";
import "./ipc/ai";

let mainWindow: BrowserWindow | null = null;

// create the browser window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, "../preload.js"),
      contextIsolation: true,  // some security configuration
      nodeIntegration: false,
    },
  });

  // Replace with your actual UI entry point if needed
  mainWindow.loadURL("about:blank");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
