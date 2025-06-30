// in src/index.ts

// imports follow the ES6 module syntax
import express from "express"; // from the express node module
import cors from "cors"; // another node module for handling CORS
import dotenv from "dotenv"; // to load environment variables from a .env file
import filesRouter from "./routes/files"; // custom router for file operations
import aiRouter from "./routes/ai"; // custom router for api calls
import logsRouter from "./routes/logs"; // custom router for logging operations

dotenv.config();

const app = express(); // creates an instance of express application -- this object represents the web server
app.use(cors()); // makes the object server use CORS, which allows cross-origin requests
app.use(express.json()); // parses incoming JSON requests and puts the parsed data in req.body automatically

// register route handlers for your different API endpoints
app.use("/api/files", filesRouter);
app.use("/api/ai", aiRouter);
app.use("/api/logs", logsRouter);

// welcome message
app.get("/hi", (req, res) => {
    res.send("Welcome to the backend server for plero! Your very own micro IDE with code-completion and AI chat capabilities.");
})

const PORT = process.env.PORT || 4000; // use the default port as 4000 unless specified in .env file
app.listen(PORT, () => {
    console.log(`[Success] Backend running on port ${PORT}`)
});

// the flow is kinda like this:
// request comes in -> express passes it through a lot of middleware and route handlers -> then passed to user-defined route handlers -> response is sent back to the client
