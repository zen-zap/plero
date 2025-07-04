import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redis = new Redis(REDIS_URL);   

redis.on("connect", () => {
    console.log("[Redis] Connected to Server");
});

redis.on("error", (err) => {
    console.error('[Redis] Redis connection error:' ,err);
});

export default redis;
