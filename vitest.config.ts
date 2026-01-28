import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Global test configuration
    globals: true,

    // Environment for React components
    environment: "jsdom",

    // Setup files run before each test file
    setupFiles: ["./src/tests/setup.ts"],

    // Include patterns for test files
    include: ["src/tests/**/*.{test,spec}.{ts,tsx}"],

    // Exclude patterns
    exclude: [
      "node_modules",
      "dist",
      // Exclude Electron IPC tests - these need Electron runner
      "src/tests/ipc_tests/**",
    ],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: [
        "src/components/**/*.{ts,tsx}",
        "src/renderer/**/*.{ts,tsx}",
        "src/services/**/*.ts",
      ],
      exclude: ["src/tests/**", "src/**/*.test.{ts,tsx}", "src/**/*.d.ts"],
    },

    // Timeout for each test
    testTimeout: 10000,

    // Reporter options
    reporters: ["verbose"],

    // Alias resolution
    alias: {
      "@": path.resolve(__dirname, "./src/renderer"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@services": path.resolve(__dirname, "./src/services"),
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/renderer"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@services": path.resolve(__dirname, "./src/services"),
    },
  },
});
