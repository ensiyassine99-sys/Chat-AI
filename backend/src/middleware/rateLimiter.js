const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Configuration conditionnelle de Redis
let RedisStore = null;
let redisClient = null;

// Initialiser Redis si configuré
const initializeRedis = () => {
  const useRedis = process.env.USE_REDIS === 'true';
  
  if (!useRedis) {
    logger.info('Rate limiting using memory store (Redis disabled)');
    return false;
  }

  try {
    const Redis = require('ioredis');
    const RedisStoreModule = require('rate-limit-redis');
    
    RedisStore = RedisStoreModule.default || RedisStoreModule;
    
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB) || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected for rate limiting');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error:', err.message);
    });

    logger.info('Rate limiting using Redis store');
    return true;
  } catch (error) {
    logger.warn('Redis initialization failed, falling back to memory store:', error.message);
    return false;
  }
};

const redisEnabled = initializeRedis();

// Helper pour créer un store
const createStore = (prefix) => {
  if (redisEnabled && RedisStore && redisClient) {
    return new RedisStore({
      client: redisClient,
      prefix: `rate_limit:${prefix}:`,
    });
  }
  return undefined;
};

// Rate limiter pour l'authentification
const authLimiter = rateLimit({
  store: createStore('auth'),
  windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 900000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS) || 5,
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many login attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
});

// Rate limiter pour les API générales
const apiLimiter = rateLimit({
  store: createStore('api'),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 30,
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`API rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json(options.message);
  },
  skip: (req) => {
    return req.user && req.user.role === 'admin';
  },
});

// Rate limiter pour le chat
const chatLimiter = rateLimit({
  store: createStore('chat'),
  windowMs: parseInt(process.env.RATE_LIMIT_CHAT_WINDOW_MS) || 60000, // 1 min
  max: parseInt(process.env.RATE_LIMIT_CHAT_MAX_REQUESTS) || 60,
  message: {
    error: 'Too many messages',
    message: 'You are sending messages too quickly. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.userId || req.ip;
  },
  handler: (req, res, next, options) => {
    logger.warn(`Chat rate limit exceeded for user: ${req.userId || req.ip}`);
    res.status(429).json(options.message);
  },
});

// Rate limiter pour les uploads
const uploadLimiter = rateLimit({
  store: createStore('upload'),
  windowMs: parseInt(process.env.RATE_LIMIT_UPLOAD_WINDOW_MS) || 900000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX_REQUESTS) || 10,
  message: {
    error: 'Too many uploads',
    message: 'You have exceeded the upload limit. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip,
});

// Rate limiter pour les résumés AI
const aiSummaryLimiter = rateLimit({
  store: createStore('ai_summary'),
  windowMs: parseInt(process.env.RATE_LIMIT_AI_SUMMARY_WINDOW_MS) || 3600000, // 1 heure
  max: parseInt(process.env.RATE_LIMIT_AI_SUMMARY_MAX_REQUESTS) || 20,
  message: {
    error: 'AI summary limit exceeded',
    message: 'You have exceeded the AI summary generation limit. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip,
});

// Rate limiter strict pour opérations sensibles
const strictLimiter = rateLimit({
  store: createStore('strict'),
  windowMs: parseInt(process.env.RATE_LIMIT_STRICT_WINDOW_MS) || 3600000, // 1 heure
  max: parseInt(process.env.RATE_LIMIT_STRICT_MAX_REQUESTS) || 3,
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many requests for this operation. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Réinitialiser les limites d'un utilisateur (admin)
const resetUserLimits = async (userId) => {
  if (!redisEnabled || !redisClient) {
    logger.warn('Cannot reset user limits: Redis not available');
    return false;
  }

  const patterns = [
    `rate_limit:api:${userId}`,
    `rate_limit:auth:${userId}`,
    `rate_limit:chat:${userId}`,
    `rate_limit:upload:${userId}`,
    `rate_limit:ai_summary:${userId}`,
    `rate_limit:strict:${userId}`,
  ];
  
  try {
    for (const pattern of patterns) {
      const keys = await redisClient.keys(`${pattern}*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    }
    logger.info(`Rate limits reset for user: ${userId}`);
    return true;
  } catch (error) {
    logger.error('Error resetting rate limits:', error);
    return false;
  }
};

// Vérifier l'état de Redis
const getRedisStatus = () => {
  return {
    enabled: redisEnabled,
    connected: redisClient ? redisClient.status === 'ready' : false,
  };
};

module.exports = {
  authLimiter,
  apiLimiter,
  chatLimiter,
  uploadLimiter,
  aiSummaryLimiter,
  strictLimiter,
  resetUserLimits,
  getRedisStatus,
  redisClient,
};