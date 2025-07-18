// in src/tests/ipc_tests/filesIpc.test.ts

import assert from "assert";
import { app, BrowserWindow } from "electron";
import path from "path";
import fs from "fs";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import type { TreeNode, FolderNode } from "../../services/file";

let win: BrowserWindow;
let testRoot: string;

const TIMEOUT = 12000;

// Helper: set up test root - use common TEST_ROOT if available
function setupTestRoot() {
  if (process.env.TEST_ROOT) {
    // Use the common test root set by the script
    testRoot = process.env.TEST_ROOT;
    console.log(`Using common TEST_ROOT: ${testRoot}`);
  } else {
    // Fallback to unique root for individual test runs
    testRoot = path.join(os.tmpdir(), `plero_file_ipc_test_${uuidv4()}`);
    process.env.TEST_ROOT = testRoot;
    console.log(`Created individual TEST_ROOT: ${testRoot}`);
  }

  // Ensure the test root exists
  if (!fs.existsSync(testRoot)) {
    fs.mkdirSync(testRoot, { recursive: true });
  }
}

before(async function () {
  this.timeout(TIMEOUT);
  await app.whenReady();
  win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../../preload.js"),
      contextIsolation: true,
      sandbox: true,
    },
  });
  await win.loadURL("about:blank");
});

// Clean up window and all test artifacts after all tests
after(function () {
  if (win) win.destroy();
  // Only clean up if we created our own test root (not the common one)
  if (testRoot && fs.existsSync(testRoot) && !process.env.TEST_ROOT?.includes('plero_common_test_')) {
    fs.rmSync(testRoot, { recursive: true, force: true });
  }
  app.quit();
});

beforeEach(() => {
  setupTestRoot();
});

afterEach(() => {
  // Remove all files/folders in testRoot (not testRoot itself, so next test can re-use it if needed)
  if (testRoot && fs.existsSync(testRoot)) {
    for (const entry of fs.readdirSync(testRoot)) {
      const entryPath = path.join(testRoot, entry);
      fs.rmSync(entryPath, { recursive: true, force: true });
    }
  }
});

it("createFolder and getTree reflect new folder", async function () {
  const folderName = `test-folder-${uuidv4()}`;
  const createRes = await win.webContents.executeJavaScript(
    `window.electronAPI.createFolder("${folderName}")`
  );
  assert(createRes.ok, `createFolder failed: ${createRes.error}`);
  const treeRes = await win.webContents.executeJavaScript(
    `window.electronAPI.getTree()`
  );
  assert(treeRes.ok, `getTree failed: ${treeRes.error}`);
  const tree: TreeNode[] = treeRes.data;
  assert(Array.isArray(tree), "tree is not an array");
  assert(tree.some((node: TreeNode) => node.name === folderName && node.type === "folder"));
});

it("saveFile, getFileContent, and exists", async function () {
  const fileName = `test-${uuidv4()}.txt`;
  const content = "Hello, IPC!";
  const saveRes = await win.webContents.executeJavaScript(
    `window.electronAPI.saveFile("${fileName}", "${content}")`
  );
  assert(saveRes.ok, `saveFile failed: ${saveRes.error}`);
  const existsRes = await win.webContents.executeJavaScript(
    `window.electronAPI.exists("${fileName}")`
  );
  assert(existsRes.ok, `exists failed: ${existsRes.error}`);
  assert.strictEqual(existsRes.data.exists, true);
  const readRes = await win.webContents.executeJavaScript(
    `window.electronAPI.getFileContent("${fileName}")`
  );
  assert(readRes.ok, `getFileContent failed: ${readRes.error}`);
  assert.strictEqual(readRes.data, content);
});

it("stat returns metadata for file", async function () {
  const fileName = `meta-${uuidv4()}.txt`;
  const content = "Meta Info";
  const saveRes = await win.webContents.executeJavaScript(
    `window.electronAPI.saveFile("${fileName}", "${content}")`
  );
  assert(saveRes.ok, `saveFile failed: ${saveRes.error}`);
  const statRes = await win.webContents.executeJavaScript(
    `window.electronAPI.stat("${fileName}")`
  );
  assert(statRes.ok, `stat failed: ${statRes.error}`);
  const stats = statRes.data;
  assert.strictEqual(stats.size, content.length);
  assert.strictEqual(stats.isFile, true);
  assert.strictEqual(stats.isDirectory, false);
});

it("renamePath renames file", async function () {
  const src = `oldname-${uuidv4()}.txt`;
  const dst = `newname-${uuidv4()}.txt`;
  const saveRes = await win.webContents.executeJavaScript(
    `window.electronAPI.saveFile("${src}", "data")`
  );
  assert(saveRes.ok, `saveFile failed: ${saveRes.error}`);
  const renameRes = await win.webContents.executeJavaScript(
    `window.electronAPI.renamePath("${src}", "${dst}")`
  );
  assert(renameRes.ok, `renamePath failed: ${renameRes.error}`);
  const existsOldRes = await win.webContents.executeJavaScript(
    `window.electronAPI.exists("${src}")`
  );
  assert(existsOldRes.ok, `exists (old) failed: ${existsOldRes.error}`);
  const existsNewRes = await win.webContents.executeJavaScript(
    `window.electronAPI.exists("${dst}")`
  );
  assert(existsNewRes.ok, `exists (new) failed: ${existsNewRes.error}`);
  assert.strictEqual(existsOldRes.data.exists, false);
  assert.strictEqual(existsNewRes.data.exists, true);
});

it("delFile deletes file", async function () {
  const fileName = `todelete-${uuidv4()}.txt`;
  const saveRes = await win.webContents.executeJavaScript(
    `window.electronAPI.saveFile("${fileName}", "bye")`
  );
  assert(saveRes.ok, `saveFile failed: ${saveRes.error}`);
  const delRes = await win.webContents.executeJavaScript(
    `window.electronAPI.delFile("${fileName}")`
  );
  assert(delRes.ok, `delFile failed: ${delRes.error}`);
  const existsRes = await win.webContents.executeJavaScript(
    `window.electronAPI.exists("${fileName}")`
  );
  assert(existsRes.ok, `exists failed: ${existsRes.error}`);
  assert.strictEqual(existsRes.data.exists, false);
});

it("delFolder deletes folders recursively", async function () {
  const folder = `parent-${uuidv4()}`;
  const subfolder = path.join(folder, `child-${uuidv4()}`);
  const file = path.join(subfolder, `a-${uuidv4()}.txt`);
  const createRes = await win.webContents.executeJavaScript(
    `window.electronAPI.createFolder("${subfolder}")`
  );
  assert(createRes.ok, `createFolder failed: ${createRes.error}`);
  const saveRes = await win.webContents.executeJavaScript(
    `window.electronAPI.saveFile("${file}", "abc")`
  );
  assert(saveRes.ok, `saveFile failed: ${saveRes.error}`);
  const delRes = await win.webContents.executeJavaScript(
    `window.electronAPI.delFolder("${folder}")`
  );
  assert(delRes.ok, `delFolder failed: ${delRes.error}`);
  const existsRes = await win.webContents.executeJavaScript(
    `window.electronAPI.exists("${folder}")`
  );
  assert(existsRes.ok, `exists failed: ${existsRes.error}`);
  assert.strictEqual(existsRes.data.exists, false);
});

it("stat returns directory info", async function () {
  const folder = `dirinfo-${uuidv4()}`;
  const createRes = await win.webContents.executeJavaScript(
    `window.electronAPI.createFolder("${folder}")`
  );
  assert(createRes.ok, `createFolder failed: ${createRes.error}`);
  const statRes = await win.webContents.executeJavaScript(
    `window.electronAPI.stat("${folder}")`
  );
  assert(statRes.ok, `stat failed: ${statRes.error}`);
  const stats = statRes.data;
  assert.strictEqual(stats.isDirectory, true);
  assert.strictEqual(stats.isFile, false);
});

it("getTree reflects nested structure", async function () {
  const subfolder = `tree-${uuidv4()}/branch-${uuidv4()}`;
  const file = `${subfolder}/leaf-${uuidv4()}.txt`;
  const createRes = await win.webContents.executeJavaScript(
    `window.electronAPI.createFolder("${subfolder}")`
  );
  assert(createRes.ok, `createFolder failed: ${createRes.error}`);
  const saveRes = await win.webContents.executeJavaScript(
    `window.electronAPI.saveFile("${file}", "leaf")`
  );
  assert(saveRes.ok, `saveFile failed: ${saveRes.error}`);
  const treeRes = await win.webContents.executeJavaScript(
    `window.electronAPI.getTree()`
  );
  assert(treeRes.ok, `getTree failed: ${treeRes.error}`);
  const tree: TreeNode[] = treeRes.data;
  // Look for nested folder and file
  const treeFolder = tree.find((node: TreeNode) => node.name.startsWith("tree-") && node.type === "folder") as FolderNode | undefined;
  assert(treeFolder);
  const branch = treeFolder.children.find((n: TreeNode) => n.name.startsWith("branch-") && n.type === "folder") as FolderNode | undefined;
  assert(branch);
  const leaf = branch.children.find((n: TreeNode) => n.name.startsWith("leaf-") && n.type === "file");
  assert(leaf);
  assert(leaf.path.includes("leaf"));
});

it("insertAtCursor inserts just before the marker and leaves marker in file", async function () {
  const fileName = `test_cursor_insert.rs`;
  const marker = "[[CURSOR]]";
  const before = "fn add(a: u8, b: u8) -> u8 {\n    ";
  const after = "\n}\n";
  const insertion = "a + b; ";
  const filePath = path.join(testRoot, fileName);

  // Ensure the test root and file exist
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, before + marker + after, "utf8");

  // Sanity check: file exists before insert
  assert(fs.existsSync(filePath), "Test file does not exist before insert!");

  // Call the IPC method via renderer
  const insertRes = await win.webContents.executeJavaScript(
    `window.electronAPI.insertAtCursor("${fileName}", "${insertion}")`
  );
  assert(
    insertRes.ok,
    `insertAtCursor failed: ${insertRes.error || JSON.stringify(insertRes)}`
  );

  // Read back the file and verify
  const resultContent = fs.readFileSync(filePath, "utf8");
  const expected = before + insertion + marker + after;
  assert.strictEqual(
    resultContent,
    expected,
    `Insertion at cursor failed. Got:\n${resultContent}`
  );
  assert(
    resultContent.includes(marker),
    "Marker should still be present after insertion"
  );
});
