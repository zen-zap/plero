// in src/preload.ts

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
    insertAtCursor: (path: string, insertion: string, marker?: string) =>  ipcRenderer.invoke("file:insertAtCursor", path, insertion, marker),
    aiComplete: (args: any) => ipcRenderer.invoke("ai:complete", args),
    tavilySearch: (args: any) => ipcRenderer.invoke("tavily:search", args),
    aiChat: (args: any) => ipcRenderer.invoke("ai:chat", args),
    aiClassify: (args: any) => ipcRenderer.invoke("ai:classify", args),
});
