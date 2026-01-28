import { ipcMain } from "electron";
import * as aiService from "../services/ai";

ipcMain.handle("ai:ghost", async (_event, args) => {
  console.log("[IPC][ai:ghost] request:", { args });
  try {
    const result = await aiService.ghostCompletion(args);
    console.log("[IPC][ai:ghost] got result:", {
      ok: true,
      length: typeof result === "string" ? result.length : undefined,
    });
    return {
      ok: true,
      data: result,
    };
  } catch (err) {
    console.error("[IPC][ai:ghost] error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
});

ipcMain.handle("ai:chat", async (_event, args) => {
  console.log("\n" + "=".repeat(70));
  console.log("[IPC][ai:chat] REQUEST RECEIVED");
  console.log("[IPC][ai:chat] mode:", args.mode);
  console.log("[IPC][ai:chat] hasContext:", !!args.context);
  console.log("[IPC][ai:chat] hasHistory:", !!args.history);
  console.log("[IPC][ai:chat] historyLength:", args.history?.length || 0);
  console.log(
    "[IPC][ai:chat] query (first 100 chars):",
    args.query?.slice(0, 100),
  );
  console.log("=".repeat(70));

  try {
    const mode = args.mode || "auto";
    let result: string;
    let usedMode = mode;

    // Use graph-based chat with full history support
    const { graphBasedChat } = await import("../services/ai");

    console.log("[IPC][ai:chat] Calling graphBasedChat with mode:", mode);

    const graphResult = await graphBasedChat({
      query: args.query,
      mode: mode,
      context: args.context,
      history: args.history, // Pass conversation history
    });

    result = graphResult.response;
    usedMode = graphResult.usedMode;

    console.log("[IPC][ai:chat] Graph returned, usedMode:", usedMode);
    console.log("[IPC][ai:chat] Response length:", result?.length);

    return {
      ok: true,
      data: result,
      mode: usedMode,
    };
  } catch (err) {
    console.error("[IPC][ai:chat] ERROR:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
});

ipcMain.handle("ai:ragChat", async (_event, args) => {
  console.log("[IPC][ai:ragChat] request:", {
    hasFileContent: !!args.fileContent,
  });
  try {
    const result = await aiService.ragChat({
      query: args.query,
      fileContent: args.fileContent,
      filePath: args.filePath,
    });
    return {
      ok: true,
      data: result,
    };
  } catch (err) {
    console.error("[IPC][ai:ragChat] error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
});
