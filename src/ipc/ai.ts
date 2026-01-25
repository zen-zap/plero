import { ipcMain } from "electron";
import * as aiService from "../services/ai";

ipcMain.handle("ai:ghost", async (_event, args) => {
    try {
        const result = await aiService.ghostCompletion(args);
        return {
            ok: true,
            data: result
        };
    } catch (err) {
        return {
            ok: false,
            error: err instanceof Error ? err.message : String(err)
        };
    }
});