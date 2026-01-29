// in src/services/ai.ts
import "dotenv/config";
import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (OPENAI_API_KEY == undefined) {
  throw new Error("Failed to retrieve OPENAI_API_KEY");
}

const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export type GhostCompletionOptions = {
  prefix: string;
  suffix: string;
  language?: string;
  model?: string;
  maxTokens?: number;
};

// We cannot have out ghost completion in a langgraph
// that would slow and this needs to be fast to be usable

/**
 * Generates a ghost code completion based on the cursor position.
 * We usually pass a few lines before the cursor as prefix and a few
 * lines after the cursor as suffix.
 * We probably need to call this function from the editor?
 *
 * TODO: Needs more refining, and support for other languages.
 * TODO: Improve usage of codex-mini. It doesn't work well.
 */
export async function ghostCompletion({
  prefix,
  suffix,
  language = "typescript",
  model = "gpt-5.1-codex-mini",
  maxTokens = 128,
}: GhostCompletionOptions): Promise<string> {
  console.log("[AI] ghostCompletion start", {
    language,
    model,
    maxTokens,
    prefixLen: prefix?.length,
    suffixLen: suffix?.length,
  });

  if (prefix.trim().length < 3) {
    return "";
  }

  console.log("[AI] OPENAI_API_KEY present?", !!OPENAI_API_KEY);

  if (!OPENAI_API_KEY) {
    console.error("[AI] OPENAI_API_KEY is not set");
    throw new Error("OPENAI_API_KEY is not set");
  }

  let safePrefix = prefix.replace(/[\/\.\(\[\{]$/, "");
  safePrefix = safePrefix.replace(/([+\-*/=])$/, "$1 ");
  let safeSuffix = suffix;
  if (safeSuffix.trim() === "}") {
    safeSuffix = "";
  }

  const chosenModel = shouldUseStructuralModel(prefix, language)
    ? "gpt-4.1-mini"
    : "gpt-5.1-codex-mini";

  const rules = shouldUseStructuralModel(prefix, language)
    ? `- You may generate a full valid construct.
	`
    : `- Prefer short continuations.
- It is allowed to continue partial expressions.
	;`;

  try {
    console.log("[AI] invoking LLM... (truncating prompts in logs)");
    const response = await client.responses.create({
      model: chosenModel,
      text: {
        format: { type: "text" },
      },
      max_output_tokens: maxTokens,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `You are a precise code completion engine.
Rules:
- Fill in the missing code between PREFIX and SUFFIX.
- Output ONLY the code.
- Do NOT include PREFIX or SUFFIX.
- Do NOT use markdown.
- Prefer methods consistent with surrounding functions.
- Prefer generating complete functions at top level.
${rules}
- If nothing fits, output an empty string.
- Respect indentation.

Language: ${language}

[PREFIX]
${safePrefix}
[SUFFIX]
${safeSuffix}

[COMPLETION]
`,
            },
          ],
        },
      ],
    });

    console.log("[AI] llm.invoke response keys:", Object.keys(response || {}));
    // Log a truncated view of the response to aid debugging without spamming logs
    try {
      const truncated = JSON.stringify(
        {
          id: (response as any)?.id,
          model: (response as any)?.model,
          output_text: (response as any)?.output_text,
          output_preview: Array.isArray((response as any)?.output)
            ? (response as any).output.slice(0, 3)
            : (response as any)?.output,
        },
        null,
        2,
      ).slice(0, 2000);
      console.log("[AI] llm.invoke response (truncated):", truncated);
    } catch (e) {
      console.log("[AI] llm.invoke response (could not stringify):", e);
    }

    let completion = (response as any).output_text || "";
    console.log("[AI] raw completion length:", completion.length);
    console.log(
      "[AI] raw completion (first 2000 chars):",
      completion.slice(0, 2000),
    );

    // a little cleanup just in case
    if (completion.startsWith("```")) {
      completion = completion
        .replace(/^```[a-z]*\n?/, "")
        .replace(/\n?```$/, "");
      console.log("[AI] stripped code fences, new length:", completion.length);
    }

    console.log("[AI] final completion length:", completion.length);
    return completion;
  } catch (err) {
    console.error("[AI] ghostCompletion error:", err);
    throw err;
  }
}

// miniature router for rust
// have to improve this router
function shouldUseStructuralModel(prefix: string, language: string) {
  const p = prefix.trim();

  if (language === "rust") {
    return (
      p === "fn" ||
      p.startsWith("fn") ||
      p.startsWith("struct") ||
      p.startsWith("impl") ||
      p.endsWith("{")
    );
  }

  if (language === "typescript") {
    return (
      p === "f" ||
      p === "fu" ||
      p === "fun" ||
      p.startsWith("function") ||
      p.startsWith("export function") ||
      p.endsWith("\n\n") ||
      p.endsWith("\n")
    );
  }

  return false;
}

import { graphChat, invokeGraph, ChatMode } from "./agent/graph";

/**
 * Chat using the LangGraph multi-agent system.
 * Routes through supervisor in auto mode or directly to the selected node.
 * Supports full conversation history for multi-turn conversations.
 */
export async function graphBasedChat({
  query,
  mode = "auto",
  context,
  history,
}: {
  query: string;
  mode?: ChatMode;
  context?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<{ response: string; usedMode: string }> {
  console.log("\n" + "-".repeat(70));
  console.log("[AI Service] graphBasedChat START");
  console.log("[AI Service] mode:", mode);
  console.log("[AI Service] hasContext:", !!context);
  console.log("[AI Service] historyLength:", history?.length || 0);
  console.log("[AI Service] query:", query?.slice(0, 100));
  console.log("-".repeat(70));

  try {
    // Build messages array with history
    const messages: Array<{
      role: "user" | "assistant" | "system";
      content: string;
    }> = [];

    // Add context as system message if provided
    if (context) {
      messages.push({
        role: "system",
        content: `Context from the codebase:\n${context}`,
      });
    }

    // Add conversation history
    if (history && history.length > 0) {
      console.log("[AI Service] Adding", history.length, "history messages");
      for (const msg of history) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Add current query
    messages.push({ role: "user", content: query });

    console.log("[AI Service] Total messages for graph:", messages.length);
    console.log("[AI Service] Calling invokeGraph...");

    const result = await invokeGraph(messages, mode as ChatMode);

    console.log("[AI Service] graphBasedChat COMPLETE");
    console.log("[AI Service] usedMode:", result.usedMode);
    console.log("[AI Service] responseLength:", result.response?.length);
    console.log("-".repeat(70) + "\n");

    return result;
  } catch (err) {
    console.error("[AI Service] graphBasedChat ERROR:", err);
    throw err;
  }
}

export type ChatOptions = {
  query: string;
  mode?: "chat" | "reasoning" | "web" | "auto";
  model?: string;
  systemPrompt?: string;
  context?: string; // RAG context
};

// This is temporary, we'll move to langgraph later
export async function chat({
  query,
  mode = "chat",
  model = "gpt-4o",
  systemPrompt = "You are a helpful AI coding assistant. You are precise and concise. Format your responses using markdown when appropriate.",
  context,
}: ChatOptions): Promise<string> {
  console.log("[AI] chat start", {
    mode,
    model,
    queryLength: query.length,
    hasContext: !!context,
  });

  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  // Build the messages array
  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [];

  // Customize system prompt based on mode
  let finalSystemPrompt = systemPrompt;
  if (mode === "reasoning") {
    finalSystemPrompt = `You are a helpful AI coding assistant with advanced reasoning capabilities. Think step by step and explain your reasoning process clearly. Format your responses using markdown.\n\n${systemPrompt}`;
  }

  messages.push({ role: "system", content: finalSystemPrompt });

  // Add context if provided (RAG)
  if (context) {
    messages.push({
      role: "system",
      content: `Here is some relevant context from the codebase:\n\n${context}\n\nUse this context to inform your response when relevant.`,
    });
  }

  messages.push({ role: "user", content: query });

  try {
    const response = await client.chat.completions.create({
      model: mode === "reasoning" ? "o1-mini" : model,
      messages,
    });

    const content = response.choices[0]?.message?.content || "";
    return content;
  } catch (err) {
    console.error("[AI] chat error:", err);
    throw err;
  }
}

/**
 * Auto mode: Uses LangGraph supervisor to route to the appropriate handler
 */
export async function autoChat({
  query,
  context,
}: {
  query: string;
  context?: string;
}): Promise<{ response: string; mode: string }> {
  console.log("[AI] autoChat - routing via LangGraph supervisor...");

  try {
    const result = await graphBasedChat({ query, mode: "auto", context });
    return { response: result.response, mode: result.usedMode };
  } catch (err) {
    console.error(
      "[AI] autoChat graph error, falling back to keyword routing:",
      err,
    );
    // Fallback to simple keyword-based routing
    const queryLower = query.toLowerCase();

    let detectedMode: "chat" | "reasoning" | "web" = "chat";

    // Check for web search indicators
    if (
      queryLower.includes("search") ||
      queryLower.includes("latest") ||
      queryLower.includes("current") ||
      queryLower.includes("news") ||
      queryLower.includes("what is") ||
      queryLower.includes("who is") ||
      queryLower.includes("find online") ||
      queryLower.includes("look up")
    ) {
      detectedMode = "web";
    }
    // Check for reasoning indicators
    else if (
      queryLower.includes("explain") ||
      queryLower.includes("why") ||
      queryLower.includes("how does") ||
      queryLower.includes("step by step") ||
      queryLower.includes("analyze") ||
      queryLower.includes("compare") ||
      queryLower.includes("debug") ||
      queryLower.includes("think through")
    ) {
      detectedMode = "reasoning";
    }

    console.log("[AI] autoChat fallback - detected mode:", detectedMode);

    if (detectedMode === "web") {
      const response = await webChat({ query, context });
      return { response, mode: "web" };
    }

    const response = await chat({ query, mode: detectedMode, context });
    return { response, mode: detectedMode };
  }
}

/**
 * Web-enhanced chat using Tavily for search
 */
export async function webChat({
  query,
  context,
}: {
  query: string;
  context?: string;
}): Promise<string> {
  console.log("[AI] webChat - searching web...");

  // Import tavily dynamically to avoid circular deps -- this is nice!
  const { tavilySearch } = await import("./tavily");

  try {
    // Search the web first
    const searchResults = await tavilySearch({
      query,
      searchDepth: "basic",
      includeAnswers: true,
      maxResults: 5,
    });

    // Build context from search results
    let webContext = "";
    if (searchResults.answer) {
      webContext += `Direct Answer: ${searchResults.answer}\n\n`;
    }
    if (searchResults.results && searchResults.results.length > 0) {
      webContext += "Web Sources:\n";
      searchResults.results.forEach((result, idx) => {
        webContext += `\n[${idx + 1}] ${result.title || "Source"}\nURL: ${result.url}\n${result.content}\n`;
      });
    }

    // Now chat with the web context
    const response = await chat({
      query: `Based on the following web search results, answer the user's question.\n\nUser Question: ${query}\n\nWeb Search Results:\n${webContext}`,
      mode: "chat",
      context,
      systemPrompt:
        "You are a helpful AI assistant with access to web search results. Use the provided search results to answer questions accurately. Cite sources when relevant using [1], [2], etc. Format your responses using markdown.",
    });

    return response;
  } catch (err) {
    console.error("[AI] webChat error:", err);
    // Fallback to regular chat if web search fails
    return chat({
      query,
      mode: "chat",
      context,
      systemPrompt:
        "You are a helpful AI assistant. Note: Web search was unavailable, answering based on training data only.",
    });
  }
}

/**
 * RAG-enhanced chat: retrieves relevant context from file or codebase
 * Routes through LangGraph for consistent response handling
 */
export async function ragChat({
  query,
  fileContent,
  filePath,
  contextMode = "file",
}: {
  query: string;
  fileContent?: string;
  filePath?: string;
  contextMode?: "file" | "codebase";
}): Promise<string> {
  console.log("[AI] ragChat - contextMode:", contextMode);

  // Import RAG utilities
  const {
    chunkByLines,
    embed,
    embedChunks,
    searchRelevantChunks,
    indexFileToHNSW,
    initHNSW,
  } = await import("./rag");

  try {
    let relevantContext = "";

    if (contextMode === "codebase") {
      // Search across entire codebase using HNSW
      console.log("[AI] ragChat - searching codebase with HNSW...");
      await initHNSW();

      const results = await searchRelevantChunks(query, 5);

      if (results.length === 0) {
        console.log("[AI] ragChat - no relevant chunks found in codebase");
        // Fall through to graph-based chat without context
      } else {
        relevantContext = results
          .map(
            (r, i) =>
              `// From ${r.filePath} (relevance: ${(r.score * 100).toFixed(1)}%):\n${r.text}`,
          )
          .join("\n\n");
        console.log(
          "[AI] ragChat - found",
          results.length,
          "relevant chunks from codebase",
        );
      }
    } else if (contextMode === "file" && fileContent) {
      // Index current file and search within it
      console.log("[AI] ragChat - searching within current file...");

      // Index the file if provided
      if (filePath) {
        await indexFileToHNSW(filePath, fileContent);
      }

      const chunks = chunkByLines(fileContent, 30);

      if (chunks.length > 0) {
        const queryEmbedding = await embed(query);
        const chunkEmbeddings = await embedChunks(chunks);

        const similarities = chunkEmbeddings.map((chunkEmb) => {
          return cosineSimilarity(queryEmbedding, chunkEmb);
        });

        // top 3 most similar chunks
        const topIndices = similarities
          .map((sim, idx) => ({ sim, idx }))
          .sort((a, b) => b.sim - a.sim)
          .slice(0, 3)
          .map((item) => item.idx);

        relevantContext = topIndices
          .map(
            (idx) =>
              `// Lines ${idx * 30 + 1}-${(idx + 1) * 30}:\n${chunks[idx]}`,
          )
          .join("\n\n");
        console.log(
          "[AI] ragChat - found relevant chunks at indices:",
          topIndices,
        );
      }
    }

    // Route through LangGraph with context
    console.log("[AI] ragChat - routing through LangGraph...");
    const result = await graphBasedChat({
      query,
      mode: "auto", // Let supervisor decide best handling
      context: relevantContext || undefined,
    });

    return result.response;
  } catch (err) {
    console.error("[AI] ragChat error:", err);
    // Fallback: pass truncated file content or just query
    const fallbackContext = fileContent
      ? fileContent.slice(0, 4000)
      : undefined;
    return chat({
      query,
      mode: "chat",
      context: fallbackContext,
    });
  }
}

/**
 * Index the entire codebase into HNSW for semantic search
 */
export async function indexEntireCodebase(): Promise<{
  indexed: number;
  skipped: number;
  errors: string[];
}> {
  console.log("[AI] indexEntireCodebase - starting...");

  const { indexCodebase, initHNSW } = await import("./rag");
  const { getTree, getFileContent } = await import("./file");

  try {
    // Initialize HNSW
    await initHNSW();

    // Get the workspace tree
    const tree = getTree();

    // Index all files
    const result = await indexCodebase(tree, getFileContent);

    console.log("[AI] indexEntireCodebase - complete:", result);
    return result;
  } catch (err) {
    console.error("[AI] indexEntireCodebase error:", err);
    throw err;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}
