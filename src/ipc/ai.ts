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
