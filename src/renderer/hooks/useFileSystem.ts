import { useState, useEffect, useCallback } from "react";
import { TreeNode } from "../../components/FileExplorer";

export function useFileSystem() {
  const [tree, setTree] = useState<TreeNode[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<TreeNode | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isEditorLoading, setIsEditorLoading] = useState<boolean>(false);
  const [untitledCounter, setUntitledCounter] = useState<number>(1);

  // Load file tree on startup
  useEffect(() => {
    loadTree();
  }, []);

  const loadTree = useCallback(() => {
    window.electronAPI
      .getTree()
      .then((res) => {
        if (res.ok) setTree(res.data);
        else setError("Failed to load file tree.");
      })
      .catch((err) => setError(err.message));
  }, []);

  const selectFile = useCallback((file: TreeNode) => {
    if (file.type === "file") {
      setIsEditorLoading(true);
      setActiveFile(file);
      window.electronAPI
        .getFileContent(file.path)
        .then((res) =>
          setFileContent(res.ok ? res.data : "Error loading content."),
        )
        .catch((err) => setFileContent(`Error loading file: ${err.message}`))
        .finally(() => setIsEditorLoading(false));
    }
  }, []);

  const saveFile = useCallback(
    async (path: string, content: string) => {
      console.log("Saving file:", path);
      try {
        const res = await window.electronAPI.saveFile(path, content);
        if (res.ok) {
          console.log("File saved successfully.");
          // We reload the tree to see new timestamps or if a new file was created
          loadTree();
          return true;
        } else {
          console.error("Failed to save file.");
          return false;
        }
      } catch (err) {
        console.error("Error saving file:", err);
        return false;
      }
    },
    [loadTree],
  );

  const newFile = useCallback(() => {
    const untitledPath = `Untitled-${untitledCounter}`;
    const newFileNode: TreeNode = {
      path: untitledPath,
      name: `Untitled-${untitledCounter}`,
      type: "file",
    };
    setUntitledCounter((prev) => prev + 1);
    setActiveFile(newFileNode);
    setFileContent("");
    setIsDirty(true);
  }, [untitledCounter]);

  const openFileDialog = useCallback(async () => {
    try {
      const res = await window.electronAPI.openDialog();
      if (res.ok && res.data) {
        // Load the file content
        const contentRes = await window.electronAPI.getFileContent(res.data);
        if (contentRes.ok) {
          const fileName = res.data.split("/").pop() || res.data;
          const newFileNode: TreeNode = {
            path: res.data,
            name: fileName,
            type: "file",
          };
          setActiveFile(newFileNode);
          setFileContent(contentRes.data);
          setIsDirty(false);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("Error opening file:", err);
      return false;
    }
  }, []);

  const renameFile = useCallback(
    async (oldPath: string, newPath: string) => {
      try {
        const res = await window.electronAPI.renamePath(oldPath, newPath);
        if (res.ok) {
          loadTree();
          // If the renamed file was active, update the active file
          if (activeFile?.path === oldPath) {
            setActiveFile({
              ...activeFile,
              path: newPath,
              name: newPath.split("/").pop() || newPath,
            });
          }
          return true;
        }
        return false;
      } catch (err) {
        console.error("Error renaming:", err);
        return false;
      }
    },
    [loadTree, activeFile],
  );

  const deleteFile = useCallback(
    async (path: string, isFolder: boolean) => {
      try {
        const res = isFolder
          ? await window.electronAPI.delFolder(path)
          : await window.electronAPI.delFile(path);
        if (res.ok) {
          loadTree();
          // If deleted file was active, clear it
          if (activeFile?.path === path) {
            setActiveFile(null);
            setFileContent("");
          }
          return true;
        }
        return false;
      } catch (err) {
        console.error("Error deleting:", err);
        return false;
      }
    },
    [loadTree, activeFile],
  );

  const createNewFile = useCallback(
    async (folderPath: string, fileName: string) => {
      const newPath = folderPath ? `${folderPath}/${fileName}` : fileName;
      try {
        const res = await window.electronAPI.saveFile(newPath, "");
        if (res.ok) {
          loadTree();
          return true;
        }
        return false;
      } catch (err) {
        console.error("Error creating file:", err);
        return false;
      }
    },
    [loadTree],
  );

  const createNewFolder = useCallback(
    async (folderPath: string, folderName: string) => {
      const newPath = folderPath ? `${folderPath}/${folderName}` : folderName;
      try {
        const res = await window.electronAPI.createFolder(newPath);
        if (res.ok) {
          loadTree();
          return true;
        }
        return false;
      } catch (err) {
        console.error("Error creating folder:", err);
        return false;
      }
    },
    [loadTree],
  );

  const [isDirty, setIsDirty] = useState(false);

  return {
    tree,
    error,
    activeFile,
    fileContent,
    isEditorLoading,
    isDirty,
    setIsDirty,
    selectFile,
    saveFile,
    newFile,
    openFileDialog,
    renameFile,
    deleteFile,
    createNewFile,
    createNewFolder,
  };
}
