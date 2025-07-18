// in src/services/files.ts
import "dotenv/config";
import fs from "fs";
import path from "path";

//export const ROOT = process.cwd();
// Function to get current ROOT - checks TEST_ROOT dynamically
function getRoot(): string {
    return process.env.TEST_ROOT
        ? path.resolve(process.env.TEST_ROOT)
        : process.cwd();
}

const ROOT = getRoot();

export type FileNode = {
    readonly name: string; 
    readonly type: 'file';
    readonly path: string;
};

export type FolderNode = {
    readonly name: string;
    readonly type: "folder";
    readonly path: string;
    readonly children: TreeNode[];
};

export type TreeNode = FileNode | FolderNode;

/**
 * Recursively gets the directory tree starting from the given directory.
 * @param dir - The directory to start from.
 * @returns An array of TreeNode representing the directory structure.
 */
export function getTree(dir: string = ROOT): TreeNode[] {

    const entries = fs.readdirSync(dir);
    entries.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return entries.map((name: string): TreeNode => {
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

    // Synchronous version means, they block code until execution
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
    const rel = path.relative(root, fullPath);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
        throw new Error("Invalid path");
    }
    return fullPath;
}

export function stat(relPath: string) {
    const stats = fs.statSync(path.join(ROOT, relPath));
    return {
        size: stats.size,
        mtime: stats.mtime,
        ctime: stats.ctime,
        atime: stats.atime,
        isFile: stats.isFile(),           
        isDirectory: stats.isDirectory(),
        mode: stats.mode,
        ino: stats.ino,
        uid: stats.uid,
        gid: stats.gid,
    };
}

export function exists(relPath: string): boolean {
    return fs.existsSync(path.join(ROOT, relPath));
}

/**
 * Inserts the given content at the first occurrence of the cursor marker in the file.
 * @param relPath Relative path to the file
 * @param insertion String to insert
 * @param marker Marker string where to insert (default: '[[CURSOR]]')
 * @throws if file not found or marker not present
 */
export function insertAtCursor(
    relPath: string,
    insertion: string,
    marker: string = '[[CURSOR]]'
): void {
    const filePath = safeJoin(ROOT, relPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        throw new Error("File not found");
    }
    let content = fs.readFileSync(filePath, "utf8");
    const markerIdx = content.indexOf(marker);
    if (markerIdx === -1) {
        throw new Error(`Marker "${marker}" not found in file`);
    }
    // Insert insertion just before the marker
    content =
        content.slice(0, markerIdx) + insertion + content.slice(markerIdx);
    fs.writeFileSync(filePath, content, "utf8");
}
