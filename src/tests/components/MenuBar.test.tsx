/**
 * Unit tests for MenuBar component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MenuBar } from "../../components/MenuBar";
import { ActionsProvider } from "../../renderer/contexts/ActionsContext";
import React from "react";

// Track dispatched actions
const dispatchedActions: string[] = [];

// Component that captures dispatch calls
const ActionCapture: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};

// Helper to render MenuBar with ActionsProvider
const renderMenuBar = () => {
  return render(
    <ActionsProvider>
      <MenuBar />
    </ActionsProvider>,
  );
};

describe("MenuBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dispatchedActions.length = 0;
  });

  describe("rendering", () => {
    it("should render the Plero", () => {
      renderMenuBar();
      expect(screen.getByText("Plero")).toBeInTheDocument();
    });

    it("should render all main menu items", () => {
      renderMenuBar();

      expect(screen.getByText("File")).toBeInTheDocument();
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.getByText("View")).toBeInTheDocument();
      expect(screen.getByText("Help")).toBeInTheDocument();
    });

    it("should render search button", () => {
      renderMenuBar();

      // Search button should have a search icon
      const searchButtons = screen.getAllByRole("button");
      const searchButton = searchButtons.find((btn) =>
        btn.querySelector("svg"),
      );
      expect(searchButton).toBeDefined();
    });
  });

  describe("menu interaction", () => {
    it("should open File menu when clicked", () => {
      renderMenuBar();

      fireEvent.click(screen.getByText("File"));

      expect(screen.getByText("New File")).toBeInTheDocument();
      expect(screen.getByText("Open File...")).toBeInTheDocument();
      expect(screen.getByText("Save")).toBeInTheDocument();
      expect(screen.getByText("Exit")).toBeInTheDocument();
    });

    it("should open Edit menu when clicked", () => {
      renderMenuBar();

      fireEvent.click(screen.getByText("Edit"));

      expect(screen.getByText("Undo")).toBeInTheDocument();
      expect(screen.getByText("Redo")).toBeInTheDocument();
      expect(screen.getByText("Cut")).toBeInTheDocument();
      expect(screen.getByText("Copy")).toBeInTheDocument();
      expect(screen.getByText("Paste")).toBeInTheDocument();
      expect(screen.getByText("Find")).toBeInTheDocument();
    });

    it("should open View menu when clicked", () => {
      renderMenuBar();

      fireEvent.click(screen.getByText("View"));

      expect(screen.getByText("Toggle Sidebar")).toBeInTheDocument();
      expect(screen.getByText("Toggle AI Chat")).toBeInTheDocument();
      expect(screen.getByText("Toggle Word Wrap")).toBeInTheDocument();
      expect(screen.getByText("Command Palette")).toBeInTheDocument();
    });

    it("should open Help menu when clicked", () => {
      renderMenuBar();

      fireEvent.click(screen.getByText("Help"));

      expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
      expect(screen.getByText("Documentation")).toBeInTheDocument();
      expect(screen.getByText("About Plero")).toBeInTheDocument();
    });

    it("should close menu when clicking same menu again", () => {
      renderMenuBar();

      // Open menu
      fireEvent.click(screen.getByText("File"));
      expect(screen.getByText("New File")).toBeInTheDocument();

      // Click again to close
      fireEvent.click(screen.getByText("File"));
      expect(screen.queryByText("New File")).not.toBeInTheDocument();
    });

    it("should switch menus when clicking different menu", () => {
      renderMenuBar();

      // Open File menu
      fireEvent.click(screen.getByText("File"));
      expect(screen.getByText("New File")).toBeInTheDocument();

      // Click Edit menu
      fireEvent.click(screen.getByText("Edit"));

      // File menu items should be gone
      expect(screen.queryByText("New File")).not.toBeInTheDocument();
      // Edit menu items should be visible
      expect(screen.getByText("Undo")).toBeInTheDocument();
    });

    it("should close menu when clicking outside", async () => {
      renderMenuBar();

      // Open menu
      fireEvent.click(screen.getByText("File"));
      expect(screen.getByText("New File")).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText("New File")).not.toBeInTheDocument();
      });
    });
  });

  describe("keyboard shortcuts display", () => {
    it("should display shortcuts for menu items", () => {
      renderMenuBar();

      fireEvent.click(screen.getByText("File"));

      expect(screen.getByText("Ctrl+N")).toBeInTheDocument();
      expect(screen.getByText("Ctrl+O")).toBeInTheDocument();
      expect(screen.getByText("Ctrl+S")).toBeInTheDocument();
    });

    it("should display Edit menu shortcuts", () => {
      renderMenuBar();

      fireEvent.click(screen.getByText("Edit"));

      expect(screen.getByText("Ctrl+Z")).toBeInTheDocument();
      expect(screen.getByText("Ctrl+Y")).toBeInTheDocument();
      expect(screen.getByText("Ctrl+F")).toBeInTheDocument();
    });

    it("should display View menu shortcuts", () => {
      renderMenuBar();

      fireEvent.click(screen.getByText("View"));

      expect(screen.getByText("Ctrl+B")).toBeInTheDocument();
      expect(screen.getByText("Ctrl+Shift+B")).toBeInTheDocument();
      expect(screen.getByText("Ctrl+Shift+P")).toBeInTheDocument();
    });
  });

  describe("menu item actions", () => {
    it("should close menu after clicking menu item", () => {
      renderMenuBar();

      fireEvent.click(screen.getByText("File"));
      fireEvent.click(screen.getByText("New File"));

      // Menu should be closed
      expect(screen.queryByText("Open File...")).not.toBeInTheDocument();
    });

    it("should close menu after clicking Edit item", () => {
      renderMenuBar();

      fireEvent.click(screen.getByText("Edit"));
      fireEvent.click(screen.getByText("Undo"));

      expect(screen.queryByText("Redo")).not.toBeInTheDocument();
    });
  });

  describe("separators", () => {
    it("should render separators in File menu", () => {
      renderMenuBar();

      fireEvent.click(screen.getByText("File"));

      // Separators are rendered as divs with specific styling
      const dropdown = screen
        .getByText("New File")
        .closest("div[class*='absolute']");
      expect(dropdown).toBeInTheDocument();

      // Check for hr elements or separator divs
      const separators = dropdown?.querySelectorAll("div.h-px") || [];
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe("hover behavior", () => {
    it("should switch menus on hover when a menu is open", () => {
      renderMenuBar();

      // Open File menu
      fireEvent.click(screen.getByText("File"));
      expect(screen.getByText("New File")).toBeInTheDocument();

      // Hover over Edit
      fireEvent.mouseEnter(screen.getByText("Edit"));

      // Should switch to Edit menu
      expect(screen.queryByText("New File")).not.toBeInTheDocument();
      expect(screen.getByText("Undo")).toBeInTheDocument();
    });

    it("should not open menu on hover when no menu is open", () => {
      renderMenuBar();

      // Hover over File without clicking
      fireEvent.mouseEnter(screen.getByText("File"));

      // Menu should not open
      expect(screen.queryByText("New File")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper menu structure", () => {
      renderMenuBar();

      // Menu bar should be present with nav element
      const menuBar = screen.getByText("File").closest("div");
      expect(menuBar).toBeInTheDocument();
    });
  });
});
