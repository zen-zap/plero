import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  initHNSW,
  addChunksToIndex,
  searchHNSW,
  fileNeedsReindex,
  saveHNSW,
  getHNSWStats,
} from "./db";

// Re-export HNSW functions for use in ai.ts
export { initHNSW, saveHNSW, getHNSWStats };

const HUGGINGFACEHUB_API_KEY = process.env.HUGGINGFACEHUB_API_KEY;

if (!HUGGINGFACEHUB_API_KEY) {
  throw new Error("HUGGINGFACEHUB_API_KEY not set");
}

// Local cache file path (legacy - keeping for backwards compatibility)
const CACHE_DIR = path.join(process.cwd(), ".plero");
const CACHE_FILE = path.join(CACHE_DIR, "embeddings_cache.json");
const HASH_CACHE_FILE = path.join(CACHE_DIR, "chunk_hashes.json");

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Legacy embedding cache (for backwards compatibility)
let embeddingCache: Record<string, number[][]> = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    embeddingCache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  } catch (error) {
    // console.error("Error reading cache file:", error);
  }
}

// Hash cache for per-chunk invalidation
let hashCache: Record<string, string[]> = {};
if (fs.existsSync(HASH_CACHE_FILE)) {
  try {
    hashCache = JSON.parse(fs.readFileSync(HASH_CACHE_FILE, "utf-8"));
  } catch (error) {
    // console.error("Error reading hash cache file:", error);
  }
}

function saveCache() {
  fs.writeFileSync(
    CACHE_FILE,
    JSON.stringify(embeddingCache, null, 2),
    "utf-8",
  );
}

function saveHashCache() {
  fs.writeFileSync(
    HASH_CACHE_FILE,
    JSON.stringify(hashCache, null, 2),
    "utf-8",
  );
}

/**
 * Splits a file into chunks of a specified size.
 * @param text The file content as a string.
 * @param chunkSize The maximum number of lines per chunk.
 * @returns An array of chunks.
 */
export function chunkByLines(text: string, chunkSize: number = 50): string[] {
  const lines = text.split("\n");
  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += chunkSize) {
    chunks.push(lines.slice(i, i + chunkSize).join("\n"));
  }

  return chunks;
}

const embedder = new HuggingFaceInferenceEmbeddings({
  model: "sentence-transformers/all-MiniLM-L6-v2",
  apiKey: HUGGINGFACEHUB_API_KEY,
});

/**
 * Generates embeddings for the given text using Hugging Face Hub.
 * @param text The input text to embed.
 * @returns A promise that resolves to the embedding vector.
 */
export async function embed(text: string): Promise<number[]> {
  return await embedder.embedQuery(text);
}

/**
 * Embeds all chunks of a file.
 * @param chunks An array of file chunks.
 * @returns A promise that resolves to an array of embeddings.
 */
export async function embedChunks(chunks: string[]): Promise<number[][]> {
  const embeddings = await embedder.embedDocuments(chunks);
  return embeddings;
}

/**
 * Caches embeddings for a file.
 * @param filePath The file path.
 * @param embeddings The embeddings to cache.
 */
export async function cacheEmbeddings(
  filePath: string,
  embeddings: number[][],
) {
  embeddingCache[filePath] = embeddings;
  saveCache(); // persist to disk
}

/**
 * Retrieves cached embeddings for a file.
 * @param filePath The file path.
 * @returns The cached embeddings or undefined if not cached.
 */
export async function getCachedEmbeddings(
  filePath: string,
): Promise<number[][] | undefined> {
  return embeddingCache[filePath];
}

/**
 * Generates a hash for a chunk of text. String hashing to check for changes in the content!
 * @param chunk The text chunk.
 * @returns The hash as a string.
 */
export function hashChunk(chunk: string): string {
  return crypto.createHash("md5").update(chunk).digest("hex");
}

/**
 * Hash all chunks of a file.
 * @param chunks Array of text chunks.
 * @returns Array of hash strings.
 */
export function hashChunks(chunks: string[]): string[] {
  return chunks.map(hashChunk);
}

export async function reEmbedChangedChunks(
  filePath: string,
  chunks: string[],
): Promise<number[][]> {
  const cachedEmbeddings = await getCachedEmbeddings(filePath);
  const cachedHashes = hashCache[filePath] || [];
  const newHashes = hashChunks(chunks);

  // If there are no cached embeddings yet, embed and cache all chunks
  if (!cachedEmbeddings || cachedEmbeddings.length === 0) {
    // console.log("[RAG] No cached embeddings found, embedding all chunks.");
    const embeddings = await embedChunks(chunks);
    await cacheEmbeddings(filePath, embeddings);
    hashCache[filePath] = newHashes;
    saveHashCache();
    return embeddings;
  }

  // If chunk count changed significantly, re-embed all
  if (Math.abs(cachedEmbeddings.length - chunks.length) > chunks.length * 0.3) {
    // console.log("[RAG] Chunk count changed significantly, re-embedding all.");
    const embeddings = await embedChunks(chunks);
    await cacheEmbeddings(filePath, embeddings);
    hashCache[filePath] = newHashes;
    saveHashCache();
    return embeddings;
  }

  // Find changed chunks by comparing hashes
  const changedIndices: number[] = [];
  for (let i = 0; i < chunks.length; i++) {
    if (i >= cachedHashes.length || cachedHashes[i] !== newHashes[i]) {
      changedIndices.push(i);
    }
  }

  if (changedIndices.length === 0) {
    // console.log("[RAG] No chunks changed, using cached embeddings.");
    return cachedEmbeddings.slice(0, chunks.length); // Handle length mismatch
  }

  // console.log(
  //   `[RAG] Re-embedding ${changedIndices.length}/${chunks.length} changed chunks.`,
  // );

  // Re-embed only changed chunks
  const changedChunks = changedIndices.map((i) => chunks[i]);
  const newEmbeddings = await embedChunks(changedChunks);

  // Build final embeddings array
  const finalEmbeddings: number[][] = [];
  let newEmbeddingIdx = 0;
  for (let i = 0; i < chunks.length; i++) {
    if (changedIndices.includes(i)) {
      finalEmbeddings.push(newEmbeddings[newEmbeddingIdx++]);
    } else if (i < cachedEmbeddings.length) {
      finalEmbeddings.push(cachedEmbeddings[i]);
    } else {
      // Shouldn't happen, but handle gracefully
      finalEmbeddings.push(
        newEmbeddings[newEmbeddingIdx++] || (await embed(chunks[i])),
      );
    }
  }

  // Update caches
  await cacheEmbeddings(filePath, finalEmbeddings);
  hashCache[filePath] = newHashes;
  saveHashCache();

  return finalEmbeddings;
}

/**
 * Index a single file into HNSW with hash-based cache invalidation.
 */
export async function indexFileToHNSW(
  filePath: string,
  content: string,
): Promise<void> {
  // console.log(`[RAG] Indexing file to HNSW: ${filePath}`);

  // Ensure HNSW is initialized
  await initHNSW();

  // Chunk the content
  const chunks = chunkByLines(content, 50);
  const hashes = hashChunks(chunks);

  // Check if file needs re-indexing
  if (!fileNeedsReindex(filePath, hashes)) {
    // console.log(`[RAG] File ${filePath} unchanged, skipping.`);
    return;
  }

  // Embed the chunks
  // console.log(`[RAG] Embedding ${chunks.length} chunks...`);
  const embeddings = await embedChunks(chunks);

  // Add to HNSW index
  await addChunksToIndex(filePath, chunks, hashes, embeddings);

  // Persist to disk
  saveHNSW();

  // console.log(`[RAG] Successfully indexed ${filePath}`);
}

/**
 * Search for relevant chunks using HNSW vector similarity.
 */
export async function searchRelevantChunks(
  query: string,
  k: number = 5,
  filterFilePath?: string,
): Promise<Array<{ text: string; filePath: string; score: number }>> {
  // console.log(
  //   `[RAG] Searching for relevant chunks, k=${k}, filter=${filterFilePath || "none"}`,
  // );

  // Embed the query
  const queryEmbedding = await embed(query);

  // Search HNSW
  const results = await searchHNSW(queryEmbedding, k, filterFilePath);

  // console.log(`[RAG] Found ${results.length} relevant chunks`);
  return results;
}

/**
 * Get HNSW index statistics.
 */
export function getIndexStats() {
  return getHNSWStats();
}

// Code file extensions to index
const CODE_EXTENSIONS = new Set([
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

// Directories to skip
const SKIP_DIRS = new Set([
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

/**
 * Recursively collect all code files from a directory tree.
 */
function collectCodeFiles(tree: any[], basePath: string = ""): string[] {
  const files: string[] = [];

  for (const node of tree) {
    const nodePath = basePath ? `${basePath}/${node.name}` : node.name;

    if (node.type === "folder") {
      if (!SKIP_DIRS.has(node.name)) {
        files.push(...collectCodeFiles(node.children || [], nodePath));
      }
    } else if (node.type === "file") {
      const ext = path.extname(node.name).toLowerCase();
      if (CODE_EXTENSIONS.has(ext)) {
        files.push(node.path || nodePath);
      }
    }
  }

  return files;
}

export interface IndexProgress {
  current: number;
  total: number;
  currentFile: string;
  status: "indexing" | "complete" | "error";
}

/**
 * Index the entire codebase into HNSW.
 * Takes a tree structure (from getTree()) and a function to get file content.
 */
export async function indexCodebase(
  tree: any[],
  getFileContent: (path: string) => string,
  onProgress?: (progress: IndexProgress) => void,
): Promise<{ indexed: number; skipped: number; errors: string[] }> {
  // console.log("[RAG] Starting codebase indexing...");

  // Initialize HNSW
  await initHNSW();

  // Collect all code files
  const files = collectCodeFiles(tree);
  // console.log(`[RAG] Found ${files.length} code files to index`);

  let indexed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: files.length,
        currentFile: filePath,
        status: "indexing",
      });
    }

    try {
      const content = getFileContent(filePath);

      // Skip very large files (>500KB) or empty files
      if (!content || content.length === 0) {
        // console.log(`[RAG] Skipping empty file: ${filePath}`);
        skipped++;
        continue;
      }
      if (content.length > 500000) {
        // console.log(
        //   `[RAG] Skipping large file (${content.length} bytes): ${filePath}`,
        // );
        skipped++;
        continue;
      }

      await indexFileToHNSW(filePath, content);
      indexed++;
    } catch (error) {
      const errorMsg = `Failed to index ${filePath}: ${error instanceof Error ? error.message : String(error)}`;
      // console.error(`[RAG] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  // Save final state
  saveHNSW();

  if (onProgress) {
    onProgress({
      current: files.length,
      total: files.length,
      currentFile: "",
      status: "complete",
    });
  }

  // console.log(
  //   `[RAG] Codebase indexing complete: ${indexed} indexed, ${skipped} skipped, ${errors.length} errors`,
  // );
  return { indexed, skipped, errors };
}

/**
 * Format search results as context for the AI.
 */
export function formatContextFromResults(
  results: Array<{ text: string; filePath: string; score: number }>,
): string {
  if (results.length === 0) {
    return "";
  }

  const sections = results.map((r, i) => {
    return `--- File: ${r.filePath} (relevance: ${(r.score * 100).toFixed(1)}%) ---\n${r.text}`;
  });

  return `Relevant code context:\n\n${sections.join("\n\n")}`;
}
