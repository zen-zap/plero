/**
 * Unit tests for CommandPalette component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommandPalette, CommandItem } from "../../components/CommandPalette";

const mockCommands: CommandItem[] = [
  {
    id: "save",
    label: "Save File",
    shortcut: "Ctrl+S",
    category: "File",
    action: vi.fn(),
  },
  {
    id: "open",
    label: "Open File",
    shortcut: "Ctrl+O",
    category: "File",
    action: vi.fn(),
  },
  {
    id: "find",
    label: "Find in File",
    shortcut: "Ctrl+F",
    category: "Edit",
    action: vi.fn(),
  },
  {
    id: "toggle-wrap",
    label: "Toggle Word Wrap",
    category: "View",
    action: vi.fn(),
  },
];

describe("CommandPalette", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all command action mocks
    mockCommands.forEach((cmd) =>
      (cmd.action as ReturnType<typeof vi.fn>).mockClear(),
    );
  });

  describe("visibility", () => {
    it("should not render when isOpen is false", () => {
      render(
        <CommandPalette
          isOpen={false}
          onClose={mockOnClose}
          commands={mockCommands}
        />,
      );

      expect(
        screen.queryByPlaceholderText("Search commands..."),
      ).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          commands={mockCommands}
        />,
      );

      expect(
        screen.getByPlaceholderText("Search commands..."),
      ).toBeInTheDocument();
    });
  });

  describe("command display", () => {
    it("should display all commands when no search filter", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          commands={mockCommands}
        />,
      );

      expect(screen.getByText("Save File")).toBeInTheDocument();
      expect(screen.getByText("Open File")).toBeInTheDocument();
      expect(screen.getByText("Find in File")).toBeInTheDocument();
      expect(screen.getByText("Toggle Word Wrap")).toBeInTheDocument();
    });

    it("should display command shortcuts", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          commands={mockCommands}
        />,
      );

      expect(screen.getByText("Ctrl+S")).toBeInTheDocument();
      expect(screen.getByText("Ctrl+O")).toBeInTheDocument();
      expect(screen.getByText("Ctrl+F")).toBeInTheDocument();
    });

    it("should display command categories", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          commands={mockCommands}
        />,
      );

      expect(screen.getAllByText("File").length).toBeGreaterThan(0);
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.getByText("View")).toBeInTheDocument();
    });
  });

  describe("search filtering", () => {
    it("should filter commands by label", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          commands={mockCommands}
        />,
      );

      const input = screen.getByPlaceholderText("Search commands...");
      fireEvent.change(input, { target: { value: "save" } });

      expect(screen.getByText("Save File")).toBeInTheDocument();
      expect(screen.queryByText("Open File")).not.toBeInTheDocument();
      expect(screen.queryByText("Find in File")).not.toBeInTheDocument();
    });

    it("should filter commands by category", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          commands={mockCommands}
        />,
      );

      const input = screen.getByPlaceholderText("Search commands...");
      fireEvent.change(input, { target: { value: "edit" } });

      expect(screen.getByText("Find in File")).toBeInTheDocument();
      expect(screen.queryByText("Save File")).not.toBeInTheDocument();
    });

    it("should show empty state when no commands match", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          commands={mockCommands}
        />,
      );

      const input = screen.getByPlaceholderText("Search commands...");
      fireEvent.change(input, { target: { value: "nonexistent" } });

      expect(screen.getByText("No commands found")).toBeInTheDocument();
    });

    it("should be case insensitive", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          commands={mockCommands}
        />,
      );

      const input = screen.getByPlaceholderText("Search commands...");
      fireEvent.change(input, { target: { value: "SAVE" } });

      expect(screen.getByText("Save File")).toBeInTheDocument();
    });
  });

  describe("keyboard navigation", () => {
    it("should close on Escape key", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          commands={mockCommands}
        />,
      );

      const input = screen.getByPlaceholderText("Search commands...");
      fireEvent.keyDown(input, { key: "Escape" });

      expect(mockOnClose).toHaveBeenCalledOnce();
    });

    it("should execute command on Enter key", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          commands={mockCommands}
        />,
      );

      const input = screen.getByPlaceholderText("Search commands...");
      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockCommands[0].action).toHaveBeenCalledOnce();
      expect(mockOnClose).toHaveBeenCalledOnce();
    });

    it("should navigate down with ArrowDown", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          commands={mockCommands}
        />,
      );

      const input = screen.getByPlaceholderText("Search commands...");
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "Enter" });

      // Second command should be executed
      expect(mockCommands[1].action).toHaveBeenCalledOnce();
    });

    it("should navigate up with ArrowUp", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          commands={mockCommands}
        />,
      );

      const input = screen.getByPlaceholderText("Search commands...");
      // Go down twice, then up once
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowUp" });
      fireEvent.keyDown(input, { key: "Enter" });

      // Second command should be executed
      expect(mockCommands[1].action).toHaveBeenCalledOnce();
    });

    it("should wrap around when navigating past end", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          commands={mockCommands}
        />,
      );

      const input = screen.getByPlaceholderText("Search commands...");
      // Navigate past the end (4 commands, so 4 down should wrap to first)
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "Enter" });

      // First command should be executed (wrapped around)
      expect(mockCommands[0].action).toHaveBeenCalledOnce();
    });
  });

  describe("mouse interaction", () => {
    it("should execute command on click", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          commands={mockCommands}
        />,
      );

      fireEvent.click(screen.getByText("Save File"));

      expect(mockCommands[0].action).toHaveBeenCalledOnce();
      expect(mockOnClose).toHaveBeenCalledOnce();
    });

    it("should close when clicking backdrop", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          commands={mockCommands}
        />,
      );

      // Click the backdrop (the outer div)
      const backdrop = screen
        .getByPlaceholderText("Search commands...")
        .closest(".fixed");
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
