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
    return (
      <div className="flex items-center justify-center h-full bg-ink-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-dusk-blue/30 border-t-dusk-blue rounded-full animate-spin" />
          <span className="text-lavender-grey/60 text-sm">Loading file...</span>
        </div>
      </div>
    );
  if (!activeFile)
    return (
      <div className="flex flex-col items-center justify-center h-full text-lavender-grey bg-gradient-to-b from-ink-black to-prussian-blue/20">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-dusk-blue/20 to-lavender-grey/10 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-dusk-blue"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-dusk-blue/30 flex items-center justify-center">
            <span className="text-lg">✨</span>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-alabaster-grey mb-2">
          Welcome to Plero
        </h2>
        <p className="text-sm text-lavender-grey/60 mb-8 max-w-xs text-center">
          A modern code editor with AI-powered completions
        </p>
        <div className="flex flex-col gap-3">
          <div
            className="flex items-center gap-3 px-4 py-3 bg-prussian-blue/50 rounded-xl border border-dusk-blue/20 hover:bg-prussian-blue/70 cursor-pointer transition-all group"
            onClick={onNew}
          >
            <div className="w-8 h-8 rounded-lg bg-dusk-blue/20 flex items-center justify-center group-hover:bg-dusk-blue/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-dusk-blue"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm text-alabaster-grey">New File</div>
              <div className="text-xs text-lavender-grey/50">
                Create a new file
              </div>
            </div>
            <kbd className="text-[10px] text-lavender-grey/40 font-mono bg-ink-black/40 px-2 py-1 rounded">
              Ctrl+N
            </kbd>
          </div>
          <div
            className="flex items-center gap-3 px-4 py-3 bg-prussian-blue/50 rounded-xl border border-dusk-blue/20 hover:bg-prussian-blue/70 cursor-pointer transition-all group"
            onClick={onOpen}
          >
            <div className="w-8 h-8 rounded-lg bg-dusk-blue/20 flex items-center justify-center group-hover:bg-dusk-blue/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-dusk-blue"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm text-alabaster-grey">Open File</div>
              <div className="text-xs text-lavender-grey/50">
                Browse your files
              </div>
            </div>
            <kbd className="text-[10px] text-lavender-grey/40 font-mono bg-ink-black/40 px-2 py-1 rounded">
              Ctrl+O
            </kbd>
          </div>
          <div
            className="flex items-center gap-3 px-4 py-3 bg-prussian-blue/50 rounded-xl border border-dusk-blue/20 hover:bg-prussian-blue/70 cursor-pointer transition-all group"
            onClick={() => onShowToast?.("Press Ctrl+Shift+P", "info")}
          >
            <div className="w-8 h-8 rounded-lg bg-dusk-blue/20 flex items-center justify-center group-hover:bg-dusk-blue/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-dusk-blue"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm text-alabaster-grey">Command Palette</div>
              <div className="text-xs text-lavender-grey/50">
                Quick access to commands
              </div>
            </div>
            <kbd className="text-[10px] text-lavender-grey/40 font-mono bg-ink-black/40 px-2 py-1 rounded">
              Ctrl+Shift+P
            </kbd>
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-ink-black">
      {/* Tab Header with border */}
      <header className="bg-gradient-to-r from-prussian-blue to-prussian-blue/80 flex items-center overflow-x-auto min-h-[42px] flex-shrink-0 border-b border-dusk-blue/20">
        <div className="flex min-w-fit">
          {openTabs && openTabs.length > 0 ? (
            openTabs.map((tab, index) => {
              const isActive = activeFile.path === tab.path;
              const getTabIcon = () => {
                const ext = tab.name.split(".").pop();
                const colors: Record<string, string> = {
                  ts: "text-blue-400",
                  tsx: "text-blue-400",
                  js: "text-yellow-400",
                  jsx: "text-yellow-400",
                  rs: "text-orange-400",
                  py: "text-green-400",
                  css: "text-pink-400",
                  html: "text-red-400",
                  json: "text-yellow-300",
                  md: "text-lavender-grey",
                };
                return colors[ext || ""] || "text-dusk-blue";
              };
              return (
                <div
                  key={tab.path}
                  onClick={() => onSelectTab?.(tab)}
                  className={`group flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer select-none whitespace-nowrap min-w-[130px] max-w-[220px] transition-all duration-200 ${
                    isActive
                      ? "bg-ink-black text-alabaster-grey border-t-2 border-t-dusk-blue shadow-inner"
                      : "text-lavender-grey/70 hover:text-lavender-grey hover:bg-dusk-blue/10 border-t-2 border-t-transparent"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`flex-shrink-0 ${getTabIcon()}`}
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="truncate flex-1 font-medium">
                    {tab.name}
                  </span>
                  {isDirty && isActive && (
                    <span
                      className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 animate-pulse"
                      title="Unsaved changes"
                    />
                  )}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab?.(tab.path);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-lavender-grey/40 hover:text-red-400 cursor-pointer flex-shrink-0 p-0.5 hover:bg-red-400/10 rounded transition-all"
                    title="Close tab"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </span>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-2 text-lavender-grey/40 italic text-sm">
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
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-2 bg-prussian-blue/95 backdrop-blur-sm rounded-xl border border-dusk-blue/30 shadow-lg animate-fade-in">
            <div className="w-3 h-3 border-2 border-dusk-blue/30 border-t-dusk-blue rounded-full animate-spin" />
            <span className="text-xs text-lavender-grey font-medium">
              AI completing...
            </span>
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
      <footer className="bg-gradient-to-r from-prussian-blue via-prussian-blue to-ink-black border-t border-dusk-blue/20 px-4 py-1.5 flex items-center justify-between text-xs text-lavender-grey flex-shrink-0">
        <div className="flex items-center gap-2">
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
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg transition-all ${
              isGhostActive
                ? "text-green-400 bg-green-400/10 hover:bg-green-400/20"
                : "text-lavender-grey/50 hover:bg-dusk-blue/20"
            }`}
            title={
              isGhostActive
                ? "AI Completions Active - Click to disable"
                : "AI Completions Disabled - Click to enable"
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${isGhostActive ? "bg-green-400 shadow-sm shadow-green-400/50" : "bg-lavender-grey/30"}`}
            />
            <span className="font-medium">Copilot</span>
          </button>

          <div className="w-px h-4 bg-dusk-blue/30" />

          {/* Word Wrap Toggle */}
          <button
            onClick={() => setWordWrap(!wordWrap)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
              wordWrap
                ? "text-dusk-blue bg-dusk-blue/10"
                : "text-lavender-grey/50 hover:bg-dusk-blue/20"
            }`}
            title={wordWrap ? "Word Wrap On" : "Word Wrap Off"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
            <span>Wrap</span>
          </button>

          {/* Dirty indicator */}
          {isDirty && (
            <>
              <div className="w-px h-4 bg-dusk-blue/30" />
              <span className="flex items-center gap-1.5 text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                <span className="font-medium">Modified</span>
              </span>
            </>
          )}

          {/* Selection info */}
          {selectionInfo.chars > 0 && (
            <>
              <div className="w-px h-4 bg-dusk-blue/30" />
              <span className="text-lavender-grey/70 bg-ink-black/40 px-2.5 py-1 rounded-lg">
                {selectionInfo.chars} chars · {selectionInfo.lines} lines
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Language Badge */}
          {activeFile && (
            <span className="px-2.5 py-1 rounded-lg bg-dusk-blue/10 text-dusk-blue font-medium">
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
          <span className="text-lavender-grey/60 font-mono text-[11px]">
            Ln {cursorPosition.line}, Col {cursorPosition.col}
          </span>

          <div className="w-px h-4 bg-dusk-blue/30" />

          {/* Encoding */}
          <span className="text-lavender-grey/40 font-mono text-[11px]">
            UTF-8
          </span>
        </div>
      </footer>
    </div>
  );
};
