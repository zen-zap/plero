// src/components/Editor.tsx

import React, { useEffect, useCallback, useState, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { rust } from "@codemirror/lang-rust";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { undo, redo } from "@codemirror/commands";
import { EditorView } from "@codemirror/view";
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
  const viewRef = useRef<EditorView | null>(null);

  const handleCreateEditor = useCallback((view: EditorView) => {
    viewRef.current = view;
  }, []);

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
    (value: string) => {
      setLocalContent(value);
      setIsDirty(true);
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
  }, [activeFile]);

  if (isLoading) return <div className="p-4 text-lavender-grey">Loading file...</div>;
  if (!activeFile)
    return (
      <div className="flex flex-col items-center justify-center h-full text-lavender-grey bg-ink-black">
        <div className="mb-2">No file open</div>
        <div className="text-sm text-dusk-blue">Select a file from the explorer</div>
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-ink-black">
      {/* Tab Header (blend into editor) */}
      <header className="bg-ink-black flex items-center overflow-x-auto">
        <div className="flex gap-1 px-1 py-1">
          {openTabs && openTabs.length > 0 ? (
            openTabs.map((tab) => {
              const isActive = activeFile.path === tab.path;
              return (
                <div
                  key={tab.path}
                  onClick={() => onSelectTab?.(tab)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm cursor-pointer select-none ${
                    isActive ? "bg-ink-black text-alabaster-grey" : "text-lavender-grey hover:bg-dusk-blue/10"
                  }`}
                >
                  <span className="truncate max-w-[12rem]">{tab.name}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab?.(tab.path);
                    }}
                    className={`ml-2 text-lavender-grey hover:text-red-400 cursor-pointer ${
                      isActive ? "group-hover:text-red-400" : ""
                    }`}
                  >
                    ●
                  </span>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-2 text-lavender-grey">No open tabs</div>
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
    </div>
  );
};
