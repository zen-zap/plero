import Redis from "ioredis";
import "dotenv/config";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redis = new Redis(REDIS_URL, {
  keepAlive: 30000,
  commandTimeout: 5000,
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redis.on("connect", () => {
    console.log("[Redis] Connected to Server");
});

redis.on("error", (err) => {
    console.error('[Redis] Redis connection error:', err);
});

redis.on("close", () => {
    console.log("[Redis] Connection closed");
});

redis.on("reconnecting", () => {
    console.log("[Redis] Reconnecting...");
});

export default redis;