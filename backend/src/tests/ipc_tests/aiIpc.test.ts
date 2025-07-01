// in test files you create headless before and after for the test and then run them .. completely different unrelated to main.ts


import assert from "assert";
import { app, BrowserWindow } from "electron";
import path from "path";

let win: BrowserWindow;

const TIMEOUT = 15000;

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

after(function () {
  if (win) win.destroy();
  app.quit();
});

it.skip("ai:complete returns a valid, non-empty completion", async function () {
  this.timeout(TIMEOUT);
  const prompt = "console.log(";
  const model = "gpt-4.1-mini";

  const result = await win.webContents.executeJavaScript(
    `window.electronAPI.aiComplete({ prompt: "${prompt}", model: "${model}", maxTokens: 10 })`
  );

  assert(result, "No result returned from ai:complete");
  assert(result.ok, `ai:complete error: ${result.error}`);

  // Accept string, {completion: string}, {data: string}, or {data: { content: string } }
  if (typeof result.data === "string") {
    assert(result.data.length > 0, "Empty .data string");
  } else if (result.data && typeof result.data.completion === "string") {
    assert(result.data.completion.length > 0, "Empty .data.completion");
  } else if (result.data && typeof result.data.content === "string") {
    assert(result.data.content.length > 0, "Empty .data.content");
  } else {
    assert.fail("Unexpected ai:complete result structure: " + JSON.stringify(result));
  }
});
