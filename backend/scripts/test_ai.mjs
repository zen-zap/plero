import { spawn } from "child_process";

// Run the pattern runner with AI tests pattern
const testProcess = spawn("node", [
  "scripts/run_test_with_pattern.mjs",
  "ipc_tests/aiIpc.test.js"
], {
  stdio: "inherit"
});

testProcess.on("error", (err) => {
  console.error("Failed to start AI test process:", err);
  process.exit(1);
});
