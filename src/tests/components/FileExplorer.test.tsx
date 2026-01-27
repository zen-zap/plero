/**
 * Unit tests for FileExplorer component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FileExplorer, TreeNode } from "../../components/FileExplorer";

const mockTree: TreeNode[] = [
  {
    name: "src",
    type: "folder",
    path: "src",
    children: [
      {
        name: "components",
        type: "folder",
        path: "src/components",
        children: [
          {
            name: "Editor.tsx",
            type: "file",
            path: "src/components/Editor.tsx",
          },
          {
            name: "MenuBar.tsx",
            type: "file",
            path: "src/components/MenuBar.tsx",
          },
        ],
      },
      { name: "index.ts", type: "file", path: "src/index.ts" },
    ],
  },
  { name: "package.json", type: "file", path: "package.json" },
  { name: "README.md", type: "file", path: "README.md" },
];

describe("FileExplorer", () => {
  const defaultProps = {
    nodes: mockTree,
    activeFile: null,
    onFileSelect: vi.fn(),
    onRename: vi.fn().mockResolvedValue(true),
    onDelete: vi.fn().mockResolvedValue(true),
    onCreateFile: vi.fn().mockResolvedValue(true),
    onCreateFolder: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render top-level files and folders", () => {
      render(<FileExplorer {...defaultProps} />);

      expect(screen.getByText("src")).toBeInTheDocument();
      expect(screen.getByText("package.json")).toBeInTheDocument();
      expect(screen.getByText("README.md")).toBeInTheDocument();
    });

    it("should not render children of collapsed folders", () => {
      render(<FileExplorer {...defaultProps} />);

      // Children should not be visible initially
      expect(screen.queryByText("components")).not.toBeInTheDocument();
      expect(screen.queryByText("index.ts")).not.toBeInTheDocument();
    });

    it("should render nothing when nodes is empty", () => {
      const { container } = render(
        <FileExplorer {...defaultProps} nodes={[]} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("should render nothing when nodes is null", () => {
      const { container } = render(
        <FileExplorer {...defaultProps} nodes={null as any} />,
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("folder expansion", () => {
    it("should expand folder on click", () => {
      render(<FileExplorer {...defaultProps} />);

      fireEvent.click(screen.getByText("src"));

      expect(screen.getByText("components")).toBeInTheDocument();
      expect(screen.getByText("index.ts")).toBeInTheDocument();
    });

    it("should collapse folder on second click", () => {
      render(<FileExplorer {...defaultProps} />);

      // First click - expand
      fireEvent.click(screen.getByText("src"));
      expect(screen.getByText("components")).toBeInTheDocument();

      // Second click - collapse
      fireEvent.click(screen.getByText("src"));
      expect(screen.queryByText("components")).not.toBeInTheDocument();
    });

    it("should show nested folder contents when expanded", () => {
      render(<FileExplorer {...defaultProps} />);

      // Expand src
      fireEvent.click(screen.getByText("src"));
      // Expand components
      fireEvent.click(screen.getByText("components"));

      expect(screen.getByText("Editor.tsx")).toBeInTheDocument();
      expect(screen.getByText("MenuBar.tsx")).toBeInTheDocument();
    });

    it("should show empty folder message for empty folders", () => {
      const emptyFolderTree: TreeNode[] = [
        { name: "empty", type: "folder", path: "empty", children: [] },
      ];

      render(<FileExplorer {...defaultProps} nodes={emptyFolderTree} />);

      fireEvent.click(screen.getByText("empty"));

      expect(screen.getByText("Empty folder")).toBeInTheDocument();
    });
  });

  describe("file selection", () => {
    it("should call onFileSelect when clicking a file", () => {
      const onFileSelect = vi.fn();
      render(<FileExplorer {...defaultProps} onFileSelect={onFileSelect} />);

      fireEvent.click(screen.getByText("package.json"));

      expect(onFileSelect).toHaveBeenCalledWith(
        expect.objectContaining({ name: "package.json", type: "file" }),
      );
    });

    it("should not call onFileSelect when clicking a folder", () => {
      const onFileSelect = vi.fn();
      render(<FileExplorer {...defaultProps} onFileSelect={onFileSelect} />);

      fireEvent.click(screen.getByText("src"));

      expect(onFileSelect).not.toHaveBeenCalled();
    });

    it("should highlight active file", () => {
      const activeFile: TreeNode = {
        name: "package.json",
        type: "file",
        path: "package.json",
      };
      render(<FileExplorer {...defaultProps} activeFile={activeFile} />);

      const fileElement = screen.getByText("package.json").closest("div");
      expect(fileElement).toHaveClass("bg-gradient-to-r");
    });
  });

  describe("context menu", () => {
    it("should show context menu on right click", () => {
      render(<FileExplorer {...defaultProps} />);

      fireEvent.contextMenu(screen.getByText("package.json"));

      expect(screen.getByText("Rename")).toBeInTheDocument();
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    it("should show New File and New Folder options for folders", () => {
      render(<FileExplorer {...defaultProps} />);

      fireEvent.contextMenu(screen.getByText("src"));

      expect(screen.getByText("Rename")).toBeInTheDocument();
      expect(screen.getByText("Delete")).toBeInTheDocument();
      expect(screen.getByText("New File")).toBeInTheDocument();
      expect(screen.getByText("New Folder")).toBeInTheDocument();
    });

    it("should not show New File and New Folder options for files", () => {
      render(<FileExplorer {...defaultProps} />);

      fireEvent.contextMenu(screen.getByText("package.json"));

      expect(screen.getByText("Rename")).toBeInTheDocument();
      expect(screen.queryByText("New File")).not.toBeInTheDocument();
      expect(screen.queryByText("New Folder")).not.toBeInTheDocument();
    });

    it("should close context menu when clicking elsewhere", async () => {
      render(<FileExplorer {...defaultProps} />);

      fireEvent.contextMenu(screen.getByText("package.json"));
      expect(screen.getByText("Rename")).toBeInTheDocument();

      // Click elsewhere
      fireEvent.click(document.body);

      await waitFor(() => {
        expect(screen.queryByText("Rename")).not.toBeInTheDocument();
      });
    });
  });

  describe("rename functionality", () => {
    it("should show rename input when clicking Rename", () => {
      render(<FileExplorer {...defaultProps} />);

      fireEvent.contextMenu(screen.getByText("package.json"));
      fireEvent.click(screen.getByText("Rename"));

      const input = screen.getByDisplayValue("package.json");
      expect(input).toBeInTheDocument();
    });

    it("should call onRename when submitting new name", async () => {
      const onRename = vi.fn().mockResolvedValue(true);
      render(<FileExplorer {...defaultProps} onRename={onRename} />);

      fireEvent.contextMenu(screen.getByText("package.json"));
      fireEvent.click(screen.getByText("Rename"));

      const input = screen.getByDisplayValue("package.json");
      fireEvent.change(input, { target: { value: "new-package.json" } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(onRename).toHaveBeenCalledWith(
          "package.json",
          "new-package.json",
        );
      });
    });

    it("should cancel rename on Escape", () => {
      render(<FileExplorer {...defaultProps} />);

      fireEvent.contextMenu(screen.getByText("package.json"));
      fireEvent.click(screen.getByText("Rename"));

      const input = screen.getByDisplayValue("package.json");
      fireEvent.change(input, { target: { value: "new-name.json" } });
      fireEvent.keyDown(input, { key: "Escape" });

      // Should show original name again
      expect(screen.getByText("package.json")).toBeInTheDocument();
      expect(
        screen.queryByDisplayValue("new-name.json"),
      ).not.toBeInTheDocument();
    });
  });

  describe("delete functionality", () => {
    it("should call onDelete when confirming delete", async () => {
      const onDelete = vi.fn().mockResolvedValue(true);
      vi.spyOn(window, "confirm").mockReturnValue(true);

      render(<FileExplorer {...defaultProps} onDelete={onDelete} />);

      fireEvent.contextMenu(screen.getByText("package.json"));
      fireEvent.click(screen.getByText("Delete"));

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith("package.json", false);
      });
    });

    it("should not call onDelete when canceling delete", async () => {
      const onDelete = vi.fn().mockResolvedValue(true);
      vi.spyOn(window, "confirm").mockReturnValue(false);

      render(<FileExplorer {...defaultProps} onDelete={onDelete} />);

      fireEvent.contextMenu(screen.getByText("package.json"));
      fireEvent.click(screen.getByText("Delete"));

      expect(onDelete).not.toHaveBeenCalled();
    });

    it("should pass isFolder=true when deleting a folder", async () => {
      const onDelete = vi.fn().mockResolvedValue(true);
      vi.spyOn(window, "confirm").mockReturnValue(true);

      render(<FileExplorer {...defaultProps} onDelete={onDelete} />);

      fireEvent.contextMenu(screen.getByText("src"));
      fireEvent.click(screen.getByText("Delete"));

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith("src", true);
      });
    });
  });

  describe("create file functionality", () => {
    it("should show input when clicking New File", () => {
      render(<FileExplorer {...defaultProps} />);

      fireEvent.contextMenu(screen.getByText("src"));
      fireEvent.click(screen.getByText("New File"));

      expect(screen.getByPlaceholderText("New file name")).toBeInTheDocument();
    });

    it("should call onCreateFile with folder path and file name", async () => {
      const onCreateFile = vi.fn().mockResolvedValue(true);
      render(<FileExplorer {...defaultProps} onCreateFile={onCreateFile} />);

      fireEvent.contextMenu(screen.getByText("src"));
      fireEvent.click(screen.getByText("New File"));

      const input = screen.getByPlaceholderText("New file name");
      fireEvent.change(input, { target: { value: "newfile.ts" } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(onCreateFile).toHaveBeenCalledWith("src", "newfile.ts");
      });
    });
  });

  describe("create folder functionality", () => {
    it("should show input when clicking New Folder", () => {
      render(<FileExplorer {...defaultProps} />);

      fireEvent.contextMenu(screen.getByText("src"));
      fireEvent.click(screen.getByText("New Folder"));

      expect(
        screen.getByPlaceholderText("New folder name"),
      ).toBeInTheDocument();
    });

    it("should call onCreateFolder with parent path and folder name", async () => {
      const onCreateFolder = vi.fn().mockResolvedValue(true);
      render(
        <FileExplorer {...defaultProps} onCreateFolder={onCreateFolder} />,
      );

      fireEvent.contextMenu(screen.getByText("src"));
      fireEvent.click(screen.getByText("New Folder"));

      const input = screen.getByPlaceholderText("New folder name");
      fireEvent.change(input, { target: { value: "newfolder" } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(onCreateFolder).toHaveBeenCalledWith("src", "newfolder");
      });
    });
  });

  describe("keyboard navigation", () => {
    it("should trigger rename with F2 key", () => {
      render(<FileExplorer {...defaultProps} />);

      const fileElement = screen.getByText("package.json").closest("div");
      fireEvent.keyDown(fileElement!, { key: "F2" });

      expect(screen.getByDisplayValue("package.json")).toBeInTheDocument();
    });
  });
});
