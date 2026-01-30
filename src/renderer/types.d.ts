import { TreeNode } from "../components/FileExplorer";

// Standard API response type for all IPC calls
export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

// File stat result type -- need documentation here
export type FileStat = {
  size: number;
  mtime: Date;
  ctime: Date;
  atime: Date;
  isFile: boolean;
  isDirectory: boolean;
  mode: number;
  ino: number;
  uid: number;
  gid: number;
};

// AI Ghost Completion options
export type GhostOptions = {
  prefix: suffix;
  suffix: string;
  language: string;
};

// AI completion options
export type CompletionOptions = {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

// AI chat options
export type ChatOptions = {
  query: string;
  mode?: "chat" | "reasoning" | "web" | "auto";
  context?: string;
  model?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

// AI RAG chat options
export type RagChatOptions = {
  query: string;
  fileContent?: string;
  filePath?: string;
  contextMode?: "file" | "codebase";
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

// Index codebase result
export type IndexCodebaseResult = {
  indexed: number;
  skipped: number;
  errors: string[];
};

// AI chat response
export type ChatResponse = {
  data: string;
  mode?: string;
};

// AI classify options
export type ClassifyOptions = {
  query: string;
  model?: string;
};

// RAG completion options
export type RagCompletionOptions = {
  fileContent: string;
  prompt: string;
  model?: string;
};

// Tavily search options
export type TavilySearchOptions = {
  query: string;
  searchDepth?: "basic" | "advanced";
  includeAnswers?: boolean;
  includeImages?: boolean;
  maxResults?: number;
};

// Tavily search result
export type TavilySearchResult = {
  answer?: string;
  images?: string[];
  follow_up_questions?: string[];
  results: Array<{
    url: string;
    content: string;
    title?: string;
  }>;
};

declare global {
  interface Window {
    electronAPI: {
      // File operations
      getTree: () => Promise<ApiResponse<TreeNode[]>>;
      getFileContent: (path: string) => Promise<ApiResponse<string>>;
      saveFile: (path: string, content: string) => Promise<ApiResponse<void>>;
      delFile: (path: string) => Promise<ApiResponse<void>>;
      createFolder: (path: string) => Promise<ApiResponse<void>>;
      renamePath: (
        oldPath: string,
        newPath: string,
      ) => Promise<ApiResponse<void>>;
      delFolder: (path: string) => Promise<ApiResponse<void>>;
      stat: (path: string) => Promise<ApiResponse<FileStat>>;
      exists: (path: string) => Promise<ApiResponse<{ exists: boolean }>>;
      insertAtCursor: (
        path: string,
        insertion: string,
        marker?: string,
      ) => Promise<ApiResponse<void>>;
      openDialog: () => Promise<ApiResponse<string>>;
      openFolderDialog: () => Promise<{
        ok: boolean;
        data?: string;
        error?: string;
      }>;

      // root directory operations
      setRoot: (path: string) => Promise<{ ok: boolean; error?: string }>;
      getRoot: () => Promise<{ ok: boolean; data?: string; error?: string }>;

      // AI operations
      aiGhost: (options: GhostOptions) => Promise<ApiResponse<string>>;
      aiComplete: (
        options: CompletionOptions,
      ) => Promise<ApiResponse<{ content: string }>>;
      aiChat: (
        options: ChatOptions,
      ) => Promise<ApiResponse<string> & { mode?: string }>;
      aiRagChat: (options: RagChatOptions) => Promise<ApiResponse<string>>;
      indexCodebase: () => Promise<ApiResponse<IndexCodebaseResult>>;
      aiClassify: (options: ClassifyOptions) => Promise<ApiResponse<number>>;
      aiCompletionRag: (
        options: RagCompletionOptions,
      ) => Promise<ApiResponse<string>>;

      // Tavily operations
      tavilySearch: (
        options: TavilySearchOptions,
      ) => Promise<ApiResponse<TavilySearchResult>>;

      // Window operations
      zoomIn: () => Promise<ApiResponse<void>>;
      zoomOut: () => Promise<ApiResponse<void>>;
      resetZoom: () => Promise<ApiResponse<void>>;
    };
  }
}

export {};
