import dotenv from "dotenv";
import pathModule from "path";
import os from "os";
import HierarchicalNSW from "hnswlib-node";
import fs from "fs";
import path from "path";

// Load API keys from ~/.plero_keys/.env
dotenv.config({ path: pathModule.join(os.homedir(), ".plero_keys", ".env") });

// HNSW Configuration
const EMBEDDING_DIM = 384; // all-MiniLM-L6-v2 produces 384-dimensional embeddings
const MAX_ELEMENTS = 100000; // Maximum number of chunks we can store
const M = 16; // Number of bi-directional links created for each element
const EF_CONSTRUCTION = 200; // Size of the dynamic list for nearest neighbors (construction)
const EF_SEARCH = 100; // Size of the dynamic list for nearest neighbors (search)

const CACHE_DIR = path.join(process.cwd(), ".plero");
const HNSW_INDEX_PATH = path.join(CACHE_DIR, "hnsw_index.bin");
const HNSW_METADATA_PATH = path.join(CACHE_DIR, "hnsw_metadata.json");

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Metadata for chunks - maps index position to chunk info
interface ChunkMetadata {
  id: number;
  text: string;
  hash: string;
  filePath: string;
  chunkIndex: number;
}

interface HNSWMetadata {
  chunks: ChunkMetadata[];
  fileHashes: Record<string, string[]>; // filePath -> array of chunk hashes
  nextId: number;
}

let index: HierarchicalNSW.HierarchicalNSW | null = null;
let metadata: HNSWMetadata = {
  chunks: [],
  fileHashes: {},
  nextId: 0,
};

/**
 * Initialize the HNSW index. Loads from disk if exists, otherwise creates new.
 */
export async function initHNSW(): Promise<void> {
  // console.log("[HNSW] Initializing HNSW index...");

  index = new HierarchicalNSW.HierarchicalNSW("cosine", EMBEDDING_DIM);

  // Try to load existing index
  if (fs.existsSync(HNSW_INDEX_PATH) && fs.existsSync(HNSW_METADATA_PATH)) {
    try {
      // console.log("[HNSW] Loading existing index from disk...");
      index.readIndexSync(HNSW_INDEX_PATH);
      const metadataContent = fs.readFileSync(HNSW_METADATA_PATH, "utf-8");
      metadata = JSON.parse(metadataContent);
      // console.log(
      //   `[HNSW] Loaded index with ${metadata.chunks.length} chunks from ${Object.keys(metadata.fileHashes).length} files`,
      // );
    } catch (error) {
      // console.error(
      //   "[HNSW] Failed to load existing index, creating new:",
      //   error,
      // );
      createNewIndex();
    }
  } else {
    // console.log("[HNSW] No existing index found, creating new...");
    createNewIndex();
  }
}

function createNewIndex(): void {
  if (!index) return;
  index.initIndex(MAX_ELEMENTS, M, EF_CONSTRUCTION);
  metadata = {
    chunks: [],
    fileHashes: {},
    nextId: 0,
  };
  // console.log("[HNSW] Created new index");
}

/**
 * Save the HNSW index and metadata to disk.
 */
export function saveHNSW(): void {
  if (!index) {
    // console.warn("[HNSW] Cannot save - index not initialized");
    return;
  }

  try {
    index.writeIndexSync(HNSW_INDEX_PATH);
    fs.writeFileSync(
      HNSW_METADATA_PATH,
      JSON.stringify(metadata, null, 2),
      "utf-8",
    );
    // console.log("[HNSW] Saved index and metadata to disk");
  } catch (error) {
    // console.error("[HNSW] Failed to save index:", error);
  }
}

/**
 * Add chunks from a file to the HNSW index.
 * Uses hash comparison to only embed changed chunks.
 */
export async function addChunksToIndex(
  filePath: string,
  chunks: string[],
  chunkHashes: string[],
  embeddings: number[][],
): Promise<void> {
  if (!index) {
    await initHNSW();
  }
  if (!index) throw new Error("Failed to initialize HNSW index");

  // console.log(`[HNSW] Adding ${chunks.length} chunks from ${filePath}`);

  // Remove old chunks from this file if they exist
  const existingChunks = metadata.chunks.filter((c) => c.filePath === filePath);
  if (existingChunks.length > 0) {
    // Mark old positions for re-use (HNSW doesn't support true deletion, but we track metadata)
    // console.log(
    //   `[HNSW] Replacing ${existingChunks.length} existing chunks from ${filePath}`,
    // );
    metadata.chunks = metadata.chunks.filter((c) => c.filePath !== filePath);
  }

  // Add new chunks
  for (let i = 0; i < chunks.length; i++) {
    const id = metadata.nextId++;
    index.addPoint(embeddings[i], id);

    metadata.chunks.push({
      id,
      text: chunks[i],
      hash: chunkHashes[i],
      filePath,
      chunkIndex: i,
    });
  }

  // Update file hashes
  metadata.fileHashes[filePath] = chunkHashes;

  // console.log(
  //   `[HNSW] Index now contains ${metadata.chunks.length} total chunks`,
  // );
}

/**
 * Search for similar chunks using HNSW.
 */
export async function searchHNSW(
  queryEmbedding: number[],
  k: number = 5,
  filterFilePath?: string,
): Promise<Array<{ text: string; filePath: string; score: number }>> {
  if (!index || metadata.chunks.length === 0) {
    // console.log("[HNSW] Index empty or not initialized");
    return [];
  }

  index.setEf(EF_SEARCH);

  // Search for more results if filtering, to ensure we get enough after filter
  const searchK = filterFilePath ? Math.min(k * 3, metadata.chunks.length) : k;
  const result = index.searchKnn(queryEmbedding, searchK);

  const results: Array<{ text: string; filePath: string; score: number }> = [];

  for (let i = 0; i < result.neighbors.length && results.length < k; i++) {
    const id = result.neighbors[i];
    const distance = result.distances[i];
    const chunkMeta = metadata.chunks.find((c) => c.id === id);

    if (chunkMeta) {
      // Apply filter if specified
      if (filterFilePath && chunkMeta.filePath !== filterFilePath) {
        continue;
      }

      // Convert cosine distance to similarity score (1 - distance for cosine)
      const score = 1 - distance;
      results.push({
        text: chunkMeta.text,
        filePath: chunkMeta.filePath,
        score,
      });
    }
  }

  return results;
}

/**
 * Check if a file needs re-indexing based on chunk hashes.
 */
export function fileNeedsReindex(
  filePath: string,
  newHashes: string[],
): boolean {
  const existingHashes = metadata.fileHashes[filePath];

  if (!existingHashes) {
    return true; // Never indexed
  }

  if (existingHashes.length !== newHashes.length) {
    return true; // Chunk count changed
  }

  // Compare each hash
  for (let i = 0; i < newHashes.length; i++) {
    if (existingHashes[i] !== newHashes[i]) {
      return true; // Content changed
    }
  }

  return false; // No changes
}

/**
 * Get changed chunk indices for partial re-embedding.
 */
export function getChangedChunkIndices(
  filePath: string,
  newHashes: string[],
): number[] {
  const existingHashes = metadata.fileHashes[filePath];

  if (!existingHashes) {
    return newHashes.map((_, i) => i); // All chunks are new
  }

  const changed: number[] = [];

  for (let i = 0; i < newHashes.length; i++) {
    if (i >= existingHashes.length || existingHashes[i] !== newHashes[i]) {
      changed.push(i);
    }
  }

  return changed;
}

/**
 * Get statistics about the current index.
 */
export function getHNSWStats(): {
  totalChunks: number;
  totalFiles: number;
  initialized: boolean;
} {
  return {
    totalChunks: metadata.chunks.length,
    totalFiles: Object.keys(metadata.fileHashes).length,
    initialized: index !== null,
  };
}

/**
 * Clear the entire index.
 */
export function clearHNSW(): void {
  if (index) {
    createNewIndex();
    saveHNSW();
    // console.log("[HNSW] Index cleared");
  }
}
