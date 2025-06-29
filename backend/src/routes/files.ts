import express, { Request, Response } from "express"; // import express and its types for HTTP request and response
import fs from "fs"; // file system module to read/write files
import path from "path"; // path module to handle file paths
import { ParsedQs } from "qs"; // ParsedQs type for parsing query strings

// ROUTER and ROOT
const router = express.Router(); // new router instance for handling file-related routes
const ROOT = process.cwd(); // get the current working directory, which is the root of our file system for this app

// TYPE DEFINITIONS
type FileNode = {
  name: string;
  type: "file";
  path: string;
};

type FolderNode = {
  name: string;
  type: "folder";
  path: string;
  children: TreeNode[];
};

// a type that can be either a FileNode or FolderNode
type TreeNode = FileNode | FolderNode;

/**
 * Recursively gets the directory tree starting from the given directory.
 * @param dir - The directory to start from.
 * @returns An array of TreeNode representing the directory structure.
 */
function getTree(dir: string): TreeNode[] {
  return fs.readdirSync(dir).map((name: string): TreeNode => {
    const fullPath = path.join(dir, name);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      return {
        name,
        type: "folder",
        path: path.relative(ROOT, fullPath),
        children: getTree(fullPath),
      }; // returns a FolderNode
    } else {
      return {
        name,
        type: "file",
        path: path.relative(ROOT, fullPath),
      }; // returns a FileNode
    }
  });
}

// List directory tree
// the goal is not to list the files but display them in a tree structure with the CWD as the root
router.get("/tree", (req: Request, res: Response) => {
  try {
    const tree = getTree(ROOT);
    res.json(tree);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to read directory tree." });
  }
});

// Get file content
// JSON body is not recommended for this route, so we use query parameters
// Example: http://localhost:4000/api/files/content?path=src/routes/files.ts
router.get("/content", (req: Request<{}, {}, {}, ParsedQs>, res: Response) => {
  const relPath = req.query.path as string; // we read a query named path
  if (!relPath) {
    res.status(400).send("Missing path");
    return;
  }
  const filePath = path.join(ROOT, relPath);

  try {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.status(404).send("File not found");
      return;
    }
    const content = fs.readFileSync(filePath, "utf8");
    res.send(content);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to read file." });
  }
});

// Save file content
router.post("/save", (req: Request<{}, {}, { path: string; content: string }>, res: Response) => {
  const { path: relPath, content } = req.body;
  if (!relPath || typeof content !== "string") {
    res.status(400).send("Missing path or content");
    return;
  }
  const filePath = path.join(ROOT, relPath);

  try {
    fs.writeFileSync(filePath, content, "utf8");
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save file." });
  }
});

// set up the default router of the file -- any other file that imports this file will have access to these routes
// -- they can import them using any name they want
export default router;