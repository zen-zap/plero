import React, { useState, useCallback, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "../index.css";
import { FileExplorer } from "../components/FileExplorer";
import { Editor } from "../components/Editor";
import { MenuBar } from "../components/MenuBar";
import { AIChatSidebar } from "../components/AIChatSidebar";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { CommandPalette, CommandItem } from "../components/CommandPalette";
import { ToastProvider, useToast } from "../components/Toast";
import { ActionsProvider, useCommands } from "./contexts/ActionsContext";
import { useFileSystem } from "./hooks/useFileSystem";

const AppContent: React.FC = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(256); // 256px = w-64 in Tailwind
  const [isResizing, setIsResizing] = useState(false);

  const [rootFolderName, setRootFolderName] = useState<string>("");

  const [isChatVisible, setIsChatVisible] = useState(true);
  const [chatWidth, setChatWidth] = useState(300);
  const [isResizingChat, setIsResizingChat] = useState(false);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const { dispatch, register } = useCommands();
  const { showToast } = useToast();

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
    openFolderDialog,
    renameFile,
    deleteFile,
    createNewFile,
    createNewFolder,
    openTabs,
    closeTab,
    isIndexingCodebase,
    setIsIndexingCodebase,
  } = useFileSystem();

  // to laod root name here
  const loadRootName = useCallback(async () => {
    try {
      const result = await window.electronAPI.getRoot();
      if (result.ok && result.data) {
        // Extract just the folder name from the full path
        const folderName = result.data.split("/").pop() || result.data;
        setRootFolderName(folderName);
      }
    } catch (err) {
      // console.error("Failed to get root:", err);
    }
  }, []);
  // for the above root folder name loading
  useEffect(() => {
    loadRootName();
  }, [loadRootName]);

  // Register sidebar toggle and other app-level commands
  React.useEffect(() => {
    const unsubToggleSidebar = register("toggle-sidebar", () => {
      setIsSidebarVisible((prev) => !prev);
    });

    const unsubOpenFolder = register("open-folder", async () => {
      await openFolderDialog();
      loadRootName();
    });

    const unsubToggleAiChat = register("toggle-ai-chat", () => {
      setIsChatVisible((prev) => !prev);
    });

    const unsubCommandPalette = register("command-palette", () => {
      setIsCommandPaletteOpen(true);
    });

    const unsubExit = register("exit", () => {
      if (window.confirm("Are you sure you want to exit?")) {
        window.close();
      }
    });

    const unsubZoomIn = register("zoom-in", () => {
      window.electronAPI?.zoomIn?.();
    });

    const unsubZoomOut = register("zoom-out", () => {
      window.electronAPI?.zoomOut?.();
    });

    const unsubAbout = register("about", () => {
      showToast(
        "Plero Editor v0.1.0 - A modern code editor with AI assistance",
        "info",
      );
    });

    const unsubShowShortcuts = register("show-shortcuts", () => {
      showToast(
        "Ctrl+S: Save | Ctrl+B: Toggle Sidebar | Ctrl+Shift+B: Toggle AI | Ctrl+F: Find | Ctrl+Shift+P: Commands",
        "info",
      );
    });

    // cleanups
    return () => {
      unsubToggleSidebar();
      unsubOpenFolder();
      unsubToggleAiChat();
      unsubCommandPalette();
      unsubExit();
      unsubZoomIn();
      unsubZoomOut();
      unsubAbout();
      unsubShowShortcuts();
    };
  }, [register, showToast, openFolderDialog, loadRootName]);

  // Global keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B: Toggle left sidebar (file explorer)
      if (e.ctrlKey && !e.shiftKey && e.key === "b") {
        e.preventDefault();
        setIsSidebarVisible((prev) => !prev);
      }
      // Ctrl+Shift+B: Toggle right sidebar (AI chat)
      if (e.ctrlKey && e.shiftKey && e.key === "B") {
        e.preventDefault();
        setIsChatVisible((prev) => !prev);
      }
      // Ctrl+Shift+P: Command Palette
      if (e.ctrlKey && e.shiftKey && e.key === "P") {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      // Escape: Close command palette
      if (e.key === "Escape" && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
      // Ctrl+O: Open File Dialog
      if (e.ctrlKey && !e.shiftKey && e.key === "o") {
        e.preventDefault();
        openFileDialog();
      }
      // Ctrl+Shift+O: Open Folder Dialog
      if (e.ctrlKey && e.shiftKey && e.key === "O") {
        e.preventDefault();
        dispatch("open-folder");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, dispatch, openFileDialog]);

  // Build command palette commands
  const paletteCommands: CommandItem[] = React.useMemo(
    () => [
      {
        id: "save",
        label: "Save File",
        shortcut: "Ctrl+S",
        category: "File",
        action: () => dispatch("save"),
      },
      {
        id: "new",
        label: "New File",
        shortcut: "Ctrl+N",
        category: "File",
        action: () => dispatch("new"),
      },
      {
        id: "open",
        label: "Open File",
        shortcut: "Ctrl+O",
        category: "File",
        action: () => dispatch("open"),
      },
      {
        id: "open-folder",
        label: "Open Folder",
        shortcut: "Ctrl+Shift+O",
        category: "File",
        action: () => dispatch("open-folder"),
      },
      {
        id: "toggle-sidebar",
        label: "Toggle File Explorer",
        shortcut: "Ctrl+B",
        category: "View",
        action: () => setIsSidebarVisible((prev) => !prev),
      },
      {
        id: "toggle-ai-chat",
        label: "Toggle AI Chat",
        shortcut: "Ctrl+Shift+B",
        category: "View",
        action: () => setIsChatVisible((prev) => !prev),
      },
      {
        id: "find",
        label: "Find in File",
        shortcut: "Ctrl+F",
        category: "Edit",
        action: () => dispatch("find"),
      },
      {
        id: "toggle-word-wrap",
        label: "Toggle Word Wrap",
        category: "View",
        action: () => dispatch("toggle-word-wrap"),
      },
      {
        id: "toggle-ghost",
        label: "Toggle AI Completions",
        category: "AI",
        action: () => dispatch("toggle-ghost"),
      },
      {
        id: "zoom-in",
        label: "Zoom In",
        shortcut: "Ctrl+=",
        category: "View",
        action: () => dispatch("zoom-in"),
      },
      {
        id: "zoom-out",
        label: "Zoom Out",
        shortcut: "Ctrl+-",
        category: "View",
        action: () => dispatch("zoom-out"),
      },
      {
        id: "about",
        label: "About Plero",
        category: "Help",
        action: () => dispatch("about"),
      },
    ],
    [dispatch],
  );

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

  // Handle Chat Sidebar resizing
  const startResizingChat = React.useCallback(() => {
    setIsResizingChat(true);
  }, []);

  const stopResizingChat = React.useCallback(() => {
    setIsResizingChat(false);
  }, []);

  const resizeChat = React.useCallback(
    (e: MouseEvent) => {
      if (isResizingChat) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 200 && newWidth <= 800) {
          setChatWidth(newWidth);
        }
      }
    },
    [isResizingChat],
  );

  React.useEffect(() => {
    if (isResizingChat) {
      document.addEventListener("mousemove", resizeChat);
      document.addEventListener("mouseup", stopResizingChat);
      return () => {
        document.removeEventListener("mousemove", resizeChat);
        document.removeEventListener("mouseup", stopResizingChat);
      };
    }
  }, [isResizingChat, resizeChat, stopResizingChat]);

  return (
    <div className="flex flex-col h-screen bg-ink-black text-alabaster-grey font-sans overflow-hidden">
      {/* Note: MenuBar just dispatches 'save'. Editor hears it and calls saveFile. */}
      <MenuBar
        rootFolderName={rootFolderName}
        isIndexing={isIndexingCodebase}
      />
      <div className="flex flex-1 overflow-hidden">
        {isSidebarVisible && (
          <>
            <aside
              className="h-full bg-gradient-to-b from-prussian-blue to-prussian-blue/95 flex flex-col border-r border-dusk-blue/20"
              style={{ width: `${sidebarWidth}px` }}
            >
              <header className="px-4 py-3 flex items-center justify-between border-b border-dusk-blue/20">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-dusk-blue"
                  >
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <h1 className="text-xs font-semibold text-lavender-grey uppercase tracking-wider">
                    Explorer
                  </h1>
                </div>

                {/* Collapse Button: hides the sidebar */}
                <button
                  title="Close sidebar (Ctrl+B)"
                  onClick={() => setIsSidebarVisible(false)}
                  className="text-lavender-grey/50 hover:text-lavender-grey hover:bg-dusk-blue/20 p-1.5 rounded-lg transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              </header>
              <div className="flex-grow overflow-y-auto custom-scrollbar px-1 py-2">
                {error && (
                  <div className="text-red-400 p-3 text-sm bg-red-400/10 rounded-lg mx-2 border border-red-400/20">
                    {error}
                  </div>
                )}
                {!tree && !error && (
                  <div className="flex flex-col items-center justify-center py-8 text-lavender-grey/50">
                    <div className="w-6 h-6 border-2 border-dusk-blue/30 border-t-dusk-blue rounded-full animate-spin mb-3" />
                    <span className="text-sm">Loading files...</span>
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
              className="w-1 h-full bg-transparent hover:bg-dusk-blue/50 cursor-col-resize transition-colors duration-200"
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
            onOpenFolder={openFolderDialog}
            onSelectTab={selectFile}
            openTabs={openTabs}
            onCloseTab={closeTab}
            onShowToast={showToast}
          />
        </main>

        {isChatVisible && (
          <>
            {/* Resizer for Chat Sidebar */}
            <div
              className="w-1 h-full bg-transparent hover:bg-dusk-blue/50 cursor-col-resize transition-colors duration-200"
              onMouseDown={startResizingChat}
              style={{
                userSelect: "none",
                backgroundColor: isResizingChat ? "#415a77" : undefined,
              }}
            />
            <AIChatSidebar
              width={chatWidth}
              onClose={() => setIsChatVisible(false)}
              activeFileContent={fileContent || undefined}
              activeFilePath={activeFile?.path}
              onIndexingChange={setIsIndexingCodebase}
            />
          </>
        )}
      </div>

      {/* Command Palette -- same level as the menu bar? */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={paletteCommands}
      />
    </div>
  );
};

// TODO: add explanation about the levels here
// what is toast provider tho? what is a toast anyways?
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ActionsProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ActionsProvider>
    </ErrorBoundary>
  );
};

const container = document.getElementById("root")!;
if (!(window as any).__appRoot) {
  (window as any).__appRoot = ReactDOM.createRoot(container);
}

(window as any).__appRoot.render(<App />);
