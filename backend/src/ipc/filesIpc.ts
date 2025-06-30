import { ipcMain } from "electron";
import * as fileService from "../services/file";

ipcMain.handle("file:getTree", async () => fileService.getTree());
ipcMain.handle("file:getContent", async (_event, relPath: string) => fileService.getFileContent(relPath));
ipcMain.handle("file:save", async (_event, relPath: string, content: string) => fileService.saveFile(relPath, content));
ipcMain.handle("file:delete", async (_event, relPath: string) => fileService.delFile(relPath));
ipcMain.handle("file:mkdir", async (_event, relPath: string) => fileService.createFolder(relPath));
ipcMain.handle("file:rename", async (_event, oldRelPath: string, newRelPath: string) => fileService.renamePath(oldRelPath, newRelPath));
ipcMain.handle("file:rmdir", async (_event, relPath: string) => fileService.delFolder(relPath));
ipcMain.handle("file:stat", async (_event, relPath: string) => fileService.stat(relPath));
ipcMain.handle("file:exists", async (_event, relPath: string) => ({ exists: fileService.exists(relPath) }));
