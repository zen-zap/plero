// src/components/Editor.tsx

import React, { useEffect, useCallback, useState, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { rust } from "@codemirror/lang-rust";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { undo, redo } from "@codemirror/commands";
import { EditorView } from "@codemirror/view";
import {
  autocompletion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { TreeNode } from "./FileExplorer";
import { useCommands } from "../renderer/contexts/ActionsContext";

interface EditorProps {
  activeFile: TreeNode | null;
  content: string;
  isLoading: boolean;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  onSave: (path: string, content: string) => void;
  onNew: () => void;
  onOpen: () => void;
  openTabs?: TreeNode[];
  onSelectTab?: (file: TreeNode) => void;
  onCloseTab?: (path: string) => void;
}

export const Editor: React.FC<EditorProps> = ({
  activeFile,
  content,
  isLoading,
  isDirty,
  setIsDirty,
  onSave,
  onNew,
  onOpen,
  openTabs = [],
  onSelectTab,
  onCloseTab,
}) => {
  const { register } = useCommands();
  const [localContent, setLocalContent] = useState(content);
  const [isGhostActive, setIsGhostActive] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const viewRef = useRef<EditorView | null>(null);

  const handleCreateEditor = useCallback((view: EditorView) => {
    viewRef.current = view;
  }, []);

  // Ghost Completion Source
  const ghostCompletionSource = useCallback(
    async (context: CompletionContext): Promise<CompletionResult | null> => {
      if (!isGhostActive) return null;

      const { state, pos } = context;

      const start = Math.max(0, pos - 2000);
      const end = Math.min(state.doc.length, pos + 1000);

      const prefix = state.doc.sliceString(start, pos);
      const suffix = state.doc.sliceString(pos, end);

      let language = "javascript";
      if (activeFile?.path.endsWith(".rs")) language = "rust";
      if (activeFile?.path.endsWith(".ts") || activeFile?.path.endsWith(".tsx"))
        language = "typescript";

      try {
        const result = await window.electronAPI.aiGhost({
          prefix,
          suffix,
          language,
        });

        if (!result.ok || !result.data) return null;

        return {
          from: pos,
          options: [
            {
              label: result.data,
              detail: "AI",
              type: "text",
              apply: result.data,
            },
          ],
        };
      } catch (err) {
        console.error("Ghost Completion Error:", err);
        return null;
      }
    },
    [activeFile, isGhostActive],
  );

  // register command listeners
  useEffect(() => {
    const unsubSave = register("save", () => {
      if (activeFile) {
        onSave(activeFile.path, localContent);
        setIsDirty(false);
      }
    });

    const unsubUndo = register("undo", () => {
      if (viewRef.current) undo(viewRef.current);
    });

    const unsubRedo = register("redo", () => {
      if (viewRef.current) redo(viewRef.current);
    });

    const unsubNew = register("new", () => onNew());
    const unsubOpen = register("open", () => onOpen());

    const unsubCopy = register("copy", () => {
      if (viewRef.current) document.execCommand("copy");
    });
    const unsubCut = register("cut", () => {
      if (viewRef.current) document.execCommand("cut");
    });
    const unsubPaste = register("paste", () => {
      if (viewRef.current) document.execCommand("paste");
    });

    return () => {
      unsubSave();
      unsubUndo();
      unsubRedo();
      unsubNew();
      unsubOpen();
      unsubCopy();
      unsubCut();
      unsubPaste();
    };
  }, [register, activeFile, localContent, onSave, onNew, onOpen, setIsDirty]);

  // sync when content changes externally
  useEffect(() => {
    setLocalContent(content);
    setIsDirty(false);
  }, [content, activeFile?.path, setIsDirty]);

  const handleChange = useCallback(
    (value: string, viewUpdate: any) => {
      setLocalContent(value);
      setIsDirty(true);

      // Update cursor position
      if (viewUpdate?.state?.selection?.main) {
        const pos = viewUpdate.state.selection.main.head;
        const line = viewUpdate.state.doc.lineAt(pos);
        setCursorPosition({
          line: line.number,
          col: pos - line.from + 1,
        });
      }
    },
    [setIsDirty],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (activeFile && isDirty) {
          onSave(activeFile.path, localContent);
          setIsDirty(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFile, isDirty, localContent, onSave, setIsDirty]);

  const getExtensions = useCallback(() => {
    const path = activeFile?.path || "";
    const exts: any[] = [];

    // Ghost completion with toggle support
    if (isGhostActive) {
      exts.push(autocompletion({ override: [ghostCompletionSource] }));
    }

    if (
      path.endsWith(".js") ||
      path.endsWith(".jsx") ||
      path.endsWith(".ts") ||
      path.endsWith(".tsx")
    ) {
      exts.push(javascript({ jsx: true, typescript: true }));
    } else if (path.endsWith(".rs")) {
      exts.push(rust());
    }
    return exts;
  }, [activeFile, ghostCompletionSource, isGhostActive]);

  if (isLoading)
    return <div className="p-4 text-lavender-grey">Loading file...</div>;
  if (!activeFile)
    return (
      <div className="flex flex-col items-center justify-center h-full text-lavender-grey bg-ink-black">
        <div className="mb-2">No file open</div>
        <div className="text-sm text-dusk-blue">
          Select a file from the explorer
        </div>
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-ink-black">
      {/* Tab Header with border */}
      <header className="bg-prussian-blue flex items-center overflow-x-auto min-h-[40px] flex-shrink-0 border-b border-dusk-blue/30">
        <div className="flex min-w-fit">
          {openTabs && openTabs.length > 0 ? (
            openTabs.map((tab, index) => {
              const isActive = activeFile.path === tab.path;
              return (
                <div
                  key={tab.path}
                  onClick={() => onSelectTab?.(tab)}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm cursor-pointer select-none whitespace-nowrap min-w-[120px] max-w-[200px] border-r border-dusk-blue/20 transition-colors duration-150 ${
                    isActive
                      ? "bg-ink-black text-alabaster-grey border-t-2 border-t-blue-500"
                      : "text-lavender-grey hover:bg-dusk-blue/20 border-t-2 border-t-transparent"
                  }`}
                >
                  <span className="truncate flex-1">{tab.name}</span>
                  {isDirty && isActive && (
                    <span
                      className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0"
                      title="Unsaved changes"
                    />
                  )}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab?.(tab.path);
                    }}
                    className="ml-1 text-lavender-grey/50 hover:text-red-400 cursor-pointer flex-shrink-0 text-xs"
                    title="Close tab"
                  >
                    ✕
                  </span>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-2 text-lavender-grey/50 italic">
              No open tabs
            </div>
          )}
        </div>
      </header>

      {/* Editor Surface */}
      <div className="flex-grow overflow-hidden relative text-[14px]">
        <CodeMirror
          value={localContent}
          height="100%"
          theme={vscodeDark}
          extensions={getExtensions()}
          onChange={handleChange}
          onCreateEditor={handleCreateEditor}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            highlightActiveLine: true,
          }}
        />
      </div>

      {/* Status Bar */}
      <footer className="bg-prussian-blue border-t border-dusk-blue/30 px-3 py-1 flex items-center justify-between text-xs text-lavender-grey flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Ghost Completion Status */}
          <button
            onClick={() => setIsGhostActive(!isGhostActive)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors ${
              isGhostActive
                ? "text-green-400 hover:bg-green-400/10"
                : "text-lavender-grey/50 hover:bg-dusk-blue/20"
            }`}
            title={
              isGhostActive
                ? "Ghost Completion Active - Click to disable"
                : "Ghost Completion Disabled - Click to enable"
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${isGhostActive ? "bg-green-400" : "bg-lavender-grey/30"}`}
            />
            <span>AI Completions</span>
          </button>

          {/* File Info */}
          {activeFile && (
            <span className="text-lavender-grey/70">
              {activeFile.path.split("/").pop()}
            </span>
          )}

          {/* Dirty indicator */}
          {isDirty && <span className="text-yellow-400/80">● Modified</span>}
        </div>

        <div className="flex items-center gap-4">
          {/* Language */}
          {activeFile && (
            <span className="text-lavender-grey/70">
              {activeFile.path.endsWith(".ts") ||
              activeFile.path.endsWith(".tsx")
                ? "TypeScript"
                : activeFile.path.endsWith(".js") ||
                    activeFile.path.endsWith(".jsx")
                  ? "JavaScript"
                  : activeFile.path.endsWith(".rs")
                    ? "Rust"
                    : activeFile.path.endsWith(".css")
                      ? "CSS"
                      : activeFile.path.endsWith(".html")
                        ? "HTML"
                        : activeFile.path.endsWith(".json")
                          ? "JSON"
                          : activeFile.path.endsWith(".md")
                            ? "Markdown"
                            : "Plain Text"}
            </span>
          )}

          {/* Cursor Position */}
          <span className="text-lavender-grey/70">
            Ln {cursorPosition.line}, Col {cursorPosition.col}
          </span>

          {/* Encoding */}
          <span className="text-lavender-grey/50">UTF-8</span>
        </div>
      </footer>
    </div>
  );
};
