import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import "dotenv/config";
import crypto from "crypto";
import redis from "./redis";

const HUGGINGFACEHUB_API_KEY = process.env.HUGGINGFACEHUB_API_KEY;

if(!HUGGINGFACEHUB_API_KEY) {
    throw new Error("HUGGINGFACEHUB_API_KEY not set in the environment variable");
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
    try {
        const embeddings = await embedder.embedQuery(text);
        console.log(`[embed] Input length: ${text.length}, Output vector length: ${embeddings.length}`);
        return embeddings;
    } catch (error) {
        console.error("Error generating embeddings:", error);
        throw new Error("Failed to generate embeddings");
    }
}

/**
 * Embeds all chunks of a file.
 * @param chunks An array of file chunks.
 * @returns A promise that resolves to an array of embeddings.
 */
export async function embedChunks(chunks: string[]) : Promise<number[][]> {
    const embeddings = await embedder.embedDocuments(chunks);
    console.log(`[embedChunks] Got ${embeddings.length} chunk embeddings; each is ${embeddings[0].length}-dimensional`);
    return embeddings;
}

// let's cache the embeddings
// const embeddingCache: Map<string, number[][]> = new Map(); // --> this one was the local embedding cache .. shifted to redis

/**
 * Caches embeddings for a file.
 * @param filePath The file path.
 * @param embeddings The embeddings to cache.
 */
export async function cacheEmbeddings(filePath: string, embeddings: number[][]) {
    //embeddingCache.set(filePath, embeddings);
    const key = `embeddings:${filePath}`;
    const value = JSON.stringify(embeddings);
    await redis.set(key, value);
}

/**
 * Retrieves cached embeddings for a file.
 * @param filePath The file path.
 * @returns The cached embeddings or undefined if not cached.
 */
export async function getCachedEmbeddings(filePath: string): Promise<number[][] | undefined> {
    //return embeddingCache.get(filePath);
    const key = `embeddings:${filePath}`;
    const value = await redis.get(key);
    return value ? JSON.parse(value) : undefined;
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
    const cachedEmbeddings = (await getCachedEmbeddings(filePath)) || [];
    const updatedEmbeddings: number[][] = [];

    const cachedHashes = cachedEmbeddings.map((_: any, index: number) => hashChunk(chunks[index] || ""));

    for(let i: number = 0; i<chunks.length; i++) {
        const chunk = chunks[i];
        const chunkHash = hashChunk(chunk);

        if(cachedHashes[i] != chunkHash) {
            // re-embedding the changed chunk
            const re_embedded_chunk = await embed(chunk);
            updatedEmbeddings[i] = re_embedded_chunk;
        } else {
            // we just use the cached embedding
            updatedEmbeddings[i] = cachedEmbeddings[i];
        }
    }

    // now we gotta update the global cache
    await cacheEmbeddings(filePath, updatedEmbeddings);
    // this one updates the global cache -- made this way so swapping in redis would be easier later on
    return updatedEmbeddings;
}
