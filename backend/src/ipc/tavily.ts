import { ipcMain } from "electron";
import { tavilySearch } from "../services/tavily";

ipcMain.handle("tavily:search", async (_event, opts) => {
    return await tavilySearch(opts);
});
