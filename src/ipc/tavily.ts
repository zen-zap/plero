import { ipcMain } from "electron";
import { tavilySearch } from "../services/tavily";

ipcMain.handle("tavily:search", async (event, args) => {
  console.log("[tavily:search] called with args:", args);
  try {
    const result = await tavilySearch(args);
    console.log("[tavily:search] got result:", result);
    return { ok: true, data: result };
  } catch (err) {
    console.error("[tavily:search] error:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
});
