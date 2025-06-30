import fs from "fs";
import path from "path";

export const ROOT = process.cwd();

export type FileNode = {
    name: string; 
    type: 'file';
    path: string;
};

export type FolderNode = {
    name: string;
    type: "folder";
    path: string;
    children: TreeNode[];
};

export type TreeNode = FileNode | FolderNode;

/**
 * Recursively gets the directory tree starting from the given directory.
 * @param dir - The directory to start from.
 * @returns An array of TreeNode representing the directory structure.
 */
export function getTree(dir: string = ROOT): TreeNode[] {
    return fs.readdirSync(dir).map((name: string): TreeNode => {
        const fullPath = safeJoin(dir, name);
        const stat = fs.statSync(fullPath);
        if(stat.isDirectory()) {
            return {
                name,
                type: "folder",
                path: path.relative(ROOT, fullPath),
                children: getTree(fullPath),
            }; // returning a FolderNode
        } else {
            return {
                name,
                type: "file",
                path: path.relative(ROOT, fullPath),
            }; // returning a FileNode
        }
    });
}

/**
 * Reads the content of a file at the given relative path.
 */
export function getFileContent(relPath: string): string {
    const filePath = safeJoin(ROOT, relPath);
    if(!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        throw new Error("File not found");
    }
    return fs.readFileSync(filePath, "utf8");
}

/**
 * Saves (writes) content to a file at the given relative path.
 */
export function saveFile(relPath: string, content: string): void {
    const filePath = safeJoin(ROOT, relPath);
    fs.writeFileSync(filePath, content, "utf8");
}

/**
 * Deletes the file at the given relative path.
 */
export function delFile(relPath: string): void {
    const filePath = safeJoin(ROOT, relPath);

    if(!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        throw new Error("File not found");
    }

    fs.unlinkSync(filePath); // synchronously remove a file or symbolic link from the file system
}

/**
 * Creates a folder at the given relative path
 */
export function createFolder(relPath: string): void {
    const folderPath = safeJoin(ROOT, relPath);

    if(fs.existsSync(folderPath)) {
        throw new Error("Folder already exists");
    }
    
    // Synchronouse version means, they block code until execution
    fs.mkdirSync(folderPath, {
        recursive: true
    });
}

/**
 * Renames or moves a file or folder from oldPath to newPath (both relative).
 */
export function renamePath(oldRelPath: string, newRelPath: string): void {
    const oldPath = safeJoin(ROOT, oldRelPath);
    const newPath = safeJoin(ROOT, newRelPath);
    if (!fs.existsSync(oldPath)) throw new Error("Source does not exist");
    if (fs.existsSync(newPath)) throw new Error("Destination already exists");
    fs.renameSync(oldPath, newPath);
}

/**
 * Recursively deletes a folder at the given relative path.
 */
export function delFolder(relPath: string): void {
    const folderPath = safeJoin(ROOT, relPath);
    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
        throw new Error("Folder not found");
    }
    fs.rmSync(folderPath, { recursive: true, force: true });
}

function safeJoin(root: string, relPath: string): string {
    const fullPath = path.resolve(root, relPath);
    if (!fullPath.startsWith(root)) {
        throw new Error("Invalid path");
    }
    return fullPath;
}

export function stat(relPath: string): fs.Stats {
    return fs.statSync(path.join(ROOT, relPath));
}

export function exists(relPath: string): boolean {
    return fs.existsSync(path.join(ROOT, relPath));
}
