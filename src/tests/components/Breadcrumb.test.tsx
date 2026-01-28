/**
 * Unit tests for Breadcrumb component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Breadcrumb } from "../../components/Breadcrumb";

describe("Breadcrumb", () => {
  describe("rendering", () => {
    it("should render nothing when path is empty", () => {
      const { container } = render(<Breadcrumb path="" onNavigate={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render nothing when path is null", () => {
      const { container } = render(
        <Breadcrumb path={null} onNavigate={vi.fn()} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("should render single segment for simple file", () => {
      render(<Breadcrumb path="file.ts" onNavigate={vi.fn()} />);
      expect(screen.getByText("file.ts")).toBeInTheDocument();
    });

    it("should render multiple segments for nested path", () => {
      render(
        <Breadcrumb path="src/components/Editor.tsx" onNavigate={vi.fn()} />,
      );

      expect(screen.getByText("src")).toBeInTheDocument();
      expect(screen.getByText("components")).toBeInTheDocument();
      expect(screen.getByText("Editor.tsx")).toBeInTheDocument();
    });

    it("should render chevron separators between segments", () => {
      render(
        <Breadcrumb path="src/components/Editor.tsx" onNavigate={vi.fn()} />,
      );

      // SVG chevrons should be present
      const svgs = document.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe("file type icon colors", () => {
    it("should apply blue color icon for TypeScript files", () => {
      render(<Breadcrumb path="src/file.ts" onNavigate={vi.fn()} />);

      // The icon should have the blue color class
      const icon = document.querySelector("svg.text-blue-400");
      expect(icon).toBeInTheDocument();
    });

    it("should apply blue color icon for TSX files", () => {
      render(<Breadcrumb path="src/Component.tsx" onNavigate={vi.fn()} />);

      const icon = document.querySelector("svg.text-blue-400");
      expect(icon).toBeInTheDocument();
    });

    it("should apply yellow color icon for JavaScript files", () => {
      render(<Breadcrumb path="src/file.js" onNavigate={vi.fn()} />);

      const icon = document.querySelector("svg.text-yellow-400");
      expect(icon).toBeInTheDocument();
    });

    it("should apply orange color icon for Rust files", () => {
      render(<Breadcrumb path="src/main.rs" onNavigate={vi.fn()} />);

      const icon = document.querySelector("svg.text-orange-400");
      expect(icon).toBeInTheDocument();
    });

    it("should apply green color icon for Python files", () => {
      render(<Breadcrumb path="src/script.py" onNavigate={vi.fn()} />);

      const icon = document.querySelector("svg.text-green-400");
      expect(icon).toBeInTheDocument();
    });

    it("should apply pink color icon for CSS files", () => {
      render(<Breadcrumb path="src/styles.css" onNavigate={vi.fn()} />);

      const icon = document.querySelector("svg.text-pink-400");
      expect(icon).toBeInTheDocument();
    });

    it("should apply red color icon for HTML files", () => {
      render(<Breadcrumb path="public/index.html" onNavigate={vi.fn()} />);

      const icon = document.querySelector("svg.text-red-400");
      expect(icon).toBeInTheDocument();
    });

    it("should apply default color icon for unknown file types", () => {
      render(<Breadcrumb path="src/file.txt" onNavigate={vi.fn()} />);

      // Default is text-dusk-blue
      const icon = document.querySelector("svg.text-dusk-blue");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("should call onNavigate with path when clicking folder segment", () => {
      const onNavigate = vi.fn();
      render(
        <Breadcrumb path="src/components/Editor.tsx" onNavigate={onNavigate} />,
      );

      fireEvent.click(screen.getByText("src"));

      expect(onNavigate).toHaveBeenCalledWith("src");
    });

    it("should call onNavigate with full path to clicked folder", () => {
      const onNavigate = vi.fn();
      render(
        <Breadcrumb path="src/components/Editor.tsx" onNavigate={onNavigate} />,
      );

      fireEvent.click(screen.getByText("components"));

      expect(onNavigate).toHaveBeenCalledWith("src/components");
    });

    it("should not call onNavigate when clicking file segment (last segment)", () => {
      const onNavigate = vi.fn();
      render(
        <Breadcrumb path="src/components/Editor.tsx" onNavigate={onNavigate} />,
      );

      fireEvent.click(screen.getByText("Editor.tsx"));

      expect(onNavigate).not.toHaveBeenCalled();
    });
  });

  describe("long paths", () => {
    it("should truncate very long paths with ellipsis", () => {
      const longPath =
        "very/deep/nested/folder/structure/with/many/levels/file.ts";
      render(<Breadcrumb path={longPath} onNavigate={vi.fn()} />);

      // Should show ellipsis for middle segments (shows only last 4)
      expect(screen.getByText("•••")).toBeInTheDocument();

      // Should still show last segments including file
      expect(screen.getByText("file.ts")).toBeInTheDocument();
    });

    it("should not truncate short paths", () => {
      render(<Breadcrumb path="src/file.ts" onNavigate={vi.fn()} />);

      expect(screen.queryByText("•••")).not.toBeInTheDocument();
    });

    it("should show last 4 segments for long paths", () => {
      const longPath = "a/b/c/d/e/f/g.ts";
      render(<Breadcrumb path={longPath} onNavigate={vi.fn()} />);

      // Should only show last 4: d, e, f, g.ts
      expect(screen.getByText("d")).toBeInTheDocument();
      expect(screen.getByText("e")).toBeInTheDocument();
      expect(screen.getByText("f")).toBeInTheDocument();
      expect(screen.getByText("g.ts")).toBeInTheDocument();

      // Should not show earlier segments
      expect(screen.queryByText("a")).not.toBeInTheDocument();
      expect(screen.queryByText("b")).not.toBeInTheDocument();
      expect(screen.queryByText("c")).not.toBeInTheDocument();
    });
  });

  describe("last segment styling", () => {
    it("should style last segment differently", () => {
      render(<Breadcrumb path="src/file.ts" onNavigate={vi.fn()} />);

      const lastSegment = screen.getByText("file.ts");
      expect(lastSegment).toHaveClass("font-semibold");
    });

    it("should not have cursor-pointer on last segment", () => {
      render(<Breadcrumb path="src/file.ts" onNavigate={vi.fn()} />);

      const lastSegment = screen.getByText("file.ts");
      expect(lastSegment).not.toHaveClass("cursor-pointer");
    });

    it("should have cursor-pointer on non-last segments", () => {
      render(<Breadcrumb path="src/file.ts" onNavigate={vi.fn()} />);

      const folderSegment = screen.getByText("src");
      expect(folderSegment).toHaveClass("cursor-pointer");
    });
  });
});
