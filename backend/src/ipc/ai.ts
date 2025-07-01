import { ipcMain } from "electron";
import * as aiService from "../services/ai";

ipcMain.handle("ai:complete", async (event, args) => {
  console.log("[ai:complete] called with args:", args);
  try {
    const result = await aiService.completion(args);
    console.log("[ai:complete] got result:", result);
    return { ok: true, data: result };
  } catch (err) {
    console.error("[ai:complete] error:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
});
