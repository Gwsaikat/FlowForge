import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedis, isRedisAvailable } from '../config/redis.js';

function createStore() {
  const redis = getRedis();
  if (!isRedisAvailable() || !redis) return undefined;
  return new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  });
}

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: createStore(),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Try again in 15 minutes.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  store: createStore(),
  message: { success: false, error: 'Too many login attempts. Try again in 15 minutes.' },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: createStore(),
  message: { success: false, error: 'Too many login attempts. Try again in 15 minutes.' },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  store: createStore(),
  message: { success: false, error: 'Too many registration attempts. Try again later.' },
});

export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  store: createStore(),
  message: { success: false, error: 'Too many refresh attempts.' },
});

export const graphLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?.id || req.ip,
  store: createStore(),
  message: { success: false, error: 'Slow down! Too many task updates.' },
});
