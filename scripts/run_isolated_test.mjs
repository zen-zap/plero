import { spawn } from "child_process";
import { randomUUID } from "crypto";
import os from "os";
import path from "path";
import fs from "fs";
import "dotenv/config";

// Get test type from command line
const testType = process.argv[2];
if (!testType) {
    console.error("Usage: node scripts/run_isolated_test.mjs <test-type>");
    console.error("Available types: redis, rag, ai, files, completion, ragcompletion, tavily");
    process.exit(1);
}

// Test configurations - run mocha directly for Node.js tests
const testConfigs = {
    redis: {
        command: "mocha",
        args: ["-r", "dotenv/config", "-r", "ts-node/register", "--timeout", "30000", "src/tests/rag_tests/redis.test.ts"],
        description: "Redis Tests"
    },
    rag: {
        command: "mocha", 
        args: ["-r", "dotenv/config", "-r", "ts-node/register", "--timeout", "30000", "src/tests/rag_tests/rag.test.ts"],
        description: "RAG Tests"
    },
    ai: {
        command: "npm",
        args: ["run", "test:electron:ai"],
        description: "AI Tests"
    },
    files: {
        command: "npm", 
        args: ["run", "test:electron:files"],
        description: "File Tests"
    },
    completion: {
        command: "npm",
        args: ["run", "test:electron:completion"], 
        description: "Completion Tests"
    },
    ragcompletion: {
        command: "npm",
        args: ["run", "test:electron:ragcompletion"],
        description: "RAG Completion Tests"
    },
    tavily: {
        command: "npm",
        args: ["run", "test:electron:tavily"],
        description: "Tavily Tests"
    }
};

const config = testConfigs[testType];
if (!config) {
    console.error(`Unknown test type: ${testType}`);
    process.exit(1);
}

// Create isolated test environment
const testRoot = path.join(os.tmpdir(), `plero_${testType}_${randomUUID()}`);
console.log(`🏗️  Creating test environment: ${testRoot}`);

const env = {
    ...process.env,
    TEST_ROOT: testRoot,
    NODE_ENV: 'test',
    REDIS_KEY_PREFIX: `test_${testType}_${Date.now()}_`
};

// Ensure test root exists
if (!fs.existsSync(testRoot)) {
    fs.mkdirSync(testRoot, { recursive: true });
}

console.log(`🚀 Starting: ${config.description}`);
console.log(`📁 Test Root: ${testRoot}`);

const testProcess = spawn(config.command, config.args, {
    stdio: "inherit",
    env: env,
    shell: true,
    detached: false
});

// Set timeout for stuck processes - 40 seconds for individual tests
const timeout = setTimeout(() => {
    console.log('⏰ Test timed out, force killing process...');
    
    // More aggressive process killing
    try {
        if (process.platform === 'win32') {
            spawn('taskkill', ['/pid', testProcess.pid, '/t', '/f']);
        } else {
            // Kill process group
            process.kill(-testProcess.pid, 'SIGKILL');
        }
    } catch (e) {
        // Fallback to regular kill
        testProcess.kill('SIGKILL');
    }
    
    cleanup();
    console.log('🔥 Process forcefully terminated');
    process.exit(1);
}, 40000); // 40 second timeout

// Cleanup function
const cleanup = () => {
    clearTimeout(timeout);
    if (fs.existsSync(testRoot)) {
        try {
            fs.rmSync(testRoot, { recursive: true, force: true });
            console.log(`🧹 Cleaned up test root: ${testRoot}`);
        } catch (err) {
            console.warn(`⚠️  Failed to cleanup: ${err.message}`);
        }
    }
};

testProcess.on("close", (code) => {
    cleanup();
    if (code === 0) {
        console.log(`✅ ${config.description} completed successfully`);
    } else {
        console.log(`❌ ${config.description} failed with exit code: ${code}`);
    }
    process.exit(code);
});

testProcess.on("error", (err) => {
    cleanup();
    console.error(`💥 Failed to start ${config.description}:`, err);
    process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Test interrupted, cleaning up...');
    cleanup();
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Test terminated, cleaning up...');
    cleanup();
    process.exit(1);
});