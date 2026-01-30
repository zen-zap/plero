/**
 * Token management utilities for AI context handling.
 *
 * This module provides:
 * - Approximate token counting (using character heuristics)
 * - Context truncation to stay within model limits
 * - History pruning strategies
 * - Message prioritization
 */

// Token estimation: ~4 chars per token for English/code (conservative estimate)
// GPT tokenizers vary, but this is a safe approximation
const CHARS_PER_TOKEN = 4;

// Model context limits (output tokens reserved separately)
export const MODEL_LIMITS: Record<string, number> = {
  "gpt-4o": 128000,
  "gpt-4": 8192,
  "gpt-4-turbo": 128000,
  "gpt-5-mini": 128000,
  "gpt-5-mini-2025-08-07": 128000,
  "gpt-5.2": 128000,
  "o1-mini": 128000,
  default: 16000,
};

// Reserve tokens for the response
const RESPONSE_TOKEN_RESERVE = 4000;

// Minimum context to keep (don't truncate below this)
const MIN_CONTEXT_TOKENS = 2000;

/**
 * Estimate token count from a string.
 * Uses character-based heuristic (~4 chars/token).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Estimate tokens for a message array.
 */
export function estimateMessagesTokens(
  messages: Array<{ role: string; content: string }>,
): number {
  // Each message has ~4 token overhead for role/formatting
  const MESSAGE_OVERHEAD = 4;
  return messages.reduce((total, msg) => {
    return total + estimateTokens(msg.content) + MESSAGE_OVERHEAD;
  }, 0);
}

/**
 * Get available tokens for context given a model and existing messages.
 */
export function getAvailableContextTokens(
  model: string,
  existingMessages: Array<{ role: string; content: string }>,
): number {
  const limit = MODEL_LIMITS[model] || MODEL_LIMITS["default"];
  const used = estimateMessagesTokens(existingMessages);
  const available = limit - used - RESPONSE_TOKEN_RESERVE;
  return Math.max(available, MIN_CONTEXT_TOKENS);
}

export interface TruncationResult {
  text: string;
  originalTokens: number;
  truncatedTokens: number;
  wasTruncated: boolean;
}

/**
 * Truncate text to fit within a token limit.
 * Tries to truncate at natural boundaries (newlines, sentences).
 */
export function truncateToTokenLimit(
  text: string,
  maxTokens: number,
): TruncationResult {
  const originalTokens = estimateTokens(text);

  if (originalTokens <= maxTokens) {
    return {
      text,
      originalTokens,
      truncatedTokens: originalTokens,
      wasTruncated: false,
    };
  }

  // Calculate target character count
  const targetChars = maxTokens * CHARS_PER_TOKEN;

  // Try to truncate at a natural boundary
  let truncated = text.slice(0, targetChars);

  // Try to end at a newline
  const lastNewline = truncated.lastIndexOf("\n");
  if (lastNewline > targetChars * 0.8) {
    truncated = truncated.slice(0, lastNewline);
  }

  // Add truncation indicator
  truncated += "\n\n[... content truncated to fit context window ...]";

  return {
    text: truncated,
    originalTokens,
    truncatedTokens: estimateTokens(truncated),
    wasTruncated: true,
  };
}

export interface PrunedHistory {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  originalCount: number;
  prunedCount: number;
  originalTokens: number;
  prunedTokens: number;
}

/**
 * Prune conversation history to fit within a token budget.
 *
 * Strategy:
 * 1. Always keep the most recent messages (they're most relevant)
 * 2. Summarize or drop older messages if needed
 * 3. Preserve alternating user/assistant pattern
 */
export function pruneHistory(
  history: Array<{ role: "user" | "assistant"; content: string }>,
  maxTokens: number,
  options: {
    keepMinMessages?: number;
    truncateLongMessages?: boolean;
    maxMessageTokens?: number;
  } = {},
): PrunedHistory {
  const {
    keepMinMessages = 4,
    truncateLongMessages = true,
    maxMessageTokens = 2000,
  } = options;

  const originalCount = history.length;
  const originalTokens = estimateMessagesTokens(history);

  if (originalTokens <= maxTokens && !truncateLongMessages) {
    return {
      messages: history,
      originalCount,
      prunedCount: originalCount,
      originalTokens,
      prunedTokens: originalTokens,
    };
  }

  // First pass: truncate overly long individual messages
  let processedHistory = truncateLongMessages
    ? history.map((msg) => {
        const msgTokens = estimateTokens(msg.content);
        if (msgTokens > maxMessageTokens) {
          const truncated = truncateToTokenLimit(msg.content, maxMessageTokens);
          return { ...msg, content: truncated.text };
        }
        return msg;
      })
    : history;

  // Check if we're within budget after truncation
  let currentTokens = estimateMessagesTokens(processedHistory);
  if (currentTokens <= maxTokens) {
    return {
      messages: processedHistory,
      originalCount,
      prunedCount: processedHistory.length,
      originalTokens,
      prunedTokens: currentTokens,
    };
  }

  // Second pass: drop older messages, keeping recent ones
  // Work backwards from the end
  const result: typeof processedHistory = [];
  let tokenBudget = maxTokens;

  for (let i = processedHistory.length - 1; i >= 0; i--) {
    const msg = processedHistory[i];
    const msgTokens = estimateTokens(msg.content) + 4; // +4 for overhead

    if (tokenBudget >= msgTokens || result.length < keepMinMessages) {
      result.unshift(msg);
      tokenBudget -= msgTokens;
    } else {
      // We've hit our budget, but ensure we have minimum messages
      if (result.length < keepMinMessages) {
        // Force include but truncate heavily
        const truncated = truncateToTokenLimit(msg.content, 200);
        result.unshift({ ...msg, content: truncated.text });
      }
      break;
    }
  }

  return {
    messages: result,
    originalCount,
    prunedCount: result.length,
    originalTokens,
    prunedTokens: estimateMessagesTokens(result),
  };
}

export interface ContextChunk {
  text: string;
  filePath: string;
  score: number;
}

export interface PrunedContext {
  chunks: ContextChunk[];
  combinedText: string;
  originalChunks: number;
  keptChunks: number;
  originalTokens: number;
  prunedTokens: number;
}

/**
 * Prune RAG context chunks to fit within a token budget.
 *
 * Strategy:
 * 1. Chunks are already sorted by relevance score
 * 2. Keep as many top chunks as fit
 * 3. Truncate the last chunk if it partially fits
 */
export function pruneContextChunks(
  chunks: ContextChunk[],
  maxTokens: number,
): PrunedContext {
  const originalChunks = chunks.length;
  const originalTokens = chunks.reduce(
    (sum, c) => sum + estimateTokens(c.text),
    0,
  );

  if (originalTokens <= maxTokens) {
    return {
      chunks,
      combinedText: formatChunksAsContext(chunks),
      originalChunks,
      keptChunks: chunks.length,
      originalTokens,
      prunedTokens: originalTokens,
    };
  }

  const result: ContextChunk[] = [];
  let tokenBudget = maxTokens;
  const CHUNK_OVERHEAD = 50; // Overhead for formatting each chunk

  for (const chunk of chunks) {
    const chunkTokens = estimateTokens(chunk.text) + CHUNK_OVERHEAD;

    if (tokenBudget >= chunkTokens) {
      result.push(chunk);
      tokenBudget -= chunkTokens;
    } else if (tokenBudget > CHUNK_OVERHEAD + 100) {
      // Partial fit - truncate this chunk
      const availableForText = tokenBudget - CHUNK_OVERHEAD;
      const truncated = truncateToTokenLimit(chunk.text, availableForText);
      result.push({ ...chunk, text: truncated.text });
      break;
    } else {
      // No more room
      break;
    }
  }

  const combinedText = formatChunksAsContext(result);

  return {
    chunks: result,
    combinedText,
    originalChunks,
    keptChunks: result.length,
    originalTokens,
    prunedTokens: estimateTokens(combinedText),
  };
}

/**
 * Format context chunks into a single string for the prompt.
 */
function formatChunksAsContext(chunks: ContextChunk[]): string {
  if (chunks.length === 0) return "";

  return chunks
    .map(
      (c, i) =>
        `// [${i + 1}] From ${c.filePath} (relevance: ${(c.score * 100).toFixed(1)}%):\n${c.text}`,
    )
    .join("\n\n");
}

/**
 * Comprehensive context preparation for a chat request.
 * Balances history, RAG context, and current query within model limits.
 */
export function prepareContextForChat(options: {
  model: string;
  systemPrompt?: string;
  query: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  contextChunks?: ContextChunk[];
}): {
  systemPrompt: string | undefined;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  context: string;
  query: string;
  tokenBreakdown: {
    system: number;
    history: number;
    context: number;
    query: number;
    total: number;
    limit: number;
  };
} {
  const {
    model,
    systemPrompt,
    query,
    history = [],
    contextChunks = [],
  } = options;

  const limit = MODEL_LIMITS[model] || MODEL_LIMITS["default"];
  const availableTokens = limit - RESPONSE_TOKEN_RESERVE;

  // Fixed costs
  const systemTokens = systemPrompt ? estimateTokens(systemPrompt) : 0;
  const queryTokens = estimateTokens(query);
  const fixedCost = systemTokens + queryTokens + 50; // 50 for message formatting

  // Remaining budget for history and context
  const remainingBudget = availableTokens - fixedCost;

  // Allocate budget: 40% history, 60% context (adjustable)
  const historyBudget = Math.floor(remainingBudget * 0.4);
  const contextBudget = Math.floor(remainingBudget * 0.6);

  // Prune history
  const prunedHistory = pruneHistory(history, historyBudget);

  // Prune context
  const prunedContext = pruneContextChunks(contextChunks, contextBudget);

  const tokenBreakdown = {
    system: systemTokens,
    history: prunedHistory.prunedTokens,
    context: prunedContext.prunedTokens,
    query: queryTokens,
    total:
      systemTokens +
      prunedHistory.prunedTokens +
      prunedContext.prunedTokens +
      queryTokens,
    limit: availableTokens,
  };

  console.log("[TokenManager] Context prepared:", {
    historyOriginal: history.length,
    historyKept: prunedHistory.prunedCount,
    contextOriginal: contextChunks.length,
    contextKept: prunedContext.keptChunks,
    tokenBreakdown,
  });

  return {
    systemPrompt,
    history: prunedHistory.messages,
    context: prunedContext.combinedText,
    query,
    tokenBreakdown,
  };
}
