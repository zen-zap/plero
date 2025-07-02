import assert from "assert";
import { app, BrowserWindow } from "electron";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import os from "os";

let win: BrowserWindow;
let testRoot: string;
const TIMEOUT = 15000;

// Helper: set up unique test root for this run
function setupTestRoot() {
  if (process.env.TEST_ROOT) {
    // Use the common test root set by the script
    testRoot = process.env.TEST_ROOT;
    console.log(`Using common TEST_ROOT: ${testRoot}`);
  } else {
    // Fallback to unique root for individual test runs
    testRoot = path.join(os.tmpdir(), `plero_completion_test_${uuidv4()}`);
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
  setupTestRoot();
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

after(function () {
  if (win) win.destroy();
  // Only clean up if we created our own test root (not the common one)
  if (testRoot && fs.existsSync(testRoot) && !process.env.TEST_ROOT?.includes('plero_common_test_')) {
    fs.rmSync(testRoot, { recursive: true, force: true });
  }
  app.quit();
});

it("completes a Rust function by inserting just before the cursor marker and keeps marker", async function () {
  this.timeout(TIMEOUT);

  // Use a unique file in the TEST_ROOT
  const fileName = `dummy-${uuidv4()}.rs`;
  const filePath = path.join(testRoot, fileName);
  const marker = "[[CURSOR]]";
  const before = "fn add(a: i32, b: i32) -> i32 {\n    ";
  const after = "\n}\n";
  fs.writeFileSync(filePath, before + marker + after, "utf8");

  // 1. Read file content (relative path from TEST_ROOT)
  let fileRes;
  try {
    fileRes = await win.webContents.executeJavaScript(
      `window.electronAPI.getFileContent("${fileName}")`
    );
    console.log("Status:", fileRes);
  } catch (err) {
    console.error("Error getting file content:", err);
    throw err;
  }

  if (!fileRes.ok) throw new Error("failed to read file: " + fileRes.error);
  const fileContent = fileRes.data;

  // 2. Get completion from AI
  let completion;
  try {
    const prompt = [
      "Below is a Rust function with a [[CURSOR]] marker.",
      "Insert idiomatic Rust code just before the marker to complete the function body. Only output the code to insert (do not include the marker or extra text).",
      fileContent
    ].join("\n\n");
    // completion = await win.webContents.executeJavaScript(
    //   `window.electronAPI.aiComplete({
    //     prompt: \`${prompt}\`,
    //     model: "gpt-4.1-mini",
    //     max_tokens: 64
    //   })`
    // );
    completion = {
      ok: true,
      data: {
        content: "return a + b;" // Simulated AI response for testing
      },
      error: null
    }
    console.log("AI completion result:", completion);
  } catch (err) {
    console.error("Error getting AI completion:", err);
    throw err;
  }

  // 3. Insert completion just before the cursor (marker stays)
  try {
    assert(completion && completion.ok, `aiComplete error: ${completion?.error}`);
    let comp = typeof completion.data === 'object' && completion.data?.content 
      ? completion.data.content 
      : String(completion.data);
    comp = comp.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();

    const insertResult = await win.webContents.executeJavaScript(
      `window.electronAPI.insertAtCursor("${fileName}", \`${comp}\`)`
    );
    console.log("Insert at cursor result:", insertResult);
    assert(insertResult && !insertResult.error, `insertAtCursor error: ${insertResult?.error}`);

    // 4. Read back and verify: Insertion is before marker, marker is kept, rest is unchanged
    const finalRes = await win.webContents.executeJavaScript(
      `window.electronAPI.getFileContent("${fileName}")`
    );
    console.log("Final file content:", finalRes.data);
    assert(finalRes.data.includes(marker), "Cursor marker should still be present after insertion");
    assert(finalRes.data.includes(comp), "Completion was not inserted at cursor");
    assert(
      finalRes.data === before + comp + marker + after,
      `File content is not as expected. Got:\n${finalRes.data}`
    );
  } catch (err) {
    console.error("Final assert or insert error:", err);
    throw err;
  }
});
