import { OpenAI } from "openai/client.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not defined.");
}

import {
  StateSchema,
  MessagesValue,
  GraphNode,
  StateGraph,
  START,
  END,
  Annotation,
  ConditionalEdgeRouter,
} from "@langchain/langgraph";
import {
  HumanMessage,
  SystemMessage,
  BaseMessage,
  AIMessage,
} from "@langchain/core/messages";
import { TavilySearch } from "@langchain/tavily";

const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
  maxRetries: 2,
  timeout: 50000,
});

// separate models for separate tasks
const supervisorModel = "gpt-4o";
const bestModel = "gpt-5.2";
const codeModel = "gpt-5.1-codex";
const chatModel = "gpt-5-mini";

/**
 * Extracts string content from a message (handles both BaseMessage and plain objects).
 */
function getMessageContent(message: any): string {
  // If message is a string itself, return it
  if (typeof message === "string") {
    return message;
  }

  if (typeof message !== "object" || message === null) {
    return "";
  }
  if (typeof message.content === "string") {
    return message.content;
  }

  if (message.kwargs?.content && typeof message.kwargs.content === "string") {
    return message.kwargs.content;
  }

  if (
    message.lc_kwargs?.content &&
    typeof message.lc_kwargs.content === "string"
  ) {
    return message.lc_kwargs.content;
  }

  const content =
    message.content ?? message.kwargs?.content ?? message.lc_kwargs?.content;
  if (Array.isArray(content)) {
    const texts = content
      .map((block: any) => {
        if (typeof block === "string") return block;
        if (typeof block === "object" && block !== null) {
          return block.text ?? block.content ?? "";
        }
        return "";
      })
      .filter(Boolean);
    return texts.join("\n");
  }

  return "";
}

/**
 * Gets the message type/role from various message formats.
 */
function getMessageType(message: any): string {
  if (typeof message !== "object" || message === null) {
    return "human";
  }

  if (message.type) return message.type;

  if (message.role) return message.role;

  if (Array.isArray(message.lc_id)) {
    const lcType = message.lc_id[message.lc_id.length - 1];
    if (lcType === "HumanMessage") return "human";
    if (lcType === "AIMessage") return "ai";
    if (lcType === "SystemMessage") return "system";
  }

  return "human";
}

function toOpenAIMessages(
  messages: any[],
): Array<{ role: "user" | "assistant" | "system"; content: string }> {
  console.log("[toOpenAIMessages] input messages count:", messages?.length);
  console.log("[toOpenAIMessages] messages type:", typeof messages);
  console.log("[toOpenAIMessages] is array:", Array.isArray(messages));

  if (messages?.[0]) {
    console.log("[toOpenAIMessages] first message type:", typeof messages[0]);
    console.log(
      "[toOpenAIMessages] first message constructor:",
      messages[0]?.constructor?.name,
    );
    console.log(
      "[toOpenAIMessages] first message full:",
      JSON.stringify(messages[0], null, 2)?.slice(0, 1500),
    );
  }

  const result: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }> = [];

  for (const m of messages) {
    const msgType = getMessageType(m);
    let role: "user" | "assistant" | "system" = "user";

    if (msgType === "system" || msgType === "SystemMessage") role = "system";
    else if (
      msgType === "ai" ||
      msgType === "AIMessage" ||
      msgType === "assistant"
    )
      role = "assistant";
    else role = "user";

    const content = getMessageContent(m);

    if (content.trim()) {
      result.push({ role, content });
    }
  }

  return result;
}

const ChatAgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y), // we concat the values
    default: () => [],
  }),
  next: Annotation<string>({
    reducer: (x, y) => y ?? x, // we overwrite the value
    default: () => "supervisor", // always start at supervisor for routing
  }),
});

/**
 * Logs the current state for debugging
 */
function logState(nodeName: string, state: typeof ChatAgentState.State) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[${nodeName.toUpperCase()}] Node entered`);
  console.log(`[${nodeName}] state.next: "${state.next}"`);
  console.log(`[${nodeName}] messages count: ${state.messages?.length}`);

  if (state.messages?.length > 0) {
    const lastMsg = state.messages[state.messages.length - 1];
    const content = getMessageContent(lastMsg);
    const msgType = getMessageType(lastMsg);
    console.log(`[${nodeName}] last message type: "${msgType}"`);
    console.log(
      `[${nodeName}] last message content (first 200 chars): "${content?.slice(0, 200)}"`,
    );
  }
  console.log(`${"=".repeat(60)}\n`);
}

/**
 * Supervisor node to route to the correct worker. Works when auto mode is selected.
 * Returns only the name of the next worker node.
 * @param state The state of the graph as ChatAgentState.State
 * @returns Promise<{ next: string }>
 */
async function supervisorNode(
  state: typeof ChatAgentState.State,
): Promise<{ next: string }> {
  logState("supervisor", state);

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
      },
      ...toOpenAIMessages(state.messages.slice(-3)),
    ],
  });

  const route = response?.output_text.trim().toLowerCase();
  console.log(`[supervisor] LLM response: "${response?.output_text}"`);
  console.log(`[supervisor] Parsed route: "${route}"`);

  if (["web_search", "reasoner", "chat"].includes(route)) {
    console.log(`[supervisor] ✓ Valid route, going to: ${route}`);
    return { next: route };
  } else {
    console.log(`[supervisor] ✗ Invalid route, defaulting to: chat`);
    return { next: "chat" };
  }
}

async function chatNode(
  state: typeof ChatAgentState.State,
): Promise<Partial<typeof ChatAgentState.State>> {
  logState("chat", state);

  let inputMessages = toOpenAIMessages(state.messages);
  console.log(`[chat] Converted ${inputMessages.length} messages for OpenAI`);

  // Ensure we always have at least one message
  if (inputMessages.length === 0) {
    console.log(`[chat] ⚠ No messages found, using fallback`);
    inputMessages = [
      { role: "user", content: "Hello, I didn't get any input ;)" },
    ];
  } else {
    console.log(`[chat] First message: ${JSON.stringify(inputMessages[0])}`);
  }

  const response = await client.responses.create({
    model: chatModel,
    text: {
      format: { type: "text" },
    },
    input: inputMessages,
  });

  const aiMessage = new AIMessage(response.output_text);

  return {
    messages: [aiMessage],
  };
}

async function reasonerNode(
  state: typeof ChatAgentState.State,
): Promise<Partial<typeof ChatAgentState.State>> {
  logState("reasoner", state);

  const sysPrompt = `You are a Senior Principal Software Architect.
Produce a careful, step-by-step analysis, then a concise solution.

You have access to a web_search tool. Use it when you need:
- Current documentation or API references
- Recent best practices or library updates
- Specific error messages or solutions
- Facts you're not certain about

Output format (markdown):
## Analysis
- Intent
- Key constraints / edge cases
- Two approaches (A vs B) with trade-offs
- Decision

## Solution
- Final recommendation and, if relevant, code (typed, safe, production-ready).
- Mention assumptions and limitations.`;

  const maxHistory = 15;
  const recentMessages = toOpenAIMessages(state.messages.slice(-maxHistory));
  console.log(
    `[reasoner] Converted ${recentMessages.length} messages for OpenAI`,
  );

  const response = await client.responses.create({
    model: bestModel,
    text: {
      format: { type: "text" },
    },
    input: [
      {
        role: "system",
        content: sysPrompt,
      },
      ...recentMessages,
    ],
    tools: [
      {
        type: "web_search",
      },
    ],
    tool_choice: "auto",
    reasoning: {
      effort: "medium",
      summary: "auto",
    },
    max_output_tokens: 1500,
  });

  const content = response.output_text || "";
  console.log(`[reasoner] Response length: ${content.length}`);
  return { messages: [new AIMessage(content)] };
}

// we'll separate the web search node and the tool, the node can make the tool call

// should we use this or the builtin tool in the models?
// Let's try the builtin first.
const webSearchTool = {
  type: "function",
  function: {
    name: "web_search",
    description:
      "Search the web for up-to-date information, libraries, or specific errors and return top results and snippets.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        k: {
          type: "integer",
          description: "Number of results",
          minimum: 1,
          maximum: 8,
          default: 4,
        },
      },
      required: ["query"],
    },
  },
};

/**
 * Performs a web search using the Tavily Search API.
 * @param query The search query string.
 * @param k The number of results to return (default is 5).
 * @returns An array of search results with title, link, and snippet.
 */
async function runWebSearch(query: string, k = 5) {
  const tavily = new TavilySearch({
    tavilyApiKey: process.env.TAVILY_API_KEY || "",
  });

  const results: any = await tavily.invoke({
    query: query,
    k: k,
  });

  return results.map((r: { title: any; link: any; snippet: any }) => ({
    title: r.title,
    link: r.link,
    snippet: r.snippet,
  }));
}

/**
 * Performs a web search using the web_search tool hosted by openai.
 * @param state Holds the current state of the graph
 * @returns the model response wrapped in AIMessage
 */
async function webSearchNode(
  state: typeof ChatAgentState.State,
): Promise<Partial<typeof ChatAgentState.State>> {
  logState("web_search", state);

  const history = toOpenAIMessages(state.messages.slice(-8));
  console.log(`[web_search] Converted ${history.length} messages for OpenAI`);

  const response = await client.responses.create({
    model: chatModel,
    text: {
      format: { type: "text" },
    },
    input: [
      {
        role: "system",
        content:
          "You can use the web_search tool for anything requiring fresh or factual data. Prefer citing URLs in the reply.",
      },
      ...history,
    ],
    tool_choice: "auto",
    tools: [
      {
        type: "web_search",
      },
    ],
    truncation: "auto",
    max_output_tokens: 1000,
    temperature: 0.2,
  });

  const content = response.output_text || "";
  console.log(`[web_search] Response length: ${content.length}`);
  return { messages: [new AIMessage(content)] };
}

/**
 * Router function for START - always go to supervisor
 * The supervisor will decide which worker to use based on the message content
 */
function startRouter(state: typeof ChatAgentState.State): string {
  console.log(`\n${"#".repeat(60)}`);
  console.log(`[START ROUTER] Invoked`);
  console.log(`[START ROUTER] state.next = "${state.next}" (will be ignored)`);
  console.log(
    `[START ROUTER] Always routing to supervisor for fresh routing decision`,
  );
  console.log(`${"#".repeat(60)}\n`);

  // Always go to supervisor - it will look at the actual message content
  // and decide which worker to route to
  return "supervisor";
}

// Build the graph with proper typing
const flow = new StateGraph(ChatAgentState)
  .addNode("supervisor", supervisorNode)
  .addNode("chat", chatNode)
  .addNode("reasoner", reasonerNode)
  .addNode("web_search", webSearchNode)
  .addConditionalEdges(START, startRouter, {
    supervisor: "supervisor",
  })
  .addConditionalEdges(
    "supervisor",
    (state) => {
      console.log(`[SUPERVISOR EDGE] Routing to: ${state.next}`);
      return state.next;
    },
    {
      chat: "chat",
      reasoner: "reasoner",
      web_search: "web_search",
    },
  )
  .addEdge("chat", END)
  .addEdge("reasoner", END)
  .addEdge("web_search", END);

export const graph = flow.compile();

export type ChatMode = "auto" | "chat" | "reasoning" | "web";

/**
 * Maps UI modes to graph node names
 */
const modeToNode: Record<ChatMode, string> = {
  auto: "supervisor",
  chat: "chat",
  reasoning: "reasoner",
  web: "web_search",
};

/**
 * Invokes the graph with the given messages and mode.
 * Used by the AI service to integrate with the chat sidebar.
 * @param messages Array of messages in { role, content } format
 * @param mode The chat mode selected in the UI
 * @returns The AI response text and the mode that was actually used
 */
export async function invokeGraph(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  mode: ChatMode = "auto",
): Promise<{ response: string; usedMode: string }> {
  console.log("\n" + "█".repeat(70));
  console.log("[GRAPH] invokeGraph START");
  console.log("[GRAPH] mode:", mode);
  console.log("[GRAPH] input messages count:", messages.length);

  // Log each message briefly
  messages.forEach((m, i) => {
    console.log(
      `[GRAPH] msg[${i}] ${m.role}: "${m.content.slice(0, 80)}${m.content.length > 80 ? "..." : ""}"`,
    );
  });
  console.log("█".repeat(70));

  const lcMessages: BaseMessage[] = messages.map((m) => {
    if (m.role === "system") return new SystemMessage(m.content);
    if (m.role === "assistant") return new AIMessage(m.content);
    return new HumanMessage(m.content);
  });

  const startNode = modeToNode[mode];
  console.log("[GRAPH] Starting node:", startNode);

  const result = await graph.invoke({
    messages: lcMessages,
    next: startNode,
  });

  console.log("[GRAPH] Graph execution complete");
  console.log("[GRAPH] Final state.next:", result.next);
  console.log("[GRAPH] Final messages count:", result.messages.length);

  const lastMessage = result.messages[result.messages.length - 1];
  const response =
    typeof lastMessage?.content === "string"
      ? lastMessage.content
      : String(lastMessage?.content ?? "");

  let usedMode = mode;
  if (mode === "auto" && result.next) {
    const nodeToMode: Record<string, ChatMode> = {
      chat: "chat",
      reasoner: "reasoning",
      web_search: "web",
    };
    usedMode = nodeToMode[result.next] || "chat";
  }

  console.log("[GRAPH] usedMode:", usedMode);
  console.log("[GRAPH] response length:", response.length);
  console.log("█".repeat(70) + "\n");

  return { response, usedMode };
}

/**
 * Simple single-turn chat helper for quick integrations.
 * @param query The user's query
 * @param mode The chat mode
 * @param context Optional context to prepend as a system message
 */
export async function graphChat(
  query: string,
  mode: ChatMode = "auto",
  context?: string,
): Promise<{ response: string; usedMode: string }> {
  const messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }> = [];

  if (context) {
    messages.push({
      role: "system",
      content: `Context from the codebase:\n${context}`,
    });
  }

  messages.push({ role: "user", content: query });

  return invokeGraph(messages, mode);
}
