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
      className="h-full bg-gradient-to-b from-prussian-blue to-ink-black flex flex-col border-l border-dusk-blue/20"
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-dusk-blue/20 bg-ink-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* AI Icon */}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-dusk-blue to-prussian-blue flex items-center justify-center shadow-lg">
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
              className="text-alabaster-grey"
            >
              <path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5 7.4V19a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1.6c2.9-1.1 5-4 5-7.4a8 8 0 0 0-8-8z" />
              <path d="M9 22h6" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-alabaster-grey">
              Copilot
            </h1>
            {/* Mode indicator badge */}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-dusk-blue/20 text-dusk-blue border border-dusk-blue/30">
              {modeLabels[mode]}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            title="Clear chat"
            onClick={clearChat}
            className="text-lavender-grey hover:text-alabaster-grey p-2 rounded-lg hover:bg-dusk-blue/20 transition-all duration-200"
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
            className="text-lavender-grey hover:text-alabaster-grey p-2 rounded-lg hover:bg-dusk-blue/20 transition-all duration-200"
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
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-lg ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-dusk-blue to-prussian-blue text-white text-sm"
                  : "bg-ink-black/80 backdrop-blur-sm text-alabaster-grey border border-dusk-blue/20"
              }`}
            >
              {msg.role === "assistant" ? (
                <div>
                  {msg.mode && msg.mode !== "chat" && (
                    <div className="flex items-center gap-1.5 text-[10px] text-dusk-blue mb-2 px-2 py-1 bg-dusk-blue/10 rounded-full w-fit">
                      <ModeIcon mode={msg.mode} />
                      <span className="font-medium">
                        {modeLabels[msg.mode]} mode
                      </span>
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
          <div className="flex justify-start animate-fade-in">
            <div className="bg-ink-black/80 backdrop-blur-sm text-lavender-grey text-sm px-4 py-3 rounded-2xl border border-dusk-blue/20 flex items-center gap-2 shadow-lg">
              <span
                className="w-2 h-2 bg-dusk-blue rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-dusk-blue rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-dusk-blue rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-dusk-blue/20 bg-ink-black/50 backdrop-blur-sm space-y-3">
        {/* Mode & Context Controls */}
        <div className="flex items-center justify-between gap-2">
          {/* Mode Selector */}
          <div className="relative" ref={modeMenuRef}>
            <button
              onClick={() => setShowModeMenu(!showModeMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-lavender-grey hover:text-alabaster-grey hover:bg-dusk-blue/20 transition-all duration-200 border border-dusk-blue/30"
            >
              <ModeIcon mode={mode} />
              <span className="font-medium">{modeLabels[mode]}</span>
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
                className={`transition-transform duration-200 ${showModeMenu ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showModeMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-ink-black/95 backdrop-blur-xl border border-dusk-blue/30 rounded-xl shadow-2xl py-2 min-w-[180px] z-10 animate-fade-in">
                {(["auto", "chat", "reasoning", "web"] as ChatMode[]).map(
                  (m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m);
                        setShowModeMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-xs text-left hover:bg-dusk-blue/20 transition-all duration-200 ${
                        mode === m
                          ? "text-dusk-blue bg-dusk-blue/10"
                          : "text-alabaster-grey"
                      }`}
                    >
                      <ModeIcon mode={m} />
                      <div>
                        <div className="font-medium">{modeLabels[m]}</div>
                        <div className="text-[10px] text-lavender-grey/70">
                          {modeDescriptions[m]}
                        </div>
                      </div>
                      {mode === m && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="ml-auto text-dusk-blue"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 border ${
              useContext
                ? "text-dusk-blue border-dusk-blue/50 bg-dusk-blue/20 shadow-lg shadow-dusk-blue/20"
                : "text-lavender-grey border-dusk-blue/30 hover:text-alabaster-grey hover:bg-dusk-blue/20"
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
            <span className="font-medium">Context</span>
            {useContext && activeFilePath && (
              <span className="text-[10px] text-dusk-blue/80 max-w-[60px] truncate bg-dusk-blue/10 px-1.5 py-0.5 rounded">
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
            className="w-full bg-ink-black/80 text-alabaster-grey text-sm rounded-xl border border-dusk-blue/30 focus:border-dusk-blue focus:ring-2 focus:ring-dusk-blue/20 focus:outline-none p-4 pr-12 resize-none custom-scrollbar transition-all duration-200 placeholder:text-lavender-grey/50"
            style={{
              minHeight: "52px",
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
            className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all duration-200 ${
              !input.trim() || isLoading
                ? "text-gray-600 cursor-not-allowed"
                : "text-alabaster-grey bg-gradient-to-r from-dusk-blue to-prussian-blue hover:shadow-lg hover:shadow-dusk-blue/30 hover:scale-105"
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
        <div className="text-[10px] text-lavender-grey/50 text-center flex items-center justify-center gap-2">
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-ink-black/50 border border-dusk-blue/20 text-lavender-grey/70 font-mono text-[9px]">
            Enter
          </kbd>
          <span>to send</span>
          <span className="text-dusk-blue/30">•</span>
          <kbd className="px-1.5 py-0.5 rounded bg-ink-black/50 border border-dusk-blue/20 text-lavender-grey/70 font-mono text-[9px]">
            Shift+Enter
          </kbd>
          <span>for new line</span>
        </div>
      </div>
    </aside>
  );
};
