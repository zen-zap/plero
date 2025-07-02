import { ipcMain } from "electron";
import * as aiService from "../services/ai";

ipcMain.handle("ai:complete", async (_event, args) => {
    console.log("[ai:complete] called with args:", args);
    try {
        const result = await aiService.completion(args);
        console.log("[ai:complete] got result:", result);
        return {
        ok: true,
        data: result
        };
    } catch (err) {
        console.error("[ai:complete] error:", err);
        return {
        ok: false,
        error: err instanceof Error ? err.message : String(err)
        };
    }
});

ipcMain.handle("ai:chat", async (_event, args) => {

    console.log("[ai:chat] called with args:", args);
    try {
        const {
            query,
            reasoning = false,
            web = false,
            model = "gpt-4o",
        } = args;
        const result = await aiService.chatRespond(query, reasoning, web, model);
        console.log("[ai:chat] Chat Response:", result);
        return {
          ok: true,
          data: result,
        };
    } catch (err) {
        console.error("[ai:chat] error:", err);
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
    }
});

ipcMain.handle("ai:classify", async (_event, args) => {
    console.log("[ai:classify] called with args:",args);
    try {
        const result = await aiService.classify(args);
        console.log("[ai:classify] response:", result);
        return {
            ok: true,
            data: result,
        };
    } catch (err) {
        console.error("[ai:classify] error:", err);
        return {
            ok: false,
            error: err instanceof Error ? err.message : String(err),
        }
    }
});
