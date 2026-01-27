# Test Setup Documentation

This document describes the testing infrastructure, organization, and best practices for the Plero codebase.

## Overview

Plero uses **Vitest** as its test framework with **jsdom** for simulating the browser environment. Tests are written using **@testing-library/react** for React components and standard Vitest matchers for unit tests.

## Test Directory Structure

All tests are centralized under `src/tests/`:

```
src/tests/
├── setup.ts                 # Global test setup and mocks
├── components/              # Component tests
│   ├── Editor.test.tsx
│   ├── CommandPalette.test.tsx
│   ├── Toast.test.tsx
│   ├── Breadcrumb.test.tsx
│   ├── FileExplorer.test.tsx
│   ├── ErrorBoundary.test.tsx
│   └── MenuBar.test.tsx
├── hooks/                   # Custom hook tests
│   └── useFileSystem.test.ts
├── contexts/                # Context tests
│   └── ActionsContext.test.tsx
├── services/                # Service layer tests
│   └── file.test.ts
└── ipc_tests/               # IPC/Electron tests (excluded from standard runs)
    ├── aiIpc.test.ts
    ├── completionPipeline.test.ts
    ├── completionRagPipeline.test.ts
    ├── filesIpc.test.ts
    └── tavilyIpc.test.ts
```

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test -- --run

# Run tests in watch mode (interactive)
npm test

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- --run src/tests/components/Editor.test.tsx

# Run tests matching a pattern
npm test -- --run -t "should render"
```

### Test Output

- **Pass/Fail Summary**: Shows at the end of test run
- **Coverage Report**: Generated in `coverage/` directory when using `--coverage`
- **Verbose Output**: Configured by default in `vitest.config.ts`

## Configuration

### vitest.config.ts

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["src/tests/ipc_tests/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    testTimeout: 10000,
    reporters: ["verbose"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
```

Key settings:
- **environment: jsdom** - Simulates browser APIs
- **globals: true** - Allows `describe`, `it`, `expect` without imports
- **setupFiles** - Runs before each test file
- **exclude: ipc_tests** - AI/Electron tests require special setup

### setup.ts

The global setup file (`src/tests/setup.ts`) provides:

1. **Electron API Mocks**: Complete mock of `window.electronAPI` with file operations, dialog APIs, and AI services
2. **jsdom Polyfills**: Mocks for browser APIs not available in jsdom (e.g., `scrollIntoView`)
3. **Testing Library Setup**: Imports and cleanup

## Writing Tests

### File Naming Convention

Tests should be named `{ComponentOrModule}.test.tsx` (or `.test.ts` for non-React):
- `Editor.test.tsx` for Editor component
- `file.test.ts` for file service

### Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComponentUnderTest } from "@/components/ComponentUnderTest";

describe("ComponentUnderTest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render initial state", () => {
      render(<ComponentUnderTest />);
      expect(screen.getByText("Expected Text")).toBeInTheDocument();
    });
  });

  describe("user interaction", () => {
    it("should handle click events", async () => {
      const handleClick = vi.fn();
      render(<ComponentUnderTest onClick={handleClick} />);
      
      fireEvent.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalled();
    });
  });
});
```

### Common Patterns

#### Mocking Electron API

```typescript
// In your test
vi.mocked(window.electronAPI.readFile).mockResolvedValue("file content");
```

#### Testing Async Operations

```typescript
import { waitFor } from "@testing-library/react";

it("should load data", async () => {
  render(<AsyncComponent />);
  
  await waitFor(() => {
    expect(screen.getByText("Loaded")).toBeInTheDocument();
  });
});
```

#### Testing Timers (e.g., Toast auto-dismiss)

```typescript
import { act } from "@testing-library/react";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it("should auto-dismiss after timeout", async () => {
  render(<ToastComponent />);
  
  await act(async () => {
    vi.advanceTimersByTime(5000);
  });
  
  expect(screen.queryByText("Toast message")).not.toBeInTheDocument();
});
```

#### Testing Error Boundaries

```typescript
const ThrowError = () => {
  throw new Error("Test error");
};

it("should catch errors", () => {
  // Suppress console.error for cleaner output
  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(screen.getByText("Test error")).toBeInTheDocument();
  consoleSpy.mockRestore();
});
```

### Testing Contexts

```typescript
import { renderHook, act } from "@testing-library/react";
import { useMyContext, MyProvider } from "@/contexts/MyContext";

it("should provide context value", () => {
  const wrapper = ({ children }) => <MyProvider>{children}</MyProvider>;
  const { result } = renderHook(() => useMyContext(), { wrapper });
  
  act(() => {
    result.current.dispatch("action");
  });
  
  expect(result.current.state).toBe("expected");
});
```

## Test Coverage

### Current Coverage Areas

| Area | Tests | Coverage |
|------|-------|----------|
| Components | 7 files | UI rendering, interactions, state |
| Hooks | 1 file | useFileSystem file operations |
| Contexts | 1 file | ActionsContext dispatch/subscribe |
| Services | 1 file | File service operations |

### What's NOT Tested (by design)

- **AI Services** (`ai.ts`, `aiIpc.ts`): Non-deterministic outputs
- **IPC Tests** (`ipc_tests/`): Require Electron environment
- **Tavily Integration**: External API dependency

## Adding New Tests

1. **Create test file** in the appropriate directory under `src/tests/`
2. **Follow naming convention**: `{Module}.test.tsx`
3. **Import dependencies**: Testing utilities, component/module under test
4. **Structure with describe blocks**: Group related tests
5. **Mock external dependencies**: Use `vi.mock()` or setup.ts mocks
6. **Run tests**: Verify with `npm test -- --run`

### Example: Adding a New Component Test

```typescript
// src/tests/components/NewComponent.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NewComponent } from "@/components/NewComponent";

describe("NewComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render", () => {
    render(<NewComponent />);
    expect(screen.getByTestId("new-component")).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Common Issues

1. **`scrollIntoView is not a function`**
   - jsdom doesn't implement `scrollIntoView`
   - Fixed in setup.ts with mock: `Element.prototype.scrollIntoView = vi.fn()`

2. **Multiple elements found**
   - Use `getAllByText()` instead of `getByText()` when expecting duplicates
   - Or use more specific queries: `getByRole()`, `getByTestId()`

3. **Timeout errors**
   - Increase `testTimeout` in config if needed
   - For timers, use `vi.useFakeTimers()` and `vi.advanceTimersByTime()`

4. **Console errors during error boundary tests**
   - Mock `console.error` to suppress expected errors:
     ```typescript
     const spy = vi.spyOn(console, "error").mockImplementation(() => {});
     // ... test ...
     spy.mockRestore();
     ```

## Dependencies

```json
{
  "@testing-library/react": "^16.3.0",
  "@testing-library/dom": "^10.4.0",
  "vitest": "^4.0.18",
  "jsdom": "^26.0.0"
}
```

## Migration Notes

Tests were reorganized from scattered locations:
- `src/components/Editor.test.tsx` → `src/tests/components/`
- `src/renderer/hooks/useFileSystem.test.ts` → `src/tests/hooks/`
- `src/services/file.test.ts` → `src/tests/services/`

This centralization improves:
- **Discoverability**: All tests in one location
- **Consistency**: Shared setup and patterns
- **Maintenance**: Easier to manage test infrastructure
