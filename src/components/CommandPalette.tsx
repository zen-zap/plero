import React, { useState, useEffect, useRef, useCallback } from "react";

export interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  category?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
}) => {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      cmd.category?.toLowerCase().includes(search.toLowerCase()),
  );

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && filteredCommands.length > 0) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, filteredCommands.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredCommands, selectedIndex, onClose],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[12vh] z-[100] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-[560px] max-w-[90vw] bg-prussian-blue/95 backdrop-blur-xl border border-dusk-blue/40 rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(65, 90, 119, 0.15)",
        }}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-dusk-blue/30">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-lavender-grey/50"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search commands..."
              className="w-full bg-ink-black/80 text-alabaster-grey text-sm rounded-xl border border-dusk-blue/30 focus:border-dusk-blue focus:outline-none focus:ring-2 focus:ring-dusk-blue/20 pl-10 pr-4 py-3 placeholder-lavender-grey/40"
            />
          </div>
        </div>

        {/* Command List */}
        <div
          ref={listRef}
          className="max-h-[340px] overflow-y-auto custom-scrollbar py-2"
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="text-4xl mb-3 opacity-30">🔍</div>
              <div className="text-lavender-grey/60 text-sm">
                No commands found
              </div>
              <div className="text-lavender-grey/40 text-xs mt-1">
                Try a different search term
              </div>
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <div
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                className={`mx-2 px-4 py-3 flex items-center justify-between cursor-pointer rounded-xl transition-all duration-150 ${
                  index === selectedIndex
                    ? "bg-dusk-blue/30 text-alabaster-grey shadow-lg"
                    : "text-lavender-grey hover:bg-dusk-blue/15"
                }`}
              >
                <div className="flex items-center gap-3">
                  {cmd.category && (
                    <span className="text-[10px] px-2 py-1 rounded-md bg-ink-black/60 text-dusk-blue uppercase font-semibold tracking-wider">
                      {cmd.category}
                    </span>
                  )}
                  <span className="text-sm font-medium">{cmd.label}</span>
                </div>
                {cmd.shortcut && (
                  <kbd className="text-[11px] text-lavender-grey/60 font-mono bg-ink-black/40 px-2 py-1 rounded-md border border-dusk-blue/20">
                    {cmd.shortcut}
                  </kbd>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-dusk-blue/30 bg-ink-black/30 flex items-center justify-center gap-6 text-[11px] text-lavender-grey/50">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-ink-black/50 rounded border border-dusk-blue/20">
              ↑↓
            </kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-ink-black/50 rounded border border-dusk-blue/20">
              ↵
            </kbd>
            Select
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-ink-black/50 rounded border border-dusk-blue/20">
              Esc
            </kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
};
