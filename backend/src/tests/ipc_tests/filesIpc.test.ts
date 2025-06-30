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

// Helper: fully resets and sets a new TEST_ROOT
function setupTestRoot() {
  if (testRoot && fs.existsSync(testRoot)) {
    fs.rmSync(testRoot, { recursive: true, force: true });
  }
  testRoot = path.join(os.tmpdir(), `plero_file_ipc_test_${uuidv4()}`);
  fs.mkdirSync(testRoot, { recursive: true });
  process.env.TEST_ROOT = testRoot;
}

before(async function () {
  this.timeout(TIMEOUT);
  await app.whenReady();
  win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../../preload.js"),
      contextIsolation: true,
    },
  });
  await win.loadURL("about:blank");
});

// Clean up window and all test artifacts after all tests
after(function () {
  if (win) win.destroy();
  if (testRoot && fs.existsSync(testRoot)) {
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
  await win.webContents.executeJavaScript(
    `window.electronAPI.createFolder("${folderName}")`
  );
  const tree: TreeNode[] = await win.webContents.executeJavaScript(
    `window.electronAPI.getTree()`
  );
  assert(tree.some((node: TreeNode) => node.name === folderName && node.type === "folder"));
});

it("saveFile, getFileContent, and exists", async function () {
  const fileName = `test-${uuidv4()}.txt`;
  const content = "Hello, IPC!";
  await win.webContents.executeJavaScript(
    `window.electronAPI.saveFile("${fileName}", "${content}")`
  );
  const exists = await win.webContents.executeJavaScript(
    `window.electronAPI.exists("${fileName}")`
  );
  assert.strictEqual(exists.exists, true);
  const read = await win.webContents.executeJavaScript(
    `window.electronAPI.getFileContent("${fileName}")`
  );
  assert.strictEqual(read, content);
});

it("stat returns metadata for file", async function () {
  const fileName = `meta-${uuidv4()}.txt`;
  const content = "Meta Info";
  await win.webContents.executeJavaScript(
    `window.electronAPI.saveFile("${fileName}", "${content}")`
  );
  const stats = await win.webContents.executeJavaScript(
    `window.electronAPI.stat("${fileName}")`
  );
  assert.strictEqual(stats.size, content.length);
  assert.strictEqual(stats.isFile, true);
  assert.strictEqual(stats.isDirectory, false);
});

it("renamePath renames file", async function () {
  const src = `oldname-${uuidv4()}.txt`;
  const dst = `newname-${uuidv4()}.txt`;
  await win.webContents.executeJavaScript(
    `window.electronAPI.saveFile("${src}", "data")`
  );
  await win.webContents.executeJavaScript(
    `window.electronAPI.renamePath("${src}", "${dst}")`
  );
  const existsOld = await win.webContents.executeJavaScript(
    `window.electronAPI.exists("${src}")`
  );
  const existsNew = await win.webContents.executeJavaScript(
    `window.electronAPI.exists("${dst}")`
  );
  assert.strictEqual(existsOld.exists, false);
  assert.strictEqual(existsNew.exists, true);
});

it("delFile deletes file", async function () {
  const fileName = `todelete-${uuidv4()}.txt`;
  await win.webContents.executeJavaScript(
    `window.electronAPI.saveFile("${fileName}", "bye")`
  );
  await win.webContents.executeJavaScript(
    `window.electronAPI.delFile("${fileName}")`
  );
  const exists = await win.webContents.executeJavaScript(
    `window.electronAPI.exists("${fileName}")`
  );
  assert.strictEqual(exists.exists, false);
});

it("delFolder deletes folders recursively", async function () {
  const folder = `parent-${uuidv4()}`;
  const subfolder = path.join(folder, `child-${uuidv4()}`);
  const file = path.join(subfolder, `a-${uuidv4()}.txt`);
  await win.webContents.executeJavaScript(
    `window.electronAPI.createFolder("${subfolder}")`
  );
  await win.webContents.executeJavaScript(
    `window.electronAPI.saveFile("${file}", "abc")`
  );
  await win.webContents.executeJavaScript(
    `window.electronAPI.delFolder("${folder}")`
  );
  const exists = await win.webContents.executeJavaScript(
    `window.electronAPI.exists("${folder}")`
  );
  assert.strictEqual(exists.exists, false);
});

it("stat returns directory info", async function () {
  const folder = `dirinfo-${uuidv4()}`;
  await win.webContents.executeJavaScript(
    `window.electronAPI.createFolder("${folder}")`
  );
  const stats = await win.webContents.executeJavaScript(
    `window.electronAPI.stat("${folder}")`
  );
  assert.strictEqual(stats.isDirectory, true);
  assert.strictEqual(stats.isFile, false);
});

it("getTree reflects nested structure", async function () {
  const subfolder = `tree-${uuidv4()}/branch-${uuidv4()}`;
  const file = `${subfolder}/leaf-${uuidv4()}.txt`;
  await win.webContents.executeJavaScript(
    `window.electronAPI.createFolder("${subfolder}")`
  );
  await win.webContents.executeJavaScript(
    `window.electronAPI.saveFile("${file}", "leaf")`
  );
  const tree: TreeNode[] = await win.webContents.executeJavaScript(
    `window.electronAPI.getTree()`
  );
  // Look for nested folder and file
  const treeFolder = tree.find((node: TreeNode) => node.name.startsWith("tree-") && node.type === "folder") as FolderNode | undefined;
  assert(treeFolder);
  const branch = treeFolder.children.find((n: TreeNode) => n.name.startsWith("branch-") && n.type === "folder") as FolderNode | undefined;
  assert(branch);
  const leaf = branch.children.find((n: TreeNode) => n.name.startsWith("leaf-") && n.type === "file");
  assert(leaf);
  assert(leaf.path.includes("leaf"));
});
