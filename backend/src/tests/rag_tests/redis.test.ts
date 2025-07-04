import { cacheEmbeddings, getCachedEmbeddings } from "../../services/rag";

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
