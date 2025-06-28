import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { ParsedQs } from "qs";

const router = express.Router();
const ROOT = process.cwd();

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

type TreeNode = FileNode | FolderNode;

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
      };
    } else {
      return {
        name,
        type: "file",
        path: path.relative(ROOT, fullPath),
      };
    }
  });
}

// List directory tree
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
router.get("/content", (req: Request<{}, {}, {}, ParsedQs>, res: Response) => {
  const relPath = req.query.path as string;
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

export default router;