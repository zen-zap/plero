import { ipcMain, BrowserWindow, webContents } from "electron";

ipcMain.handle("window:zoom-in", async (_event) => {
  const win = BrowserWindow.fromWebContents(_event.sender);
  if (win) {
    const currentZoom = win.webContents.getZoomLevel();
    win.webContents.setZoomLevel(currentZoom + 0.5);
  }
  return { ok: true };
});

ipcMain.handle("window:zoom-out", async (_event) => {
  const win = BrowserWindow.fromWebContents(_event.sender);
  if (win) {
    const currentZoom = win.webContents.getZoomLevel();
    win.webContents.setZoomLevel(currentZoom - 0.5);
  }
  return { ok: true };
});

ipcMain.handle("window:reset-zoom", async (_event) => {
  const win = BrowserWindow.fromWebContents(_event.sender);
  if (win) {
    win.webContents.setZoomLevel(0);
  }
  return { ok: true };
});
