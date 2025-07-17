import { spawn } from "child_process";

// Run the pattern runner with RAG tests pattern
const testProcess = spawn("node", [
  "scripts/run_test_with_pattern.mjs",
  "rag_tests/*.test.js"
], {
  stdio: "inherit"
});

testProcess.on("close", (code) => {
  console.log(`Tests finished with exit code: ${code}`);
  process.exit(code);
});

testProcess.on("error", (err) => {
  console.error("Failed to start RAG test process:", err);
  process.exit(1);
});
