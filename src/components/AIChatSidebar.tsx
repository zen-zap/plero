import React, { useState, useRef, useEffect } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";

export type ChatMode = "auto" | "chat" | "reasoning" | "web";

interface Message {
  role: "user" | "assistant";
  content: string;
  mode?: ChatMode;
}

interface AIChatSidebarProps {
  width: number;
  onClose: () => void;
  activeFileContent?: string;
  activeFilePath?: string;
}

const ModeIcon: React.FC<{ mode: ChatMode }> = ({ mode }) => {
  switch (mode) {
    case "auto":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      );
    case "chat":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "reasoning":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5 7.4V19a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1.6c2.9-1.1 5-4 5-7.4a8 8 0 0 0-8-8z" />
          <path d="M9 22h6" />
        </svg>
      );
    case "web":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
  }
};

const modeLabels: Record<ChatMode, string> = {
  auto: "Auto",
  chat: "Chat",
  reasoning: "Reason",
  web: "Web",
};

const modeDescriptions: Record<ChatMode, string> = {
  auto: "Automatically selects the best mode",
  chat: "Standard conversation",
  reasoning: "Deep thinking & analysis",
  web: "Search the web for answers",
};

export const AIChatSidebar: React.FC<AIChatSidebarProps> = ({
  width,
  onClose,
  activeFileContent,
  activeFilePath,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! How can I help you with your code today?\n\nYou can:\n- Ask questions about your code\n- Get explanations\n- Search the web\n- Use different modes for different tasks",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>("auto");
  const [useContext, setUseContext] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close mode menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modeMenuRef.current &&
        !modeMenuRef.current.contains(e.target as Node)
      ) {
        setShowModeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      let response;

      // If context is enabled and we have file content, use RAG
      if (useContext && activeFileContent) {
        response = await window.electronAPI.aiRagChat({
          query: userMessage.content,
          fileContent: activeFileContent,
          filePath: activeFilePath,
        });
      } else {
        response = await window.electronAPI.aiChat({
          query: userMessage.content,
          mode: mode,
          context:
            useContext && activeFileContent
              ? activeFileContent.slice(0, 2000)
              : undefined,
        });
      }

      if (response.ok && response.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.data as string,
            mode: (response as any).mode || mode,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `**Error:** ${response.error || "Unknown error"}`,
          },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `**Error:** ${e instanceof Error ? e.message : String(e)}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared. How can I help you?",
      },
    ]);
  };

  return (
    <aside
      className="h-full bg-prussian-blue flex flex-col border-l border-ink-black"
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-ink-black">
        <div className="flex items-center gap-2">
          <h1 className="text-xs font-bold text-lavender-grey uppercase tracking-wider">
            AI Chat
          </h1>
          {/* Mode indicator badge */}
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-black text-dusk-blue">
            {modeLabels[mode]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            title="Clear chat"
            onClick={clearChat}
            className="text-lavender-grey hover:text-alabaster-grey p-1.5 rounded hover:bg-ink-black/30 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
          <button
            title="Close chat (Ctrl+Shift+B)"
            onClick={onClose}
            className="text-lavender-grey hover:text-alabaster-grey p-1.5 rounded hover:bg-ink-black/30 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-lg px-3 py-2 ${
                msg.role === "user"
                  ? "bg-dusk-blue text-white text-sm"
                  : "bg-ink-black text-alabaster-grey border border-ink-black/50"
              }`}
            >
              {msg.role === "assistant" ? (
                <div>
                  {msg.mode && msg.mode !== "chat" && (
                    <div className="flex items-center gap-1 text-[10px] text-lavender-grey mb-1.5 opacity-70">
                      <ModeIcon mode={msg.mode} />
                      <span>{modeLabels[msg.mode]} mode</span>
                    </div>
                  )}
                  <MarkdownRenderer content={msg.content} />
                </div>
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-ink-black text-lavender-grey text-sm px-3 py-2 rounded-lg border border-ink-black/50 flex items-center gap-2">
              <span
                className="w-2 h-2 bg-lavender-grey rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-lavender-grey rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-lavender-grey rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-ink-black bg-sidebar-bg space-y-2">
        {/* Mode & Context Controls */}
        <div className="flex items-center justify-between gap-2">
          {/* Mode Selector */}
          <div className="relative" ref={modeMenuRef}>
            <button
              onClick={() => setShowModeMenu(!showModeMenu)}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-lavender-grey hover:text-alabaster-grey hover:bg-ink-black/30 transition-colors border border-ink-black/50"
            >
              <ModeIcon mode={mode} />
              <span>{modeLabels[mode]}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showModeMenu && (
              <div className="absolute bottom-full left-0 mb-1 bg-ink-black border border-ink-black/50 rounded-md shadow-lg py-1 min-w-[140px] z-10">
                {(["auto", "chat", "reasoning", "web"] as ChatMode[]).map(
                  (m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m);
                        setShowModeMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-dusk-blue/20 transition-colors ${
                        mode === m
                          ? "text-dusk-blue bg-dusk-blue/10"
                          : "text-alabaster-grey"
                      }`}
                    >
                      <ModeIcon mode={m} />
                      <div>
                        <div className="font-medium">{modeLabels[m]}</div>
                        <div className="text-[10px] text-lavender-grey">
                          {modeDescriptions[m]}
                        </div>
                      </div>
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Context Toggle */}
          <button
            onClick={() => setUseContext(!useContext)}
            title={
              useContext
                ? "Context enabled - using current file"
                : "Enable context from current file"
            }
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors border ${
              useContext
                ? "text-dusk-blue border-dusk-blue/50 bg-dusk-blue/10"
                : "text-lavender-grey border-ink-black/50 hover:text-alabaster-grey hover:bg-ink-black/30"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>Context</span>
            {useContext && activeFilePath && (
              <span className="text-[10px] text-lavender-grey max-w-[60px] truncate">
                {activeFilePath.split("/").pop()}
              </span>
            )}
          </button>
        </div>

        {/* Text Input */}
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              useContext ? "Ask about your code..." : "Ask anything..."
            }
            className="w-full bg-ink-black text-alabaster-grey text-sm rounded-lg border border-gray-700 focus:border-dusk-blue focus:outline-none p-3 pr-10 resize-none custom-scrollbar"
            style={{
              minHeight: "44px",
              maxHeight: "120px",
            }}
            rows={1}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 bottom-2 p-1.5 rounded-md transition-colors ${
              !input.trim() || isLoading
                ? "text-gray-600 cursor-not-allowed"
                : "text-dusk-blue hover:bg-dusk-blue/20"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        {/* Footer hint */}
        <div className="text-[10px] text-lavender-grey/60 text-center">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </aside>
  );
};
