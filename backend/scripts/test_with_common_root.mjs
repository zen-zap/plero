import { spawn } from "child_process";
import { randomUUID } from "crypto";
import os from "os";
import path from "path";

const commonTestRoot = path.join(os.tmpdir(), `plero_common_test_${randomUUID()}`);
console.log(`Setting TEST_ROOT to: ${commonTestRoot}`);

const env = {
  ...process.env,
  TEST_ROOT: commonTestRoot
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
  
  // Then run the existing test command
  const testProcess = spawn("npm", ["test"], {
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
