
// src/components/Editor.tsx

import React from 'react';
import { TreeNode } from './FileExplorer';

interface EditorProps {
    activeFile: TreeNode | null;
    content: string;
    isLoading: boolean;
}

export const Editor: React.FC<EditorProps> = ({ activeFile, content, isLoading }) => {
    if (isLoading) {
        return <div className="p-4 text-gray-400">Loading file...</div>;
    }

    if (!activeFile) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
            Select a file to begin editing.
                </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
        <header className="bg-[#282a2e] p-2 border-b border-gray-700 flex items-center">
        <h2 className="text-sm text-gray-200 flex-1 truncate">{activeFile.path}</h2>
        </header>
        <div className="flex-grow bg-[#1e1e1e] p-4 overflow-auto font-mono text-sm whitespace-pre-wrap">
        <pre><code>{content}</code></pre>
        </div>
        </div>
    );
};

