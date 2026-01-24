import { TreeNode } from "./components/FileExplorer";

declare global {
  interface Window {
    electronAPI: {
      getTree: () => Promise<{ ok: boolean; data: TreeNode[] }>;
      getFileContent: (path: string) => Promise<{ ok: boolean; data: string }>;
      saveFile: (path: string, content: string) => Promise<{ ok: boolean }>;
      renameFile: (
        oldPath: string,
        newPath: string,
      ) => Promise<{ ok: boolean }>;
    };
  }
}
