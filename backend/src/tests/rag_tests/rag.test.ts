import { chunkByLines, embed, embedChunks, cacheEmbeddings, getCachedEmbeddings, reEmbedChangedChunks } from "../../services/rag";
import assert from "assert";
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
    it("Testing", async function () {

        this.timeout(TIMEOUT);

        console.log("=== Testing Chunking ===");
        const chunks = chunkByLines(fileContent, 5); // chunking by 5 lines
        assert(chunks.length > 0, "No chunks generated!");
        console.log(`Number of Chunks: ${chunks.length}`);
        chunks.forEach((chunk, index) => {
            console.log(`Chunk ${index + 1}: ${chunk.length} characters`);
        });


        console.log("\n=== Testing Embedding ===");
        const embeddings = await embedChunks(chunks);
        console.log(`Number of Embeddings: ${embeddings.length}`);

        console.log("\n=== Testing Caching ===");
        cacheEmbeddings(filePath, embeddings);
        const cachedEmbeddings = await getCachedEmbeddings(filePath);
        if(cachedEmbeddings !== undefined) {
            assert(cachedEmbeddings.length > 0, "length of Cached Embeddings is 0");
        } else {
            console.log("Cached Embeddings is undefined!"); // FIXME: Can we do it better here?
        }
        //console.log(`Cached Embeddings: ${cachedEmbeddings?.length} vectors`);

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
        const updatedEmbeddings = await reEmbedChangedChunks(filePath, modifiedChunks);
        assert(updatedEmbeddings.length > 0, "No updated Embeddings generated!");
        //console.log(`Updated Embeddings: ${updatedEmbeddings.length} vectors`);

    });
});
// (async () => {
//     const filePath = "test-file";
//     const fileContent = `
//         function add(a, b) {
//             return a + b;
//         }
//
//         function subtract(a, b) {
//             return a - b;
//         }
//
//         function multiply(a, b) {
//             return a * b;
//         }
//     `;
//
//     console.log("=== Testing Chunking ===");
//     const chunks = chunkByLines(fileContent, 5); // chunking by 5 lines
//     console.log(`Number of Chunks: ${chunks.length}`);
//     chunks.forEach((chunk, index) => {
//         console.log(`Chunk ${index + 1}: ${chunk.length} characters`);
//     });
//
//     console.log("\n=== Testing Embedding ===");
//     const embeddings = await embedChunks(chunks);
//     console.log(`Number of Embeddings: ${embeddings.length}`);
//     //embeddings.forEach((embedding, index) => {
//     //    console.log(`Embedding ${index + 1}: Vector length = ${embedding.length}, First 5 values = ${embedding.slice(0, 5)}`);
//     //});
//
//     console.log("\n=== Testing Caching ===");
//     cacheEmbeddings(filePath, embeddings);
//     const cachedEmbeddings = await getCachedEmbeddings(filePath);
//     console.log(`Cached Embeddings: ${cachedEmbeddings?.length} vectors`);
//     //cachedEmbeddings?.forEach((embedding, index) => {
//     //    console.log(`Cached Embedding ${index + 1}: Vector length = ${embedding.length}, First 5 values = ${embedding.slice(0, 5)}`);
//     //});
//
//     console.log("\n=== Testing Re-Embedding ===");
//     const modifiedContent = `
//         function add(a, b) {
//             return a + b;
//         }
//
//         function subtract(a, b) {
//             return a - b;
//         }
//
//         function divide(a, b) {
//             return a / b; // Modified chunk
//         }
//     `;
//     const modifiedChunks = chunkByLines(modifiedContent, 5);
//     const updatedEmbeddings = await reEmbedChangedChunks(filePath, modifiedChunks);
//     console.log(`Updated Embeddings: ${updatedEmbeddings.length} vectors`);
//     //updatedEmbeddings.forEach((embedding, index) => {
//     //    console.log(`Updated Embedding ${index + 1}: Vector length = ${embedding.length}, First 5 values = ${embedding.slice(0, 5)}`);
//     //});
// })();
