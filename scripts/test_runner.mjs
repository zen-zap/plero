import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import os from 'os';

// Create test_output directory
const outputDir = path.resolve('test_output');
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir);

const runIsolatedTest = (testName, command, args, description) => {
  return new Promise((resolve, reject) => {
    // Create unique test root for this specific test
    const testRoot = path.join(os.tmpdir(), `plero_${testName}_${randomUUID()}`);
    const outputFile = path.join(outputDir, `${testName}_output.txt`);
    
    console.log(`\n🚀 Starting: ${description}`);
    console.log(`📁 Test Root: ${testRoot}`);
    console.log(`📝 Command: ${command} ${args.join(' ')}\n`);
    
    const env = {
      ...process.env,
      TEST_ROOT: testRoot,
      NODE_ENV: 'test'
    };
    
    const testProcess = spawn(command, args, { 
      stdio: ['inherit', 'pipe', 'pipe'],
      env,
      shell: true,
      detached: false
    });
    
    const outStream = fs.createWriteStream(outputFile, { flags: 'w' });
    
    // Set up timeout to kill stuck processes - reduced to 45 seconds
    const timeout = setTimeout(() => {
      console.log(`⏰ Test ${testName} timed out, killing process...`);
      
      // Kill the process tree
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', testProcess.pid, '/t', '/f']);
        } else {
          process.kill(-testProcess.pid, 'SIGKILL');
        }
      } catch (e) {
        testProcess.kill('SIGKILL');
      }
      
      outStream.end();
      cleanup();
      reject(new Error(`Test ${testName} timed out`));
    }, 45000); // 45 second timeout
    
    // Show AND save output
    testProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
      outStream.write(data);
    });
    
    testProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
      outStream.write(data);
    });
    
    const cleanup = () => {
      clearTimeout(timeout);
      // Cleanup test root
      if (fs.existsSync(testRoot)) {
        try {
          fs.rmSync(testRoot, { recursive: true, force: true });
          console.log(`🧹 Cleaned up test root: ${testRoot}`);
        } catch (err) {
          console.warn(`⚠️  Failed to cleanup test root: ${err.message}`);
        }
      }
    };
    
    testProcess.on('close', (code) => {
      clearTimeout(timeout);
      outStream.end();
      cleanup();
      
      if (code === 0) {
        console.log(`\n✅ Completed: ${description}`);
        console.log(`📄 Output saved to: ${outputFile}`);
        resolve();
      } else {
        console.log(`\n❌ Failed: ${description} (exit code: ${code})`);
        reject(new Error(`${description} failed`));
      }
    });
    
    testProcess.on('error', (err) => {
      clearTimeout(timeout);
      outStream.end();
      cleanup();
      reject(err);
    });
  });
};

async function main() {
  try {
    // Run each test category in isolation
    await runIsolatedTest('redis', 'mocha', ['-r', 'dotenv/config', '-r', 'ts-node/register', '--timeout', '30000', 'src/tests/rag_tests/redis.test.ts'], 'Redis Tests');
    
    await runIsolatedTest('rag', 'mocha', ['-r', 'dotenv/config', '-r', 'ts-node/register', '--timeout', '30000', 'src/tests/rag_tests/rag.test.ts'], 'RAG Tests');
    
    // Only run Electron tests if the basic ones pass
    console.log('\n🚀 Starting Electron Tests...');
    await runIsolatedTest('ai', 'npm', ['run', 'test:electron:ai'], 'AI Tests');
    await runIsolatedTest('files', 'npm', ['run', 'test:electron:files'], 'File Tests');
    await runIsolatedTest('completion', 'npm', ['run', 'test:electron:completion'], 'Completion Tests');
    await runIsolatedTest('ragcompletion', 'npm', ['run', 'test:electron:ragcompletion'], 'RAG Completion Tests');
    await runIsolatedTest('tavily', 'npm', ['run', 'test:electron:tavily'], 'Tavily Tests');
    
    console.log('\n🎉 All tests completed successfully!');
    console.log(`📁 Test outputs saved in: ${outputDir}/`);
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test suite interrupted, exiting...');
  process.exit(1);
});

main();