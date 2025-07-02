// in src/services/ai.ts

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { tavilySearch } from "./tavily";
import { error } from "console";

type CompletionOptions = {
    prompt: string,
    model?: string,
    temperature?: number,
    maxTokens?: number,
}

/**
 * Generates a code completion based on the provided prompt using OpenAI's GPT model.
 * 
 * @param param0 - The options for the completion function
 * @param param0.prompt - The prompt to complete
 * @param param0.model - The model to use for completion (default: "gpt-4.1-mini")
 * @param param0.temperature - The temperature for the model (default: 0.2)
 * @param param0.maxTokens - The maximum number of tokens to generate (default: 50)
 * @returns 
 */
export async function completion({
    prompt,
    model = "gpt-4.1-mini",
    temperature = 0.2,
    maxTokens = 50,
}: CompletionOptions) {

    if (!OPENAI_API_KEY) {
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

type ClassifyOptions = {
    query: string,
    model?: string,
    temperature?: number,
    maxTokens?: number,
}

const options = [
    "code completion",
    "chat completion",
    "reasoning",
    "web search"
];

/**
 * Classifies a query into one of the predefined categories.
 * 
 * @param param0 - The options for the classification function
 * @param param0.query - The query to classify
 * @param param0.model - The model to use for classification (default: "gpt-3.5-turbo")
 * @returns The classification as an integer (1-4)
 */
export async function classify({
    query,
    model = "gpt-3.5-turbo"
}: ClassifyOptions) {

    const classifyPrompt = new PromptTemplate({
        inputVariables: ["query"],
        template: `Classify this query into one category. Respond with just the number:
1. Code completion (user is typing code, wants autocomplete, usually some incomplete piece of code is given as input without any human conversation)
2. Chat (conversational question, does not require external or real-time information)  
3. Reasoning (complex problem solving, requires logical thinking or step-by-step analysis)
4. Web search (requires external or real-time information, such as current events, or live data)

Query: {query}
Classification:`
    });

    const llm = new ChatOpenAI({
        model,
        temperature: 0,
        maxTokens: 5,
        apiKey: OPENAI_API_KEY,
    });
    const response = await classifyPrompt.pipe(llm).invoke({ query });
    const classification = parseInt(response.content.toString().trim());

    if (classification < 1 || classification > 4 || isNaN(classification)) {
        console.warn("Invalid Classification: ${classification}, defaulting to chat");
        return 2; // default chat mode
    }

    return classification;
}

/** 
 * Handles a basic chat interaction with the AI.
 * 
 * @param query - The user's query to respond to
 * @param model - The model to use for the chat (default: "gpt-4o")
 * @param temperature - The temperature for the model (default: 0.5)
 * @param maxTokens - The maximum number of tokens to generate (default: 300)
 * @returns The AI's response to the query
 */
export async function basicChat(
    query: string,
    model: string = "gpt-4o",
    temperature: number = 0.5,
    maxTokens: number = 300,
): Promise<string> {

    const chatPrompt = new PromptTemplate({
        inputVariables: ["query"],
        template: `You are a helpful AI assistant. Respond to the user's query in a conversational manner.
        
        Query: {query}
        Response:`
    });

    const llm = new ChatOpenAI({
        model,
        temperature,
        maxTokens,
        apiKey: OPENAI_API_KEY,
    });

    const chain = chatPrompt.pipe(llm);
    const response = await chain.invoke({
        query,
    });

    return response.content.toString();
}

/**
 * Reason through a query step by step, breaking down the problem and providing a comprehensive analysis.
 * 
 * @param query - The query to reason through
 * @param model - The model to use for reasoning (default: "gpt-4o")
 * @param temperature - The temperature for the model (default: 0.5)
 * @param maxTokens - The maximum number of tokens to generate (default: 400)
 * @returns 
 */
export async function reasonerHelper(
    query: string,
    model: string = "gpt-4o",
    temperature: number = 0.5,
    maxTokens: number = 300,
): Promise<string> {

    const reasoningPrompt = new PromptTemplate({
        inputVariables: ["query"],
        template: `Think through this step by step. Break down the problem and reason through it carefully.

Query: {query}

Let me think through this step by step:
1. First, I need to understand what's being asked
2. Then I'll break down the components
3. I'll consider different approaches
4. Finally, I'll provide a comprehensive answer

Analysis:`
    });

    const llm = new ChatOpenAI({
        model,
        temperature,
        maxTokens,
        apiKey: OPENAI_API_KEY,
    });

    const chain = reasoningPrompt.pipe(llm);

    const response = await chain.invoke({
        query
    });

    return response.content.toString();
}

/**
 * Performs a web search for the given query and generates a response using the search results as context.
 * 
 * @param query - The query to search the web for
 * @param model - The model to use for the web search response (default: "gpt-4o")
 * @param temperature - The temperature for the model (default: 0.2)
 * @param maxTokens - The maximum number of tokens to generate (default: 300)
 * @returns 
 */
export async function webHelper(
    query: string,
    model: string = "gpt-4o",
    temperature: number = 0.2,
    maxTokens: number = 300,
): Promise<string> {

    const searchRes = await tavilySearch({
        query,
        maxResults: 3,
        includeAnswers: true,
    });

    const webPrompt = new PromptTemplate({
        inputVariables: ["query", "searchRes"],
        template: `Answer the following query using the provided search results as context. 
If the search results are relevant, incorporate the information. If not, answer based on your knowledge.

Query: {query}

Search Results:
{searchResults}

Response:`
    });

    const searchContext = searchRes.results
        .map(result => `Title: ${result.title}\nContent: ${result.content}\nURL: ${result.url}`).join('\n\n');

    const llm = new ChatOpenAI({
        model,
        temperature,
        maxTokens,
        timeout: 4000,  // 4 seconds timeout for web search
        maxRetries: 2,
        apiKey: OPENAI_API_KEY,
    });

    const response = await webPrompt.pipe(llm).invoke({
        query,
        searchRes: searchContext
    });

    return response.content.toString();
}

/**
 * Handles advanced chat interactions with the AI, allowing for reasoning, web search, or both.
 * 
 * @param query - The user's query to respond to.
 * @param reasoning - Whether to enable reasoning mode for the query (default: false).
 * @param web - Whether to enable web search mode for the query (default: false).
 * @param model - The model to use for the chat (default: "gpt-4o").
 * @returns The AI's response to the query, incorporating reasoning, web search, or basic chat as specified.
 * @throws Error if the `OPENAI_API_KEY` is not set or if the chat response fails.
 */
export async function chatRespond(
    query: string,
    reasoning: boolean = false,
    web: boolean = false,
    model: string = "gpt-4o",
): Promise<string> {

    if (!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY not set");
    }

    try {
        let content: string;

        if (reasoning && web) {
            console.log("[Mode]: Reasoning + Web Search");
            const webRes = await webHelper(query, model);
            const reasonRes = await reasonerHelper(
                query = `Based on this information: ${webRes}\n\nOriginal Query: ${query}`,
                model,
            );
            content = reasonRes;
        } else if (reasoning) {
            console.log("[Mode]: Reasoning");
            const reasonRes = await reasonerHelper(query, model);
            content = reasonRes;
        } else if (web) {
            console.log("[Mode]: Web Search");
            const webRes = await webHelper(query, model);
            content = webRes;
        } else {
            console.log("[Mode]: Basic Chat");
            content = await basicChat(query, model);
        }

        return content;
    } catch (err) {
        console.error("Error in advancedChat: ", err);
        throw new Error(`Chat Response Failed: ${err instanceof Error ? err.message : String(err)}`);
    }
}