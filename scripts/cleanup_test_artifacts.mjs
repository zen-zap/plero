import fs from "fs";
import "dotenv/config";
import path from "path";

// Patterns for files and folders to remove after tests
const patterns = [
  /^test(-[a-zA-Z0-9\-_.]+)?\.txt$/,
  /^meta(-[a-zA-Z0-9\-_.]+)?\.txt$/,
  /^oldname(-[a-zA-Z0-9\-_.]+)?\.txt$/,
  /^newname(-[a-zA-Z0-9\-_.]+)?\.txt$/,
  /^dirinfo(-[a-zA-Z0-9\-_.]+)?$/,
  /^tree(-[a-zA-Z0-9\-_.]+)?$/,
  /^test-folder(-[a-zA-Z0-9\-_.]+)?$/,
];

const cwd = process.cwd();

try {
  for (const entry of fs.readdirSync(cwd)) {
    for (const pattern of patterns) {
      if (pattern.test(entry)) {
        const p = path.join(cwd, entry);
        try {
          const stat = fs.lstatSync(p);
          if (stat.isDirectory()) {
            fs.rmSync(p, { recursive: true, force: true });
          } else {
            fs.unlinkSync(p);
          }
        } catch (err) {
          // Swallow errors, but optionally log in a debug mode
        }
        break;
      }
    }
  }
  console.log("Artifact Cleanup done!");
} catch (err) {
  console.error("Cleanup encountered an error:", err);
  process.exit(1);
}