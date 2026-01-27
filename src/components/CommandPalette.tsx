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
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[15vh] z-[100]"
      onClick={onClose}
    >
      <div
        className="w-[500px] max-w-[90vw] bg-prussian-blue border border-dusk-blue rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-3 border-b border-dusk-blue/50">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="w-full bg-ink-black text-alabaster-grey text-sm rounded border border-gray-700 focus:border-dusk-blue focus:outline-none px-3 py-2"
          />
        </div>

        {/* Command List */}
        <div
          ref={listRef}
          className="max-h-[300px] overflow-y-auto custom-scrollbar"
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-lavender-grey/60 text-sm">
              No commands found
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <div
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                  index === selectedIndex
                    ? "bg-dusk-blue/30 text-alabaster-grey"
                    : "text-lavender-grey hover:bg-dusk-blue/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  {cmd.category && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-black text-dusk-blue uppercase">
                      {cmd.category}
                    </span>
                  )}
                  <span className="text-sm">{cmd.label}</span>
                </div>
                {cmd.shortcut && (
                  <span className="text-xs text-lavender-grey/50 font-mono">
                    {cmd.shortcut}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-dusk-blue/50 flex items-center justify-between text-[10px] text-lavender-grey/50">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
};
