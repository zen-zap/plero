/**
 * Tests for HNSW database service
 * Tests the vector store without actual embeddings
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

let testRoot: string;
let testCacheDir: string;

beforeEach(() => {
  testRoot = path.join(os.tmpdir(), `plero_db_test_${Date.now()}`);
  testCacheDir = path.join(testRoot, ".plero");
  fs.mkdirSync(testCacheDir, { recursive: true });

  process.env.TEST_ROOT = testRoot;

  vi.spyOn(process, "cwd").mockReturnValue(testRoot);
});

afterEach(() => {
  if (fs.existsSync(testRoot)) {
    fs.rmSync(testRoot, { recursive: true, force: true });
  }
  delete process.env.TEST_ROOT;
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("HNSW Database Service", () => {
  describe("fileNeedsReindex", () => {
    it("should return true for never-indexed file", async () => {
      const { fileNeedsReindex, initHNSW } = await import("../../services/db");

      await initHNSW();

      const needsReindex = fileNeedsReindex("new-file.ts", ["hash1", "hash2"]);

      expect(needsReindex).toBe(true);
    });
  });

  describe("getHNSWStats", () => {
    it("should return stats after initialization", async () => {
      const { initHNSW, getHNSWStats } = await import("../../services/db");

      await initHNSW();
      const stats = getHNSWStats();

      expect(stats).toHaveProperty("totalChunks");
      expect(stats).toHaveProperty("totalFiles");
      expect(stats).toHaveProperty("initialized");
      expect(stats.initialized).toBe(true);
    });

    it("should show 0 chunks for fresh index", async () => {
      const { initHNSW, getHNSWStats, clearHNSW } =
        await import("../../services/db");

      await initHNSW();
      clearHNSW();
      const stats = getHNSWStats();

      expect(stats.totalChunks).toBe(0);
      expect(stats.totalFiles).toBe(0);
    });
  });

  describe("addChunksToIndex", () => {
    it("should add chunks and update stats", async () => {
      const { initHNSW, addChunksToIndex, getHNSWStats, clearHNSW } =
        await import("../../services/db");

      await initHNSW();
      clearHNSW();

      const chunks = ["chunk 1 content", "chunk 2 content"];
      const hashes = ["hash1", "hash2"];
      const embeddings = [
        Array(384)
          .fill(0)
          .map(() => Math.random()),
        Array(384)
          .fill(0)
          .map(() => Math.random()),
      ];

      await addChunksToIndex("test.ts", chunks, hashes, embeddings);

      const stats = getHNSWStats();
      expect(stats.totalChunks).toBe(2);
      expect(stats.totalFiles).toBe(1);
    });

    it("should replace chunks when re-indexing same file", async () => {
      const { initHNSW, addChunksToIndex, getHNSWStats, clearHNSW } =
        await import("../../services/db");

      await initHNSW();
      clearHNSW();

      const chunks1 = ["chunk 1"];
      const hashes1 = ["hash1"];
      const embeddings1 = [
        Array(384)
          .fill(0)
          .map(() => Math.random()),
      ];
      await addChunksToIndex("test.ts", chunks1, hashes1, embeddings1);

      const chunks2 = ["new chunk 1", "new chunk 2", "new chunk 3"];
      const hashes2 = ["hashA", "hashB", "hashC"];
      const embeddings2 = [
        Array(384)
          .fill(0)
          .map(() => Math.random()),
        Array(384)
          .fill(0)
          .map(() => Math.random()),
        Array(384)
          .fill(0)
          .map(() => Math.random()),
      ];
      await addChunksToIndex("test.ts", chunks2, hashes2, embeddings2);

      const stats = getHNSWStats();
      // Should have 3 chunks (old ones replaced)
      expect(stats.totalChunks).toBe(3);
      expect(stats.totalFiles).toBe(1);
    });
  });

  describe("searchHNSW", () => {
    it("should return empty array for empty index", async () => {
      const { initHNSW, searchHNSW, clearHNSW } =
        await import("../../services/db");

      await initHNSW();
      clearHNSW();

      const queryEmbedding = Array(384)
        .fill(0)
        .map(() => Math.random());
      const results = await searchHNSW(queryEmbedding, 5);

      expect(results).toHaveLength(0);
    });

    it("should return results when index has data", async () => {
      const { initHNSW, addChunksToIndex, searchHNSW, clearHNSW } =
        await import("../../services/db");

      await initHNSW();
      clearHNSW();

      const chunks = ["function hello() {}", "function world() {}"];
      const hashes = ["h1", "h2"];
      const embeddings = [Array(384).fill(0.1), Array(384).fill(0.9)];
      await addChunksToIndex("test.ts", chunks, hashes, embeddings);

      // Search with query similar to first chunk
      const queryEmbedding = Array(384).fill(0.15);
      const results = await searchHNSW(queryEmbedding, 2);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty("text");
      expect(results[0]).toHaveProperty("filePath");
      expect(results[0]).toHaveProperty("score");
    });

    it("should filter by filePath when specified", async () => {
      const { initHNSW, addChunksToIndex, searchHNSW, clearHNSW } =
        await import("../../services/db");

      await initHNSW();
      clearHNSW();

      // Add chunks from two files
      await addChunksToIndex(
        "file1.ts",
        ["chunk from file1"],
        ["h1"],
        [Array(384).fill(0.5)],
      );
      await addChunksToIndex(
        "file2.ts",
        ["chunk from file2"],
        ["h2"],
        [Array(384).fill(0.5)],
      );

      // Search with filter
      const queryEmbedding = Array(384).fill(0.5);
      const results = await searchHNSW(queryEmbedding, 5, "file1.ts");

      // Should only return results from file1.ts
      expect(results.every((r) => r.filePath === "file1.ts")).toBe(true);
    });
  });

  describe("saveHNSW and persistence", () => {
    it("should save index to disk", async () => {
      const { initHNSW, addChunksToIndex, saveHNSW, clearHNSW } =
        await import("../../services/db");

      await initHNSW();
      clearHNSW();

      await addChunksToIndex(
        "test.ts",
        ["test chunk"],
        ["testhash"],
        [Array(384).fill(0.5)],
      );

      saveHNSW();

      // Check files exist
      const indexPath = path.join(testCacheDir, "hnsw_index.bin");
      const metadataPath = path.join(testCacheDir, "hnsw_metadata.json");

      expect(fs.existsSync(indexPath)).toBe(true);
      expect(fs.existsSync(metadataPath)).toBe(true);
    });

    it("should load index from disk on init", async () => {
      // First, create and save an index
      const mod1 = await import("../../services/db");
      await mod1.initHNSW();
      mod1.clearHNSW();

      await mod1.addChunksToIndex(
        "persisted.ts",
        ["persisted chunk"],
        ["phash"],
        [Array(384).fill(0.5)],
      );
      mod1.saveHNSW();

      const stats1 = mod1.getHNSWStats();
      expect(stats1.totalChunks).toBe(1);

      // Reset module and re-import
      vi.resetModules();
      vi.spyOn(process, "cwd").mockReturnValue(testRoot);

      // Re-import and init - should load from disk
      const mod2 = await import("../../services/db");
      await mod2.initHNSW();

      const stats2 = mod2.getHNSWStats();
      expect(stats2.totalChunks).toBe(1);
      expect(stats2.totalFiles).toBe(1);
    });
  });
});
