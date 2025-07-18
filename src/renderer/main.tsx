
// src/renderer/main.tsx

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { FileExplorer, TreeNode } from "../components/FileExplorer";
import { Editor } from "../components/Editor";

declare global {
  interface Window {
    electronAPI: {
      getTree: () => Promise<{ ok: boolean; data: TreeNode[] }>;
      getFileContent: (path: string) => Promise<{ ok: boolean; data: string }>;
    };
  }
}

const App: React.FC = () => {
  const [tree, setTree] = useState<TreeNode[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeFile, setActiveFile] = useState<TreeNode | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isEditorLoading, setIsEditorLoading] = useState<boolean>(false);

  useEffect(() => {
    window.electronAPI.getTree()
      .then(res => {
        if (res.ok) setTree(res.data);
        else setError("Failed to load file tree.");
      })
      .catch(err => setError(err.message));
  }, []);

  const handleFileSelect = (file: TreeNode) => {
    if (file.type === 'file') {
      setIsEditorLoading(true);
      setActiveFile(file);
      window.electronAPI.getFileContent(file.path)
        .then(res => setFileContent(res.ok ? res.data : "Error loading content."))
        .catch(err => setFileContent(`Error: ${err.message}`))
        .finally(() => setIsEditorLoading(false));
    }
  };

  return (
    <div className="flex h-screen bg-[#202124] text-gray-300 font-sans">
      <aside className="w-64 h-full bg-[#282a2e] p-2 flex flex-col">
        <header className="px-2 py-1 mb-2">
          <h1 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Explorer</h1>
        </header>
        <div className="flex-grow overflow-y-auto pr-1">
          {error && <div className="text-red-400 p-2">{error}</div>}
          {!tree && !error && <div className="text-gray-400 p-2">Loading...</div>}
          {tree && <FileExplorer nodes={tree} activeFile={activeFile} onFileSelect={handleFileSelect} />}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <Editor activeFile={activeFile} content={fileContent} isLoading={isEditorLoading} />
      </main>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

