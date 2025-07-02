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
            sandbox: true,
        },
    });
    await win.loadURL("about:blank");

    win.webContents.on('console-message', (event) => {
        console.log(`Renderer Console [${event.level}] : ${event.message}`);
    });
});

after(function () {
    if (win) win.destroy();
    app.quit();
});

it("ai:complete returns a valid, non-empty completion", async function () {
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

it("ai: classifies the query", async function () {
    this.timeout(TIMEOUT);

    const testCases = [
        { query: "console.log(", expected: 1 }, // Code completion
        { query: "Hello, how are you?", expected: 2 }, // Chat
        { query: "Explain quantum computing in detail", expected: 3 }, // Reasoning
        { query: "What's the weather today?", expected: 4 }, // Web search
    ];

    for (const testCase of testCases) {
        const result = await win.webContents.executeJavaScript(
            `window.electronAPI.aiClassify({ query: "${testCase.query}" })`
        );

        console.log(`Calling [ai:classify] --> query: ${testCase.query} expected: ${testCase.expected} classification: ${result.data}`);

        assert(result, "No result returned from ai:classify");
        assert(result.ok, `ai:classify error: ${result.error}`);
        assert(typeof result.data === "number", "Classification should be a number");
        assert(result.data >= 1 && result.data <= 4, "Classification should be between 1-4");
    }
});

it("ai: classifies the query", async function () {
    this.timeout(TIMEOUT);

    const result = await win.webContents.executeJavaScript(
        `window.electronAPI.aiClassify({ query: "console.log('hello')" })`
    );

    console.log("Classification result:", result);
    assert(result, "No result returned from ai:classify");
    assert(result.ok, `ai:classify error: ${result.error}`);
});

it("ai: chat returns conversational response", async function () {
    this.timeout(TIMEOUT);

    const result = await win.webContents.executeJavaScript(
        `window.electronAPI.aiChat({ 
          query: "Hello, what's TypeScript?", 
          reasoning: false, 
          web: false 
        })`
    );

    console.log("Chat result:", result);
    assert(result, "No result returned from ai:chat");
    assert(result.ok, `ai:chat error: ${result.error}`);
});
