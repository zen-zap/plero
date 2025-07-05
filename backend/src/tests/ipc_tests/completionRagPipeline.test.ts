import assert from "assert";
import { completionRag } from "../../services/ai";

(async () => {
    const fileContent = `
        function add(a, b) {
            return a + b;
        }

        function subtract(a, b) {
            return a - b;
        }
    `;

    const prompt = "Complete the multiply function.";
    const result = await completionRag({
        fileContent,
        prompt,
        model: "gpt-4.1-mini",
    });

    console.log("RAG Completion Result:", result);
    assert(result.length > 0, "RAG completion result is empty");
})();
