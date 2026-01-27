# 📚 Plero - Complete Project Documentation

> **A beginner-friendly guide to understanding this AI-powered code editor built with Electron, React, and TypeScript.**

Welcome! This documentation will take you from zero web development knowledge to understanding how this entire project works. Grab a cup of coffee ☕ and let's dive in!

---

## Table of Contents

1. [Introduction - What is Plero?](#1-introduction---what-is-plero)
2. [Web Development Fundamentals](#2-web-development-fundamentals)
   - [HTML - The Structure](#21-html---the-structure)
   - [CSS - The Styling](#22-css---the-styling)
   - [JavaScript - The Logic](#23-javascript---the-logic)
3. [Understanding the Technologies Used](#3-understanding-the-technologies-used)
   - [What is Node.js?](#31-what-is-nodejs)
   - [What is TypeScript?](#32-what-is-typescript)
   - [What is React?](#33-what-is-react)
   - [React Hooks](#react-hooks)
   - [What is Electron?](#34-what-is-electron)
   - [What is Vite?](#35-what-is-vite)
   - [What is Tailwind CSS?](#36-what-is-tailwind-css)
4. [Project Architecture Overview](#4-project-architecture-overview)
   - [Directory Structure](#41-directory-structure)
   - [How Components Connect](#42-how-components-connect)
5. [Deep Dive: The Main Process](#5-deep-dive-the-main-process)
   - [Understanding main.ts](#51-understanding-maints)
   - [The Preload Script](#52-the-preload-script)
6. [Deep Dive: The Renderer Process (UI)](#6-deep-dive-the-renderer-process-ui)
   - [React Components](#61-react-components)
   - [The File Explorer](#62-the-file-explorer)
   - [The Code Editor](#63-the-code-editor)
   - [The Menu Bar](#64-the-menu-bar)
7. [State Management & Communication](#7-state-management--communication)
   - [React Context (ActionsContext)](#71-react-context-actionscontext)
   - [Custom Hooks (useFileSystem)](#72-custom-hooks-usefilesystem)
   - [IPC - Inter-Process Communication](#73-ipc---inter-process-communication)
8. [Backend Services](#8-backend-services)
   - [File Service](#81-file-service)
   - [AI Service](#82-ai-service)
   - [Tavily (Web Search) Service](#83-tavily-web-search-service)
   - [RAG (Retrieval Augmented Generation)](#84-rag-retrieval-augmented-generation)
9. [Styling with Tailwind CSS](#9-styling-with-tailwind-css)
10. [Configuration Files Explained](#10-configuration-files-explained)
11. [How to Run the Project](#11-how-to-run-the-project)
12. [Testing](#12-testing)
13. [Glossary of Terms](#13-glossary-of-terms)

---

## 1. Introduction - What is Plero?

**Plero** is a desktop code editor (like VS Code!) with built-in AI code completion capabilities. It's built using web technologies but runs as a native desktop application.

### What can Plero do?

1. **Browse files and folders** - Like the file explorer in any code editor
2. **Edit code** - With syntax highlighting for JavaScript, TypeScript, and Rust
3. **AI Code Completion** - Get intelligent code suggestions powered by OpenAI
4. **AI Chat** - Have conversations with AI about your code
5. **Web Search** - Search the internet for information using Tavily API
6. **RAG (Retrieval Augmented Generation)** - Get context-aware completions based on your file content

### Why is this project special for learning?

This project touches almost every aspect of modern web development:
- Frontend (React, TypeScript, Tailwind CSS)
- Desktop development (Electron)
- AI integration (OpenAI, LangChain)
- Build tools (Vite, TypeScript compiler)
- Testing (Vitest)

---

## 2. Web Development Fundamentals

Before we dive into the code, let's understand the building blocks of web development.

### 2.1 HTML - The Structure

HTML (HyperText Markup Language) is like the **skeleton** of a webpage. It defines what elements exist on the page.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>My Page</title>
  </head>
  <body>
    <h1>Hello, World!</h1>
    <p>This is a paragraph.</p>
  </body>
</html>
```

**Key concepts:**
- **Tags**: `<tag>content</tag>` - Define elements
- **Attributes**: `<tag attribute="value">` - Add properties to elements
- **Nesting**: Tags can contain other tags
- **head**: Contains metadata (title, stylesheets, scripts)
- **body**: Contains visible content

In Plero, you'll find two HTML files:
- `index.html` - The root file (used by Electron)
- `src/renderer/index.html` - The React app's entry point

### 2.2 CSS - The Styling

CSS (Cascading Style Sheets) is like the **skin and clothes** of a webpage. It defines how elements look.

```css
/* This is a CSS comment */
body {
  background-color: #0d1b2a;  /* Dark blue background */
  color: #e0e1dd;             /* Light grey text */
  font-family: sans-serif;
}

.button {
  padding: 10px 20px;
  border-radius: 4px;
}
```

**Key concepts:**
- **Selectors**: Target which elements to style (`body`, `.class`, `#id`)
- **Properties**: What to change (`color`, `background`, `padding`)
- **Values**: What to change it to (`red`, `10px`, `center`)
- **Classes**: Reusable styles applied with `class="name"`

### 2.3 JavaScript - The Logic

JavaScript is the **brain** of a webpage. It makes things interactive and dynamic.

```javascript
// Variables - storing data
const message = "Hello!";
let count = 0;

// Functions - reusable code blocks
function greet(name) {
  return `Hello, ${name}!`;
}

// Event handling - responding to user actions
button.addEventListener('click', () => {
  count = count + 1;
  console.log(`Clicked ${count} times`);
});
```

**Key concepts:**
- **Variables**: Store data (`const`, `let`, `var`)
- **Functions**: Reusable code blocks
- **Events**: User actions (click, type, hover)
- **DOM**: Document Object Model - how JS interacts with HTML
- **Async/Await**: Handle operations that take time (like API calls)

---

## 3. Understanding the Technologies Used

### 3.1 What is Node.js?

**Node.js** is a runtime that allows you to run JavaScript outside the browser. Before Node.js, JavaScript could only run in web browsers. Now it can:

- Run on servers
- Create command-line tools
- Build desktop applications (with Electron)
- Access the file system
- Make network requests

**Why Plero uses it**: Node.js lets us use JavaScript/TypeScript for both the UI and the backend file operations.

```javascript
// This code can only run in Node.js, not a browser
const fs = require('fs');
fs.readFileSync('/path/to/file.txt', 'utf-8');
```

### 3.2 What is TypeScript?

**TypeScript** is JavaScript with **types**. It helps catch errors before your code runs.

```typescript
// JavaScript - no types, errors found at runtime
function add(a, b) {
  return a + b;
}
add("hello", 5);  // Returns "hello5" - probably not what you wanted!

// TypeScript - types catch errors at compile time
function add(a: number, b: number): number {
  return a + b;
}
add("hello", 5);  // ❌ Error: Argument of type 'string' is not assignable
```

**Why Plero uses it**: 
- Catches bugs early (before running the code)
- Better autocomplete in editors
- Self-documenting code (types tell you what data to expect)
- Easier to refactor large codebases

**Key TypeScript concepts you'll see in Plero:**

```typescript
// Type definitions
type TreeNode = {
  path: string;
  name: string;
  type: "file" | "folder";  // Union type - can only be one of these
  children?: TreeNode[];     // Optional property (the ?)
};

// Interface (similar to type, used for objects)
interface EditorProps {
  activeFile: TreeNode | null;  // Can be TreeNode or null
  content: string;
  isLoading: boolean;
}

// Generic types
type ApiResponse<T> = {
  ok: boolean;
  data?: T;       // T is a placeholder for any type
  error?: string;
};
```

### 3.3 What is React?

**React** is a JavaScript library for building user interfaces. Instead of manually updating the HTML when data changes, you describe what the UI should look like, and React updates it automatically.

**The key ideas:**

1. **Components** - Reusable UI pieces (like LEGO blocks)
2. **JSX** - Write HTML-like code in JavaScript
3. **State** - Data that changes over time
4. **Props** - Data passed from parent to child components

```tsx
// A simple React component
import React, { useState } from 'react';

function Counter() {
  // useState creates a "state variable" that React watches
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```

**How React works (simplified):**

1. You define components with state
2. When state changes, React re-renders the component
3. React compares the old and new UI (Virtual DOM)
4. React updates only what changed in the real DOM

**Why Plero uses it**: React makes building complex UIs manageable by breaking them into small, reusable components.

## React Hooks

React hooks are small APIs that let a function remember things, react to changes over time, or interact with the outside world. Each hook exists to solve a very specific class of problems. Misusing them usually means mixing these responsibilities.

---

### `useState` — component memory (state)

`useState` gives a component **persistent memory across renders**. It stores values that represent the *current truth of the UI*.

```ts
const [activeMenu, setActiveMenu] = useState<string | null>(null);
```

Use `useState` when:

* the UI should change when a value changes
* the value belongs to this component
* the value represents “what the user sees now”

Examples:

* which menu is open
* whether a modal is visible
* form input values
* loading / error flags

Calling the setter (`setActiveMenu`) does **not** mutate the variable. It schedules a re-render, and the component function runs again with the updated state.

---

### `useEffect` — lifecycle and side effects

`useEffect` runs **after rendering**, based on the component’s lifecycle. It is not triggered by user events like clicks or key presses.

```ts
useEffect(() => {
  const unsubscribe = register("save", onSave);
  return () => unsubscribe();
}, [register, onSave]);
```

Use `useEffect` when you need to:

* subscribe to something (events, timers, IPC, listeners)
* perform side effects (logging, analytics, network calls)
* clean up resources when a component unmounts
* react to changes in values *over time*

Key rule:

* `useEffect` runs on **mount**
* runs again when **dependencies change**
* runs cleanup on **unmount**

It is lifecycle glue, not event handling.

---

### `useRef` — mutable values without re-rendering

`useRef` stores a value that:

* survives re-renders
* can be mutated freely
* does **not** trigger re-renders when changed

```ts
const menuRef = useRef<HTMLDivElement>(null);
```

Use `useRef` when:

* you need access to a real DOM element
* you want to store mutable values (timeouts, IDs, latest data)
* re-rendering would be incorrect or expensive

Common use cases:

* detecting clicks outside a component
* storing the latest value for async callbacks
* integrating with non-React APIs

A ref always has the shape:

```ts
{ current: value }
```

The `current` property is defined by React, not by you.

---

### `useCallback` — stable function identity

`useCallback` memoizes a function so that its identity does not change unless dependencies change.

```ts
const handleSave = useCallback(() => {
  dispatch("save");
}, [dispatch]);
```

Use `useCallback` when:

* passing functions to effects or child components
* avoiding unnecessary re-registrations or re-renders
* function identity matters more than execution speed

It does **not** make code faster by default. It makes behavior more predictable.

---

### `useMemo` — cached computed values

`useMemo` caches the *result* of a computation.

```ts
const filteredItems = useMemo(() => {
  return items.filter(i => i.visible);
}, [items]);
```

Use `useMemo` when:

* a computation is expensive
* the result depends on specific inputs
* recomputing on every render is wasteful

It is about **avoiding repeated work**, not state.

---

### `useContext` — shared state without prop drilling

`useContext` lets components read values from a shared context.

```ts
const { dispatch, register } = useActions();
```

Use `useContext` when:

* many components need the same data or functions
* passing props through many layers becomes messy
* modeling global services (actions, theme, auth)

Context is for **shared access**, not for frequent local updates.

---

## How these hooks work together (typical pattern)

* `useState` → represents UI truth
* `useEffect` → manages subscriptions and side effects
* `useRef` → bridges React and imperative reality
* `useCallback` → stabilizes behavior across renders
* `useContext` → shares services and global access

A good rule of thumb:

* **State describes**
* **Effects connect**
* **Refs point**
* **Callbacks stabilize**
* **Context shares**

---

React components are **pure functions of state**, and hooks are the controlled escape hatches that let those functions:

* remember things
* observe time
* touch the outside world
* coordinate with other components

### 3.4 What is Electron?

**Electron** is a framework that lets you build desktop applications using web technologies (HTML, CSS, JavaScript).

Think of it this way:
- **Chromium**: The browser engine (same one used by Google Chrome)
- **Node.js**: The backend runtime
- **Your Code**: The actual application

```
┌─────────────────────────────────────────────────────────┐
│                    Electron App                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │              Main Process (Node.js)               │ │
│  │  - Controls app lifecycle                         │ │
│  │  - Creates windows                                │ │
│  │  - File system access                             │ │
│  │  - Native menus                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                          │ IPC                         │
│                          ▼                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │           Renderer Process (Chromium)             │ │
│  │  - Displays the UI (HTML/CSS/JS)                  │ │
│  │  - React components                               │ │
│  │  - User interactions                              │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Key Electron concepts:**

1. **Main Process**: The "backend" - runs Node.js, has full system access
2. **Renderer Process**: The "frontend" - runs in Chromium, displays the UI
3. **IPC (Inter-Process Communication)**: How main and renderer talk to each other
4. **Preload Script**: A bridge between main and renderer (for security)

**Why Plero uses it**: Electron allows us to build a desktop app (like VS Code itself!) using familiar web technologies.

### 3.5 What is Vite?

**Vite** (French for "fast") is a build tool that:
- Serves your code during development with hot reload
- Bundles your code for production

**Why it's fast:**
- Uses native ES modules (no bundling during development)
- Only processes files when you need them

```javascript
// vite.config.ts - Configuration file
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "src/renderer",           // Where to find the app
  build: {
    outDir: "../../dist/renderer" // Where to output built files
  },
  plugins: [react()]              // Enable React support
});
```

**How Vite works in Plero:**

1. During development (`npm run dev`):
   - Vite starts a dev server on `http://localhost:5173`
   - Electron loads this URL
   - Changes to files instantly appear (Hot Module Replacement)

2. For production (`npm run build`):
   - Vite bundles all files into optimized output
   - The built files go to `dist/renderer`
   - Electron loads these static files

### 3.6 What is Tailwind CSS?

**Tailwind CSS** is a utility-first CSS framework. Instead of writing custom CSS, you compose styles using pre-defined classes.

```html
<!-- Traditional CSS approach -->
<style>
  .button {
    padding: 8px 16px;
    background-color: blue;
    color: white;
    border-radius: 4px;
  }
</style>
<button class="button">Click me</button>

<!-- Tailwind CSS approach -->
<button class="px-4 py-2 bg-blue-500 text-white rounded">Click me</button>
```

**Common Tailwind classes you'll see in Plero:**

| Class | What it does |
|-------|-------------|
| `flex` | Display: flex (flexbox layout) |
| `flex-col` | Flex direction: column |
| `h-full` | Height: 100% |
| `w-64` | Width: 16rem (256px) |
| `p-4` | Padding: 1rem on all sides |
| `px-4` | Padding left & right: 1rem |
| `py-2` | Padding top & bottom: 0.5rem |
| `text-sm` | Small text size |
| `bg-ink-black` | Custom background color |
| `hover:bg-dusk-blue` | Background on hover |
| `rounded` | Border radius |
| `overflow-hidden` | Hide overflow content |

**Custom colors in Plero** (defined in `tailwind.config.js`):

```javascript
colors: {
  'ink-black': '#0d1b2a',      // Deep dark blue
  'prussian-blue': '#1b263b',  // Sidebar background
  'dusk-blue': '#415a77',      // Borders, dividers
  'lavender-grey': '#778da9',  // Secondary text
  'alabaster-grey': '#e0e1dd', // Primary text
}
```

---

## 4. Project Architecture Overview

### 4.1 Directory Structure

Let's understand what each file and folder does:

```
plero/
├── demo.env                # Template for environment variables (API keys)
├── index.html              # Basic HTML file for Electron fallback
├── package.json            # Project dependencies and scripts
├── postcss.config.js       # PostCSS config (used by Tailwind)
├── README.md               # Project readme
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build tool configuration
│
├── src/                    # All source code
│   ├── index.css           # Global CSS with Tailwind directives
│   ├── main.ts             # 🚀 ELECTRON MAIN PROCESS ENTRY POINT
│   ├── preload.ts          # 🌉 Bridge between main and renderer
│   │
│   ├── components/         # React UI components
│   │   ├── Editor.tsx      # 📝 Code editor component
│   │   ├── FileExplorer.tsx# 📂 File tree component
│   │   └── MenuBar.tsx     # 📋 Top menu bar component
│   │
│   ├── ipc/                # Inter-Process Communication handlers
│   │   ├── ai.ts           # 🤖 AI-related IPC handlers
│   │   ├── filesIpc.ts     # 📁 File operations IPC handlers
│   │   └── tavily.ts       # 🌐 Web search IPC handlers
│   │
│   ├── renderer/           # React app (runs in Chromium)
│   │   ├── index.html      # React app entry HTML
│   │   ├── main.tsx        # ⚛️ REACT APP ENTRY POINT
│   │   ├── types.d.ts      # TypeScript type declarations
│   │   ├── contexts/       # React Context providers
│   │   │   └── ActionsContext.tsx  # Command dispatch system
│   │   └── hooks/          # Custom React hooks
│   │       └── useFileSystem.ts    # File operations hook
│   │
│   ├── services/           # Backend services (run in main process)
│   │   ├── ai.ts           # 🧠 AI completion, chat, classification
│   │   ├── db.ts           # 💾 Database service (placeholder)
│   │   ├── file.ts         # 📄 File system operations
│   │   ├── rag.ts          # 🔍 Retrieval Augmented Generation
│   │   └── tavily.ts       # 🔎 Web search service
│   │
│   └── tests/              # Test files
│       └── ipc_tests/      # IPC integration tests
│
├── test_output/            # Test output logs
└── dist/                   # Built files (generated)
```

### 4.2 How Components Connect

Here's the big picture of how data flows through the application:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
│  ┌─────────────┐     ┌──────────────────┐     ┌────────────────────┐       │
│  │   MenuBar   │────▶│  ActionsContext  │◀────│      Editor        │       │
│  │  (dispatch) │     │  (command bus)   │     │  (register/listen) │       │
│  └─────────────┘     └──────────────────┘     └────────────────────┘       │
│                                                         │                   │
│  ┌─────────────────────────────────────────────────────┐│                   │
│  │                   main.tsx (App)                    ││                   │
│  │  ┌────────────────────────────────────────────────┐ ││                   │
│  │  │              useFileSystem Hook                │◀┘│                   │
│  │  │  - tree (file structure)                       │  │                   │
│  │  │  - activeFile                                  │  │                   │
│  │  │  - fileContent                                 │  │                   │
│  │  │  - openTabs                                    │  │                   │
│  │  └───────────────────────┬────────────────────────┘  │                   │
│  └──────────────────────────┼───────────────────────────┘                   │
│                             │                                               │
│  ┌──────────────────────────┼───────────────────────────┐                   │
│  │              FileExplorer │                          │                   │
│  │  - Displays file tree     │                          │                   │
│  │  - Handles selection      │                          │                   │
│  │  - Context menu           │                          │                   │
│  └───────────────────────────┘                          │                   │
└──────────────────────────────────────────────────────────────────────────────
                               │
                               │ window.electronAPI
                               │ (exposed by preload.ts)
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRELOAD SCRIPT                                     │
│  contextBridge.exposeInMainWorld("electronAPI", {                           │
│    getTree: () => ipcRenderer.invoke("file:getTree"),                       │
│    getFileContent: (path) => ipcRenderer.invoke("file:getContent", path),   │
│    aiComplete: (args) => ipcRenderer.invoke("ai:complete", args),           │
│    ...                                                                       │
│  });                                                                         │
└──────────────────────────────────────────────────────────────────────────────
                               │
                               │ IPC (Inter-Process Communication)
                               │ ipcMain.handle("file:getTree", ...)
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             MAIN PROCESS                                     │
│  ┌───────────────┐     ┌────────────────┐     ┌────────────────┐           │
│  │   filesIpc.ts │────▶│    file.ts     │────▶│  File System   │           │
│  │ (IPC handler) │     │   (service)    │     │   (Node.js)    │           │
│  └───────────────┘     └────────────────┘     └────────────────┘           │
│                                                                              │
│  ┌───────────────┐     ┌────────────────┐     ┌────────────────┐           │
│  │     ai.ts     │────▶│    ai.ts       │────▶│   OpenAI API   │           │
│  │ (IPC handler) │     │   (service)    │     │   (internet)   │           │
│  └───────────────┘     └────────────────┘     └────────────────┘           │
│                              │                                              │
│                              ├────────────────┐                             │
│                              ▼                ▼                             │
│                        ┌──────────┐    ┌────────────┐                       │
│                        │  rag.ts  │    │ tavily.ts  │                       │
│                        │(embeddings)   │(web search)│                       │
│                        └──────────┘    └────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Deep Dive: The Main Process

The main process is the "backend" of your Electron app. It has full access to Node.js APIs (file system, network, etc.) and controls the application lifecycle.

### 5.1 Understanding main.ts

This is the entry point for the Electron application:

```typescript
// src/main.ts

// Import Electron modules
import { app, BrowserWindow } from "electron";
import path from "path";

// Import IPC handlers - these register themselves when imported
import "./ipc/ai";
import "./ipc/filesIpc";
import "./ipc/tavily";

function createWindow() {
  // Create a new browser window
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,  // Hide default Electron menu
    webPreferences: {
      // Preload script runs before the renderer
      preload: path.join(__dirname, "preload.js"),
      // Security settings
      contextIsolation: true,   // Isolate renderer from Node.js
      nodeIntegration: false,   // Don't allow require() in renderer
      webSecurity: false,       // Allow loading local files
    },
  });

  // Load different content based on environment
  if (process.env.NODE_ENV === "development") {
    // In development, load from Vite dev server
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();  // Open Chrome DevTools
  } else {
    // In production, load the built HTML file
    win.loadURL(
      `file://${path.resolve(process.cwd(), "dist/renderer/index.html")}`
    );
  }
}

// When Electron is ready, create the window
app.whenReady().then(createWindow);

// Quit when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
```

**What's happening:**

1. **Imports**: Load Electron's `app` and `BrowserWindow` modules
2. **IPC Imports**: Loading these files registers the IPC handlers
3. **createWindow()**: Creates the main application window
4. **Security Settings**:
   - `contextIsolation: true` - Renderer can't directly access Node.js
   - `nodeIntegration: false` - Can't use `require()` in renderer
   - This is important for security!
5. **Development vs Production**: Different loading strategies

### 5.2 The Preload Script

The preload script is the secure bridge between the main process and the renderer.

```typescript
// src/preload.ts

import { contextBridge, ipcRenderer } from "electron";

// Expose a limited API to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // File operations
  getTree: () => ipcRenderer.invoke("file:getTree"),
  getFileContent: (path: string) => ipcRenderer.invoke("file:getContent", path),
  saveFile: (path: string, content: string) =>
    ipcRenderer.invoke("file:save", path, content),
  delFile: (path: string) => ipcRenderer.invoke("file:delete", path),
  createFolder: (path: string) => ipcRenderer.invoke("file:mkdir", path),
  renamePath: (oldPath: string, newPath: string) =>
    ipcRenderer.invoke("file:rename", oldPath, newPath),
  delFolder: (path: string) => ipcRenderer.invoke("file:rmdir", path),
  stat: (path: string) => ipcRenderer.invoke("file:stat", path),
  exists: (path: string) => ipcRenderer.invoke("file:exists", path),
  insertAtCursor: (path: string, insertion: string, marker?: string) =>
    ipcRenderer.invoke("file:insertAtCursor", path, insertion, marker),
  openDialog: () => ipcRenderer.invoke("file:openDialog"),

  // AI operations
  aiComplete: (args: any) => ipcRenderer.invoke("ai:complete", args),
  aiChat: (args: any) => ipcRenderer.invoke("ai:chat", args),
  aiClassify: (args: any) => ipcRenderer.invoke("ai:classify", args),
  aiCompletionRag: (args: any) => ipcRenderer.invoke("ai:completionRag", args),

  // Tavily operations
  tavilySearch: (args: any) => ipcRenderer.invoke("tavily:search", args),
});
```

**Key concepts:**

1. **contextBridge.exposeInMainWorld()**: Safely exposes functions to the renderer
2. **ipcRenderer.invoke()**: Sends a message to the main process and waits for a response
3. **The exposed API**: This is what the renderer can access via `window.electronAPI`

**Why this pattern?**

Without the preload script, you'd have two bad choices:
- Enable `nodeIntegration` (dangerous - any script could access your files!)
- Have no communication between processes

The preload script provides a controlled, secure API.

---

## 6. Deep Dive: The Renderer Process (UI)

The renderer process runs in Chromium (the browser engine) and displays the user interface.

### 6.1 React Components

React components are the building blocks of the UI. Here's how they're organized:

```
App (main.tsx)
├── ActionsProvider (context wrapper)
│   └── AppContent
│       ├── MenuBar
│       │   └── Dropdown menus (File, Edit, View)
│       │
│       └── Main Layout (flexbox)
│           ├── Sidebar (FileExplorer)
│           │   ├── Explorer header
│           │   └── File tree (recursive)
│           │
│           ├── Resizer (draggable divider)
│           │
│           └── Editor
│               ├── Tab bar
│               └── CodeMirror (code editor)
```

### 6.2 The File Explorer

The FileExplorer shows your project's file structure as a tree:

```typescript
// src/components/FileExplorer.tsx

// A TreeNode represents either a file or folder
export type TreeNode = {
  path: string;           // e.g., "src/main.ts"
  name: string;           // e.g., "main.ts"
  type: "file" | "folder";
  children?: TreeNode[];  // Only folders have children
};

// The Node component renders a single file or folder
const Node: React.FC<{
  node: TreeNode;
  activeFile: TreeNode | null;
  onFileSelect: (file: TreeNode) => void;
  // ... other props
}> = ({ node, activeFile, onFileSelect, ... }) => {
  const [isOpen, setIsOpen] = useState(false);  // Is folder expanded?
  const [isRenaming, setIsRenaming] = useState(false);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);

  const isFolder = node.type === "folder";
  const isActive = activeFile?.path === node.path;

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);  // Toggle folder
    } else {
      onFileSelect(node);  // Select file
    }
  };

  return (
    <div>
      {/* The clickable row */}
      <div onClick={handleClick} onContextMenu={handleContextMenu}>
        {isFolder ? <FolderIcon isOpen={isOpen} /> : <FileIcon />}
        {isRenaming ? (
          <input value={newName} onChange={...} />
        ) : (
          <span>{node.name}</span>
        )}
      </div>

      {/* Context menu (right-click) */}
      {contextMenu && (
        <div style={{ left: contextMenu.x, top: contextMenu.y }}>
          <div onClick={handleRename}>Rename</div>
          <div onClick={handleDelete}>Delete</div>
          {isFolder && (
            <>
              <div onClick={handleNewFile}>New File</div>
              <div onClick={handleNewFolder}>New Folder</div>
            </>
          )}
        </div>
      )}

      {/* Children (for folders) - RECURSIVE! */}
      {isFolder && isOpen && (
        <div className="pl-4">
          <FileExplorer
            nodes={node.children}
            activeFile={activeFile}
            onFileSelect={onFileSelect}
            // ... passes all the same props
          />
        </div>
      )}
    </div>
  );
};

// The FileExplorer renders multiple nodes
export const FileExplorer: React.FC<FileExplorerProps> = ({
  nodes,
  activeFile,
  onFileSelect,
  // ...
}) => {
  return (
    <nav>
      {nodes.map((node) => (
        <Node
          key={node.path}
          node={node}
          activeFile={activeFile}
          onFileSelect={onFileSelect}
          // ...
        />
      ))}
    </nav>
  );
};
```

**Key patterns:**

1. **Recursive rendering**: A folder renders a FileExplorer containing its children
2. **State management**: Each Node tracks its own `isOpen`, `isRenaming`, etc.
3. **Context menu**: Appears on right-click with rename/delete/new options

### 6.3 The Code Editor

The Editor component wraps CodeMirror, a powerful code editing library:

```typescript
// src/components/Editor.tsx

import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { rust } from "@codemirror/lang-rust";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";

export const Editor: React.FC<EditorProps> = ({
  activeFile,
  content,
  isLoading,
  isDirty,
  setIsDirty,
  onSave,
  openTabs,
  onSelectTab,
  onCloseTab,
}) => {
  const { register } = useCommands();  // Access command system
  const [localContent, setLocalContent] = useState(content);
  const viewRef = useRef<EditorView | null>(null);

  // Register command listeners (e.g., save, undo, redo)
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

    // Return cleanup function
    return () => {
      unsubSave();
      unsubUndo();
      // ...
    };
  }, [register, activeFile, localContent, ...]);

  // Sync content when file changes
  useEffect(() => {
    setLocalContent(content);
    setIsDirty(false);
  }, [content, activeFile?.path]);

  // Handle Ctrl+S shortcut
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

  // Choose syntax highlighting based on file extension
  const getExtensions = useCallback(() => {
    const path = activeFile?.path || "";
    if (path.endsWith(".js") || path.endsWith(".ts") || path.endsWith(".tsx")) {
      return [javascript({ jsx: true, typescript: true })];
    } else if (path.endsWith(".rs")) {
      return [rust()];
    }
    return [];
  }, [activeFile]);

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <header>
        {openTabs.map((tab) => (
          <div
            key={tab.path}
            onClick={() => onSelectTab?.(tab)}
            className={activeFile.path === tab.path ? "active" : ""}
          >
            {tab.name}
            <span onClick={() => onCloseTab?.(tab.path)}>✕</span>
          </div>
        ))}
      </header>

      {/* The actual code editor */}
      <CodeMirror
        value={localContent}
        height="100%"
        theme={vscodeDark}
        extensions={getExtensions()}
        onChange={(value) => {
          setLocalContent(value);
          setIsDirty(true);
        }}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          bracketMatching: true,
          // ...
        }}
      />
    </div>
  );
};
```

**Key features:**

1. **CodeMirror**: A powerful, extensible code editor
2. **Language support**: JavaScript, TypeScript, Rust syntax highlighting
3. **Theme**: Uses VS Code dark theme
4. **Tab management**: Multiple files can be open
5. **Dirty state**: Tracks if file has unsaved changes
6. **Keyboard shortcuts**: Ctrl+S to save

### 6.4 The Menu Bar

The MenuBar provides File, Edit, and View menus:

```typescript
// src/components/MenuBar.tsx

const MENU_STRUCTURE: MenuSection[] = [
  {
    label: 'File',
    items: [
      { label: 'New File', action: 'new', shortcut: 'Ctrl+N' },
      { label: 'Open File...', action: 'open', shortcut: 'Ctrl+O' },
      { label: 'separator', type: 'separator' },
      { label: 'Save', action: 'save', shortcut: 'Ctrl+S' },
      { label: 'separator', type: 'separator' },
      { label: 'Exit', action: 'exit' }
    ]
  },
  {
    label: 'Edit',
    items: [
      { label: 'Undo', action: 'undo', shortcut: 'Ctrl+Z' },
      { label: 'Redo', action: 'redo', shortcut: 'Ctrl+Y' },
      // ...
    ]
  },
  // ...
];

export const MenuBar: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { dispatch } = useCommands();  // Get dispatch function

  const handleItemClick = (action?: string) => {
    if (action) {
      dispatch(action);  // Send command to listeners
    }
    setActiveMenu(null);  // Close menu
  };

  return (
    <nav>
      <div className="font-bold">PLERO</div>
      
      {MENU_STRUCTURE.map((menu) => (
        <div
          key={menu.label}
          onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
        >
          <div>{menu.label}</div>
          
          {activeMenu === menu.label && (
            <div className="dropdown">
              {menu.items.map((item, idx) => (
                item.type === "separator" ? (
                  <div key={idx} className="separator" />
                ) : (
                  <div
                    key={idx}
                    onClick={() => handleItemClick(item.action)}
                  >
                    {item.label}
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
};
```

**Key pattern:**

The MenuBar doesn't directly call save/open functions. Instead, it **dispatches actions** through the ActionsContext. This decouples the menu from the actual implementations.

---

## 7. State Management & Communication

### 7.1 React Context (ActionsContext)

React Context provides a way to share data across components without passing props manually through every level.

```typescript
// src/renderer/contexts/ActionsContext.tsx

import React, { createContext, useContext, useRef } from "react";

type CommandCallback = () => void;

interface ActionsContextType {
  dispatch: (action: string) => void;
  register: (action: string, callback: CommandCallback) => () => void;
}

const ActionsContext = createContext<ActionsContextType | null>(null);

export const ActionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Store callbacks for each action
  const listeners = useRef<Record<string, CommandCallback[]>>({});

  // Dispatch an action to all registered listeners
  const dispatch = (action: string) => {
    console.log(`[Command] Dispatching: ${action}`);
    const handlers = listeners.current[action];
    if (handlers) handlers.forEach(fn => fn());
  };

  // Register a callback for an action, returns cleanup function
  const register = (action: string, callback: CommandCallback) => {
    if (!listeners.current[action]) listeners.current[action] = [];
    listeners.current[action].push(callback);
    
    // Return unsubscribe function
    return () => {
      listeners.current[action] = listeners.current[action].filter(fn => fn !== callback);
    };
  };

  return (
    <ActionsContext.Provider value={{ dispatch, register }}>
      {children}
    </ActionsContext.Provider>
  );
};

// Custom hook to use the context
export const useCommands = () => {
  const context = useContext(ActionsContext);
  if (!context) throw new Error("useCommands must be used within ActionsProvider");
  return context;
};
```

**How it works:**

1. **ActionsProvider**: Wraps the entire app, provides `dispatch` and `register`
2. **dispatch(action)**: Calls all callbacks registered for that action
3. **register(action, callback)**: Registers a callback, returns unsubscribe function
4. **useCommands()**: Hook to access dispatch/register from any component

**Explanation:**

- This project uses a simple event dispatch (pub-sub) system to decouple UI actions (like menu clicks or keyboard shortcuts) from the logic that handles them.
- A component registers a callback for an action (for example "save") when the component is mounted. 
- This registration happens inside useEffect, which runs based on the component’s lifecycle — not user input. 
- Once registered, the callback stays active for the entire lifetime of the component. 
- When an action is dispatched, all callbacks previously registered for that action are executed; dispatching does not add or remove callbacks, it only triggers them. 
- The unsubscribe function returned by register is used to remove the callback when the component unmounts or when the effect re-runs due to dependency changes. 
- This prevents memory leaks, duplicate handlers, and callbacks holding stale state. Callbacks are persistent listeners, not one-shot handlers. 
- State updates and async operations may occur while callbacks run, which is expected in an event-driven system; the UI remains consistent because React re-renders from state rather than relying on execution order. 
- This separation between lifecycle (register/unsubscribe) and events (dispatch) is the core idea that keeps the system predictable and scalable.

**Example flow:**

```
MenuBar clicks "Save"
    ↓
dispatch("save")
    ↓
All registered "save" callbacks fire
    ↓
Editor's save callback executes
    ↓
File is saved
```

### 7.2 Custom Hooks (useFileSystem)

Custom hooks encapsulate reusable logic. `useFileSystem` handles all file-related state:

```typescript
// src/renderer/hooks/useFileSystem.ts

export function useFileSystem() {
  // State
  const [tree, setTree] = useState<TreeNode[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<TreeNode | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isEditorLoading, setIsEditorLoading] = useState<boolean>(false);
  const [openTabs, setOpenTabs] = useState<TreeNode[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Load file tree from backend
  const loadTree = useCallback(() => {
    window.electronAPI.getTree()
      .then((res) => {
        if (res.ok) setTree(res.data);
        else setError("Failed to load file tree.");
      })
      .catch((err) => setError(err.message));
  }, []);

  // Load tree on mount
  useEffect(() => {
    loadTree();
  }, [loadTree]);

  // Select a file to view/edit
  const selectFile = useCallback((file: TreeNode) => {
    if (file.type !== "file") return;
    setIsEditorLoading(true);

    // Add to open tabs if not already there
    setOpenTabs((prev) => {
      if (prev.find((t) => t.path === file.path)) return prev;
      return [...prev, file];
    });

    setActiveFile(file);
    
    // Fetch file content
    window.electronAPI.getFileContent(file.path)
      .then((res) => {
        if (res.ok) {
          setFileContent(res.data);
          setIsDirty(false);
        }
      })
      .finally(() => setIsEditorLoading(false));
  });

  // Save a file
  const saveFile = useCallback(async (path: string, content: string) => {
    const res = await window.electronAPI.saveFile(path, content);
    if (res.ok) {
      loadTree();  // Refresh tree
      return true;
    }
    return false;
  }, [loadTree]);

  // Delete a file or folder
  const deleteFile = useCallback(async (path: string, isFolder: boolean) => {
    const res = isFolder
      ? await window.electronAPI.delFolder(path)
      : await window.electronAPI.delFile(path);
    
    if (res.ok) {
      loadTree();
      if (activeFile?.path === path) {
        setActiveFile(null);
        setFileContent("");
      }
      return true;
    }
    return false;
  }, [loadTree, activeFile]);

  // ... more functions: newFile, renameFile, createNewFile, createNewFolder, etc.

  return {
    tree,
    error,
    activeFile,
    fileContent,
    isEditorLoading,
    isDirty,
    setIsDirty,
    selectFile,
    saveFile,
    newFile,
    openFileDialog,
    renameFile,
    deleteFile,
    createNewFile,
    createNewFolder,
    openTabs,
    closeTab,
  };
}
```

**Benefits of custom hooks:**

1. **Separation of concerns**: Logic is separate from UI
2. **Reusability**: Could be used in multiple components
3. **Testability**: Logic can be tested independently
4. **Clean components**: Components just render, hooks handle logic

### 7.3 IPC - Inter-Process Communication

IPC is how the renderer (UI) talks to the main process (backend).

**The IPC flow:**

```
Renderer Process                Main Process
      │                              │
      │  ipcRenderer.invoke(         │
      │    "file:getTree"            │
      │  )                           │
      │ ────────────────────────────▶│
      │                              │  ipcMain.handle(
      │                              │    "file:getTree",
      │                              │    async () => {
      │                              │      return getTree();
      │                              │    }
      │                              │  )
      │                              │
      │◀────────────────────────────│
      │  { ok: true, data: [...] }   │
      │                              │
```

**IPC Handlers** (in `src/ipc/filesIpc.ts`):

```typescript
import { ipcMain, dialog } from "electron";
import * as fileService from "../services/file";

// Helper for consistent error handling
const handle = (fn: Function) => async (_event: any, ...args: any[]) => {
  try {
    const data = await fn(...args);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
};

// Register handlers
ipcMain.handle("file:getTree", handle(() => fileService.getTree()));
ipcMain.handle("file:getContent", handle((path: string) => fileService.getFileContent(path)));
ipcMain.handle("file:save", handle((path: string, content: string) => fileService.saveFile(path, content)));
ipcMain.handle("file:delete", handle((path: string) => fileService.delFile(path)));
ipcMain.handle("file:mkdir", handle((path: string) => fileService.createFolder(path)));
ipcMain.handle("file:rename", handle((old: string, new: string) => fileService.renamePath(old, new)));
ipcMain.handle("file:rmdir", handle((path: string) => fileService.delFolder(path)));

// File dialog uses Electron's native dialog
ipcMain.handle("file:openDialog", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "All Files", extensions: ["*"] },
      { name: "JavaScript/TypeScript", extensions: ["js", "jsx", "ts", "tsx"] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return { ok: true, data: result.filePaths[0] };
  }
  return { ok: false, error: "No file selected" };
});
```

**Key points:**

1. `ipcMain.handle()` registers a handler for a channel
2. `ipcRenderer.invoke()` calls the handler and returns a Promise
3. All responses follow `{ ok: boolean, data?: any, error?: string }` pattern
4. The `handle()` wrapper provides consistent error handling

---

## 8. Backend Services

### 8.1 File Service

The file service (`src/services/file.ts`) provides file system operations:

```typescript
import fs from "fs";
import path from "path";

// Get the root directory (current working directory or test directory)
function getRoot(): string {
  return process.env.TEST_ROOT
    ? path.resolve(process.env.TEST_ROOT)
    : process.cwd();
}

const ROOT = getRoot();

// Type definitions
export type FileNode = {
  readonly name: string;
  readonly type: 'file';
  readonly path: string;
};

export type FolderNode = {
  readonly name: string;
  readonly type: "folder";
  readonly path: string;
  readonly children: TreeNode[];
};

export type TreeNode = FileNode | FolderNode;

/**
 * Recursively gets the directory tree
 */
export function getTree(dir: string = ROOT): TreeNode[] {
  const entries = fs.readdirSync(dir);
  entries.sort((a, b) => a.localeCompare(b));

  return entries.map((name: string): TreeNode => {
    const fullPath = safeJoin(dir, name);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      return {
        name,
        type: "folder",
        path: path.relative(ROOT, fullPath),
        children: getTree(fullPath),  // Recursive!
      };
    } else {
      return {
        name,
        type: "file",
        path: path.relative(ROOT, fullPath),
      };
    }
  });
}

/**
 * Reads file content
 */
export function getFileContent(relPath: string): string {
  const filePath = safeJoin(ROOT, relPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    throw new Error("File not found");
  }
  return fs.readFileSync(filePath, "utf8");
}

/**
 * Saves file content
 */
export function saveFile(relPath: string, content: string): void {
  const filePath = safeJoin(ROOT, relPath);
  fs.writeFileSync(filePath, content, "utf8");
}

/**
 * Deletes a file
 */
export function delFile(relPath: string): void {
  const filePath = safeJoin(ROOT, relPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    throw new Error("File not found");
  }
  fs.unlinkSync(filePath);
}

/**
 * Creates a folder
 */
export function createFolder(relPath: string): void {
  const folderPath = safeJoin(ROOT, relPath);
  if (fs.existsSync(folderPath)) {
    throw new Error("Folder already exists");
  }
  fs.mkdirSync(folderPath, { recursive: true });
}

/**
 * Renames/moves a file or folder
 */
export function renamePath(oldRelPath: string, newRelPath: string): void {
  const oldPath = safeJoin(ROOT, oldRelPath);
  const newPath = safeJoin(ROOT, newRelPath);
  if (!fs.existsSync(oldPath)) throw new Error("Source does not exist");
  if (fs.existsSync(newPath)) throw new Error("Destination already exists");
  fs.renameSync(oldPath, newPath);
}

/**
 * Deletes a folder recursively
 */
export function delFolder(relPath: string): void {
  const folderPath = safeJoin(ROOT, relPath);
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    throw new Error("Folder not found");
  }
  fs.rmSync(folderPath, { recursive: true, force: true });
}

/**
 * Security: Prevents path traversal attacks
 */
function safeJoin(root: string, relPath: string): string {
  const fullPath = path.resolve(root, relPath);
  const rel = path.relative(root, fullPath);
  // Prevent going outside root with "../"
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("Invalid path");
  }
  return fullPath;
}
```

**Key concepts:**

1. **Relative paths**: All operations use paths relative to ROOT
2. **safeJoin()**: Prevents path traversal attacks (e.g., `../../etc/passwd`)
3. **Recursive tree building**: `getTree()` calls itself for each subdirectory
4. **Synchronous operations**: Uses `fs.xxxSync()` methods (blocks until done)

### 8.2 AI Service

The AI service (`src/services/ai.ts`) provides various AI-powered features:

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Code completion - continues writing code
 */
export async function completion({
  prompt,
  model = "gpt-4.1-mini",
  temperature = 0.2,
  maxTokens = 50,
}: CompletionOptions) {
  const llm = new ChatOpenAI({
    model,
    temperature,
    maxTokens,
    apiKey: OPENAI_API_KEY,
  });

  const codePrompt = new PromptTemplate({
    inputVariables: ["input"],
    template: `Complete the following code. Only output the next lines of code, with no explanations.\n\n{input}`,
  });

  const chain = codePrompt.pipe(llm);  // Chain prompt → LLM
  const response = await chain.invoke({ input: prompt });
  return response;
}

/**
 * Query classification - determines what type of request this is
 */
export async function classify({ query, model = "gpt-3.5-turbo" }: ClassifyOptions) {
  const classifyPrompt = new PromptTemplate({
    inputVariables: ["query"],
    template: `Classify this query into one category. Respond with just the number:
1. Code completion (user is typing code, wants autocomplete)
2. Chat (conversational question)
3. Reasoning (complex problem solving)
4. Web search (requires external information)

Query: {query}
Classification:`
  });

  const llm = new ChatOpenAI({ model, temperature: 0, maxTokens: 5, apiKey: OPENAI_API_KEY });
  const response = await classifyPrompt.pipe(llm).invoke({ query });
  return parseInt(response.content.toString().trim());
}

/**
 * Basic chat - conversational responses
 */
export async function basicChat(query: string, model: string = "gpt-4o"): Promise<string> {
  const chatPrompt = new PromptTemplate({
    inputVariables: ["query"],
    template: `You are a helpful AI assistant. Respond conversationally.
Query: {query}
Response:`
  });

  const llm = new ChatOpenAI({ model, apiKey: OPENAI_API_KEY });
  const response = await chatPrompt.pipe(llm).invoke({ query });
  return response.content.toString();
}

/**
 * Reasoning - step-by-step problem solving
 */
export async function reasonerHelper(query: string, model: string = "gpt-4o"): Promise<string> {
  const reasoningPrompt = new PromptTemplate({
    inputVariables: ["query"],
    template: `Think through this step by step. Break down the problem carefully.
Query: {query}
Analysis:`
  });

  const llm = new ChatOpenAI({ model, apiKey: OPENAI_API_KEY });
  const response = await reasoningPrompt.pipe(llm).invoke({ query });
  return response.content.toString();
}

/**
 * Web-assisted responses - uses Tavily search results
 */
export async function webHelper(query: string, model: string = "gpt-4o"): Promise<string> {
  // First, search the web
  const searchRes = await tavilySearch({ query, maxResults: 3, includeAnswers: true });

  // Then, use results as context
  const webPrompt = new PromptTemplate({
    inputVariables: ["query", "searchResults"],
    template: `Answer using these search results as context:
Query: {query}
Search Results: {searchResults}
Response:`
  });

  const searchContext = searchRes.results
    .map(r => `Title: ${r.title}\nContent: ${r.content}`)
    .join('\n\n');

  const llm = new ChatOpenAI({ model, apiKey: OPENAI_API_KEY });
  const response = await webPrompt.pipe(llm).invoke({ query, searchResults: searchContext });
  return response.content.toString();
}

/**
 * Advanced chat - combines modes based on flags
 */
export async function chatRespond(
  query: string,
  reasoning: boolean = false,
  web: boolean = false,
  model: string = "gpt-4o"
): Promise<string> {
  if (reasoning && web) {
    const webRes = await webHelper(query, model);
    return await reasonerHelper(`Based on: ${webRes}\n\nQuery: ${query}`, model);
  } else if (reasoning) {
    return await reasonerHelper(query, model);
  } else if (web) {
    return await webHelper(query, model);
  } else {
    return await basicChat(query, model);
  }
}
```

**Key concepts:**

1. **LangChain**: A framework for building LLM applications
2. **PromptTemplate**: Reusable prompts with variable substitution
3. **Chain**: Connects prompt → LLM → output
4. **Different modes**: Completion, chat, reasoning, web search

### 8.3 Tavily (Web Search) Service

Tavily provides real-time web search capabilities:

```typescript
// src/services/tavily.ts

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

export type TavilySearchOptions = {
  query: string;
  searchDepth?: "basic" | "advanced";
  includeAnswers?: boolean;
  includeImages?: boolean;
  maxResults?: number;
};

export type TavilySearchResult = {
  answer?: string;
  images?: string[];
  follow_up_questions?: string[];
  results: Array<{
    url: string;
    content: string;
    title?: string;
  }>;
};

export async function tavilySearch(opts: TavilySearchOptions): Promise<TavilySearchResult> {
  const body = {
    api_key: TAVILY_API_KEY,
    query: opts.query,
    search_depth: opts.searchDepth ?? "basic",
    include_answers: opts.includeAnswers ?? true,
    include_images: opts.includeImages ?? false,
    max_results: opts.maxResults ?? 10,
  };

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.status}`);
  }

  return await response.json();
}
```

**Why Tavily?**
- Designed for AI applications
- Returns clean, relevant content
- Includes direct answers
- Fast and reliable

### 8.4 RAG (Retrieval Augmented Generation)

RAG improves AI responses by providing relevant context from your files:

```typescript
// src/services/rag.ts

import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

const HUGGINGFACEHUB_API_KEY = process.env.HUGGINGFACEHUB_API_KEY;

// Local cache for embeddings
const CACHE_FILE = path.join(process.cwd(), ".plero", "embeddings_cache.json");
let embeddingCache: Record<string, number[][]> = {};

// Embedder model
const embedder = new HuggingFaceInferenceEmbeddings({
  model: "sentence-transformers/all-MiniLM-L6-v2",
  apiKey: HUGGINGFACEHUB_API_KEY,
});

/**
 * Split text into chunks
 */
export function chunkByLines(text: string, chunkSize: number = 50): string[] {
  const lines = text.split("\n");
  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += chunkSize) {
    chunks.push(lines.slice(i, i + chunkSize).join("\n"));
  }
  return chunks;
}

/**
 * Embed a single piece of text
 */
export async function embed(text: string): Promise<number[]> {
  return await embedder.embedQuery(text);
}

/**
 * Embed multiple chunks (more efficient)
 */
export async function embedChunks(chunks: string[]): Promise<number[][]> {
  return await embedder.embedDocuments(chunks);
}

/**
 * Cache embeddings to avoid re-computing
 */
export async function cacheEmbeddings(filePath: string, embeddings: number[][]) {
  embeddingCache[filePath] = embeddings;
  fs.writeFileSync(CACHE_FILE, JSON.stringify(embeddingCache, null, 2));
}
```

**How RAG works in Plero:**

```typescript
// In ai.ts

export async function completionRag({ fileContent, prompt, model }) {
  // 1. Split file into chunks
  const chunks = rag.chunkByLines(fileContent, 50);

  // 2. Get or compute embeddings for chunks
  let embeddings = await rag.getCachedEmbeddings("current-file");
  if (!embeddings) {
    embeddings = await rag.embedChunks(chunks);
    await rag.cacheEmbeddings("current-file", embeddings);
  }

  // 3. Embed the prompt
  const promptEmbedding = await rag.embed(prompt);

  // 4. Find most similar chunks
  const relevantChunks = findRelevantChunks(chunks, embeddings, promptEmbedding, 3);

  // 5. Build context-aware prompt
  const context = relevantChunks.map((c, i) => `Chunk ${i+1}:\n${c}`).join("\n\n");
  const fullPrompt = `Context from file:\n${context}\n\nPrompt: ${prompt}`;

  // 6. Get completion with context
  return await completion({ prompt: fullPrompt, model });
}

/**
 * Cosine similarity - measures how similar two vectors are
 * 1 = identical, 0 = unrelated, -1 = opposite
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.hypot(...a);
  const magB = Math.hypot(...b);
  return dotProduct / (magA * magB);
}

/**
 * Find the most relevant chunks for a query
 */
export function findRelevantChunks(
  chunks: string[],
  embeddings: number[][],
  queryEmbedding: number[],
  topK: number
): string[] {
  const similarities = embeddings.map((embedding, index) => ({
    chunk: chunks[index],
    similarity: cosineSimilarity(embedding, queryEmbedding),
  }));

  return similarities
    .sort((a, b) => b.similarity - a.similarity)  // Sort by similarity (descending)
    .slice(0, topK)                                // Take top K
    .map(item => item.chunk);                      // Extract chunks
}
```

**Why RAG is powerful:**

1. **Context-aware**: The AI knows about your specific code
2. **Efficient**: Only sends relevant chunks, not the entire file
3. **Cached**: Embeddings are stored to avoid re-computation
4. **Semantic search**: Finds conceptually related code, not just keyword matches

---

## 9. Styling with Tailwind CSS

Plero uses a custom color scheme defined in `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/renderer/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Sea Theme
        'ink-black': '#0d1b2a',      // Main background
        'prussian-blue': '#1b263b',  // Sidebar, menus
        'dusk-blue': '#415a77',      // Borders, hover states
        'lavender-grey': '#778da9',  // Secondary text
        'alabaster-grey': '#e0e1dd', // Primary text
      }
    },
  },
};
```

**Custom CSS** in `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #282a2e;
}
::-webkit-scrollbar-thumb {
  background: #4a4d52;
  border-radius: 4px;
}
```

**Common patterns in the codebase:**

```tsx
// Layout with flexbox
<div className="flex flex-col h-screen">
  <header className="...">...</header>
  <main className="flex-1 overflow-hidden">...</main>
</div>

// Hover effects
<button className="text-lavender-grey hover:text-alabaster-grey hover:bg-dusk-blue">
  Click me
</button>

// Conditional classes
<div className={`px-2 py-1 ${isActive ? "bg-dusk-blue text-alabaster-grey" : ""}`}>
  Tab
</div>
```

---

## 10. Configuration Files Explained

### package.json

```json
{
  "name": "plero",
  "version": "1.0.0",
  "main": "dist/main.js",  // Entry point for Electron
  "type": "commonjs",      // Use CommonJS modules
  
  "scripts": {
    // Development
    "dev": "concurrently \"npm run dev:react\" \"npm run dev:electron\"",
    "dev:react": "vite",                              // Start Vite dev server
    "dev:electron": "npm run build:main && electron .", // Build & start Electron
    
    // Build
    "build": "tsc --noEmitOnError false",
    "build:main": "npx tsc src/main.ts src/preload.ts --outDir dist ...",
    "build:react": "vite build",
    
    // Production
    "start": "electron .",
    
    // Testing
    "test": "vitest",
    "test:ui": "vitest --ui"
  },
  
  "devDependencies": {
    // Build tools
    "typescript": "^5.8.3",
    "vite": "^6.3.5",
    "@vitejs/plugin-react": "^4.7.0",
    
    // Electron
    "electron": "^37.2.3",
    
    // CSS
    "tailwindcss": "^3.4.17",
    "postcss": "^8.5.6",
    "autoprefixer": "^10.4.21",
    
    // Testing
    "vitest": "^4.0.18",
    "@vitest/ui": "^4.0.18",
    
    // Utilities
    "concurrently": "^9.2.1",  // Run multiple commands
    "cross-env": "^10.1.0",    // Cross-platform env vars
  },
  
  "dependencies": {
    // React
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    
    // Code editor
    "@uiw/react-codemirror": "^4.25.4",
    "@uiw/codemirror-theme-vscode": "^4.25.4",
    "@codemirror/lang-javascript": "^6.2.4",
    "@codemirror/lang-rust": "^6.0.2",
    
    // AI / LangChain
    "@langchain/openai": "^0.6.2",
    "@langchain/core": "^0.3.65",
    "@langchain/community": "^0.3.49",
    "@langchain/tavily": "^0.1.4",
    
    // Hugging Face (for embeddings)
    "@huggingface/inference": "^4.5.3",
    "@huggingface/transformers": "^3.6.3",
    
    // Utilities
    "dotenv": "^16.4.5",  // Load .env files
    "uuid": "^11.1.0",    // Generate unique IDs
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "es2020",        // JavaScript version to output
    "module": "commonjs",      // Module system (require/exports)
    "rootDir": "./src",        // Source files location
    "jsx": "react-jsx",        // JSX transform (no React import needed)
    "strict": true,            // Enable all strict type checks
    "esModuleInterop": true,   // Better CommonJS/ES module interop
    "skipLibCheck": true,      // Skip type checking of .d.ts files
    "forceConsistentCasingInFileNames": true
  }
}
```

### vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: "src/renderer",           // Where the React app is
  base: "./",                     // Use relative paths
  build: {
    outDir: "../../dist/renderer", // Output location
    emptyOutDir: true,             // Clear before building
  },
  plugins: [react()],              // Enable React
  css: {
    postcss: "./postcss.config.js", // PostCSS (for Tailwind)
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/renderer"), // @ = src/renderer
    },
  },
});
```

### demo.env

```dotenv
OPENAI_API_KEY="sk-proj-XXXX..."      # OpenAI for GPT models
TAVILY_API_KEY="tvly-dev-xxx..."       # Tavily for web search
HUGGINGFACEHUB_API_KEY="hf_XXX..."     # Hugging Face for embeddings

# LangSmith (optional - for tracing/debugging)
LANGSMITH_API_KEY="lsv2_pt_xxx..."
LANGSMITH_ENDPOINT="https://api.smith.langchain.com"
LANGSMITH_PROJECT="plero"
LANGSMITH_TRACING=true
```

**To use:**
1. Copy `demo.env` to `.env`
2. Fill in your actual API keys
3. Never commit `.env` to git!

---

## 11. How to Run the Project

### Prerequisites

1. **Node.js** (v18 or higher): https://nodejs.org/
2. **npm** (comes with Node.js)
3. **API Keys**:
   - OpenAI: https://platform.openai.com/api-keys
   - Tavily: https://tavily.com/
   - Hugging Face: https://huggingface.co/settings/tokens

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/zen-zap/plero.git
cd plero

# 2. Install dependencies
npm install

# 3. Create environment file
cp demo.env .env
# Edit .env and add your API keys

# 4. Run in development mode
npm run dev
```

### Development Workflow

**Development mode** (`npm run dev`):
- Starts Vite dev server on http://localhost:5173
- Starts Electron and loads from Vite
- Hot reload: changes appear instantly
- DevTools open automatically

**Production build**:
```bash
# Build everything
npm run build:frontend

# Run built app
npm start
```

### Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui
```

---

## 12. Testing

Tests are located in `src/tests/ipc_tests/`. They test the IPC communication between renderer and main processes.

```typescript
// Example: src/tests/ipc_tests/filesIpc.test.ts

import assert from "assert";
import { app, BrowserWindow } from "electron";
import path from "path";
import fs from "fs";
import os from "os";

let win: BrowserWindow;
let testRoot: string;

// Setup before all tests
before(async function () {
  await app.whenReady();
  win = new BrowserWindow({
    show: false,  // Headless - no visible window
    webPreferences: {
      preload: path.join(__dirname, "../../preload.js"),
      contextIsolation: true,
    },
  });
  await win.loadURL("about:blank");
});

// Cleanup after all tests
after(function () {
  if (win) win.destroy();
  app.quit();
});

// Individual test
it("createFolder and getTree reflect new folder", async function () {
  const folderName = `test-folder-${uuid()}`;
  
  // Create folder via IPC
  const createRes = await win.webContents.executeJavaScript(
    `window.electronAPI.createFolder("${folderName}")`
  );
  assert(createRes.ok, `createFolder failed: ${createRes.error}`);
  
  // Verify it appears in tree
  const treeRes = await win.webContents.executeJavaScript(
    `window.electronAPI.getTree()`
  );
  assert(treeRes.ok);
  assert(treeRes.data.some(node => node.name === folderName));
});
```

**Testing strategy:**

1. Create a headless Electron window
2. Use `executeJavaScript` to call `window.electronAPI` methods
3. Assert the results are correct
4. Clean up test files after

---

## 13. Glossary of Terms

| Term | Definition |
|------|------------|
| **API** | Application Programming Interface - a way for programs to communicate |
| **Async/Await** | JavaScript syntax for handling asynchronous operations |
| **Bundle** | Combining multiple files into one for production |
| **Chromium** | The open-source browser engine used by Chrome and Electron |
| **Component** | A reusable piece of UI in React |
| **Context** | React's way to share data across components without props |
| **DOM** | Document Object Model - the tree structure of HTML elements |
| **Electron** | Framework for building desktop apps with web technologies |
| **Embedding** | Converting text to numerical vectors for similarity search |
| **Hot Reload** | Updating the app without refreshing when code changes |
| **Hook** | A function that lets you use React features in functional components |
| **IPC** | Inter-Process Communication - how Electron processes talk to each other |
| **JSX** | JavaScript XML - React's syntax for writing HTML in JavaScript |
| **LLM** | Large Language Model - AI models like GPT-4 |
| **Node.js** | JavaScript runtime for running JS outside browsers |
| **Preload** | Script that runs before renderer, bridges main and renderer |
| **Props** | Data passed from parent to child components in React |
| **RAG** | Retrieval Augmented Generation - providing context to AI |
| **React** | Library for building user interfaces |
| **Renderer** | Electron process that displays the UI (runs in Chromium) |
| **State** | Data that changes over time and triggers re-renders |
| **Tailwind** | Utility-first CSS framework |
| **TypeScript** | JavaScript with static types |
| **Vite** | Fast build tool and dev server |

---

## Final Notes

Congratulations on making it through! 🎉 You now understand:

1. ✅ How web technologies (HTML, CSS, JS) work
2. ✅ What Electron is and how it creates desktop apps
3. ✅ How React components and state management work
4. ✅ How IPC connects the UI to backend services
5. ✅ How the AI features (completion, chat, RAG) work
6. ✅ How to set up and run the project

### Next Steps for Learning

1. **Modify the colors** in `tailwind.config.js` and see changes instantly
2. **Add a new menu item** in `MenuBar.tsx`
3. **Add a new file type** for syntax highlighting in `Editor.tsx`
4. **Try the AI features** by implementing UI buttons for them
5. **Read the test files** to understand expected behaviors

### Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [LangChain JS Documentation](https://js.langchain.com/docs)

Happy coding! 🚀
