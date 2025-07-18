import { spawn } from "child_process";
import "dotenv/config";

// Run the pattern runner with Tavily tests pattern
const testProcess = spawn("node", [
  "scripts/run_test_with_pattern.mjs",
  "ipc_tests/tavilyIpc.test.js"
], {
  stdio: "inherit"
});

testProcess.on("error", (err) => {
  console.error("Failed to start Tavily test process:", err);
  process.exit(1);
});
