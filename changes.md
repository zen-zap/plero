# AI Chat Sidebar Implementation - Changes Documentation

This document details all the changes made to implement the AI Chat Sidebar feature with markdown rendering, multiple modes, RAG context support, and keyboard shortcuts.

---

## Summary of Changes

| File | Type | Description |
|------|------|-------------|
| `src/components/AIChatSidebar.tsx` | Modified | Complete rewrite with mode selection, context toggle, markdown rendering |
| `src/components/MarkdownRenderer.tsx` | Created | New component for rendering markdown with proper styling |
| `src/services/ai.ts` | Modified | Added `autoChat`, `webChat`, `ragChat` functions and mode support |
| `src/ipc/ai.ts` | Modified | Updated IPC handlers with mode routing and RAG endpoint |
| `src/preload.ts` | Modified | Exposed `aiRagChat` IPC method |
| `src/renderer/types.d.ts` | Modified | Updated type definitions for new chat options |
| `src/renderer/main.tsx` | Modified | Added keyboard shortcuts and passed file content to sidebar |
| `package.json` | Modified | Added `react-markdown` and `remark-gfm` dependencies |

---

## Detailed Changes

### 1. Markdown Rendering (`src/components/MarkdownRenderer.tsx`)

**Created a new component** to handle markdown rendering in AI responses.

**Features:**
- Uses `react-markdown` with `remark-gfm` plugin for GitHub Flavored Markdown
- Custom styled components for:
  - Code blocks with syntax highlighting (language badge, proper formatting)
  - Inline code with distinct styling
  - Headings (h1, h2, h3)
  - Lists (ordered and unordered)
  - Blockquotes
  - Tables with proper styling
  - Links (open in new tab)
  - Bold and italic text
- Matches the "Deep Sea" theme color palette

**Key code:**
```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Custom components for each markdown element
components={{
  code({ className, children, ...props }) {
    // Handles both inline and block code
  },
  // ... other components
}}
```

---

### 2. AI Chat Sidebar (`src/components/AIChatSidebar.tsx`)

**Complete rewrite** to support:

#### Mode Selection
Four modes available via dropdown menu:
- **Auto**: Automatically detects the best mode based on query keywords
- **Chat**: Standard conversation mode
- **Reasoning**: Uses `o1-mini` model for deep analysis
- **Web**: Searches the web using Tavily API

```tsx
export type ChatMode = "auto" | "chat" | "reasoning" | "web";
```

#### Context Toggle
- Toggle button to enable/disable file context
- When enabled, passes current file content to AI
- Shows the current file name when context is active
- Uses RAG (Retrieval Augmented Generation) for large files

#### UI Improvements
- Mode indicator badge in header
- Clear chat button
- Mode selector dropdown with descriptions
- Markdown rendering for all AI responses
- Mode badge on responses (shows which mode was used)
- Updated placeholder text based on context state

**Props interface:**
```tsx
interface AIChatSidebarProps {
  width: number;
  onClose: () => void;
  activeFileContent?: string;  // NEW
  activeFilePath?: string;     // NEW
}
```

---

### 3. Backend AI Service (`src/services/ai.ts`)

**Added multiple new functions:**

#### `chat()` - Enhanced
```typescript
export type ChatOptions = {
  query: string;
  mode?: "chat" | "reasoning" | "web" | "auto";
  model?: string;
  systemPrompt?: string;
  context?: string; // RAG context
};
```
- Now accepts `mode` and `context` parameters
- Adjusts system prompt based on mode
- Uses `o1-mini` model for reasoning mode

#### `autoChat()` - NEW
```typescript
export async function autoChat({
  query,
  context,
}: {
  query: string;
  context?: string;
}): Promise<{ response: string; mode: string }>
```
- Classifies query based on keywords
- Routes to appropriate handler (web, reasoning, or chat)
- Returns the detected mode alongside the response

**Classification logic:**
- Web mode: "search", "latest", "current", "news", "what is", "who is"
- Reasoning mode: "explain", "why", "how does", "step by step", "analyze", "debug"
- Default: Chat mode

#### `webChat()` - NEW
```typescript
export async function webChat({
  query,
  context,
}: {
  query: string;
  context?: string;
}): Promise<string>
```
- Searches the web using Tavily API
- Formats search results as context
- Passes to chat with web-aware system prompt
- Falls back to regular chat if web search fails

#### `ragChat()` - NEW
```typescript
export async function ragChat({
  query,
  fileContent,
  filePath,
}: {
  query: string;
  fileContent: string;
  filePath?: string;
}): Promise<string>
```
- Chunks file content into 30-line segments
- Embeds query and chunks using HuggingFace embeddings
- Calculates cosine similarity to find relevant chunks
- Passes top 3 most relevant chunks as context
- Falls back to truncated content on error

**Helper function:**
```typescript
function cosineSimilarity(a: number[], b: number[]): number
```

---

### 4. IPC Handlers (`src/ipc/ai.ts`)

**Updated `ai:chat` handler:**
```typescript
ipcMain.handle("ai:chat", async (_event, args) => {
  const mode = args.mode || "chat";
  
  switch (mode) {
    case "auto":
      // Uses autoChat, returns detected mode
    case "web":
      // Uses webChat
    case "reasoning":
    case "chat":
    default:
      // Uses chat with mode param
  }
  
  return { ok: true, data: result, mode: usedMode };
});
```

**Added `ai:ragChat` handler:**
```typescript
ipcMain.handle("ai:ragChat", async (_event, args) => {
  const result = await aiService.ragChat({
    query: args.query,
    fileContent: args.fileContent,
    filePath: args.filePath,
  });
  return { ok: true, data: result };
});
```

---

### 5. Preload Script (`src/preload.ts`)

**Added new IPC method:**
```typescript
aiRagChat: (args: any) => ipcRenderer.invoke("ai:ragChat", args),
```

---

### 6. Type Definitions (`src/renderer/types.d.ts`)

**Updated ChatOptions:**
```typescript
export type ChatOptions = {
  query: string;
  mode?: "chat" | "reasoning" | "web" | "auto";
  context?: string;
  model?: string;
};
```

**Added RagChatOptions:**
```typescript
export type RagChatOptions = {
  query: string;
  fileContent: string;
  filePath?: string;
};
```

**Updated Window interface:**
```typescript
aiChat: (options: ChatOptions) => Promise<ApiResponse<string> & { mode?: string }>;
aiRagChat: (options: RagChatOptions) => Promise<ApiResponse<string>>;
```

---

### 7. Main Layout (`src/renderer/main.tsx`)

**Added keyboard shortcuts:**
```typescript
React.useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl+B: Toggle left sidebar (file explorer)
    if (e.ctrlKey && !e.shiftKey && e.key === "b") {
      e.preventDefault();
      setIsSidebarVisible((prev) => !prev);
    }
    // Ctrl+Shift+B: Toggle right sidebar (AI chat)
    if (e.ctrlKey && e.shiftKey && e.key === "B") {
      e.preventDefault();
      setIsChatVisible((prev) => !prev);
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, []);
```

**Passed file content to sidebar:**
```tsx
<AIChatSidebar
  width={chatWidth}
  onClose={() => setIsChatVisible(false)}
  activeFileContent={fileContent || undefined}
  activeFilePath={activeFile?.path}
/>
```

---

### 8. Dependencies (`package.json`)

**Added packages:**
```json
"react-markdown": "^9.x.x",
"remark-gfm": "^4.x.x"
```

Installed with:
```bash
npm install react-markdown remark-gfm --save --legacy-peer-deps
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Toggle left sidebar (File Explorer) |
| `Ctrl+Shift+B` | Toggle right sidebar (AI Chat) |

---

## Usage

### Mode Selection
1. Click the mode dropdown button (shows current mode)
2. Select from: Auto, Chat, Reasoning, or Web
3. Mode badge appears on AI responses showing which mode was used

### Context Toggle
1. Click the "Context" button to enable
2. When enabled, current file content is used as context
3. Button shows the current file name when active
4. For large files, RAG is used to find relevant chunks

### Chat Features
- **Enter**: Send message
- **Shift+Enter**: New line
- **Clear button**: Reset chat history
- **Close button**: Hide sidebar (or use Ctrl+Shift+B)

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   IPC Layer     │     │   Backend       │
│                 │     │                 │     │                 │
│ AIChatSidebar   │────▶│ ai:chat         │────▶│ chat()          │
│                 │     │ ai:ragChat      │     │ autoChat()      │
│ MarkdownRenderer│     │                 │     │ webChat()       │
│                 │     │                 │     │ ragChat()       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                       │
                                                       ▼
                                               ┌─────────────────┐
                                               │   External      │
                                               │                 │
                                               │ OpenAI API      │
                                               │ Tavily API      │
                                               │ HuggingFace     │
                                               └─────────────────┘
```

---

## Future Improvements

1. **Streaming responses**: Add support for streaming AI responses
2. **Chat history persistence**: Save chat history to disk
3. **Multiple conversations**: Support for multiple chat threads
4. **Code actions**: Add buttons to apply AI suggestions to editor
5. **Image support**: Handle image generation/analysis
6. **Voice input**: Add speech-to-text support

---

# Editor UX Improvements - Phase 2

This section documents the editor improvements made to enhance the overall user experience, including improved AI completions, command palette, toast notifications, and various UI enhancements.

---

## Summary of Phase 2 Changes

| File | Type | Description |
|------|------|-------------|
| `src/components/CommandPalette.tsx` | Created | New command palette component with fuzzy search |
| `src/components/Toast.tsx` | Created | Toast notification system with provider |
| `src/components/Breadcrumb.tsx` | Created | File path breadcrumb navigation |
| `src/components/Editor.tsx` | Modified | Ghost completion improvements, search, word wrap, status bar |
| `src/components/MenuBar.tsx` | Modified | Added new menu items and keyboard shortcuts display |
| `src/renderer/main.tsx` | Modified | Integrated CommandPalette, ToastProvider, new commands |

---

## Detailed Phase 2 Changes

### 1. Command Palette (`src/components/CommandPalette.tsx`)

**Created a VS Code-style command palette** for quick access to all commands.

**Features:**
- Opens with `Ctrl+Shift+P`
- Fuzzy search filtering by command name or category
- Keyboard navigation (↑/↓ arrows, Enter to execute, Escape to close)
- Shows keyboard shortcuts for each command
- Grouped by category (File, Edit, View, AI, Help)
- Auto-scrolls to selected item
- Focus trap when open

**Key interface:**
```tsx
export interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  category?: string;
  action: () => void;
}
```

**Styling:**
- Semi-transparent backdrop with blur
- Centered modal design
- Matches Deep Sea theme colors
- Hover and selected states with proper contrast

---

### 2. Toast Notification System (`src/components/Toast.tsx`)

**Created a flexible toast notification system** using React Context.

**Features:**
- Four toast types: `success`, `error`, `warning`, `info`
- Auto-dismiss after 4 seconds (configurable)
- Manual dismiss with close button
- Smooth slide-in/out animations
- Stacks multiple toasts
- Custom icons per type

**Usage:**
```tsx
const { showToast } = useToast();
showToast("File saved successfully", "success");
showToast("Error occurred", "error");
```

**Context provider:**
```tsx
<ToastProvider>
  <App />
</ToastProvider>
```

---

### 3. Breadcrumb Navigation (`src/components/Breadcrumb.tsx`)

**Created a file path breadcrumb component** for easy navigation.

**Features:**
- Shows file path as clickable segments
- Handles long paths (shows last 4 segments with ellipsis)
- Separator icons between segments
- Hover highlighting
- Click handling ready for future navigation

**Styling:**
- Compact design fitting editor header
- Muted colors with hover states
- Folder icon for each segment

---

### 4. Editor Improvements (`src/components/Editor.tsx`)

#### Ghost Completion Enhancements

**Improved the AI auto-completion system:**

- **Longer debounce** (400ms vs 250ms): Reduces API calls, waits for user to stop typing
- **AbortController**: Cancels pending requests when user continues typing
- **Loading indicator**: Shows "AI thinking..." when completion is in progress
- **Better language detection**: Added Python, CSS, HTML language tags
- **Comment filtering**: Skips completion when line is a comment
- **Higher priority**: Boosted completion priority for consistent appearance

```typescript
const ghostAbortRef = useRef<AbortController | null>(null);
const [isGhostLoading, setIsGhostLoading] = useState(false);

// On new request, abort previous
if (ghostAbortRef.current) {
  ghostAbortRef.current.abort();
}
ghostAbortRef.current = new AbortController();
```

#### New Commands Registered

| Command | Description |
|---------|-------------|
| `find` | Opens CodeMirror search panel |
| `toggle-word-wrap` | Toggles line wrapping |
| `toggle-ghost` | Toggles AI completions |

#### Selection Info Tracking

**Added selection info tracking:**
```typescript
const [selectionInfo, setSelectionInfo] = useState({ chars: 0, lines: 0 });

// In handleChange:
const selection = view.state.selection.main;
const selectedText = view.state.sliceDoc(selection.from, selection.to);
setSelectionInfo({
  chars: selectedText.length,
  lines: selectedText.split("\n").length,
});
```

#### Extended CodeMirror Extensions

**Added new extensions:**
- `search()`: Enables Ctrl+F find functionality
- `searchKeymap`: Keyboard shortcuts for find/next/previous
- `EditorView.lineWrapping`: Toggleable word wrap

```typescript
const getExtensions = () => {
  const exts = [langExtension, search(), keymap.of(searchKeymap)];
  if (wordWrap) {
    exts.push(EditorView.lineWrapping);
  }
  // ... ghost completion
  return exts;
};
```

#### Enhanced Status Bar

**Redesigned status bar with:**
- **AI toggle button**: Click to enable/disable completions with toast feedback
- **Word wrap toggle button**: Visual icon button
- **Modified indicator**: Compact dot indicator
- **Selection info**: Shows "X chars, Y lines selected" when text is selected
- **Ghost loading indicator**: Floating badge when AI is thinking

#### Improved Empty State

**New empty state design:**
- Friendly welcome message
- Quick action hints with keyboard shortcuts
- Command palette shortcut highlighted
- Cleaner visual design

```tsx
<div className="text-center">
  <h2>Welcome to Plero</h2>
  <p>Open a file or create a new one</p>
  <div className="flex flex-col gap-2 text-sm">
    <span>Ctrl+N: New file</span>
    <span>Ctrl+O: Open file</span>
    <span>Ctrl+Shift+P: Command Palette</span>
  </div>
</div>
```

#### Breadcrumb Integration

**Added breadcrumb below tab bar:**
```tsx
{/* Breadcrumb */}
<Breadcrumb path={activeFile.path} />
```

---

### 5. MenuBar Updates (`src/components/MenuBar.tsx`)

**Enhanced menu structure:**

#### New Menu Items

**Edit Menu:**
- Find (`Ctrl+F`)
- Find and Replace (`Ctrl+H`)

**View Menu:**
- Toggle AI Chat (`Ctrl+Shift+B`)
- Toggle Word Wrap
- Toggle AI Completions
- Command Palette (`Ctrl+Shift+P`)

**Help Menu (NEW):**
- Keyboard Shortcuts
- Documentation
- About Plero

#### Keyboard Shortcuts Display

**Menu items now show shortcuts:**
```tsx
<div className="flex items-center justify-between gap-4">
  <span>{item.label}</span>
  {item.shortcut && (
    <span className="text-lavender-grey/50 text-xs">{item.shortcut}</span>
  )}
</div>
```

---

### 6. Main Layout Updates (`src/renderer/main.tsx`)

#### New State

```typescript
const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
```

#### New Command Registrations

| Command | Action |
|---------|--------|
| `toggle-ai-chat` | Toggle AI sidebar visibility |
| `command-palette` | Open command palette |
| `about` | Show about toast |
| `show-shortcuts` | Show keyboard shortcuts toast |

#### Keyboard Shortcuts

Added `Ctrl+Shift+P` for command palette:
```typescript
if (e.ctrlKey && e.shiftKey && e.key === "P") {
  e.preventDefault();
  setIsCommandPaletteOpen(true);
}
```

#### Command Palette Commands

```typescript
const paletteCommands: CommandItem[] = [
  { id: "save", label: "Save File", shortcut: "Ctrl+S", category: "File", ... },
  { id: "new", label: "New File", shortcut: "Ctrl+N", category: "File", ... },
  { id: "toggle-sidebar", label: "Toggle File Explorer", ... },
  { id: "toggle-ai-chat", label: "Toggle AI Chat", ... },
  { id: "find", label: "Find in File", ... },
  { id: "toggle-word-wrap", label: "Toggle Word Wrap", ... },
  { id: "toggle-ghost", label: "Toggle AI Completions", ... },
  // ...
];
```

#### ToastProvider Wrapper

```tsx
<ErrorBoundary>
  <ActionsProvider>
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  </ActionsProvider>
</ErrorBoundary>
```

#### Editor Props

Added `onShowToast` prop to Editor:
```tsx
<Editor
  // ... other props
  onShowToast={showToast}
/>
```

---

## Updated Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New file |
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save file |
| `Ctrl+B` | Toggle File Explorer |
| `Ctrl+Shift+B` | Toggle AI Chat |
| `Ctrl+Shift+P` | Command Palette |
| `Ctrl+F` | Find in file |
| `Ctrl+H` | Find and Replace |
| `Ctrl+=` | Zoom in |
| `Ctrl+-` | Zoom out |
| `Escape` | Close command palette |

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         App (main.tsx)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    ToastProvider                          │  │
│  │  ┌───────────────────────────────────────────────────┐   │  │
│  │  │                  AppContent                        │   │  │
│  │  │  ┌─────────┐  ┌────────┐  ┌──────────────────┐   │   │  │
│  │  │  │ MenuBar │  │ Editor │  │ AIChatSidebar    │   │   │  │
│  │  │  │         │  │        │  │                  │   │   │  │
│  │  │  │         │  │ ┌────┐ │  │ MarkdownRenderer │   │   │  │
│  │  │  │         │  │ │Crumb│ │  │                  │   │   │  │
│  │  │  │         │  │ └────┘ │  │                  │   │   │  │
│  │  │  └─────────┘  └────────┘  └──────────────────┘   │   │  │
│  │  │                                                    │   │  │
│  │  │  ┌──────────────────────────────────────────────┐ │   │  │
│  │  │  │            CommandPalette (modal)            │ │   │  │
│  │  │  └──────────────────────────────────────────────┘ │   │  │
│  │  └───────────────────────────────────────────────────┘   │  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────────────────────┐│  │
│  │  │              Toast Notifications                      ││  │
│  │  └──────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files Created

### `src/components/CommandPalette.tsx`
```tsx
// ~160 lines
// - Search input with filtering
// - Keyboard navigation
// - Command execution
// - Styled modal overlay
```

### `src/components/Toast.tsx`
```tsx
// ~120 lines
// - ToastProvider context
// - useToast hook
// - Toast component with animations
// - Auto-dismiss logic
```

### `src/components/Breadcrumb.tsx`
```tsx
// ~60 lines
// - Path parsing
// - Segment rendering
// - Overflow handling
```

---

## Testing Checklist

- [ ] Command palette opens with Ctrl+Shift+P
- [ ] Command palette filters by typing
- [ ] Arrow keys navigate command palette
- [ ] Enter executes selected command
- [ ] Escape closes command palette
- [ ] Toast notifications appear and auto-dismiss
- [ ] Different toast types show correct colors
- [ ] AI completions show loading indicator
- [ ] Word wrap toggle works
- [ ] Find (Ctrl+F) opens search panel
- [ ] Status bar shows selection info
- [ ] Breadcrumb displays file path
- [ ] Menu shows keyboard shortcuts

---

## Performance Considerations

1. **Ghost completion debounce**: 400ms prevents excessive API calls
2. **AbortController**: Cancels pending requests to avoid race conditions
3. **useMemo for commands**: Prevents command array recreation on every render
4. **useCallback for handlers**: Memoizes event handlers
