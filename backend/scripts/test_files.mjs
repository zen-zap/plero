import { spawn } from "child_process";

// Run the pattern runner with Files tests pattern
const testProcess = spawn("node", [
  "scripts/run_test_with_pattern.mjs",
  "ipc_tests/filesIpc.test.js"
], {
  stdio: "inherit"
});

testProcess.on("error", (err) => {
  console.error("Failed to start Files test process:", err);
  process.exit(1);
});
