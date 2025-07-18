import { spawn } from "child_process";
import { randomUUID } from "crypto";
import os from "os";
import "dotenv/config";
import path from "path";

// Get the test pattern from command line args
const testPattern = process.argv[2] || '**/*.test.js';
console.log(`Running tests matching pattern: ${testPattern}`);

const commonTestRoot = path.join(os.tmpdir(), `plero_common_test_${randomUUID()}`);
console.log(`Setting TEST_ROOT to: ${commonTestRoot}`);

const env = {
  ...process.env,
  TEST_ROOT: commonTestRoot,
  NODE_ENV: 'test'
};

// First build the TypeScript
const buildProcess = spawn("npm", ["run", "build"], {
  stdio: "inherit",
  env: env
});

buildProcess.on("close", (buildCode) => {
  if (buildCode !== 0) {
    console.error("Build failed");
    process.exit(buildCode);
  }
  
  // Run electron-mocha with the specific pattern
  const testProcess = spawn("electron-mocha", [
    "--main", "dist/main.js", 
    `dist/tests/${testPattern}`
  ], {
    stdio: "inherit",
    env: env
  });

  testProcess.on("close", (code) => {
    console.log(`Tests finished with exit code: ${code}`);
    process.exit(code);
  });

  testProcess.on("error", (err) => {
    console.error("Failed to start test process:", err);
    process.exit(1);
  });
});

buildProcess.on("error", (err) => {
  console.error("Failed to start build process:", err);
  process.exit(1);
});
