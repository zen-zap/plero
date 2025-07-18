import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";
import "dotenv/config";

// Arguments: category (ai, tavily, completion, rag, etc.)
const category = process.argv[2];
if (!category) {
    console.error("Usage: node scripts/run_backend_test.mjs <category>");
    process.exit(1);
}

// Map category to test pattern
const patterns = {
    ai: "ipc_tests/aiIpc.test.js",
    tavily: "ipc_tests/tavilyIpc.test.js",
    completion: "ipc_tests/completionPipeline.test.js",
    ragcompletion: "ipc_tests/completionRagPipeline.test.js",
    rag: "rag_tests/*.test.js",
    files: "ipc_tests/filesIpc.test.js",
    redis: "rag_tests/redis.test.js",
};

const testPattern = patterns[category];
if (!testPattern) {
    console.error(`Unknown test category: ${category}`);
    process.exit(1);
}

// Setup test output directory
const outputDir = path.resolve("test_output");
if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir);

// Setup unique TEST_ROOT for isolation
const testRoot = path.join(os.tmpdir(), `plero_test_${randomUUID()}`);
const env = {
    ...process.env,
    TEST_ROOT: testRoot,
    NODE_ENV: "test",
};

// Build TypeScript
const buildProcess = spawn("npm", ["run", "build"], { stdio: "inherit", env });
buildProcess.on("close", (buildCode) => {
    if (buildCode !== 0) {
        console.error("Build failed");
        process.exit(buildCode);
    }

    // Run electron-mocha and redirect output to file
    const outputFile = path.join(outputDir, `${category}_output.txt`);
    const testProcess = spawn(
        "electron-mocha",
        ["--main", "dist/main.js", `dist/tests/${testPattern}`],
        { env }
    );

    const outStream = fs.createWriteStream(outputFile, { flags: "w" });
    testProcess.stdout.pipe(outStream);
    testProcess.stderr.pipe(outStream);

    testProcess.on("close", (code) => {
        if (code === 0) {
            console.log(`✅ All ${category} tests passed. Output saved to ${outputFile}`);
        } else {
            console.error(`❌ ${category} tests failed. See ${outputFile} for details.`);
        }
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
