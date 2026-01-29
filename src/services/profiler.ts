/**
 * Simple profiler for timing operations
 * Can be used to measure AI requests, RAG operations, etc.
 */

export interface ProfileResult {
  name: string;
  duration: number; // milliseconds
  startTime: number;
  endTime: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ProfilerStats {
  totalCalls: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
  results: ProfileResult[];
}

class Profiler {
  private results: Map<string, ProfileResult[]> = new Map();
  private activeTimers: Map<
    string,
    { startTime: number; metadata?: Record<string, unknown> }
  > = new Map();

  /**
   * Start timing an operation
   */
  start(name: string, metadata?: Record<string, unknown>): void {
    const timerId = `${name}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.activeTimers.set(timerId, {
      startTime: performance.now(),
      metadata,
    });
    this.activeTimers.set(name, this.activeTimers.get(timerId)!);
  }

  /**
   * Stop timing and record the result
   */
  stop(
    name: string,
    success: boolean = true,
    error?: string,
  ): ProfileResult | null {
    const timer = this.activeTimers.get(name);
    if (!timer) {
      console.warn(`[Profiler] No active timer found for: ${name}`);
      return null;
    }

    const endTime = performance.now();
    const result: ProfileResult = {
      name,
      duration: endTime - timer.startTime,
      startTime: timer.startTime,
      endTime,
      success,
      error,
      metadata: timer.metadata,
    };

    if (!this.results.has(name)) {
      this.results.set(name, []);
    }
    this.results.get(name)!.push(result);

    // Clean up
    this.activeTimers.delete(name);

    return result;
  }

  /**
   * Time an async operation
   */
  async timeAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>,
  ): Promise<{ result: T; profile: ProfileResult }> {
    this.start(name, metadata);
    try {
      const result = await fn();
      const profile = this.stop(name, true)!;
      return { result, profile };
    } catch (error) {
      const profile = this.stop(
        name,
        false,
        error instanceof Error ? error.message : String(error),
      )!;
      throw error;
    }
  }

  /**
   * Time a sync operation
   */
  timeSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>,
  ): { result: T; profile: ProfileResult } {
    this.start(name, metadata);
    try {
      const result = fn();
      const profile = this.stop(name, true)!;
      return { result, profile };
    } catch (error) {
      const profile = this.stop(
        name,
        false,
        error instanceof Error ? error.message : String(error),
      )!;
      throw error;
    }
  }

  /**
   * Get statistics for a named operation
   */
  getStats(name: string): ProfilerStats | null {
    const results = this.results.get(name);
    if (!results || results.length === 0) {
      return null;
    }

    const durations = results.map((r) => r.duration);
    const successCount = results.filter((r) => r.success).length;

    return {
      totalCalls: results.length,
      totalTime: durations.reduce((a, b) => a + b, 0),
      avgTime: durations.reduce((a, b) => a + b, 0) / results.length,
      minTime: Math.min(...durations),
      maxTime: Math.max(...durations),
      successRate: successCount / results.length,
      results,
    };
  }

  /**
   * Get all statistics
   */
  getAllStats(): Map<string, ProfilerStats> {
    const allStats = new Map<string, ProfilerStats>();
    for (const name of this.results.keys()) {
      const stats = this.getStats(name);
      if (stats) {
        allStats.set(name, stats);
      }
    }
    return allStats;
  }

  /**
   * Get a formatted summary of all operations
   */
  getSummary(): string {
    const lines: string[] = ["=== Profiler Summary ==="];

    for (const [name, results] of this.results) {
      const stats = this.getStats(name);
      if (stats) {
        lines.push(`\n${name}:`);
        lines.push(`  Calls: ${stats.totalCalls}`);
        lines.push(`  Total: ${stats.totalTime.toFixed(2)}ms`);
        lines.push(`  Avg: ${stats.avgTime.toFixed(2)}ms`);
        lines.push(`  Min: ${stats.minTime.toFixed(2)}ms`);
        lines.push(`  Max: ${stats.maxTime.toFixed(2)}ms`);
        lines.push(`  Success: ${(stats.successRate * 100).toFixed(1)}%`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Clear all results
   */
  clear(): void {
    this.results.clear();
    this.activeTimers.clear();
  }

  /**
   * Get the last result for a named operation
   */
  getLastResult(name: string): ProfileResult | null {
    const results = this.results.get(name);
    if (!results || results.length === 0) {
      return null;
    }
    return results[results.length - 1];
  }
}

export const profiler = new Profiler();

export const timeAsync = profiler.timeAsync.bind(profiler);
export const timeSync = profiler.timeSync.bind(profiler);
export const getStats = profiler.getStats.bind(profiler);
export const getSummary = profiler.getSummary.bind(profiler);

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}μs`;
  }
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${(ms / 60000).toFixed(2)}min`;
}
