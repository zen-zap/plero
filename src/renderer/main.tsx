// in src/renderer/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import "../index.css";
import { FileExplorer } from "../components/FileExplorer";
import { Editor } from "../components/Editor";
import { MenuBar } from "../components/MenuBar";
import { ActionsProvider } from "./contexts/ActionsContext";
import { useFileSystem } from "./hooks/useFileSystem";

const App: React.FC = () => {
    
	const { 
        tree, 
        error, 
        activeFile, 
        fileContent, 
        isEditorLoading, 
        selectFile, 
        saveFile 
    } = useFileSystem();

    return (
        <ActionsProvider>
            <div className="flex flex-col h-screen bg-ink-black text-alabaster-grey font-sans overflow-hidden">
                {/* Note: MenuBar just dispatches 'save'. Editor hears it and calls saveFile. */}
                <MenuBar /> 
                <div className="flex flex-1 overflow-hidden">
                    <aside className="w-64 h-full bg-prussian-blue flex flex-col border-r border-ink-black">
                        <header className="px-4 py-3 mb-2 flex items-center justify-between">
                            <h1 className="text-xs font-bold text-lavender-grey uppercase tracking-wider">Explorer</h1>
                        </header>
                        <div className="flex-grow overflow-y-auto custom-scrollbar">
                            {error && <div className="text-red-400 p-2 text-sm">{error}</div>}
                            {!tree && !error && <div className="text-lavender-grey p-4 text-sm text-center">Loading...</div>}
                            {tree && <FileExplorer nodes={tree} activeFile={activeFile} onFileSelect={selectFile} />}
                        </div>
                    </aside>

                    <main className="flex-1 flex flex-col min-w-0 bg-ink-black">
                        <Editor 
                            activeFile={activeFile} 
                            content={fileContent} 
                            isLoading={isEditorLoading} 
                            onSave={saveFile}
                        />
                    </main>
                </div>
            </div>
        </ActionsProvider>
    );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);