import { cacheEmbeddings, getCachedEmbeddings } from "../../services/rag";
import redis from "../../services/redis";
import assert from "assert";

const TIMEOUT = 15000;
const filePath = "test-file";
const embeddings = [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]];

describe("Testing Redis", function () {
    // Clean up after all tests
    after(async function() {
        this.timeout(5000);
        try {
            // Force close Redis connection
            if (redis && redis.status !== 'end') {
                await redis.quit();
                console.log("Main Redis connection closed");
            }
        } catch (err) {
            console.log("Error closing main Redis:", err);
        }
    });

    it("Caching and Embedding", async function () {
        this.timeout(TIMEOUT);
        
        try {
            // Cache the embeddings
            await cacheEmbeddings(filePath, embeddings);
            console.log("Embeddings cached!");

            // Retrieve the embeddings
            const cached = await getCachedEmbeddings(filePath);
            if(cached !== undefined) {
                assert(cached.length > 0, "Failed to retrieve cached Embeddings. Got length as 0");
                console.log("✅ Successfully retrieved cached embeddings");
            } else {
                assert.fail("Failed to get cached Embeddings. UNDEFINED");
            }
        } catch (err) {
            console.error("Test error:", err);
            throw err;
        }
    });
});