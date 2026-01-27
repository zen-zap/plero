/**
 * Unit tests for file service
 * These tests run without Electron using a temp directory
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { TreeNode, FolderNode } from "../../services/file";

// We need to mock the module before importing
let testRoot: string;

// Set up test root before importing the module
beforeEach(() => {
  testRoot = path.join(os.tmpdir(), `plero_file_test_${Date.now()}`);
  fs.mkdirSync(testRoot, { recursive: true });
  process.env.TEST_ROOT = testRoot;
});

afterEach(() => {
  // Clean up test directory
  if (fs.existsSync(testRoot)) {
    fs.rmSync(testRoot, { recursive: true, force: true });
  }
  delete process.env.TEST_ROOT;
  // Clear module cache to reset ROOT
  vi.resetModules();
});

describe("file service", () => {
  describe("getTree", () => {
    it("should return empty array for empty directory", async () => {
      const { getTree } = await import("../../services/file");
      const tree = getTree(testRoot);
      expect(tree).toEqual([]);
    });

    it("should return file nodes for files", async () => {
      fs.writeFileSync(path.join(testRoot, "test.txt"), "content");

      const { getTree } = await import("../../services/file");
      const tree = getTree(testRoot);

      expect(tree).toHaveLength(1);
      expect(tree[0]).toMatchObject({
        name: "test.txt",
        type: "file",
        path: "test.txt",
      });
    });

    it("should return folder nodes with children", async () => {
      fs.mkdirSync(path.join(testRoot, "folder"));
      fs.writeFileSync(path.join(testRoot, "folder", "file.txt"), "content");

      const { getTree } = await import("../../services/file");
      const tree = getTree(testRoot);

      expect(tree).toHaveLength(1);
      expect(tree[0]).toMatchObject({
        name: "folder",
        type: "folder",
        path: "folder",
      });
      const folderNode = tree[0] as FolderNode;
      expect(folderNode.children).toHaveLength(1);
      expect(folderNode.children[0]).toMatchObject({
        name: "file.txt",
        type: "file",
      });
    });

    it("should sort entries alphabetically", async () => {
      fs.writeFileSync(path.join(testRoot, "c.txt"), "");
      fs.writeFileSync(path.join(testRoot, "a.txt"), "");
      fs.writeFileSync(path.join(testRoot, "b.txt"), "");

      const { getTree } = await import("../../services/file");
      const tree = getTree(testRoot);

      expect(tree.map((n) => n.name)).toEqual(["a.txt", "b.txt", "c.txt"]);
    });
  });

  describe("getFileContent", () => {
    it("should read file content", async () => {
      const content = "Hello, World!";
      fs.writeFileSync(path.join(testRoot, "test.txt"), content);

      const { getFileContent } = await import("../../services/file");
      const result = getFileContent("test.txt");

      expect(result).toBe(content);
    });

    it("should throw error for non-existent file", async () => {
      const { getFileContent } = await import("../../services/file");

      expect(() => getFileContent("nonexistent.txt")).toThrow("File not found");
    });

    it("should throw error when reading directory", async () => {
      fs.mkdirSync(path.join(testRoot, "folder"));

      const { getFileContent } = await import("../../services/file");

      expect(() => getFileContent("folder")).toThrow("File not found");
    });
  });

  describe("saveFile", () => {
    it("should write content to file", async () => {
      const content = "New content";

      const { saveFile } = await import("../../services/file");
      saveFile("newfile.txt", content);

      const result = fs.readFileSync(
        path.join(testRoot, "newfile.txt"),
        "utf8",
      );
      expect(result).toBe(content);
    });

    it("should overwrite existing file", async () => {
      fs.writeFileSync(path.join(testRoot, "existing.txt"), "old content");

      const { saveFile } = await import("../../services/file");
      saveFile("existing.txt", "new content");

      const result = fs.readFileSync(
        path.join(testRoot, "existing.txt"),
        "utf8",
      );
      expect(result).toBe("new content");
    });
  });

  describe("delFile", () => {
    it("should delete file", async () => {
      fs.writeFileSync(path.join(testRoot, "todelete.txt"), "content");

      const { delFile } = await import("../../services/file");
      delFile("todelete.txt");

      expect(fs.existsSync(path.join(testRoot, "todelete.txt"))).toBe(false);
    });

    it("should throw error for non-existent file", async () => {
      const { delFile } = await import("../../services/file");

      expect(() => delFile("nonexistent.txt")).toThrow("File not found");
    });
  });

  describe("createFolder", () => {
    it("should create folder", async () => {
      const { createFolder } = await import("../../services/file");
      createFolder("newfolder");

      expect(fs.existsSync(path.join(testRoot, "newfolder"))).toBe(true);
      expect(fs.statSync(path.join(testRoot, "newfolder")).isDirectory()).toBe(
        true,
      );
    });

    it("should create nested folders", async () => {
      const { createFolder } = await import("../../services/file");
      createFolder("parent/child/grandchild");

      expect(
        fs.existsSync(path.join(testRoot, "parent/child/grandchild")),
      ).toBe(true);
    });

    it("should throw error if folder already exists", async () => {
      fs.mkdirSync(path.join(testRoot, "existing"));

      const { createFolder } = await import("../../services/file");

      expect(() => createFolder("existing")).toThrow("Folder already exists");
    });
  });

  describe("renamePath", () => {
    it("should rename file", async () => {
      fs.writeFileSync(path.join(testRoot, "old.txt"), "content");

      const { renamePath } = await import("../../services/file");
      renamePath("old.txt", "new.txt");

      expect(fs.existsSync(path.join(testRoot, "old.txt"))).toBe(false);
      expect(fs.existsSync(path.join(testRoot, "new.txt"))).toBe(true);
    });

    it("should rename folder", async () => {
      fs.mkdirSync(path.join(testRoot, "oldfolder"));

      const { renamePath } = await import("../../services/file");
      renamePath("oldfolder", "newfolder");

      expect(fs.existsSync(path.join(testRoot, "oldfolder"))).toBe(false);
      expect(fs.existsSync(path.join(testRoot, "newfolder"))).toBe(true);
    });

    it("should throw error if source doesn't exist", async () => {
      const { renamePath } = await import("../../services/file");

      expect(() => renamePath("nonexistent", "new")).toThrow(
        "Source does not exist",
      );
    });

    it("should throw error if destination exists", async () => {
      fs.writeFileSync(path.join(testRoot, "source.txt"), "");
      fs.writeFileSync(path.join(testRoot, "dest.txt"), "");

      const { renamePath } = await import("../../services/file");

      expect(() => renamePath("source.txt", "dest.txt")).toThrow(
        "Destination already exists",
      );
    });
  });

  describe("delFolder", () => {
    it("should delete empty folder", async () => {
      fs.mkdirSync(path.join(testRoot, "emptyfolder"));

      const { delFolder } = await import("../../services/file");
      delFolder("emptyfolder");

      expect(fs.existsSync(path.join(testRoot, "emptyfolder"))).toBe(false);
    });

    it("should delete folder with contents recursively", async () => {
      fs.mkdirSync(path.join(testRoot, "parent/child"), { recursive: true });
      fs.writeFileSync(path.join(testRoot, "parent/file.txt"), "");
      fs.writeFileSync(path.join(testRoot, "parent/child/nested.txt"), "");

      const { delFolder } = await import("../../services/file");
      delFolder("parent");

      expect(fs.existsSync(path.join(testRoot, "parent"))).toBe(false);
    });

    it("should throw error for non-existent folder", async () => {
      const { delFolder } = await import("../../services/file");

      expect(() => delFolder("nonexistent")).toThrow("Folder not found");
    });
  });

  describe("stat", () => {
    it("should return file stats", async () => {
      fs.writeFileSync(path.join(testRoot, "statfile.txt"), "12345");

      const { stat } = await import("../../services/file");
      const result = stat("statfile.txt");

      expect(result.size).toBe(5);
      expect(result.isFile).toBe(true);
      expect(result.isDirectory).toBe(false);
    });

    it("should return directory stats", async () => {
      fs.mkdirSync(path.join(testRoot, "statfolder"));

      const { stat } = await import("../../services/file");
      const result = stat("statfolder");

      expect(result.isFile).toBe(false);
      expect(result.isDirectory).toBe(true);
    });
  });

  describe("exists", () => {
    it("should return true for existing file", async () => {
      fs.writeFileSync(path.join(testRoot, "exists.txt"), "");

      const { exists } = await import("../../services/file");

      expect(exists("exists.txt")).toBe(true);
    });

    it("should return false for non-existent file", async () => {
      const { exists } = await import("../../services/file");

      expect(exists("nonexistent.txt")).toBe(false);
    });
  });

  describe("insertAtCursor", () => {
    it("should insert text before cursor marker", async () => {
      const marker = "[[CURSOR]]";
      fs.writeFileSync(
        path.join(testRoot, "insert.txt"),
        `before ${marker} after`,
      );

      const { insertAtCursor } = await import("../../services/file");
      insertAtCursor("insert.txt", "INSERTED");

      const result = fs.readFileSync(path.join(testRoot, "insert.txt"), "utf8");
      expect(result).toBe(`before INSERTED${marker} after`);
    });

    it("should throw error if marker not found", async () => {
      fs.writeFileSync(path.join(testRoot, "nomarker.txt"), "no marker here");

      const { insertAtCursor } = await import("../../services/file");

      expect(() => insertAtCursor("nomarker.txt", "text")).toThrow(
        'Marker "[[CURSOR]]" not found',
      );
    });

    it("should support custom marker", async () => {
      fs.writeFileSync(
        path.join(testRoot, "custom.txt"),
        "start {INSERT_HERE} end",
      );

      const { insertAtCursor } = await import("../../services/file");
      insertAtCursor("custom.txt", "CODE", "{INSERT_HERE}");

      const result = fs.readFileSync(path.join(testRoot, "custom.txt"), "utf8");
      expect(result).toBe("start CODE{INSERT_HERE} end");
    });
  });

  describe("security - path traversal prevention", () => {
    it("should prevent path traversal with ..", async () => {
      const { getFileContent } = await import("../../services/file");

      expect(() => getFileContent("../../../etc/passwd")).toThrow(
        "Invalid path",
      );
    });

    it("should prevent absolute paths", async () => {
      const { saveFile } = await import("../../services/file");

      expect(() => saveFile("/etc/passwd", "malicious")).toThrow(
        "Invalid path",
      );
    });
  });
});
