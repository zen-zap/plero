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
  console.log("[IPC][ai:chat] request:", {
    mode: args.mode,
    hasContext: !!args.context,
  });
  try {
    const mode = args.mode || "chat";
    let result: string;
    let usedMode = mode;

    switch (mode) {
      case "auto": {
        const autoResult = await aiService.autoChat({
          query: args.query,
          context: args.context,
        });
        result = autoResult.response;
        usedMode = autoResult.mode;
        break;
      }
      case "web": {
        result = await aiService.webChat({
          query: args.query,
          context: args.context,
        });
        break;
      }
      case "reasoning":
      case "chat":
      default: {
        result = await aiService.chat({
          query: args.query,
          mode: mode,
          context: args.context,
        });
        break;
      }
    }

    return {
      ok: true,
      data: result,
      mode: usedMode,
    };
  } catch (err) {
    console.error("[IPC][ai:chat] error:", err);
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
