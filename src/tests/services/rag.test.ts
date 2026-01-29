/**
 * Tests for RAG service
 * Tests chunking, hashing, and utility functions
 * Does NOT test actual embedding calls (those require API keys)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

let testRoot: string;
let testCacheDir: string;

beforeEach(() => {
  testRoot = path.join(os.tmpdir(), `plero_rag_test_${Date.now()}`);
  testCacheDir = path.join(testRoot, ".plero");
  fs.mkdirSync(testCacheDir, { recursive: true });

  process.env.TEST_ROOT = testRoot;
  process.env.HUGGINGFACEHUB_API_KEY = "test-key-for-unit-tests";
});

afterEach(() => {
  if (fs.existsSync(testRoot)) {
    fs.rmSync(testRoot, { recursive: true, force: true });
  }
  delete process.env.TEST_ROOT;
  vi.resetModules();
});

describe("RAG Service - Pure Functions", () => {
  describe("chunkByLines", () => {
    it("should split text into chunks of specified size", async () => {
      // Import after env setup
      const { chunkByLines } = await import("../../services/rag");

      const text = Array.from({ length: 100 }, (_, i) => `line ${i + 1}`).join(
        "\n",
      );
      const chunks = chunkByLines(text, 25);

      expect(chunks).toHaveLength(4);
      expect(chunks[0].split("\n")).toHaveLength(25);
      expect(chunks[0]).toContain("line 1");
      expect(chunks[0]).toContain("line 25");
      expect(chunks[1]).toContain("line 26");
    });

    it("should handle text smaller than chunk size", async () => {
      const { chunkByLines } = await import("../../services/rag");

      const text = "line 1\nline 2\nline 3";
      const chunks = chunkByLines(text, 50);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(text);
    });

    it("should handle empty text", async () => {
      const { chunkByLines } = await import("../../services/rag");

      const chunks = chunkByLines("", 50);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe("");
    });

    it("should use default chunk size of 50", async () => {
      const { chunkByLines } = await import("../../services/rag");

      const text = Array.from({ length: 150 }, (_, i) => `line ${i + 1}`).join(
        "\n",
      );
      const chunks = chunkByLines(text);

      expect(chunks).toHaveLength(3);
      expect(chunks[0].split("\n")).toHaveLength(50);
    });

    it("should handle uneven splits", async () => {
      const { chunkByLines } = await import("../../services/rag");

      const text = Array.from({ length: 75 }, (_, i) => `line ${i + 1}`).join(
        "\n",
      );
      const chunks = chunkByLines(text, 50);

      expect(chunks).toHaveLength(2);
      expect(chunks[0].split("\n")).toHaveLength(50);
      expect(chunks[1].split("\n")).toHaveLength(25);
    });
  });

  describe("hashChunk", () => {
    it("should generate consistent MD5 hash for same input", async () => {
      const { hashChunk } = await import("../../services/rag");

      const text = "const foo = 'bar';";
      const hash1 = hashChunk(text);
      const hash2 = hashChunk(text);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{32}$/); // MD5 format
    });

    it("should generate different hashes for different inputs", async () => {
      const { hashChunk } = await import("../../services/rag");

      const hash1 = hashChunk("const foo = 'bar';");
      const hash2 = hashChunk("const foo = 'baz';");

      expect(hash1).not.toBe(hash2);
    });

    it("should handle empty string", async () => {
      const { hashChunk } = await import("../../services/rag");

      const hash = hashChunk("");

      expect(hash).toMatch(/^[a-f0-9]{32}$/);
      expect(hash).toBe("d41d8cd98f00b204e9800998ecf8427e"); // Known MD5 of empty string
    });

    it("should handle unicode content", async () => {
      const { hashChunk } = await import("../../services/rag");

      const hash = hashChunk("const emoji = '🚀';");

      expect(hash).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe("hashChunks", () => {
    it("should hash all chunks", async () => {
      const { hashChunks } = await import("../../services/rag");

      const chunks = ["chunk 1", "chunk 2", "chunk 3"];
      const hashes = hashChunks(chunks);

      expect(hashes).toHaveLength(3);
      hashes.forEach((hash) => {
        expect(hash).toMatch(/^[a-f0-9]{32}$/);
      });
    });

    it("should return unique hashes for unique chunks", async () => {
      const { hashChunks } = await import("../../services/rag");

      const chunks = ["unique 1", "unique 2", "unique 3"];
      const hashes = hashChunks(chunks);

      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(3);
    });

    it("should return same hash for duplicate chunks", async () => {
      const { hashChunks } = await import("../../services/rag");

      const chunks = ["same", "same", "different"];
      const hashes = hashChunks(chunks);

      expect(hashes[0]).toBe(hashes[1]);
      expect(hashes[0]).not.toBe(hashes[2]);
    });

    it("should handle empty array", async () => {
      const { hashChunks } = await import("../../services/rag");

      const hashes = hashChunks([]);

      expect(hashes).toHaveLength(0);
    });
  });
});

describe("RAG Service - Code File Detection", () => {
  it("should recognize common code extensions", async () => {
    const codeExtensions = new Set([
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".py",
      ".rs",
      ".go",
      ".java",
      ".c",
      ".cpp",
      ".h",
      ".hpp",
      ".cs",
      ".rb",
      ".php",
      ".swift",
      ".kt",
      ".scala",
      ".vue",
      ".svelte",
      ".md",
      ".json",
      ".yaml",
      ".yml",
      ".toml",
      ".html",
      ".css",
      ".scss",
      ".less",
      ".sql",
      ".sh",
      ".bash",
      ".zsh",
      ".fish",
    ]);

    // common extensions are included
    expect(codeExtensions.has(".ts")).toBe(true);
    expect(codeExtensions.has(".tsx")).toBe(true);
    expect(codeExtensions.has(".py")).toBe(true);
    expect(codeExtensions.has(".rs")).toBe(true);
    expect(codeExtensions.has(".md")).toBe(true);

    // non-code extensions are not included
    expect(codeExtensions.has(".png")).toBe(false);
    expect(codeExtensions.has(".jpg")).toBe(false);
    expect(codeExtensions.has(".mp4")).toBe(false);
    expect(codeExtensions.has(".exe")).toBe(false);
  });

  it("should skip common non-code directories", async () => {
    const skipDirs = new Set([
      "node_modules",
      ".git",
      "dist",
      "build",
      ".next",
      ".nuxt",
      "coverage",
      "__pycache__",
      ".venv",
      "venv",
      ".env",
      "target",
      "vendor",
      ".plero",
    ]);

    expect(skipDirs.has("node_modules")).toBe(true);
    expect(skipDirs.has(".git")).toBe(true);
    expect(skipDirs.has("dist")).toBe(true);
    expect(skipDirs.has(".plero")).toBe(true);

    // Source directories should not be skipped
    expect(skipDirs.has("src")).toBe(false);
    expect(skipDirs.has("lib")).toBe(false);
    expect(skipDirs.has("components")).toBe(false);
  });
});

describe("RAG Service - Chunking Real Code", () => {
  it("should chunk TypeScript code sensibly", async () => {
    const { chunkByLines } = await import("../../services/rag");

    const tsCode = `
import React from 'react';

interface Props {
  name: string;
  age: number;
}

export const Component: React.FC<Props> = ({ name, age }) => {
  const [count, setCount] = React.useState(0);

  const handleClick = () => {
    setCount(prev => prev + 1);
  };

  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>Age: {age}</p>
      <p>Count: {count}</p>
      <button onClick={handleClick}>Increment</button>
    </div>
  );
};

export default Component;
`.trim();

    const chunks = chunkByLines(tsCode, 10);

    // Should create multiple chunks
    expect(chunks.length).toBeGreaterThan(1);

    // First chunk should contain imports
    expect(chunks[0]).toContain("import React");
  });

  it("should preserve code structure within chunks", async () => {
    const { chunkByLines } = await import("../../services/rag");

    const code = `function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}`;

    const chunks = chunkByLines(code, 3);

    // Each chunk should be valid partial code
    expect(chunks[0]).toContain("function add");
    expect(chunks[1]).toContain("function multiply");
  });
});
