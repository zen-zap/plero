
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
}

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-lavender-grey flex-shrink-0">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    </svg>
);

const FolderIcon = ({ isOpen }: { isOpen: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mr-2 text-lavender-grey flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}>
    <polyline points="9 18 15 12 9 6" />
    </svg>
);

const Node: React.FC<{ node: TreeNode; activeFile: TreeNode | null; onFileSelect: (file: TreeNode) => void; }> = ({ node, activeFile, onFileSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isFolder = node.type === 'folder';
    const isActive = activeFile?.path === node.path;

    const handleClick = () => {
        if (isFolder) {
            setIsOpen(!isOpen);
        } else {
            onFileSelect(node);
        }
    };

    return (
        <div>
        <div
        onClick={handleClick}
        className={`flex items-center px-2 py-1 rounded cursor-pointer hover:bg-dusk-blue/30 transition-colors duration-100 ${isActive ? 'bg-dusk-blue text-alabaster-grey' : ''}`}
        >
        {isFolder ? <FolderIcon isOpen={isOpen} /> : <FileIcon />}
        <span className="truncate flex-1">{node.name}</span>
        </div>

        {isFolder && isOpen && (
            <div className="pl-4 border-l-2 border-dusk-blue/30 ml-2 space-y-1">
            {node.children && node.children.length > 0 ? (
                <FileExplorer nodes={node.children} activeFile={activeFile} onFileSelect={onFileSelect} />
            ) : (
            <div className="text-lavender-grey italic px-2 py-1">Empty folder</div>
            )}
            </div>
        )}
        </div>
    );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ nodes, activeFile, onFileSelect }) => {
    if (!nodes || nodes.length === 0) return null;

    return (
        <nav className="space-y-1">
        {nodes.map(node => (
            <Node key={node.path} node={node} activeFile={activeFile} onFileSelect={onFileSelect} />
        ))}
        </nav>
    );
};

