// This file exposes the APIs from the main process to the renderer

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // File operations
  getTree: () => ipcRenderer.invoke("file:getTree"),
  getFileContent: (path: string) => ipcRenderer.invoke("file:getContent", path),
  saveFile: (path: string, content: string) =>
    ipcRenderer.invoke("file:save", path, content),
  delFile: (path: string) => ipcRenderer.invoke("file:delete", path),
  createFolder: (path: string) => ipcRenderer.invoke("file:mkdir", path),
  renamePath: (oldPath: string, newPath: string) =>
    ipcRenderer.invoke("file:rename", oldPath, newPath),
  delFolder: (path: string) => ipcRenderer.invoke("file:rmdir", path),
  stat: (path: string) => ipcRenderer.invoke("file:stat", path),
  exists: (path: string) => ipcRenderer.invoke("file:exists", path),
  insertAtCursor: (path: string, insertion: string, marker?: string) =>
    ipcRenderer.invoke("file:insertAtCursor", path, insertion, marker),
  openDialog: () => ipcRenderer.invoke("file:openDialog"),

  // AI operations
  aiGhost: (args: any) => ipcRenderer.invoke("ai:ghost", args),
  //aiComplete: (args: any) => ipcRenderer.invoke("ai:complete", args),
  aiChat: (args: any) => ipcRenderer.invoke("ai:chat", args),
  aiRagChat: (args: any) => ipcRenderer.invoke("ai:ragChat", args),
  indexCodebase: () => ipcRenderer.invoke("ai:indexCodebase"),
  //aiClassify: (args: any) => ipcRenderer.invoke("ai:classify", args),
  //aiCompletionRag: (args: any) => ipcRenderer.invoke("ai:completionRag", args),

  // Tavily operations
  tavilySearch: (args: any) => ipcRenderer.invoke("tavily:search", args),

  // Window operations
  zoomIn: () => ipcRenderer.invoke("window:zoom-in"),
  zoomOut: () => ipcRenderer.invoke("window:zoom-out"),
  resetZoom: () => ipcRenderer.invoke("window:reset-zoom"),
});

// these are accessible in the renderer process via window.electronAPI
