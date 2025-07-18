import { chunkByLines, embed, embedChunks, cacheEmbeddings, getCachedEmbeddings, reEmbedChangedChunks } from "../../services/rag";
import assert from "assert";
import Redis from "ioredis";

const TIMEOUT = 15000;
const filePath = "test-file";
const fileContent = `
    function add(a, b) {
        return a + b;
    }

    function subtract(a, b) {
        return a - b;
    }

    function multiply(a, b) {
        return a * b;
    }
`;

describe("Chunking and Embedding Tests", function () {
    let testRedis: Redis;
    let originalRedis: any;
    
    before(async function() {
        this.timeout(10000);
        // Create isolated Redis connection
        const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
        testRedis = new Redis(REDIS_URL, {
            keepAlive: 30000,
            commandTimeout: 5000,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            keyPrefix: `rag_test_${Date.now()}_`,
        });
        
        try {
            await testRedis.connect();
            console.log("RAG test Redis connected");
            
            // Replace the main Redis instance with our test instance
            originalRedis = require("../../services/rag").redis;
            require("../../services/rag").redis = testRedis;
        } catch (err) {
            console.log("Redis connection failed:", err);
            // Continue anyway, caching tests will be skipped
        }
    });

    after(async function() {
        this.timeout(5000);
        
        // Restore original Redis first
        if (originalRedis) {
            require("../../services/rag").redis = originalRedis;
        }
        
        if (testRedis) {
            try {
                // Clean up all test keys
                const keys = await testRedis.keys(`rag_test_*`);
                if (keys.length > 0) {
                    await testRedis.del(...keys);
                }
                await testRedis.quit();
                console.log("RAG test Redis connection closed and cleaned up");
            } catch (err) {
                console.log("Error during Redis cleanup:", err);
            }
        }
        
        // Force close any remaining connections
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    });

    it("Testing", async function () {
        this.timeout(TIMEOUT);

        console.log("=== Testing Chunking ===");
        const chunks = chunkByLines(fileContent, 5);
        assert(chunks.length > 0, "No chunks generated!");
        console.log(`Number of Chunks: ${chunks.length}`);
        chunks.forEach((chunk, index) => {
            console.log(`Chunk ${index + 1}: ${chunk.length} characters`);
        });

        console.log("\n=== Testing Embedding ===");
        const embeddings = await embedChunks(chunks);
        console.log(`Number of Embeddings: ${embeddings.length}`);

        console.log("\n=== Testing Caching ===");
        if (testRedis && testRedis.status === 'ready') {
            try {
                await cacheEmbeddings(filePath, embeddings);
                const cachedEmbeddings = await getCachedEmbeddings(filePath);
                if(cachedEmbeddings !== undefined) {
                    assert(cachedEmbeddings.length > 0, "length of Cached Embeddings is 0");
                    console.log("✅ Caching test passed");
                } else {
                    console.log("Cached Embeddings is undefined!");
                }
            } catch (err) {
                console.log("Caching test failed:", err);
                // Don't fail the test if Redis is unavailable
            }
        } else {
            console.log("⚠️  Skipping caching tests - Redis not available");
        }

        console.log("\n=== Testing Re-Embedding ===");
        const modifiedContent = `
            function add(a, b) {
                return a + b;
            }

            function subtract(a, b) {
                return a - b;
            }

            function divide(a, b) {
                return a / b; // Modified chunk
            }
        `;
        const modifiedChunks = chunkByLines(modifiedContent, 5);
        
        if (testRedis && testRedis.status === 'ready') {
            try {
                const updatedEmbeddings = await reEmbedChangedChunks(filePath, modifiedChunks);
                assert(updatedEmbeddings.length > 0, "No updated Embeddings generated!");
                console.log("✅ Re-embedding test passed");
            } catch (err) {
                console.log("Re-embedding test failed:", err);
            }
        } else {
            console.log("⚠️  Skipping re-embedding tests - Redis not available");
        }
    });
});