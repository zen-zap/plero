import { OpenAI } from "openai/client.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if(!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not defined.");
}

import { StateSchema, MessagesValue, GraphNode, StateGraph, START, END, Annotation, ConditionalEdgeRouter, AnnotationRoot} from "@langchain/langgraph";
import { HumanMessage, SystemMessage, BaseMessage, ChatMessageChunk } from "@langchain/core/messages";
import { TavilySearch } from "@langchain/tavily";
import { Chat } from "openai/resources.js";

const client = new OpenAI({
    apiKey: OPENAI_API_KEY,
    maxRetries: 2,
    timeout: 5000,
});

// separate models for separate tasks
const supervisorModel = "gpt-4o";

const ChatAgentState = Annotation.Root({
    // we need conversation history
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y), // we concat the values
        default: () => [],
    }),
    next: Annotation<string>({
        reducer: (x, y) => y ?? x, // we overwrite the value
        default: () => "supervisor",
    })
});

/**
 * Supervisor node to route to the correct worker. Works when auto mode is selected.
 * Returns only the name of the next node.
 * @param state ChatAgentState.State
 * @returns Promise<{ next: string }>
 */
async function supervisorNode(state: typeof ChatAgentState.State): Promise<{ next: string }> {
    const sysPrompt = `You are the Supervisor of an intelligent code editor agent.
Your goal is to route the user's request to the correct worker.

Workers:
- "web_search": For questions requiring current events, docs, libraries, or specific errors (e.g., "latest react docs", "api error 404").
- "reasoner": For complex logic, architectural decisions, debugging analysis, or explaining concepts in depth.
- "chat": For casual conversation, greetings, or simple clarifications.

Output ONLY the name of the worker: "web_search", "reasoner", or "chat".`;

    const response = await client.responses.create({
        model: supervisorModel,
        text: {
            format: { type: "text" },
        },
        max_output_tokens: 20,
        input: [
            {
                role: "system",
                content: sysPrompt,
            }
        ]
    });

    const route = response?.output_text.trim().toLowerCase();

    if(["web_search", "reasoner", "chat"].includes(route)) {
        return { next: route };
    } else {
        return { next: "chat" };
    }
}

