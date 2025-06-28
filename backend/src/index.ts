import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import filesRouter from "./routes/files";
import aiRouter from "./routes/ai";
import logsRouter from "./routes/logs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/files", filesRouter);
app.use("/api/ai", aiRouter);
app.use("/api/logs", logsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));