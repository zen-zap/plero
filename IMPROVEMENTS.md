# 🔧 Plero Improvements & Fixes

> **Document tracking all improvements, fixes, and suggestions for the Plero project.**

Last Updated: January 25, 2026

---

## Table of Contents

1. [Summary of Changes](#summary-of-changes)
2. [Issues Found & Fixed](#issues-found--fixed)
3. [Testing Framework Setup](#testing-framework-setup)
4. [New Files Created](#new-files-created)
5. [Files Modified](#files-modified)
6. [How to Run Tests](#how-to-run-tests)
7. [Remaining Suggestions](#remaining-suggestions)

---

## Summary of Changes

| Category | Issue | Status |
|----------|-------|--------|
| Types | Incomplete TypeScript declarations for electronAPI | ✅ Fixed |
| Testing | No Vitest configuration file | ✅ Fixed |
| React | Missing useCallback dependency array | ✅ Fixed |
| Error Handling | No Error Boundary for catching UI errors | ✅ Added |
| Testing | No test setup file with mocks | ✅ Added |
| Testing | No unit tests for hooks/services | ✅ Added |
| Scripts | Missing useful npm scripts | ✅ Added |
| Dependencies | Missing testing dependencies | ✅ Added |

---

## Issues Found & Fixed

### 1. Incomplete TypeScript Declarations

**Problem:**
The [types.d.ts](src/renderer/types.d.ts) file only declared 3 of the 15+ methods exposed by `window.electronAPI`. This meant:
- No autocomplete for most API methods
- No type checking for API call parameters
- No type checking for API responses

**Solution:**
Completely rewrote `types.d.ts` to include:
- All file operations (`getTree`, `getFileContent`, `saveFile`, `delFile`, `createFolder`, `renamePath`, `delFolder`, `stat`, `exists`, `insertAtCursor`, `openDialog`)
- All AI operations (`aiComplete`, `aiChat`, `aiClassify`, `aiCompletionRag`)
- All Tavily operations (`tavilySearch`)
- Proper generic `ApiResponse<T>` type for consistent response handling
- Exported types for options objects (`CompletionOptions`, `ChatOptions`, etc.)

**File Changed:** [src/renderer/types.d.ts](src/renderer/types.d.ts)

---

### 2. Missing Vitest Configuration

**Problem:**
The project had `vitest` in dependencies and test scripts, but no configuration file existed. Running `npm test` would fail or behave unexpectedly because:
- No jsdom environment configured for React testing
- No setup file for mocking `window.electronAPI`
- No clear include/exclude patterns

**Solution:**
Created [vitest.config.ts](vitest.config.ts) with:
- React plugin support
- jsdom environment for DOM testing
- Setup file reference for mocks
- Proper include/exclude patterns
- Coverage configuration
- Path aliases matching vite.config.ts

**File Created:** [vitest.config.ts](vitest.config.ts)

---

### 3. Missing useCallback Dependency Array

**Problem:**
In [useFileSystem.ts](src/renderer/hooks/useFileSystem.ts), the `selectFile` function was defined with `useCallback()` but missing the dependency array:

```typescript
// BEFORE - Bug!
const selectFile = useCallback((file: TreeNode) => {
  // ...
}); // <-- Missing dependency array!
```

This caused:
- Function recreated every render (performance issue)
- Stale closures possible
- ESLint warnings (if enabled)

**Solution:**
Added empty dependency array (function doesn't depend on external values) and improved error handling:

```typescript
// AFTER - Fixed!
const selectFile = useCallback((file: TreeNode) => {
  // ...
  if (res.ok) {
    setFileContent(res.data ?? "");  // Added nullish coalescing
    // ...
  } else {
    setError(res.error ?? "Failed to load file content");  // Better error message
    // ...
  }
}, []);  // <-- Added dependency array
```

**File Changed:** [src/renderer/hooks/useFileSystem.ts](src/renderer/hooks/useFileSystem.ts)

---

### 4. No Error Boundary Component

**Problem:**
If any React component throws an error, the entire application would crash with a white screen. There was no way to:
- Catch and display errors gracefully
- Allow users to recover
- Log errors for debugging

**Solution:**
Created [ErrorBoundary.tsx](src/components/ErrorBoundary.tsx) with:
- Catches JavaScript errors anywhere in the component tree
- Displays user-friendly error message with details
- "Try again" button to attempt recovery
- Optional custom fallback UI
- `withErrorBoundary` HOC (Higher Order Component) for easy wrapping
- Error callback for logging/reporting

**Usage in App:**
```tsx
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ActionsProvider>
        <AppContent />
      </ActionsProvider>
    </ErrorBoundary>
  );
};
```

**Files Created:** [src/components/ErrorBoundary.tsx](src/components/ErrorBoundary.tsx)
**Files Changed:** [src/renderer/main.tsx](src/renderer/main.tsx)

---

### 5. No Test Setup File

**Problem:**
Every test file would need to manually mock `window.electronAPI`, which leads to:
- Code duplication
- Inconsistent mocks
- Difficult maintenance

**Solution:**
Created [setup.ts](src/tests/setup.ts) with:
- Mock `window.electronAPI` with all methods
- Mock `window.confirm` and `window.alert`
- Helper functions for testing:
  - `resetMock(method)` - Clear specific mock
  - `mockApiFailure(method, error)` - Simulate API failure
  - `mockApiResponse(method, data)` - Simulate specific response
- Automatic cleanup after each test

**File Created:** [src/tests/setup.ts](src/tests/setup.ts)

---

### 6. Missing Unit Tests

**Problem:**
The existing tests in `src/tests/ipc_tests/` are integration tests that require Electron. There were no unit tests that could run quickly without Electron for:
- React hooks
- React components
- Service functions

**Solution:**
Created comprehensive unit tests:

1. **useFileSystem Hook Tests** - [src/renderer/hooks/useFileSystem.test.ts](src/renderer/hooks/useFileSystem.test.ts)
   - Initialization tests
   - File selection tests
   - Save/delete/rename operations
   - Tab management
   - Error handling

2. **Editor Component Tests** - [src/components/Editor.test.tsx](src/components/Editor.test.tsx)
   - Empty state
   - Loading state
   - Tab display and interaction
   - Keyboard shortcuts

3. **File Service Tests** - [src/services/file.test.ts](src/services/file.test.ts)
   - All CRUD operations
   - Error cases
   - Security (path traversal prevention)

---

### 7. Missing npm Scripts

**Problem:**
Limited npm scripts for common operations.

**Solution:**
Added to [package.json](package.json):

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:electron": "npx electron-mocha --require ts-node/register src/tests/ipc_tests/*.test.ts",
    "lint": "tsc --noEmit",
    "typecheck": "tsc --noEmit"
  }
}
```

| Script | Description |
|--------|-------------|
| `test` | Run unit tests once |
| `test:ui` | Run tests with Vitest UI (browser-based) |
| `test:coverage` | Run tests with coverage report |
| `test:watch` | Run tests in watch mode (re-run on changes) |
| `test:electron` | Run Electron IPC integration tests |
| `lint` | Type check without emitting files |
| `typecheck` | Same as lint (alias) |

---

### 8. Missing Testing Dependencies

**Problem:**
Missing npm packages needed for proper testing.

**Solution:**
Added to [package.json](package.json) devDependencies:

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",    // DOM matchers
    "@testing-library/react": "^16.3.0",       // React testing utilities
    "@vitest/coverage-v8": "^4.0.18",          // Coverage provider
    "jsdom": "^26.1.0"                         // DOM environment for tests
  }
}
```

---

## Testing Framework Setup

### Vitest Configuration Explained

The [vitest.config.ts](vitest.config.ts) file configures Vitest for this project:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use globals (describe, it, expect) without imports
    globals: true,
    
    // Use jsdom for DOM APIs (document, window)
    environment: "jsdom",
    
    // Run setup.ts before each test file
    setupFiles: ["./src/tests/setup.ts"],
    
    // Which files are tests
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "src/tests/**/*.{test,spec}.{ts,tsx}",
    ],
    
    // Skip Electron integration tests (they need electron-mocha)
    exclude: [
      "node_modules",
      "dist",
      "src/tests/ipc_tests/**",
    ],
    
    // Coverage settings
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
    },
  },
});
```

### Test Types

| Type | Location | Runner | Description |
|------|----------|--------|-------------|
| Unit Tests | `src/**/*.test.ts` | Vitest | Fast, no Electron needed |
| Component Tests | `src/**/*.test.tsx` | Vitest + jsdom | React component testing |
| Integration Tests | `src/tests/ipc_tests/` | electron-mocha | Full Electron IPC testing |

---

## New Files Created

| File | Purpose |
|------|---------|
| [vitest.config.ts](vitest.config.ts) | Vitest test runner configuration |
| [src/tests/setup.ts](src/tests/setup.ts) | Test setup with mocks and helpers |
| [src/components/ErrorBoundary.tsx](src/components/ErrorBoundary.tsx) | Error boundary component |
| [src/renderer/hooks/useFileSystem.test.ts](src/renderer/hooks/useFileSystem.test.ts) | Hook unit tests |
| [src/components/Editor.test.tsx](src/components/Editor.test.tsx) | Component unit tests |
| [src/services/file.test.ts](src/services/file.test.ts) | Service unit tests |

---

## Files Modified

| File | Changes |
|------|---------|
| [src/renderer/types.d.ts](src/renderer/types.d.ts) | Complete TypeScript declarations for electronAPI |
| [src/renderer/hooks/useFileSystem.ts](src/renderer/hooks/useFileSystem.ts) | Fixed useCallback dependency, improved error handling |
| [src/renderer/main.tsx](src/renderer/main.tsx) | Added ErrorBoundary wrapper |
| [package.json](package.json) | Added scripts and dependencies |

---

## How to Run Tests

### Install New Dependencies

First, install the new testing dependencies:

```bash
npm install
```

### Run Unit Tests

```bash
# Run once
npm test

# Watch mode (re-run on changes)
npm run test:watch

# With UI
npm run test:ui

# With coverage
npm run test:coverage
```

### Run Integration Tests (Electron)

```bash
# Requires Electron - tests IPC communication
npm run test:electron
```

### Type Checking

```bash
# Check types without building
npm run typecheck
```

---

## Remaining Suggestions

These are improvements that could be made in the future:

### High Priority

1. **Add ESLint Configuration**
   - Create `.eslintrc.js` with React and TypeScript rules
   - Add `lint` script for code quality checks
   - Enable `react-hooks/exhaustive-deps` rule

2. **Add Prettier Configuration**
   - Create `.prettierrc` for consistent formatting
   - Add format scripts

3. **Improve Error Messages**
   - Show toast notifications for save success/failure
   - Add error state display in FileExplorer

### Medium Priority

4. **Add Loading States**
   - Loading indicator while file tree loads
   - Skeleton loaders for better UX

5. **Keyboard Navigation**
   - Arrow keys to navigate file tree
   - Tab/Shift+Tab in editor

6. **File Icons by Type**
   - Different icons for `.ts`, `.js`, `.json`, `.md`, etc.
   - Folder icons that change when open/closed

### Lower Priority

7. **Add Search Functionality**
   - Search files by name
   - Search content within files (grep)

8. **Recent Files List**
   - Track recently opened files
   - Quick open menu

9. **Workspace Settings**
   - Remember sidebar width
   - Remember open tabs
   - Theme preferences

10. **Git Integration**
    - Show modified files
    - Basic git status indicators

---

## Code Quality Checklist

Before committing, ensure:

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] No console errors in browser
- [ ] Error boundary catches component errors
- [ ] API calls handle both success and failure

---

## Architecture Notes

### IPC Communication Pattern

```
┌─────────────────────────────────────────────────────────────┐
│ RENDERER (React)                                            │
│                                                             │
│  useFileSystem hook                                         │
│       │                                                     │
│       ▼                                                     │
│  window.electronAPI.getTree()                               │
│       │                                                     │
└───────┼─────────────────────────────────────────────────────┘
        │ ipcRenderer.invoke("file:getTree")
        ▼
┌─────────────────────────────────────────────────────────────┐
│ PRELOAD (Bridge)                                            │
│                                                             │
│  contextBridge.exposeInMainWorld("electronAPI", {...})      │
│                                                             │
└───────┼─────────────────────────────────────────────────────┘
        │ IPC Channel
        ▼
┌─────────────────────────────────────────────────────────────┐
│ MAIN (Node.js)                                              │
│                                                             │
│  ipcMain.handle("file:getTree", () => fileService.getTree())│
│       │                                                     │
│       ▼                                                     │
│  fileService.getTree() → fs.readdirSync()                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Response Format

All IPC responses follow this pattern:

```typescript
type ApiResponse<T> = {
  ok: boolean;     // Success indicator
  data?: T;        // Payload on success
  error?: string;  // Error message on failure
};
```

This allows consistent error handling:

```typescript
const res = await window.electronAPI.getTree();
if (res.ok) {
  // Use res.data
} else {
  // Handle res.error
}
```

---

## Questions?

If you have questions about any changes, refer to the detailed comments in the code or the [DOCUMENTATION.md](DOCUMENTATION.md) file for full project explanation.
