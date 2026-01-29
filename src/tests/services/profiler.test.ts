/**
 * Tests for the profiler utility
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  profiler,
  timeAsync,
  timeSync,
  getStats,
  getSummary,
  formatDuration,
  type ProfileResult,
} from "../../services/profiler";

describe("Profiler", () => {
  beforeEach(() => {
    profiler.clear();
  });

  describe("start/stop", () => {
    it("should track timing for an operation", () => {
      profiler.start("test-op");

      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 10) {
        // busy wait
      }

      const result = profiler.stop("test-op");

      expect(result).not.toBeNull();
      expect(result!.name).toBe("test-op");
      expect(result!.duration).toBeGreaterThanOrEqual(10);
      expect(result!.success).toBe(true);
    });

    it("should return null when stopping non-existent timer", () => {
      const result = profiler.stop("non-existent");
      expect(result).toBeNull();
    });

    it("should record errors", () => {
      profiler.start("error-op");
      const result = profiler.stop("error-op", false, "Something went wrong");

      expect(result!.success).toBe(false);
      expect(result!.error).toBe("Something went wrong");
    });

    it("should store metadata", () => {
      profiler.start("meta-op", { fileSize: 1024, chunks: 5 });
      const result = profiler.stop("meta-op");

      expect(result!.metadata).toEqual({ fileSize: 1024, chunks: 5 });
    });
  });

  describe("timeAsync", () => {
    it("should time async operations", async () => {
      const { result, profile } = await timeAsync("async-op", async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return "done";
      });

      expect(result).toBe("done");
      expect(profile.duration).toBeGreaterThanOrEqual(50);
      expect(profile.success).toBe(true);
    });

    it("should handle async errors", async () => {
      await expect(
        timeAsync("async-error", async () => {
          throw new Error("Async failure");
        }),
      ).rejects.toThrow("Async failure");

      const stats = getStats("async-error");
      expect(stats).not.toBeNull();
      expect(stats!.successRate).toBe(0);
    });
  });

  describe("timeSync", () => {
    it("should time sync operations", () => {
      const { result, profile } = timeSync("sync-op", () => {
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
          sum += i;
        }
        return sum;
      });

      expect(result).toBe(499999500000);
      expect(profile.duration).toBeGreaterThan(0);
      expect(profile.success).toBe(true);
    });

    it("should handle sync errors", () => {
      expect(() =>
        timeSync("sync-error", () => {
          throw new Error("Sync failure");
        }),
      ).toThrow("Sync failure");

      const stats = getStats("sync-error");
      expect(stats).not.toBeNull();
      expect(stats!.successRate).toBe(0);
    });
  });

  describe("getStats", () => {
    it("should calculate correct statistics", async () => {
      // Run multiple operations
      for (let i = 0; i < 5; i++) {
        await timeAsync("multi-op", async () => {
          await new Promise((resolve) => setTimeout(resolve, 10 + i * 5));
          return i;
        });
      }

      const stats = getStats("multi-op");

      expect(stats).not.toBeNull();
      expect(stats!.totalCalls).toBe(5);
      expect(stats!.avgTime).toBeGreaterThan(0);
      expect(stats!.minTime).toBeLessThanOrEqual(stats!.avgTime);
      expect(stats!.maxTime).toBeGreaterThanOrEqual(stats!.avgTime);
      expect(stats!.successRate).toBe(1);
    });

    it("should return null for unknown operation", () => {
      const stats = getStats("unknown");
      expect(stats).toBeNull();
    });

    it("should calculate success rate correctly", async () => {
      // 2 successes
      await timeAsync("mixed", async () => "ok");
      await timeAsync("mixed", async () => "ok");

      // 1 failure
      try {
        await timeAsync("mixed", async () => {
          throw new Error("fail");
        });
      } catch {}

      const stats = getStats("mixed");
      expect(stats!.successRate).toBeCloseTo(2 / 3, 2);
    });
  });

  describe("getSummary", () => {
    it("should generate formatted summary", async () => {
      await timeAsync("op1", async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
      await timeAsync("op2", async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      const summary = getSummary();

      expect(summary).toContain("=== Profiler Summary ===");
      expect(summary).toContain("op1:");
      expect(summary).toContain("op2:");
      expect(summary).toContain("Calls:");
      expect(summary).toContain("Avg:");
    });
  });

  describe("getLastResult", () => {
    it("should return the last result", async () => {
      await timeAsync("last-test", async () => 1);
      await timeAsync("last-test", async () => 2);
      await timeAsync("last-test", async () => 3);

      const last = profiler.getLastResult("last-test");

      expect(last).not.toBeNull();
      // The results array should have 3 entries
      const stats = getStats("last-test");
      expect(stats!.totalCalls).toBe(3);
    });

    it("should return null for unknown operation", () => {
      const last = profiler.getLastResult("unknown");
      expect(last).toBeNull();
    });
  });

  describe("clear", () => {
    it("should clear all results", async () => {
      await timeAsync("clear-test", async () => "data");

      expect(getStats("clear-test")).not.toBeNull();

      profiler.clear();

      expect(getStats("clear-test")).toBeNull();
    });
  });
});

describe("formatDuration", () => {
  it("should format microseconds", () => {
    expect(formatDuration(0.5)).toContain("μs");
  });

  it("should format milliseconds", () => {
    expect(formatDuration(50)).toContain("ms");
    expect(formatDuration(50)).toBe("50.00ms");
  });

  it("should format seconds", () => {
    expect(formatDuration(2500)).toContain("s");
    expect(formatDuration(2500)).toBe("2.50s");
  });

  it("should format minutes", () => {
    expect(formatDuration(90000)).toContain("min");
    expect(formatDuration(90000)).toBe("1.50min");
  });
});
