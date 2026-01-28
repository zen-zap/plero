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


// TODO: Shift to langgraph, this is temporary for checking UI functionality
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
 * Auto mode: Classifies the query and routes to the appropriate handler
 */
export async function autoChat({
  query,
  context,
}: {
  query: string;
  context?: string;
}): Promise<{ response: string; mode: string }> {
  console.log("[AI] autoChat - classifying query...");

  // Simple classification based on keywords
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

  console.log("[AI] autoChat - detected mode:", detectedMode);

  if (detectedMode === "web") {
    const response = await webChat({ query, context });
    return { response, mode: "web" };
  }

  const response = await chat({ query, mode: detectedMode, context });
  return { response, mode: detectedMode };
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
 * RAG-enhanced chat: retrieves relevant context from the file
 */
export async function ragChat({
  query,
  fileContent,
  filePath,
}: {
  query: string;
  fileContent: string;
  filePath?: string;
}): Promise<string> {
  console.log("[AI] ragChat - building context from file...");

  // Import RAG utilities -- lazy -- 
  const { chunkByLines, embed, embedChunks } = await import("./rag");

  try {
    const chunks = chunkByLines(fileContent, 30);

    if (chunks.length === 0) {
      return chat({ query, mode: "chat" });
    }

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

    const relevantContext = topIndices
      .map(
        (idx) =>
          `// Chunk ${idx + 1} (lines ${idx * 30 + 1}-${(idx + 1) * 30}):\n${chunks[idx]}`,
      )
      .join("\n\n");

    console.log("[AI] ragChat - found relevant chunks:", topIndices);

    return chat({
      query,
      mode: "chat",
      context: relevantContext,
      systemPrompt: `You are a helpful AI coding assistant analyzing code${filePath ? ` from ${filePath}` : ""}. Use the provided code context to give accurate, specific answers. Format your responses using markdown.`,
    });
  } catch (err) {
    console.error("[AI] ragChat error:", err);
    // passing the whole file as context in case of an error
    const truncatedContent = fileContent.slice(0, 4000);
    return chat({
      query,
      mode: "chat",
      context: truncatedContent,
    });
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
