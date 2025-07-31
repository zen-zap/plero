// This file exposes the APIs from the main process to the renderer

import { contextBridge } from 'electron';

// Mock implementation for testing UI without full backend
const mockFileTree = [
  {
    path: '/src',
    name: 'src',
    type: 'folder' as const,
    children: [
      {
        path: '/src/main.ts',
        name: 'main.ts',
        type: 'file' as const,
      },
      {
        path: '/src/renderer',
        name: 'renderer',
        type: 'folder' as const,
        children: [
          {
            path: '/src/renderer/main.tsx',
            name: 'main.tsx',
            type: 'file' as const,
          },
          {
            path: '/src/renderer/index.html',
            name: 'index.html',
            type: 'file' as const,
          }
        ]
      },
      {
        path: '/src/components',
        name: 'components',
        type: 'folder' as const,
        children: [
          {
            path: '/src/components/FileExplorer.tsx',
            name: 'FileExplorer.tsx',
            type: 'file' as const,
          },
          {
            path: '/src/components/Editor.tsx',
            name: 'Editor.tsx',
            type: 'file' as const,
          }
        ]
      }
    ]
  },
  {
    path: '/package.json',
    name: 'package.json',
    type: 'file' as const,
  },
  {
    path: '/README.md',
    name: 'README.md',
    type: 'file' as const,
  }
];

const mockFileContent = `// Sample TypeScript file content
import React from 'react';

const App: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Hello World!</h1>
      <p className="text-gray-600">This is a sample file to demonstrate the editor.</p>
    </div>
  );
};

export default App;`;

contextBridge.exposeInMainWorld('electronAPI', {
  // Mock file operations
  getTree: () => Promise.resolve({ ok: true, data: mockFileTree }),
  getFileContent: (path: string) => Promise.resolve({ ok: true, data: mockFileContent }),
  saveFile: (path: string, content: string) => Promise.resolve({ ok: true }),
  delFile: (path: string) => Promise.resolve({ ok: true }),
  createFolder: (path: string) => Promise.resolve({ ok: true }),
  renamePath: (oldPath: string, newPath: string) => Promise.resolve({ ok: true }),
  delFolder: (path: string) => Promise.resolve({ ok: true }),
  stat: (path: string) => Promise.resolve({ ok: true, data: { type: 'file' } }),
  exists: (path: string) => Promise.resolve({ ok: true, data: true }),
  insertAtCursor: (path: string, insertion: string, marker?: string) => Promise.resolve({ ok: true }),
  
  // Mock AI operations
  aiComplete: (args: any) => Promise.resolve({ ok: true, data: 'Mock completion response' }),
  aiChat: (args: any) => Promise.resolve({ ok: true, data: 'Mock chat response' }),
  aiClassify: (args: any) => Promise.resolve({ ok: true, data: 'mock_classification' }),
  aiCompletionRag: (args: any) => Promise.resolve({ ok: true, data: 'Mock RAG completion' }),
  
  // Mock Tavily operations
  tavilySearch: (args: any) => Promise.resolve({ ok: true, data: { results: [] } }),
});
