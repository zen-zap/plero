import express from "express"; 
import * as fileops from "../services/file";

// instantiates a router
const router = express.Router(); 

router.get("/tree", (_req, res) => {
    try {
        const tree = fileops.getTree();
        res.json(tree)
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to read directory tree"
        });
    }
});

router.get("/content", (req, res) => {
    const relPath = req.query.path as string;

    if(!relPath) {
        res.status(400).send("Missing path");
        return;
    }

    try {
        const content = fileops.getFileContent(relPath);
        res.send(content);
    } catch (err) {
        res.status(404).json({
            error: "File not Found"
        });
    }
});

router.post("/save", (req, res) => {
    const {
        path: relPath,
        content,
    } = req.body;

    if(!relPath) {
        res.status(400).send("Missing path");
        return;
    }

    if(typeof content !== "string") {
        res.status(400).send("Content must be a string");
        return;
    }

    try {
        fileops.saveFile(relPath, content);
        res.json({
            success: true
        });
    } catch (err) {
        res.status(500).json({
            error: "Failed to save file"
        });
    }
});

router.delete("/delete", (req, res) => {
    const relPath = req.query.path as string;
    if (!relPath) {
        res.status(400).send("Missing path");
        return;
    }
    try {
        fileops.delFile(relPath);
        res.json({ success: true });
    } catch (err) {
        res.status(404).json({ error: "File not found or could not be deleted" });
    }
});

router.post("/mkdir", (req, res) => {
    const { path: relPath } = req.body;
    if (!relPath) {
        res.status(400).send("Missing path");
        return;
    }
    try {
        fileops.createFolder(relPath);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: "Failed to create folder" });
    }
});

// Rename/move file or folder
router.post("/rename", (req, res) => {
    const { oldPath, newPath } = req.body;
    if (!oldPath || !newPath) {
        res.status(400).send("Missing oldPath or newPath");
        return;
    }
    try {
        fileops.renamePath(oldPath, newPath);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : "Failed to rename/move" });
    }
});

// Delete a folder (recursive)
router.delete("/rmdir", (req, res) => {
    const relPath = req.query.path as string;
    if (!relPath) {
        res.status(400).send("Missing path");
        return;
    }
    try {
        fileops.delFolder(relPath);
        res.json({ success: true });
    } catch (err) {
        res.status(404).json({ error: err instanceof Error ? err.message : "Folder not found or could not be deleted" });
    }
});

// Stat (metadata) for a file or folder
router.get("/stat", (req, res) => {
    const relPath = req.query.path as string;
    if (!relPath) {
        res.status(400).send("Missing path");
        return;
    }
    try {
        const stats = fileops.stat(relPath);
        res.json({
            size: stats.size,
            mtime: stats.mtime,
            ctime: stats.ctime,
            atime: stats.atime,
            isFile: stats.isFile,
            isDirectory: stats.isDirectory,
            mode: stats.mode,
            ino: stats.ino,
            uid: stats.uid,
            gid: stats.gid,
        });
    } catch (err) {
        res.status(404).json({ error: err instanceof Error ? err.message : "File or folder not found" });
    }
});

// Existence check for a file or folder
router.get("/exists", (req, res) => {
    const relPath = req.query.path as string;
    if (!relPath) {
        res.status(400).send("Missing path");
        return;
    }
    try {
        const doesExist = fileops.exists(relPath);
        res.json({ exists: doesExist });
    } catch (err) {
        res.status(500).json({ error: "Failed to check existence" });
    }
});

export default router;
