// src/components/FileExplorer.tsx
//
// Need to improve UI here -- no urgency

import React, { useState } from "react";

export type TreeNode = {
  path: string;
  name: string;
  type: "file" | "folder";
  children?: TreeNode[];
};

interface FileExplorerProps {
  nodes: TreeNode[];
  activeFile: TreeNode | null;
  onFileSelect: (file: TreeNode) => void;
  onRename: (oldPath: string, newPath: string) => Promise<boolean>;
  onDelete: (path: string, isFolder: boolean) => Promise<boolean>;
  onCreateFile: (folderPath: string, fileName: string) => Promise<boolean>;
  onCreateFolder: (folderPath: string, folderName: string) => Promise<boolean>;
}

// File type color coding
const getFileColor = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const colors: Record<string, string> = {
    ts: "text-blue-400",
    tsx: "text-blue-400",
    js: "text-yellow-400",
    jsx: "text-yellow-400",
    rs: "text-orange-400",
    py: "text-green-400",
    css: "text-pink-400",
    scss: "text-pink-400",
    html: "text-red-400",
    json: "text-yellow-300",
    md: "text-gray-400",
    yml: "text-purple-400",
    yaml: "text-purple-400",
  };
  return colors[ext] || "text-lavender-grey";
};

const FileIcon = ({ fileName }: { fileName: string }) => {
  const colorClass = getFileColor(fileName);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`mr-2 flex-shrink-0 ${colorClass}`}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
};

const FolderIcon = ({ isOpen }: { isOpen: boolean }) => (
  <div className="mr-2 flex items-center gap-1 flex-shrink-0">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-lavender-grey/70 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={isOpen ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-dusk-blue ${isOpen ? "opacity-80" : ""}`}
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  </div>
);

// we need to define a node to represent this in the DOM tree
// this also helps with recursive rendering of folders
const Node: React.FC<{
  node: TreeNode;
  activeFile: TreeNode | null;
  onFileSelect: (file: TreeNode) => void;
  onRename: (oldPath: string, newPath: string) => Promise<boolean>;
  onDelete: (path: string, isFolder: boolean) => Promise<boolean>;
  onCreateFile: (folderPath: string, fileName: string) => Promise<boolean>;
  onCreateFolder: (folderPath: string, folderName: string) => Promise<boolean>;
}> = ({
  node,
  activeFile,
  onFileSelect,
  onRename,
  onDelete,
  onCreateFile,
  onCreateFolder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [creating, setCreating] = useState<null | "file" | "folder">(null);
  const [newItemName, setNewItemName] = useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const newItemRef = React.useRef<HTMLInputElement>(null);

  const isFolder = node.type === "folder";
  const isActive = activeFile?.path === node.path;

  React.useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onFileSelect(node);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleRename = () => {
    setIsRenaming(true);
    closeContextMenu();
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${node.name}?`)) {
      await onDelete(node.path, isFolder);
    }
    closeContextMenu();
  };

  const handleNewFile = () => {
    setCreating("file");
    setNewItemName("");
  };

  const handleNewFolder = () => {
    setCreating("folder");
    setNewItemName("");
  };

  const submitNewItem = async () => {
    if (!newItemName) return;
    const folderPath = isFolder
      ? node.path
      : node.path.split("/").slice(0, -1).join("/");
    if (creating === "file") {
      await onCreateFile(folderPath, newItemName);
    } else if (creating === "folder") {
      await onCreateFolder(folderPath, newItemName);
    }
    setCreating(null);
    setNewItemName("");
    closeContextMenu();
  };

  const cancelNewItem = () => {
    setCreating(null);
    setNewItemName("");
  };

  const submitRename = async () => {
    if (newName && newName !== node.name) {
      const pathParts = node.path.split("/");
      pathParts[pathParts.length - 1] = newName;
      const newPath = pathParts.join("/");
      const success = await onRename(node.path, newPath);
      if (!success) {
        setNewName(node.name);
      }
    }
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setNewName(node.name);
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      submitRename();
    } else if (e.key === "Escape") {
      cancelRename();
    } else if (e.key === "F2" && !isRenaming) {
      handleRename();
    }
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    if (contextMenu) {
      const handleClickOutside = () => closeContextMenu();
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [contextMenu]);

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className={`group flex items-center px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-200 ${
          isActive
            ? "bg-gradient-to-r from-dusk-blue/40 to-dusk-blue/20 text-alabaster-grey shadow-sm"
            : "hover:bg-dusk-blue/20 text-lavender-grey hover:text-alabaster-grey"
        }`}
      >
        {isFolder ? (
          <FolderIcon isOpen={isOpen} />
        ) : (
          <FileIcon fileName={node.name} />
        )}
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={submitRename}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-ink-black text-alabaster-grey px-2 py-0.5 rounded-lg outline-none border border-dusk-blue/50 focus:border-dusk-blue text-sm"
          />
        ) : (
          <span className="truncate flex-1 text-sm">{node.name}</span>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-ink-black/95 backdrop-blur-xl border border-dusk-blue/30 shadow-2xl py-2 z-50 min-w-[180px] rounded-xl animate-fade-in"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="px-4 py-2 hover:bg-dusk-blue/20 text-alabaster-grey cursor-pointer text-sm flex items-center gap-2 transition-colors duration-200"
            onClick={handleRename}
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
              className="text-lavender-grey"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
            Rename
          </div>
          <div
            className="px-4 py-2 hover:bg-red-500/20 text-red-400 cursor-pointer text-sm flex items-center gap-2 transition-colors duration-200"
            onClick={handleDelete}
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
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            Delete
          </div>
          {isFolder && (
            <>
              <div className="h-px bg-dusk-blue/20 my-2 mx-3" />
              {creating ? (
                <div className="px-3 py-2">
                  <input
                    ref={newItemRef}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitNewItem();
                      if (e.key === "Escape") cancelNewItem();
                    }}
                    className="w-full bg-ink-black text-alabaster-grey px-3 py-1.5 rounded-lg outline-none border border-dusk-blue/30 focus:border-dusk-blue text-sm"
                    placeholder={
                      creating === "file" ? "New file name" : "New folder name"
                    }
                    autoFocus
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      className="flex-1 px-3 py-1.5 bg-gradient-to-r from-dusk-blue to-prussian-blue text-alabaster-grey rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200"
                      onClick={submitNewItem}
                    >
                      Create
                    </button>
                    <button
                      className="flex-1 px-3 py-1.5 bg-ink-black/50 text-lavender-grey rounded-lg text-sm hover:bg-ink-black/80 transition-all duration-200"
                      onClick={cancelNewItem}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="px-4 py-2 hover:bg-dusk-blue/20 text-alabaster-grey cursor-pointer text-sm flex items-center gap-2 transition-colors duration-200"
                    onClick={handleNewFile}
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
                      className="text-lavender-grey"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    New File
                  </div>
                  <div
                    className="px-4 py-2 hover:bg-dusk-blue/20 text-alabaster-grey cursor-pointer text-sm flex items-center gap-2 transition-colors duration-200"
                    onClick={handleNewFolder}
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
                      className="text-lavender-grey"
                    >
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      <line x1="12" y1="11" x2="12" y2="17" />
                      <line x1="9" y1="14" x2="15" y2="14" />
                    </svg>
                    New Folder
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {isFolder && isOpen && (
        <div className="pl-3 ml-3 border-l border-dusk-blue/20 space-y-0.5 mt-0.5">
          {node.children && node.children.length > 0 ? (
            <FileExplorer
              nodes={node.children}
              activeFile={activeFile}
              onFileSelect={onFileSelect}
              onRename={onRename}
              onDelete={onDelete}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
            />
          ) : (
            <div className="text-lavender-grey/50 italic px-2 py-1.5 text-xs">
              Empty folder
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// we defined a single node above, so how do we render multiple nodes?
// Here, we create a FileExplorer component that returns a list of nodes in an array. These nodes can be files or folders. They are rendered recursively using the Node component defined above.

// the node is defined above, here we just need to return the nodes
export const FileExplorer: React.FC<FileExplorerProps> = ({
  nodes,
  activeFile,
  onFileSelect,
  onRename,
  onDelete,
  onCreateFile,
  onCreateFolder,
}) => {
  if (!nodes || nodes.length === 0) return null;

  return (
    <nav className="space-y-0.5">
      {nodes.map((node) => (
        <Node
          key={node.path}
          node={node}
          activeFile={activeFile}
          onFileSelect={onFileSelect}
          onRename={onRename}
          onDelete={onDelete}
          onCreateFile={onCreateFile}
          onCreateFolder={onCreateFolder}
        />
      ))}
    </nav>
  );
};
