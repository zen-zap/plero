import assert from "assert";
import { app, BrowserWindow } from "electron";
import path from "path";

let win: BrowserWindow;

const TIMEOUT = 12000;

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

it.skip("tavilySearch returns results for simple query", async function () {
  this.timeout(TIMEOUT);
  const result = await win.webContents.executeJavaScript(
    `window.electronAPI.tavilySearch({ query: "hello", k: 1 })`
  );
  assert(result, "No result returned from tavilySearch");
  assert(result.ok, `tavilySearch error: ${result.error}`);

  // Accepts either an array or object with results array
  if (Array.isArray(result.data)) {
    assert(result.data.length > 0, "No search results in data array");
  } else if (result.data && Array.isArray(result.data.results)) {
    assert(result.data.results.length > 0, "No search results in data.results array");
  } else {
    assert.fail("Unexpected tavilySearch result structure: " + JSON.stringify(result));
  }
});
