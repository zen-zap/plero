import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const HUGGINGFACEHUB_API_KEY = process.env.HUGGINGFACEHUB_API_KEY;

if(!HUGGINGFACEHUB_API_KEY) {
    throw new Error("HUGGINGFACEHUB_API_KEY not set");
}

// Local cache file path
const CACHE_DIR = path.join(process.cwd(), ".plero");
const CACHE_FILE = path.join(CACHE_DIR, "embeddings_cache.json");

if(!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

let embeddingCache: Record<string, number[][]> = {};
if(fs.existsSync(CACHE_FILE)) {
    try {
        embeddingCache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    } catch (error) {
        console.error("Error reading cache file:", error);
    }
}

function saveCache() {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(embeddingCache, null, 2), "utf-8");
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
    for(let i=0; i<lines.length; i += chunkSize) {
        chunks.push(lines.slice(i, i+chunkSize).join("\n"));
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
export async function embedChunks(chunks: string[]) : Promise<number[][]> {
    const embeddings = await embedder.embedDocuments(chunks);
    return embeddings;
}

/**
 * Caches embeddings for a file.
 * @param filePath The file path.
 * @param embeddings The embeddings to cache.
 */
export async function cacheEmbeddings(filePath: string, embeddings: number[][]) {
    embeddingCache[filePath] = embeddings;
    saveCache(); // persist to disk
}

/**
 * Retrieves cached embeddings for a file.
 * @param filePath The file path.
 * @returns The cached embeddings or undefined if not cached.
 */
export async function getCachedEmbeddings(filePath: string): Promise<number[][] | undefined> {
    return embeddingCache[filePath];
}

/**
 * Generates a hash for a chunk of text. String hashing to check for changes in the content!
 * @param chunk The text chunk.
 * @returns The hash as a string.
 */
function hashChunk(chunk: string): string {
    return crypto.createHash("md5").update(chunk).digest("hex");
}

export async function reEmbedChangedChunks(filePath: string, chunks: string[]): Promise<number[][]> {
    const cachedEmbeddings = await getCachedEmbeddings(filePath);

    // If there are no cached embeddings yet, embed and cache all chunks
    if (!cachedEmbeddings) {
        console.log("No cached embeddings found, embedding all chunks.");
        const embeddings = await embedChunks(chunks);
        await cacheEmbeddings(filePath, embeddings);
        return embeddings;
    }

    // If chunk count changed, re-embed all and update cache
    if (cachedEmbeddings.length !== chunks.length) {
        console.log("Chunk count changed, re-embedding all chunks.");
        const embeddings = await embedChunks(chunks);
        await cacheEmbeddings(filePath, embeddings);
        return embeddings;
    }

    // For now return the cached embeddings when counts match.
    // TODO: store and compare per-chunk hashes to re-embed only changed chunks.
    return cachedEmbeddings;
}
