import { spawn } from "child_process";
import "dotenv/config";

// Run the pattern runner with Completion tests pattern
const testProcess = spawn("node", [
  "scripts/run_test_with_pattern.mjs",
  "ipc_tests/completionPipeline.test.js"
], {
  stdio: "inherit"
});

testProcess.on("error", (err) => {
  console.error("Failed to start Completion test process:", err);
  process.exit(1);
});
