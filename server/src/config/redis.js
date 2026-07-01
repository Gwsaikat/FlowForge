import Redis from 'ioredis';

let redis = null;
let redisAvailable = false;

/**
 * Connect to Redis. Falls back gracefully if Redis is unavailable (dev mode).
 */
export async function connectRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn('REDIS_URL not set — caching and rate limiting will use memory fallback');
    return null;
  }

  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    await redis.connect();
    redisAvailable = true;
    console.log('Redis connected');
    return redis;
  } catch (err) {
    console.warn('Redis unavailable — using in-memory fallback:', err.message);
    redis = null;
    redisAvailable = false;
    return null;
  }
}

/**
 * Get the Redis client instance (may be null).
 */
export function getRedis() {
  return redis;
}

/**
 * Check if Redis is connected and ready.
 */
export function isRedisAvailable() {
  return redisAvailable && redis !== null;
}

/**
 * Safe Redis get — returns null if Redis unavailable.
 */
export async function safeGet(key) {
  if (!isRedisAvailable()) return null;
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

/**
 * Safe Redis setex — no-op if Redis unavailable.
 */
export async function safeSetex(key, ttl, value) {
  if (!isRedisAvailable()) return;
  try {
    await redis.setex(key, ttl, value);
  } catch {
    /* ignore */
  }
}

/**
 * Safe Redis del — no-op if Redis unavailable.
 */
export async function safeDel(...keys) {
  if (!isRedisAvailable()) return;
  try {
    await redis.del(...keys);
  } catch {
    /* ignore */
  }
}

export { redis };
