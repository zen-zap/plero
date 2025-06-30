import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getTree: () => ipcRenderer.invoke("file:getTree"),
  getFileContent: (path: string) => ipcRenderer.invoke("file:getContent", path),
  saveFile: (path: string, content: string) => ipcRenderer.invoke("file:save", path, content),
  delFile: (path: string) => ipcRenderer.invoke("file:delete", path),
  createFolder: (path: string) => ipcRenderer.invoke("file:mkdir", path),
  renamePath: (oldPath: string, newPath: string) => ipcRenderer.invoke("file:rename", oldPath, newPath),
  delFolder: (path: string) => ipcRenderer.invoke("file:rmdir", path),
  stat: (path: string) => ipcRenderer.invoke("file:stat", path),
  exists: (path: string) => ipcRenderer.invoke("file:exists", path),
});
