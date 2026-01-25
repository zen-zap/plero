// in src/services/ai.ts
import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (OPENAI_API_KEY == undefined) {
  throw new Error("Failed to retrieve OPENAI_API_KEY");
}

export type GhostCompletionOptions = {
    prefix: string, 
    suffix: string,
    language?: string,
    model?: string,
    maxTokens?: number,
    temperature?: number,
};

// We cannot have out ghost completion in a langgraph
// that would slow and this needs to be fast to be usable

/**
 * Generates a ghost code completion based on the cursor position.
 * We usually pass a few lines before the cursor as prefix and a few 
 * lines after the cursor as suffix. 
 * We probably need to call this function from the editor?
 */
export async function ghostCompletion({
    prefix,
    suffix,
    language = "typescript",
    model = "gpt-5.1-codex-mini",
    temperature = 0.0, // code completion should be deterministic
    maxTokens = 128,
}: GhostCompletionOptions): Promise<string> {

    if(!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not set");
    }

    const llm = new ChatOpenAI({
        model,
        temperature,
        maxTokens,
        timeout: 5000,
        maxRetries: 0,
        apiKey: OPENAI_API_KEY,
    });

    const systemPrompt = `You are a precise code completion engine.
    Your task is to fill in the missing code between the provided PREFIX and SUFFIX.
    - Output ONLY the code that fills the gap.
    - Do NOT output the prefix or suffix.
    - Do NOT wrap the output in markdown blocks (no \`\`\`).
    - If there is no code to complete, output an empty string.
    - Respect the indentation of the PREFIX.`;

    const userPrompt = `Language: ${language}

    [PREFIX]
    ${prefix}
    [SUFFIX]
    ${suffix}

    [COMPLETION]`;

    const response = await llm.invoke([
        ["system", systemPrompt],
        ["user", userPrompt]
    ]);

    let completion = response.content.toString();

    // a little cleanup just in case
    if (completion.startsWith("```")) {
        completion = completion.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "");
    }

    return completion;
}