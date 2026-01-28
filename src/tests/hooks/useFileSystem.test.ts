/**
 * Unit tests for useFileSystem hook
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFileSystem } from "../../renderer/hooks/useFileSystem";
import { mockElectronAPI, mockApiResponse, mockApiFailure } from "../setup";
import type { TreeNode } from "../../components/FileExplorer";

describe("useFileSystem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should load file tree on mount", async () => {
      const mockTree: TreeNode[] = [
        { name: "file.ts", type: "file", path: "file.ts" },
        { name: "folder", type: "folder", path: "folder", children: [] },
      ];

      mockApiResponse("getTree", mockTree);

      const { result } = renderHook(() => useFileSystem());

      await waitFor(() => {
        expect(result.current.tree).toEqual(mockTree);
      });

      expect(mockElectronAPI.getTree).toHaveBeenCalledOnce();
    });

    it("should set error when tree loading fails", async () => {
      mockApiFailure("getTree", "Network error");

      const { result } = renderHook(() => useFileSystem());

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to load file tree.");
      });
    });

    it("should initialize with empty state", () => {
      const { result } = renderHook(() => useFileSystem());

      expect(result.current.activeFile).toBeNull();
      expect(result.current.fileContent).toBe("");
      expect(result.current.isEditorLoading).toBe(false);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.openTabs).toEqual([]);
    });
  });

  describe("selectFile", () => {
    it("should load file content when selecting a file", async () => {
      const file: TreeNode = { name: "test.ts", type: "file", path: "test.ts" };
      const content = "const x = 1;";

      mockApiResponse("getFileContent", content);

      const { result } = renderHook(() => useFileSystem());

      act(() => {
        result.current.selectFile(file);
      });

      await waitFor(() => {
        expect(result.current.activeFile).toEqual(file);
        expect(result.current.fileContent).toBe(content);
        expect(result.current.openTabs).toContainEqual(file);
      });
    });

    it("should not select folders", async () => {
      const folder: TreeNode = {
        name: "folder",
        type: "folder",
        path: "folder",
        children: [],
      };

      const { result } = renderHook(() => useFileSystem());

      act(() => {
        result.current.selectFile(folder);
      });

      expect(result.current.activeFile).toBeNull();
      expect(mockElectronAPI.getFileContent).not.toHaveBeenCalled();
    });

    it("should not duplicate tabs when selecting same file twice", async () => {
      const file: TreeNode = { name: "test.ts", type: "file", path: "test.ts" };
      mockApiResponse("getFileContent", "content");

      const { result } = renderHook(() => useFileSystem());

      act(() => {
        result.current.selectFile(file);
      });

      await waitFor(() => {
        expect(result.current.openTabs.length).toBe(1);
      });

      mockApiResponse("getFileContent", "content");

      act(() => {
        result.current.selectFile(file);
      });

      await waitFor(() => {
        expect(result.current.openTabs.length).toBe(1);
      });
    });

    it("should handle file content loading error", async () => {
      const file: TreeNode = { name: "test.ts", type: "file", path: "test.ts" };
      mockApiFailure("getFileContent", "File not found");

      const { result } = renderHook(() => useFileSystem());

      act(() => {
        result.current.selectFile(file);
      });

      await waitFor(() => {
        expect(result.current.error).toBe("File not found");
        expect(result.current.fileContent).toBe("");
      });
    });
  });

  describe("saveFile", () => {
    it("should save file successfully", async () => {
      mockApiResponse("saveFile", undefined);
      mockApiResponse("getTree", []);

      const { result } = renderHook(() => useFileSystem());

      let saveResult: boolean | undefined;
      await act(async () => {
        saveResult = await result.current.saveFile("test.ts", "new content");
      });

      expect(saveResult).toBe(true);
      expect(mockElectronAPI.saveFile).toHaveBeenCalledWith(
        "test.ts",
        "new content",
      );
    });

    it("should return false when save fails", async () => {
      mockApiFailure("saveFile", "Permission denied");

      const { result } = renderHook(() => useFileSystem());

      let saveResult: boolean | undefined;
      await act(async () => {
        saveResult = await result.current.saveFile("test.ts", "content");
      });

      expect(saveResult).toBe(false);
    });
  });

  describe("deleteFile", () => {
    it("should delete file and clear active if it was active", async () => {
      const file: TreeNode = { name: "test.ts", type: "file", path: "test.ts" };

      mockApiResponse("getFileContent", "content");
      mockApiResponse("delFile", undefined);
      mockApiResponse("getTree", []);

      const { result } = renderHook(() => useFileSystem());

      // First select the file
      act(() => {
        result.current.selectFile(file);
      });

      await waitFor(() => {
        expect(result.current.activeFile).toEqual(file);
      });

      // Then delete it
      let deleteResult: boolean | undefined;
      await act(async () => {
        deleteResult = await result.current.deleteFile(file.path, false);
      });

      expect(deleteResult).toBe(true);
      expect(result.current.activeFile).toBeNull();
    });

    it("should delete folder recursively", async () => {
      mockApiResponse("delFolder", undefined);
      mockApiResponse("getTree", []);

      const { result } = renderHook(() => useFileSystem());

      let deleteResult: boolean | undefined;
      await act(async () => {
        deleteResult = await result.current.deleteFile("folder", true);
      });

      expect(deleteResult).toBe(true);
      expect(mockElectronAPI.delFolder).toHaveBeenCalledWith("folder");
    });
  });

  describe("renameFile", () => {
    it("should rename file successfully", async () => {
      mockApiResponse("renamePath", undefined);
      mockApiResponse("getTree", []);

      const { result } = renderHook(() => useFileSystem());

      let renameResult: boolean | undefined;
      await act(async () => {
        renameResult = await result.current.renameFile("old.ts", "new.ts");
      });

      expect(renameResult).toBe(true);
      expect(mockElectronAPI.renamePath).toHaveBeenCalledWith(
        "old.ts",
        "new.ts",
      );
    });

    it("should update active file path when renaming active file", async () => {
      const file: TreeNode = { name: "old.ts", type: "file", path: "old.ts" };

      mockApiResponse("getFileContent", "content");

      const { result } = renderHook(() => useFileSystem());

      // Select file
      act(() => {
        result.current.selectFile(file);
      });

      await waitFor(() => {
        expect(result.current.activeFile?.path).toBe("old.ts");
      });

      mockApiResponse("renamePath", undefined);
      mockApiResponse("getTree", []);

      // Rename it
      await act(async () => {
        await result.current.renameFile("old.ts", "new.ts");
      });

      expect(result.current.activeFile?.path).toBe("new.ts");
      expect(result.current.activeFile?.name).toBe("new.ts");
    });
  });

  describe("createNewFile", () => {
    it("should create new file in folder", async () => {
      mockApiResponse("saveFile", undefined);
      mockApiResponse("getTree", []);

      const { result } = renderHook(() => useFileSystem());

      let createResult: boolean | undefined;
      await act(async () => {
        createResult = await result.current.createNewFile(
          "folder",
          "newfile.ts",
        );
      });

      expect(createResult).toBe(true);
      expect(mockElectronAPI.saveFile).toHaveBeenCalledWith(
        "folder/newfile.ts",
        "",
      );
    });

    it("should create new file in root when folder is empty", async () => {
      mockApiResponse("saveFile", undefined);
      mockApiResponse("getTree", []);

      const { result } = renderHook(() => useFileSystem());

      let createResult: boolean | undefined;
      await act(async () => {
        createResult = await result.current.createNewFile("", "newfile.ts");
      });

      expect(createResult).toBe(true);
      expect(mockElectronAPI.saveFile).toHaveBeenCalledWith("newfile.ts", "");
    });
  });

  describe("createNewFolder", () => {
    it("should create new folder", async () => {
      mockApiResponse("createFolder", undefined);
      mockApiResponse("getTree", []);

      const { result } = renderHook(() => useFileSystem());

      let createResult: boolean | undefined;
      await act(async () => {
        createResult = await result.current.createNewFolder(
          "parent",
          "newfolder",
        );
      });

      expect(createResult).toBe(true);
      expect(mockElectronAPI.createFolder).toHaveBeenCalledWith(
        "parent/newfolder",
      );
    });
  });

  describe("closeTab", () => {
    it("should close tab and switch to next available tab", async () => {
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

      mockApiResponse("getFileContent", "content1");
      mockApiResponse("getFileContent", "content2");

      const { result } = renderHook(() => useFileSystem());

      // Open two files
      act(() => {
        result.current.selectFile(file1);
      });

      await waitFor(() => {
        expect(result.current.openTabs.length).toBe(1);
      });

      mockApiResponse("getFileContent", "content2");

      act(() => {
        result.current.selectFile(file2);
      });

      await waitFor(() => {
        expect(result.current.openTabs.length).toBe(2);
        expect(result.current.activeFile).toEqual(file2);
      });

      // Close active tab
      await act(async () => {
        await result.current.closeTab("file2.ts");
      });

      // Should have switched to file1
      await waitFor(() => {
        expect(result.current.openTabs.length).toBe(1);
      });
    });
  });

  describe("newFile", () => {
    it("should create untitled file", () => {
      const { result } = renderHook(() => useFileSystem());

      act(() => {
        result.current.newFile();
      });

      expect(result.current.activeFile?.name).toBe("Untitled-1");
      expect(result.current.activeFile?.path).toBe("Untitled-1");
      expect(result.current.fileContent).toBe("");
      expect(result.current.isDirty).toBe(true);
    });

    it("should increment untitled counter", () => {
      const { result } = renderHook(() => useFileSystem());

      act(() => {
        result.current.newFile();
      });

      expect(result.current.activeFile?.name).toBe("Untitled-1");

      act(() => {
        result.current.newFile();
      });

      expect(result.current.activeFile?.name).toBe("Untitled-2");
    });
  });
});
