import React, { useState, useEffect, useRef } from "react";
import { useCommands } from "../renderer/contexts/ActionsContext";

interface MenuItem {
  label: string;
  action?: string;
  shortcut?: string;
  type?: "separator" | "item";
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const MENU_STRUCTURE: MenuSection[] = [
  {
    label: "File",
    items: [
      { label: "New File", action: "new", shortcut: "Ctrl+N" },
      { label: "Open File...", action: "open", shortcut: "Ctrl+O" },
      { label: "separator", type: "separator" },
      { label: "Save", action: "save", shortcut: "Ctrl+S" },
      { label: "separator", type: "separator" },
      { label: "Exit", action: "exit" },
    ],
  },
  {
    label: "Edit",
    items: [
      { label: "Undo", action: "undo", shortcut: "Ctrl+Z" },
      { label: "Redo", action: "redo", shortcut: "Ctrl+Y" },
      { label: "separator", type: "separator" },
      { label: "Cut", action: "cut", shortcut: "Ctrl+X" },
      { label: "Copy", action: "copy", shortcut: "Ctrl+C" },
      { label: "Paste", action: "paste", shortcut: "Ctrl+V" },
      { label: "separator", type: "separator" },
      { label: "Find", action: "find", shortcut: "Ctrl+F" },
      { label: "Find and Replace", action: "find-replace", shortcut: "Ctrl+H" },
    ],
  },
  {
    label: "View",
    items: [
      { label: "Toggle Sidebar", action: "toggle-sidebar", shortcut: "Ctrl+B" },
      {
        label: "Toggle AI Chat",
        action: "toggle-ai-chat",
        shortcut: "Ctrl+Shift+B",
      },
      { label: "separator", type: "separator" },
      { label: "Toggle Word Wrap", action: "toggle-word-wrap" },
      { label: "Toggle AI Completions", action: "toggle-ghost" },
      { label: "separator", type: "separator" },
      {
        label: "Command Palette",
        action: "command-palette",
        shortcut: "Ctrl+Shift+P",
      },
      { label: "separator", type: "separator" },
      { label: "Zoom In", action: "zoom-in", shortcut: "Ctrl+=" },
      { label: "Zoom Out", action: "zoom-out", shortcut: "Ctrl+-" },
    ],
  },
  {
    label: "Help",
    items: [
      { label: "Keyboard Shortcuts", action: "show-shortcuts" },
      { label: "Documentation", action: "show-docs" },
      { label: "separator", type: "separator" },
      { label: "About Plero", action: "about" },
    ],
  },
];

export const MenuBar: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { dispatch } = useCommands();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMenuClick = (label: string) => {
    if (activeMenu === label) {
      setActiveMenu(null);
    } else {
      setActiveMenu(label);
    }
  };

  const handleItemClick = (action?: string) => {
    if (action) {
      dispatch(action); // we broadcast the action to listeners
    }
    setActiveMenu(null);
  };

  const handleMouseEnter = (label: string) => {
    if (activeMenu) {
      setActiveMenu(label);
    }
  };

  return (
    <nav
      ref={menuRef}
      className="flex items-center text-sm bg-gradient-to-r from-ink-black via-ink-black to-prussian-blue/30 border-b border-dusk-blue/20 select-none sticky top-0 z-50 backdrop-blur-sm"
    >
      {/* Logo */}
      <div className="px-5 py-2 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-dusk-blue to-lavender-grey flex items-center justify-center">
          <span className="text-ink-black font-bold text-xs">P</span>
        </div>
        <span className="font-bold text-alabaster-grey tracking-wide">
          PLERO
        </span>
      </div>

      {/* Menu Items */}
      <div className="flex">
        {MENU_STRUCTURE.map((menu) => (
          <div
            key={menu.label}
            onMouseEnter={() => handleMouseEnter(menu.label)}
            onClick={() => handleMenuClick(menu.label)}
            className="relative"
          >
            <div
              className={`px-4 py-2 cursor-pointer transition-all duration-150 rounded-lg mx-0.5 ${
                activeMenu === menu.label
                  ? "text-alabaster-grey bg-dusk-blue/20"
                  : "text-lavender-grey hover:text-alabaster-grey hover:bg-dusk-blue/10"
              }`}
            >
              {menu.label}
            </div>

            {activeMenu === menu.label && (
              <div
                className="absolute mt-1 left-0 bg-prussian-blue/95 backdrop-blur-xl border border-dusk-blue/30 shadow-2xl py-2 z-50 min-w-[220px] rounded-xl animate-fade-in"
                style={{ boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.5)" }}
              >
                {menu.items.map((item, idx) =>
                  item.type === "separator" ? (
                    <div
                      key={idx}
                      className="h-px bg-gradient-to-r from-transparent via-dusk-blue/30 to-transparent my-2 mx-3"
                    />
                  ) : (
                    <div
                      key={idx}
                      className="mx-2 px-3 py-2 hover:bg-dusk-blue/20 text-alabaster-grey cursor-pointer flex items-center justify-between gap-4 rounded-lg transition-all duration-150"
                      onClick={() => handleItemClick(item.action)}
                    >
                      <span className="text-sm">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="text-[10px] text-lavender-grey/50 font-mono bg-ink-black/40 px-1.5 py-0.5 rounded border border-dusk-blue/20">
                          {item.shortcut}
                        </kbd>
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Quick Actions */}
      <div className="flex items-center gap-2 px-4">
        <button
          onClick={() => dispatch("command-palette")}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-lavender-grey hover:text-alabaster-grey bg-ink-black/50 hover:bg-dusk-blue/20 border border-dusk-blue/20 rounded-lg transition-all"
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
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Search</span>
          <kbd className="text-[9px] text-lavender-grey/40 font-mono ml-1">
            ⌘P
          </kbd>
        </button>
      </div>
    </nav>
  );
};
