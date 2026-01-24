import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "../index.css";
import { FileExplorer } from "../components/FileExplorer";
import { Editor } from "../components/Editor";
import { MenuBar } from "../components/MenuBar";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ActionsProvider, useCommands } from "./contexts/ActionsContext";
import { useFileSystem } from "./hooks/useFileSystem";

const AppContent: React.FC = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(256); // 256px = w-64 in Tailwind
  const [isResizing, setIsResizing] = useState(false);
  const { dispatch, register } = useCommands();

  const {
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
    openTabs,
    closeTab,
  } = useFileSystem();

  // Register sidebar toggle and other app-level commands
  React.useEffect(() => {
    const unsubToggleSidebar = register("toggle-sidebar", () => {
      setIsSidebarVisible((prev) => !prev);
    });

    const unsubExit = register("exit", () => {
      if (window.confirm("Are you sure you want to exit?")) {
        window.close();
      }
    });

    // Note: copy, cut, paste, zoom-in, zoom-out are handled by the browser/editor natively
    // We can enhance these later if needed

    return () => {
      unsubToggleSidebar();
      unsubExit();
    };
  }, [register]);

  // Handle sidebar resizing
  const startResizing = React.useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX;
        // Constrain between 150px and 600px
        if (newWidth >= 150 && newWidth <= 600) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing],
  );

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", resize);
      document.addEventListener("mouseup", stopResizing);
      return () => {
        document.removeEventListener("mousemove", resize);
        document.removeEventListener("mouseup", stopResizing);
      };
    }
  }, [isResizing, resize, stopResizing]);

  return (
    <div className="flex flex-col h-screen bg-ink-black text-alabaster-grey font-sans overflow-hidden">
      {/* Note: MenuBar just dispatches 'save'. Editor hears it and calls saveFile. */}
      <MenuBar />
      <div className="flex flex-1 overflow-hidden">
        {isSidebarVisible && (
          <>
            <aside
              className="h-full bg-prussian-blue flex flex-col border-r border-ink-black"
              style={{ width: `${sidebarWidth}px` }}
            >
              <header className="px-4 py-3 mb-2 flex items-center justify-between">
                <h1 className="text-xs font-bold text-lavender-grey uppercase tracking-wider">
                  Explorer
                </h1>

                {/* Collapse Button: hides the sidebar */}
                <button
                  title="Close sidebar"
                  onClick={() => setIsSidebarVisible(false)}
                  className="text-lavender-grey hover:text-alabaster-grey px-2 py-1 rounded"
                >
                  ✕
                </button>
              </header>
              <div className="flex-grow overflow-y-auto custom-scrollbar">
                {error && (
                  <div className="text-red-400 p-2 text-sm">{error}</div>
                )}
                {!tree && !error && (
                  <div className="text-lavender-grey p-4 text-sm text-center">
                    Loading...
                  </div>
                )}
                {tree && (
                  <FileExplorer
                    nodes={tree}
                    activeFile={activeFile}
                    onFileSelect={selectFile}
                    onRename={renameFile}
                    onDelete={deleteFile}
                    onCreateFile={createNewFile}
                    onCreateFolder={createNewFolder}
                  />
                )}
              </div>
            </aside>

            {/* Resizable divider */}
            <div
              className="w-1 h-full bg-ink-black hover:bg-dusk-blue cursor-col-resize transition-colors duration-150"
              onMouseDown={startResizing}
              style={{
                userSelect: "none",
                backgroundColor: isResizing ? "#415a77" : undefined,
              }}
            />
          </>
        )}

        <main className="flex-1 flex flex-col min-w-0 bg-ink-black">
          <Editor
            activeFile={activeFile}
            content={fileContent}
            isLoading={isEditorLoading}
            isDirty={isDirty}
            setIsDirty={setIsDirty}
            onSave={saveFile}
            onNew={newFile}
            onOpen={openFileDialog}
            onSelectTab={selectFile}
            openTabs={openTabs}
            onCloseTab={closeTab}
          />
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ActionsProvider>
        <AppContent />
      </ActionsProvider>
    </ErrorBoundary>
  );
};

const container = document.getElementById("root")!;
if (!(window as any).__appRoot) {
  (window as any).__appRoot = ReactDOM.createRoot(container);
}
(window as any).__appRoot.render(<App />);
