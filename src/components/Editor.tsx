
// src/components/Editor.tsx

import React, { useEffect, useCallback, useState, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { rust } from '@codemirror/lang-rust';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { undo, redo } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';
import { TreeNode } from './FileExplorer';
import { useCommands } from '../renderer/contexts/ActionsContext';

interface EditorProps {
    activeFile: TreeNode | null;
    content: string;
    isLoading: boolean;
    onSave: (path: string, content: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ activeFile, content, isLoading, onSave }) => {
    
    const { register } = useCommands(); // the editor subscribes to commands
    const [localContent, setLocalContent] = useState(content);
    const [isDirty, setIsDirty] = useState(false);
    
    // We need a ref to the editor view instance to perform imperative actions like undo/redo
    const viewRef = useRef<EditorView | null>(null);

    const handleCreateEditor = useCallback((view: EditorView) => {
        viewRef.current = view;
    }, []);

    // register command listeners
    useEffect(() => {

        // TODO: Move these functions outside to directly call them here to keep code cleaner
        // TODO: Add more commands as needed
        const unsubSave = register('save', () => {
             if (activeFile) {
                console.log("Editor received save command");
                onSave(activeFile.path, localContent);
                setIsDirty(false); 
            }
        });

        const unsubUndo = register('undo', () => {
            if (viewRef.current) {
                undo(viewRef.current);
            }
        });

        const unsubRedo = register('redo', () => {
            if (viewRef.current) {
                redo(viewRef.current);
            }
        });

        return () => {
             unsubSave();
             unsubUndo();
             unsubRedo();
        };
    }, [register, activeFile, localContent, onSave]);

    // local state sync when new file loads
    useEffect(() => {
        setLocalContent(content);
        setIsDirty(false);
    }, [content, activeFile?.path]);

    const handleChange = useCallback((value: string) => {
        setLocalContent(value);
        setIsDirty(true);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (activeFile && isDirty) {
                    onSave(activeFile.path, localContent);
                    setIsDirty(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeFile, isDirty, localContent, onSave]);

    const getExtensions = () => {
        const path = activeFile?.path || '';
        const exts = [];

        if(path.endsWith('.js') || path.endsWith('.jsx') || path.endsWith('.ts') || path.endsWith('.tsx')) {
            exts.push(javascript({ jsx: true, typescript: true }));
        } else if (path.endsWith('.rs')) {
            exts.push(rust());
        }

        return exts;
    };
    
    if (isLoading) {
        return <div className="p-4 text-lavender-grey">Loading file...</div>;
    }

    if (!activeFile) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-lavender-grey bg-ink-black">
                <div className="mb-2">No file open</div>
                <div className="text-sm text-dusk-blue">Select a file from the explorer</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-ink-black">
            {/* Tab Header */}
            <header className="bg-prussian-blue flex items-center border-b border-ink-black">
                <div className={`px-4 py-2 text-sm border-t-2 ${isDirty ? 'border-lavender-grey text-alabaster-grey bg-ink-black' : 'border-transparent text-lavender-grey hover:bg-dusk-blue/20'}`}>
                    {activeFile.name}
                    {isDirty && <span className="ml-2 text-xs">●</span>}
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
                        autocompletion: true, // Standard IDE autocomplete (variables, keywords)
                        highlightActiveLine: true,
                    }}
                />
            </div>
        </div>
    );
};

