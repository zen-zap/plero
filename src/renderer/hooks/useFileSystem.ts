import { useState, useEffect, useCallback } from "react";
import { TreeNode } from "../../components/FileExplorer";

export function useFileSystem() {
    const [tree, setTree] = useState<TreeNode[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeFile, setActiveFile] = useState<TreeNode | null>(null);
    const [fileContent, setFileContent] = useState<string>("");
    const [isEditorLoading, setIsEditorLoading] = useState<boolean>(false);

    // Load file tree on startup
    useEffect(() => {
        loadTree();
    }, []);

    const loadTree = useCallback(() => {
        window.electronAPI.getTree()
        .then(res => {
            if(res.ok) setTree(res.data);
            else setError("Failed to load file tree.");
        })
        .catch(err => setError(err.message));
    }, []);

    const selectFile = useCallback((file: TreeNode) => {
        if (file.type === 'file') {
            setIsEditorLoading(true);
            setActiveFile(file);
            window.electronAPI.getFileContent(file.path)
                .then(res => setFileContent(res.ok ? res.data : "Error loading content."))
                .catch(err => setFileContent(`Error loading file: ${err.message}`))
                .finally(() => setIsEditorLoading(false));
        }
    }, []);

    const saveFile = useCallback(async (path: string, content: string) => {
        console.log("Saving file:", path);
        try {
            const res = await window.electronAPI.saveFile(path, content);
            if(res.ok) {
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
    }, [loadTree]);

    return {
        tree,
        error,
        activeFile,
        fileContent,
        isEditorLoading,
        selectFile,
        saveFile
    };
}