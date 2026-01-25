import assert from "assert";
// COMMENTED OUT - Old AI service, migrating to LangGraph
// import { completionRag } from "../../services/ai";

const TIMEOUT = 15000;

// COMMENTED OUT - Old AI service, migrating to LangGraph
/*
describe("RAG Completion Pipeline Test", function () {
    it("returns a non-empty completion", async function () {
        this.timeout(TIMEOUT);
        const fileContent = `
            function add(a, b) {
                return a + b;
            }

            function subtract(a, b) {
                return a - b;
            }

            function multiply(a, b) {

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
    });
});
*/
