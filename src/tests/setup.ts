/**
 * Vitest test setup file
 * This runs before each test file
 */

import { vi, beforeAll, afterAll, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// Mock window.electronAPI for renderer tests
const mockElectronAPI = {
  // File operations
  getTree: vi.fn().mockResolvedValue({ ok: true, data: [] }),
  getFileContent: vi.fn().mockResolvedValue({ ok: true, data: "" }),
  saveFile: vi.fn().mockResolvedValue({ ok: true }),
  delFile: vi.fn().mockResolvedValue({ ok: true }),
  createFolder: vi.fn().mockResolvedValue({ ok: true }),
  renamePath: vi.fn().mockResolvedValue({ ok: true }),
  delFolder: vi.fn().mockResolvedValue({ ok: true }),
  stat: vi.fn().mockResolvedValue({ ok: true, data: {} }),
  exists: vi.fn().mockResolvedValue({ ok: true, data: { exists: true } }),
  insertAtCursor: vi.fn().mockResolvedValue({ ok: true }),
  openDialog: vi.fn().mockResolvedValue({ ok: true, data: "/test/file.txt" }),

  // AI operations
  aiComplete: vi
    .fn()
    .mockResolvedValue({ ok: true, data: { content: "mock completion" } }),
  aiChat: vi.fn().mockResolvedValue({ ok: true, data: "mock chat response" }),
  aiClassify: vi.fn().mockResolvedValue({ ok: true, data: 2 }),
  aiCompletionRag: vi
    .fn()
    .mockResolvedValue({ ok: true, data: "mock rag completion" }),

  // Tavily operations
  tavilySearch: vi.fn().mockResolvedValue({ ok: true, data: { results: [] } }),
};

// Setup before all tests
beforeAll(() => {
  // Mock window.electronAPI
  Object.defineProperty(window, "electronAPI", {
    value: mockElectronAPI,
    writable: true,
    configurable: true,
  });

  // Mock window.confirm
  vi.spyOn(window, "confirm").mockImplementation(() => true);

  // Mock window.alert
  vi.spyOn(window, "alert").mockImplementation(() => {});

  // Mock console methods to reduce noise in tests (optional)
  // vi.spyOn(console, 'log').mockImplementation(() => {});
  // vi.spyOn(console, 'warn').mockImplementation(() => {});
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Cleanup after all tests
afterAll(() => {
  vi.restoreAllMocks();
});

// Export mock for use in tests
export { mockElectronAPI };

// Helper to reset specific mocks
export function resetMock(method: keyof typeof mockElectronAPI) {
  mockElectronAPI[method].mockClear();
}

// Helper to mock API failure
export function mockApiFailure(
  method: keyof typeof mockElectronAPI,
  error: string = "Mock error",
) {
  mockElectronAPI[method].mockResolvedValueOnce({ ok: false, error });
}

// Helper to mock specific API response
export function mockApiResponse<T>(
  method: keyof typeof mockElectronAPI,
  data: T,
) {
  mockElectronAPI[method].mockResolvedValueOnce({ ok: true, data });
}
