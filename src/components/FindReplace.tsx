import React, { useState, useRef, useEffect, useCallback } from "react";

interface FindReplaceProps {
  isOpen: boolean;
  onClose: () => void;
  onFind: (query: string, options: FindOptions) => void;
  onFindNext: () => void;
  onFindPrevious: () => void;
  onReplace: (replacement: string) => void;
  onReplaceAll: (replacement: string) => void;
  matchCount?: number;
  currentMatch?: number;
}

export interface FindOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
}

export const FindReplace: React.FC<FindReplaceProps> = ({
  isOpen,
  onClose,
  onFind,
  onFindNext,
  onFindPrevious,
  onReplace,
  onReplaceAll,
  matchCount = 0,
  currentMatch = 0,
}) => {
  const [findValue, setFindValue] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [showReplace, setShowReplace] = useState(false);
  const [options, setOptions] = useState<FindOptions>({
    caseSensitive: false,
    wholeWord: false,
    regex: false,
  });
  const findInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => findInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (findValue) {
      onFind(findValue, options);
    }
  }, [findValue, options, onFind]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter") {
        if (e.shiftKey) {
          onFindPrevious();
        } else {
          onFindNext();
        }
      } else if (e.key === "h" && e.ctrlKey) {
        e.preventDefault();
        setShowReplace((prev) => !prev);
      }
    },
    [onClose, onFindNext, onFindPrevious],
  );

  const toggleOption = (key: keyof FindOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-4 z-50 bg-prussian-blue border border-dusk-blue rounded-b-lg shadow-lg p-3 w-[350px]">
      {/* Find Row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <input
            ref={findInputRef}
            type="text"
            value={findValue}
            onChange={(e) => setFindValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find"
            className="w-full bg-ink-black text-alabaster-grey text-sm rounded border border-gray-700 focus:border-dusk-blue focus:outline-none px-3 py-1.5 pr-16"
          />
          {findValue && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-lavender-grey/60">
              {matchCount > 0 ? `${currentMatch}/${matchCount}` : "No results"}
            </span>
          )}
        </div>

        {/* Navigation buttons */}
        <button
          onClick={onFindPrevious}
          className="p-1.5 text-lavender-grey hover:text-alabaster-grey hover:bg-ink-black/50 rounded transition-colors"
          title="Previous match (Shift+Enter)"
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
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
        <button
          onClick={onFindNext}
          className="p-1.5 text-lavender-grey hover:text-alabaster-grey hover:bg-ink-black/50 rounded transition-colors"
          title="Next match (Enter)"
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
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <button
          onClick={onClose}
          className="p-1.5 text-lavender-grey hover:text-alabaster-grey hover:bg-ink-black/50 rounded transition-colors"
          title="Close (Esc)"
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

      {/* Options Row */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => toggleOption("caseSensitive")}
          className={`px-2 py-1 text-xs rounded border transition-colors ${
            options.caseSensitive
              ? "border-dusk-blue bg-dusk-blue/20 text-dusk-blue"
              : "border-gray-700 text-lavender-grey/60 hover:text-lavender-grey"
          }`}
          title="Match Case"
        >
          Aa
        </button>
        <button
          onClick={() => toggleOption("wholeWord")}
          className={`px-2 py-1 text-xs rounded border transition-colors ${
            options.wholeWord
              ? "border-dusk-blue bg-dusk-blue/20 text-dusk-blue"
              : "border-gray-700 text-lavender-grey/60 hover:text-lavender-grey"
          }`}
          title="Match Whole Word"
        >
          [ab]
        </button>
        <button
          onClick={() => toggleOption("regex")}
          className={`px-2 py-1 text-xs rounded border transition-colors ${
            options.regex
              ? "border-dusk-blue bg-dusk-blue/20 text-dusk-blue"
              : "border-gray-700 text-lavender-grey/60 hover:text-lavender-grey"
          }`}
          title="Use Regular Expression"
        >
          .*
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setShowReplace(!showReplace)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            showReplace
              ? "text-dusk-blue"
              : "text-lavender-grey/60 hover:text-lavender-grey"
          }`}
          title="Toggle Replace (Ctrl+H)"
        >
          Replace
        </button>
      </div>

      {/* Replace Row */}
      {showReplace && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={replaceValue}
            onChange={(e) => setReplaceValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Replace"
            className="flex-1 bg-ink-black text-alabaster-grey text-sm rounded border border-gray-700 focus:border-dusk-blue focus:outline-none px-3 py-1.5"
          />
          <button
            onClick={() => onReplace(replaceValue)}
            className="px-2 py-1.5 text-xs text-lavender-grey hover:text-alabaster-grey hover:bg-ink-black/50 rounded transition-colors"
            title="Replace"
          >
            Replace
          </button>
          <button
            onClick={() => onReplaceAll(replaceValue)}
            className="px-2 py-1.5 text-xs text-lavender-grey hover:text-alabaster-grey hover:bg-ink-black/50 rounded transition-colors"
            title="Replace All"
          >
            All
          </button>
        </div>
      )}
    </div>
  );
};
