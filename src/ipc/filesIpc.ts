import { ipcMain } from "electron";
import * as fileService from "../services/file";

// Helper for consistent error handling
const handle = (fn: Function) => async (_event: any, ...args: any[]) => {
  try {
    //console.log(`[IPC] Calling ${fn.name} with`, args);
    const data = await fn(...args);
    //console.log(`[IPC] Success: ${fn.name} =>`, data);
    return { ok: true, data };
  } catch (error) {
    console.error(`[IPC] Error in ${fn.name}:`, error);
    return { ok: false, error: (error as Error).message ?? String(error) };
  }
};

ipcMain.handle("file:getTree", handle(() => fileService.getTree()));
ipcMain.handle("file:getContent", handle((relPath: string) => fileService.getFileContent(relPath)));
ipcMain.handle("file:save", handle((relPath: string, content: string) => fileService.saveFile(relPath, content)));
ipcMain.handle("file:delete", handle((relPath: string) => fileService.delFile(relPath)));
ipcMain.handle("file:mkdir", handle((relPath: string) => fileService.createFolder(relPath)));
ipcMain.handle("file:rename", handle((oldRelPath: string, newRelPath: string) => fileService.renamePath(oldRelPath, newRelPath)));
ipcMain.handle("file:rmdir", handle((relPath: string) => fileService.delFolder(relPath)));
ipcMain.handle("file:stat", handle((relPath: string) => fileService.stat(relPath)));
ipcMain.handle("file:exists", handle((relPath: string) => ({ exists: fileService.exists(relPath) })));
ipcMain.handle("file:insertAtCursor", handle(
  (relPath: string, insertion: string, marker?: string) => fileService.insertAtCursor(relPath, insertion, marker)
));
