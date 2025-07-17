import { cacheEmbeddings, getCachedEmbeddings } from "../../services/rag";
import assert from "assert";

(async () => {
    const filePath = "test-file";
    const embeddings = [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]];

    // Cache the embeddings
    await cacheEmbeddings(filePath, embeddings);
    console.log("Embeddings cached!");

    // Retrieve the embeddings
    const cached = await getCachedEmbeddings(filePath);
    console.log("Retrieved embeddings:", cached);
})();

const filePath = "test-file";
const embeddings = [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]];

describe("Testing Redis", function () {
    it("Caching and Embedding", async function () {

        // Cache the embeddings
        await cacheEmbeddings(filePath, embeddings);
        console.log("Embeddings cached!");

        // Retrieve the embeddings
        const cached = await getCachedEmbeddings(filePath);
        if(cached !== undefined) {
            assert(cached.length > 0, "Failed to retrieve cached Embeddings. Got length as 0");
        } else {
            console.log("Failed to get cached Embeddings. UNDEFINED");
        }
    });
});
