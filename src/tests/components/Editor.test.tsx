/**
 * Unit tests for Editor component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Editor } from "../../components/Editor";
import { ActionsProvider } from "../../renderer/contexts/ActionsContext";
import type { TreeNode } from "../../components/FileExplorer";

// Helper to render Editor with ActionsProvider
const renderEditor = (props: Partial<Parameters<typeof Editor>[0]> = {}) => {
  const defaultProps = {
    activeFile: null,
    content: "",
    isLoading: false,
    isDirty: false,
    setIsDirty: vi.fn(),
    onSave: vi.fn(),
    onNew: vi.fn(),
    onOpen: vi.fn(),
    onOpenFolder: vi.fn(),
    openTabs: [],
    onSelectTab: vi.fn(),
    onCloseTab: vi.fn(),
  };

  return render(
    <ActionsProvider>
      <Editor {...defaultProps} {...props} />
    </ActionsProvider>,
  );
};

describe("Editor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when no file is active", () => {
    it("should show welcome message", () => {
      renderEditor({ activeFile: null });

      expect(screen.getByText("Welcome to Plero")).toBeInTheDocument();
      expect(screen.getByText(/A modern code editor/i)).toBeInTheDocument();
    });
  });

  describe("when loading", () => {
    it("should show loading indicator", () => {
      const file: TreeNode = { name: "test.ts", type: "file", path: "test.ts" };

      renderEditor({ activeFile: file, isLoading: true });

      expect(screen.getByText("Loading file...")).toBeInTheDocument();
    });
  });

  describe("when file is active", () => {
    it("should display the file in a tab", () => {
      const file: TreeNode = { name: "test.ts", type: "file", path: "test.ts" };

      renderEditor({
        activeFile: file,
        content: "const x = 1;",
        openTabs: [file],
      });

      // The filename appears in tab and breadcrumb, so use getAllByText
      const elements = screen.getAllByText("test.ts");
      expect(elements.length).toBeGreaterThan(0);
    });

    it("should display multiple tabs", () => {
      const file1: TreeNode = {
        name: "file1.ts",
        type: "file",
        path: "file1.ts",
      };
      const file2: TreeNode = {
        name: "file2.ts",
        type: "file",
        path: "file2.ts",
      };

      renderEditor({
        activeFile: file1,
        content: "",
        openTabs: [file1, file2],
      });

      // Files appear in tabs and potentially breadcrumb
      const file1Elements = screen.getAllByText("file1.ts");
      const file2Elements = screen.getAllByText("file2.ts");
      expect(file1Elements.length).toBeGreaterThan(0);
      expect(file2Elements.length).toBeGreaterThan(0);
    });

    it("should call onSelectTab when clicking a tab", () => {
      const file1: TreeNode = {
        name: "file1.ts",
        type: "file",
        path: "file1.ts",
      };
      const file2: TreeNode = {
        name: "file2.ts",
        type: "file",
        path: "file2.ts",
      };
      const onSelectTab = vi.fn();

      renderEditor({
        activeFile: file1,
        content: "",
        openTabs: [file1, file2],
        onSelectTab,
      });

      // Find the second file tab and click it
      const file2Elements = screen.getAllByText("file2.ts");
      // Click the first occurrence (should be the tab)
      fireEvent.click(file2Elements[0]);

      expect(onSelectTab).toHaveBeenCalledWith(file2);
    });
  });

  describe("keyboard shortcuts", () => {
    it("should call onSave when pressing Ctrl+S", () => {
      const file: TreeNode = { name: "test.ts", type: "file", path: "test.ts" };
      const onSave = vi.fn();
      const setIsDirty = vi.fn();

      renderEditor({
        activeFile: file,
        content: "const x = 1;",
        isDirty: true,
        onSave,
        setIsDirty,
      });

      // Simulate Ctrl+S
      fireEvent.keyDown(window, { key: "s", ctrlKey: true });

      expect(onSave).toHaveBeenCalledWith("test.ts", "const x = 1;");
      expect(setIsDirty).toHaveBeenCalledWith(false);
    });

    it("should not call onSave when file is not dirty", () => {
      const file: TreeNode = { name: "test.ts", type: "file", path: "test.ts" };
      const onSave = vi.fn();

      renderEditor({
        activeFile: file,
        content: "const x = 1;",
        isDirty: false,
        onSave,
      });

      fireEvent.keyDown(window, { key: "s", ctrlKey: true });

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("tabs display", () => {
    it("should show 'No open tabs' when no tabs are open", () => {
      const file: TreeNode = { name: "test.ts", type: "file", path: "test.ts" };

      renderEditor({
        activeFile: file,
        content: "",
        openTabs: [],
      });

      expect(screen.getByText("No open tabs")).toBeInTheDocument();
    });
  });
});
