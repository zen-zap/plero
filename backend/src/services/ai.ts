// in src/services/ai.ts

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

type CompletionOptions = {
    prompt: string,
    model?: string,
    temperature?: number,
    maxTokens?: number,
}

export async function completion({
    prompt,
    model = "gpt-4.1-mini",
    temperature = 0.2,
    maxTokens = 50,
} : CompletionOptions) {

    if(!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY not set");
    }

    // same constant llm for the completion .. later upgrade the default one to gpt-4o for better completion results
    const llm = new ChatOpenAI({
        model,
        temperature,
        maxTokens,
        timeout: undefined,
        maxRetries: 2,
        apiKey: OPENAI_API_KEY,
    });

    const codePrompt = new PromptTemplate({
        inputVariables: ["input"],
        template: `Complete the following code. Only output the next lines of code, with no explanations, comments, or extra text.\n\n{input}`,
    });

    const chain = codePrompt.pipe(llm);

    const response = await chain.invoke({
        input: prompt
    })

    return response;
}
