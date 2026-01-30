import { useState, useEffect, useCallback } from "react";
import { TreeNode } from "../../components/FileExplorer";

export function useFileSystem() {
  const [tree, setTree] = useState<TreeNode[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<TreeNode | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isEditorLoading, setIsEditorLoading] = useState<boolean>(false);
  const [untitledCounter, setUntitledCounter] = useState<number>(1);
  const [openTabs, setOpenTabs] = useState<TreeNode[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isIndexingCodebase, setIsIndexingCodebase] = useState(false);

  const loadTree = useCallback(() => {
    window.electronAPI
      .getTree()
      .then((res) => {
        if (res.ok) setTree(res.data ?? null);
        else setError("Failed to load file tree.");
      })
      .catch((err) => setError(err.message));
  }, []);

  // Load file tree on startup
  useEffect(() => {
    loadTree();
  }, [loadTree]);

  // Auto-index on startup if a folder is already open
  useEffect(() => {
    const indexOnStartup = async () => {
      try {
        const result = await window.electronAPI.getRoot();
        if (result.ok && result.data) {
          // A folder is already set from a previous session - index it
          // console.log(
          //   "[useFileSystem] Found existing root folder, indexing on startup:",
          //   result.data,
          // );
          setIsIndexingCodebase(true);
          try {
            const indexResult = await window.electronAPI.indexCodebase?.();
            if (indexResult?.ok) {
              // console.log(
              //   "[useFileSystem] Startup indexing completed:",
              //   indexResult.data,
              // );
            } else {
              // console.error(
              //   "[useFileSystem] Startup indexing failed:",
              //   indexResult?.error,
              // );
            }
          } catch (indexErr) {
            // console.error(
            //   "[useFileSystem] Error during startup indexing:",
            //   indexErr,
            // );
          } finally {
            setIsIndexingCodebase(false);
          }
        }
      } catch (err) {
        // console.error("[useFileSystem] Error checking root on startup:", err);
      }
    };
    indexOnStartup();
  }, []); // Run once on mount

  const openFolderDialog = useCallback(async () => {
    try {
      const res = await window.electronAPI.openFolderDialog();

      if (!res.ok || !res.data) {
        return;
      }

      const folderPath = res.data;
      const setRootResult = await window.electronAPI.setRoot(folderPath);
      if (!setRootResult.ok) {
        setError(setRootResult.error || "Failed to set folder");
        return;
      }

      setActiveFile(null);
      setFileContent("");
      setOpenTabs([]);
      setIsDirty(false);

      // we reload the file tree
      loadTree();

      // Auto-index the codebase for AI context
      setIsIndexingCodebase(true);
      // console.log("[useFileSystem] Starting codebase indexing...");
      try {
        const indexResult = await window.electronAPI.indexCodebase?.();
        if (indexResult?.ok) {
          // console.log(
          //   "[useFileSystem] Codebase indexed successfully:",
          //   indexResult.data,
          // );
        } else {
          // console.error(
          //   "[useFileSystem] Codebase indexing failed:",
          //   indexResult?.error,
          // );
        }
      } catch (indexErr) {
        // console.error("[useFileSystem] Error indexing codebase:", indexErr);
      } finally {
        setIsIndexingCodebase(false);
      }
    } catch (err) {
      // console.error("Error opening folder:", err);
    }
  }, [loadTree]);

  const selectFile = useCallback((file: TreeNode) => {
    if (file.type !== "file") return;
    setIsEditorLoading(true);

    setOpenTabs((prev) => {
      if (prev.find((t) => t.path === file.path)) return prev;
      return [...prev, file];
    });

    setActiveFile(file);
    window.electronAPI
      .getFileContent(file.path)
      .then((res) => {
        if (res.ok) {
          setFileContent(res.data ?? "");
          setIsEditorLoading(false);
          setIsDirty(false);
        } else {
          setError(res.error ?? "Failed to load file content");
          setFileContent("");
        }
      })
      .catch((err) => {
        setError(err.message);
        setFileContent("");
      })
      .finally(() => {
        setIsEditorLoading(false);
      });
  }, []);

  const closeTab = useCallback(
    async (path: string) => {
      if (activeFile?.path === path && isDirty) {
        const ok = window.confirm("You have unsaved changed. Close anyway?");
        if (!ok) return false;
      }

      setOpenTabs((prev) => prev.filter((t) => t.path !== path));

      // if active was closed, switch to last tab or null
      if (activeFile?.path === path) {
        setTimeout(() => {
          setOpenTabs((prev) => {
            const remaining = prev;
            if (remaining.length > 0) {
              const next = remaining[remaining.length - 1];
              selectFile(next);
            } else {
              setActiveFile(null);
              setFileContent("");
              setIsDirty(false);
            }

            return prev;
          });
        }, 0);
      }
      return true;
    },
    [activeFile, isDirty, selectFile],
  );

  const saveFile = useCallback(
    async (path: string, content: string) => {
      // console.log("Saving file:", path);
      try {
        const res = await window.electronAPI.saveFile(path, content);
        if (res.ok) {
          // console.log("File saved successfully.");
          // We reload the tree to see new timestamps or if a new file was created
          loadTree();
          return true;
        } else {
          // console.error("Failed to save file.");
          return false;
        }
      } catch (err) {
        // console.error("Error saving file:", err);
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
            path: res.data!,
            name: fileName,
            type: "file",
          };
          setActiveFile(newFileNode);
          setFileContent(contentRes.data ?? "");
          setIsDirty(false);
          return true;
        }
      }
      return false;
    } catch (err) {
      // console.error("Error opening file:", err);
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
        // console.error("Error renaming:", err);
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
        // console.error("Error deleting:", err);
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
        // console.error("Error creating file:", err);
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
        // console.error("Error creating folder:", err);
        return false;
      }
    },
    [loadTree],
  );

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
    openFolderDialog,
    renameFile,
    deleteFile,
    createNewFile,
    createNewFolder,
    openTabs,
    closeTab,
    isIndexingCodebase,
    setIsIndexingCodebase,
  };
}
