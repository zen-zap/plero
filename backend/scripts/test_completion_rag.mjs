import { spawn } from "child_process";

// Run the test
const testProcess = spawn("node", [
  "scripts/run_test_with_pattern.mjs",
  "ipc_tests/completionRagPipeline.test.js",
], {
  stdio: "inherit",
});

testProcess.on("close", (code) => {
  console.log(`Tests finished with exit code: ${code}`);
  process.exit(code);
});

testProcess.on("error", (err) => {
  console.error("Failed to start Completion RAG test process:", err);
  process.exit(1);
});
