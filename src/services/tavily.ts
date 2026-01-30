import dotenv from "dotenv";
import path from "path";
import os from "os";

// Load API keys from ~/.plero_keys/.env
dotenv.config({ path: path.join(os.homedir(), ".plero_keys", ".env") });

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
if (!TAVILY_API_KEY) {
  throw new Error("TAVILY_API_KEY is not set in the environment");
}

export type TavilySearchOptions = {
  query: string;
  searchDepth?: "basic" | "advanced"; // "basic" is default, "advanced" is more expensive
  includeAnswers?: boolean; // Whether to include direct answers (default: true)
  includeImages?: boolean; // Whether to include images (default: false)
  maxResults?: number; // Max number of links to return (default: 10)
  includeRawContent?: boolean; // Whether to include raw HTML/text (default: false)
};

export type TavilySearchResult = {
  answer?: string; // Direct answer, if available
  images?: string[]; // URLs of relevant images
  follow_up_questions?: string[]; // Suggested related queries
  results: Array<{
    url: string;
    content: string;
    title?: string;
    raw_content?: string;
  }>;
};

export async function tavilySearch(
  opts: TavilySearchOptions,
): Promise<TavilySearchResult> {
  const body = {
    api_key: TAVILY_API_KEY,
    query: opts.query,
    search_depth: opts.searchDepth ?? "basic",
    include_answers: opts.includeAnswers ?? true,
    include_images: opts.includeImages ?? false,
    include_raw_content: opts.includeRawContent ?? false,
    max_results: opts.maxResults ?? 10,
  };

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tavily API error: ${response.status} - ${text}`);
  }

  const data = await response.json();
  // Validate/shape as needed for your app
  return data as TavilySearchResult;
}
