// src/components/Editor.tsx

import React, { useEffect, useCallback, useState, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { rust } from "@codemirror/lang-rust";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { undo, redo } from "@codemirror/commands";
import { EditorView, keymap } from "@codemirror/view";
import {
  autocompletion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import {
  search,
  searchKeymap,
  openSearchPanel,
  closeSearchPanel,
} from "@codemirror/search";
import { TreeNode } from "./FileExplorer";
import { useCommands } from "../renderer/contexts/ActionsContext";
import { Breadcrumb } from "./Breadcrumb";

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
  onShowToast?: (
    message: string,
    type?: "success" | "error" | "info" | "warning",
  ) => void;
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
  onShowToast,
}) => {
  const { register } = useCommands();
  const [localContent, setLocalContent] = useState(content);
  const [isGhostActive, setIsGhostActive] = useState(true);
  const [isGhostLoading, setIsGhostLoading] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const [wordWrap, setWordWrap] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [selectionInfo, setSelectionInfo] = useState({ chars: 0, lines: 0 });
  const viewRef = useRef<EditorView | null>(null);
  const ghostAbortRef = useRef<AbortController | null>(null);

  const handleCreateEditor = useCallback((view: EditorView) => {
    viewRef.current = view;
  }, []);

  // Ghost Completion Source with improved debouncing and loading state
  const ghostCompletionSource = useCallback(
    async (context: CompletionContext): Promise<CompletionResult | null> => {
      if (!isGhostActive) return null;

      // Cancel any previous request
      if (ghostAbortRef.current) {
        ghostAbortRef.current.abort();
      }
      ghostAbortRef.current = new AbortController();

      // Longer debounce for better UX
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Check if aborted during debounce
      if (context.aborted || ghostAbortRef.current?.signal.aborted) {
        return null;
      }

      const { state, pos } = context;

      // Get more context for better completions
      const start = Math.max(0, pos - 3000);
      const end = Math.min(state.doc.length, pos + 1500);

      const prefix = state.doc.sliceString(start, pos);
      const suffix = state.doc.sliceString(pos, end);

      // Require more content before triggering
      if (prefix.trim().length < 8) {
        return null;
      }

      // Don't trigger in comments or strings (basic check)
      const lastLine = prefix.split("\n").pop() || "";
      if (lastLine.trim().startsWith("//") || lastLine.trim().startsWith("#")) {
        return null;
      }

      let language = "javascript";
      if (activeFile?.path.endsWith(".rs")) language = "rust";
      if (activeFile?.path.endsWith(".ts") || activeFile?.path.endsWith(".tsx"))
        language = "typescript";
      if (activeFile?.path.endsWith(".py")) language = "python";
      if (activeFile?.path.endsWith(".css")) language = "css";
      if (activeFile?.path.endsWith(".html")) language = "html";

      try {
        setIsGhostLoading(true);
        console.log("[Editor] aiGhost request", {
          language,
          prefixLen: prefix.length,
          suffixLen: suffix.length,
        });

        const result = await window.electronAPI.aiGhost({
          prefix,
          suffix,
          language,
        });

        setIsGhostLoading(false);

        if (context.aborted || ghostAbortRef.current?.signal.aborted) {
          console.log("Typing detected, aborting mid-response.");
          return null;
        }

        console.log(
          "[Editor] aiGhost result",
          result &&
            (result.ok
              ? { ok: true, dataLen: result.data?.length }
              : { ok: false, error: result.error }),
        );

        if (!result.ok || !result.data) return null;

        // Filter out very short or whitespace-only completions
        const completion = result.data.trim();
        if (completion.length < 2) return null;

        return {
          from: pos,
          options: [
            {
              label:
                completion.length > 50
                  ? completion.slice(0, 50) + "..."
                  : completion,
              detail: "✨ AI",
              type: "text",
              apply: result.data,
              boost: 99, // Prioritize AI completion
            },
          ],
        };
      } catch (err) {
        setIsGhostLoading(false);
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
        onShowToast?.("File saved", "success");
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

    // Find command
    const unsubFind = register("find", () => {
      if (viewRef.current) {
        openSearchPanel(viewRef.current);
      }
    });

    // Toggle word wrap
    const unsubWordWrap = register("toggle-word-wrap", () => {
      setWordWrap((prev) => !prev);
    });

    // Toggle ghost completion
    const unsubToggleGhost = register("toggle-ghost", () => {
      setIsGhostActive((prev) => {
        onShowToast?.(
          !prev ? "AI Completions enabled" : "AI Completions disabled",
          "info",
        );
        return !prev;
      });
    });

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
      unsubFind();
      unsubWordWrap();
      unsubToggleGhost();
      unsubCopy();
      unsubCut();
      unsubPaste();
    };
  }, [
    register,
    activeFile,
    localContent,
    onSave,
    onNew,
    onOpen,
    setIsDirty,
    onShowToast,
  ]);

  // sync when content changes externally
  useEffect(() => {
    setLocalContent(content);
    setIsDirty(false);
  }, [content, activeFile?.path, setIsDirty]);

  const handleChange = useCallback(
    (value: string, viewUpdate: any) => {
      setLocalContent(value);
      setIsDirty(true);

      // Update cursor position and selection info
      if (viewUpdate?.state?.selection?.main) {
        const selection = viewUpdate.state.selection.main;
        const pos = selection.head;
        const line = viewUpdate.state.doc.lineAt(pos);
        setCursorPosition({
          line: line.number,
          col: pos - line.from + 1,
        });

        // Calculate selection info
        if (selection.from !== selection.to) {
          const selectedText = viewUpdate.state.doc.sliceString(
            selection.from,
            selection.to,
          );
          const selectedLines = selectedText.split("\n").length;
          setSelectionInfo({
            chars: selectedText.length,
            lines: selectedLines,
          });
        } else {
          setSelectionInfo({ chars: 0, lines: 0 });
        }
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
          onShowToast?.("File saved", "success");
        }
      }
      // Ctrl+F for find
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        if (viewRef.current) {
          openSearchPanel(viewRef.current);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFile, isDirty, localContent, onSave, setIsDirty, onShowToast]);

  const getExtensions = useCallback(() => {
    const path = activeFile?.path || "";
    const exts: any[] = [];

    // Built-in search
    exts.push(search());
    exts.push(keymap.of(searchKeymap));

    // Word wrap
    if (wordWrap) {
      exts.push(EditorView.lineWrapping);
    }

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
  }, [activeFile, ghostCompletionSource, isGhostActive, wordWrap]);

  if (isLoading)
    return <div className="p-4 text-lavender-grey">Loading file...</div>;
  if (!activeFile)
    return (
      <div className="flex flex-col items-center justify-center h-full text-lavender-grey bg-ink-black">
        <div className="text-6xl mb-4 opacity-20">📝</div>
        <div className="mb-2 text-lg">No file open</div>
        <div className="text-sm text-dusk-blue mb-4">
          Select a file from the explorer or use keyboard shortcuts
        </div>
        <div className="flex gap-4 text-xs text-lavender-grey/60">
          <span className="px-2 py-1 bg-ink-black/50 rounded">Ctrl+N New</span>
          <span className="px-2 py-1 bg-ink-black/50 rounded">Ctrl+O Open</span>
          <span className="px-2 py-1 bg-ink-black/50 rounded">
            Ctrl+Shift+P Commands
          </span>
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

      {/* Breadcrumb */}
      <Breadcrumb path={activeFile.path} />

      {/* Editor Surface */}
      <div className="flex-grow overflow-hidden relative text-[14px]">
        {/* Ghost loading indicator */}
        {isGhostLoading && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-2 px-2 py-1 bg-ink-black/80 rounded text-xs text-dusk-blue">
            <span className="w-2 h-2 bg-dusk-blue rounded-full animate-pulse" />
            AI thinking...
          </div>
        )}
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
        <div className="flex items-center gap-3">
          {/* Ghost Completion Status */}
          <button
            onClick={() => {
              setIsGhostActive(!isGhostActive);
              onShowToast?.(
                !isGhostActive
                  ? "AI Completions enabled"
                  : "AI Completions disabled",
                "info",
              );
            }}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors ${
              isGhostActive
                ? "text-green-400 hover:bg-green-400/10"
                : "text-lavender-grey/50 hover:bg-dusk-blue/20"
            }`}
            title={
              isGhostActive
                ? "AI Completions Active - Click to disable"
                : "AI Completions Disabled - Click to enable"
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${isGhostActive ? "bg-green-400" : "bg-lavender-grey/30"}`}
            />
            <span>AI</span>
          </button>

          {/* Word Wrap Toggle */}
          <button
            onClick={() => setWordWrap(!wordWrap)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
              wordWrap
                ? "text-dusk-blue hover:bg-dusk-blue/10"
                : "text-lavender-grey/50 hover:bg-dusk-blue/20"
            }`}
            title={wordWrap ? "Word Wrap On" : "Word Wrap Off"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M3 12h15a3 3 0 1 1 0 6h-4" />
              <polyline points="13 16 16 19 13 22" />
            </svg>
          </button>

          {/* Dirty indicator */}
          {isDirty && (
            <span className="text-yellow-400/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              Modified
            </span>
          )}

          {/* Selection info */}
          {selectionInfo.chars > 0 && (
            <span className="text-lavender-grey/60">
              {selectionInfo.chars} chars, {selectionInfo.lines} lines selected
            </span>
          )}
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
                    : activeFile.path.endsWith(".py")
                      ? "Python"
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
