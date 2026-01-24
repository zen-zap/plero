// src/components/FileExplorer.tsx

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

const FileIcon = () => (
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
    className="mr-2 text-lavender-grey flex-shrink-0"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const FolderIcon = ({ isOpen }: { isOpen: boolean }) => (
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
    className={`mr-2 text-lavender-grey flex-shrink-0 transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
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
        className={`flex items-center px-2 py-1 rounded cursor-pointer hover:bg-dusk-blue/30 transition-colors duration-100 ${isActive ? "bg-dusk-blue text-alabaster-grey" : ""}`}
      >
        {isFolder ? <FolderIcon isOpen={isOpen} /> : <FileIcon />}
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={submitRename}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-prussian-blue text-alabaster-grey px-1 rounded outline-none border border-dusk-blue"
          />
        ) : (
          <span className="truncate flex-1">{node.name}</span>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-prussian-blue border border-dusk-blue shadow-xl py-1 z-50 min-w-[160px] rounded"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="px-4 py-1.5 hover:bg-dusk-blue text-alabaster-grey cursor-pointer"
            onClick={handleRename}
          >
            Rename
          </div>
          <div
            className="px-4 py-1.5 hover:bg-dusk-blue text-alabaster-grey cursor-pointer"
            onClick={handleDelete}
          >
            Delete
          </div>
          {isFolder && (
            <>
              <div className="h-px bg-dusk-blue my-1 mx-2 opacity-50" />
              {creating ? (
                <div className="px-3 py-1">
                  <input
                    ref={newItemRef}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitNewItem();
                      if (e.key === "Escape") cancelNewItem();
                    }}
                    className="w-full bg-prussian-blue text-alabaster-grey px-2 py-1 rounded outline-none border border-dusk-blue"
                    placeholder={
                      creating === "file" ? "New file name" : "New folder name"
                    }
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2 px-1">
                    <button
                      className="px-3 py-1 bg-dusk-blue text-alabaster-grey rounded"
                      onClick={submitNewItem}
                    >
                      Create
                    </button>
                    <button
                      className="px-3 py-1 bg-prussian-blue text-lavender-grey rounded"
                      onClick={cancelNewItem}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="px-4 py-1.5 hover:bg-dusk-blue text-alabaster-grey cursor-pointer"
                    onClick={handleNewFile}
                  >
                    New File
                  </div>
                  <div
                    className="px-4 py-1.5 hover:bg-dusk-blue text-alabaster-grey cursor-pointer"
                    onClick={handleNewFolder}
                  >
                    New Folder
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {isFolder && isOpen && (
        <div className="pl-4 border-l-2 border-dusk-blue/30 ml-2 space-y-1">
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
            <div className="text-lavender-grey italic px-2 py-1">
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
    <nav className="space-y-1">
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
