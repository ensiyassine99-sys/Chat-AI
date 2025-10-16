const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// ================================================
// 🔴 VARIABLES GLOBALES
// ================================================
let RedisStore = null;
let redisClient = null;
let isRedisReady = false;

// ================================================
// 🔴 CONFIGURATION CENTRALISÉE
// ================================================
const rateLimitConfig = {
  auth: {
    windowMs: () => parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 900000,
    max: () => parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS) || 15,
    skipSuccessfulRequests: true,
    message: {
      error: 'Too many authentication attempts',
      message: 'Too many login attempts. Please try again later.',
    },
  },
  api: {
    windowMs: () => parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: () => parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 30,
    skipAdmin: true,
    message: {
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
    },
  },
  chat: {
    windowMs: () => parseInt(process.env.RATE_LIMIT_CHAT_WINDOW_MS) || 60000,
    max: () => parseInt(process.env.RATE_LIMIT_CHAT_MAX_REQUESTS) || 60,
    useUserId: true,
    message: {
      error: 'Too many messages',
      message: 'You are sending messages too quickly. Please slow down.',
    },
  },
  upload: {
    windowMs: () => parseInt(process.env.RATE_LIMIT_UPLOAD_WINDOW_MS) || 900000,
    max: () => parseInt(process.env.RATE_LIMIT_UPLOAD_MAX_REQUESTS) || 10,
    useUserId: true,
    message: {
      error: 'Too many uploads',
      message: 'You have exceeded the upload limit. Please try again later.',
    },
  },
  aiSummary: {
    windowMs: () => parseInt(process.env.RATE_LIMIT_AI_SUMMARY_WINDOW_MS) || 3600000,
    max: () => parseInt(process.env.RATE_LIMIT_AI_SUMMARY_MAX_REQUESTS) || 20,
    useUserId: true,
    message: {
      error: 'AI summary limit exceeded',
      message: 'You have exceeded the AI summary generation limit. Please try again later.',
    },
  },
  strict: {
    windowMs: () => parseInt(process.env.RATE_LIMIT_STRICT_WINDOW_MS) || 3600000,
    max: () => parseInt(process.env.RATE_LIMIT_STRICT_MAX_REQUESTS) || 3,
    skipSuccessfulRequests: true,
    message: {
      error: 'Rate limit exceeded',
      message: 'Too many requests for this operation. Please try again later.',
    },
  },
};

// ================================================
// 🔴 INITIALISATION REDIS
// ================================================
const initializeRedis = async () => {
  const useRedis = process.env.USE_REDIS === 'true';

  if (!useRedis) {
    logger.info('✅ Rate limiting using memory store (Redis disabled)');
    isRedisReady = false;
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
        if (times > 3) {
          logger.error('❌ Redis: Max retries reached (3 attempts)');
          return null;
        }
        const delay = Math.min(times * 100, 2000);
        logger.warn(`🔄 Redis: Retry attempt ${times}/3 in ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      lazyConnect: false,
    });

    redisClient.on('connect', () => {
      logger.info(`🔄 Redis: Connection initiated to ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis: Connection ready and operational');
      isRedisReady = true;
    });

    redisClient.on('error', (err) => {
      logger.error('❌ Redis error:', {
        message: err.message,
        code: err.code,
      });
      isRedisReady = false;
    });

    redisClient.on('close', () => {
      logger.warn('⚠️  Redis: Connection closed');
      isRedisReady = false;
    });

    redisClient.on('reconnecting', () => {
      logger.info('🔄 Redis: Reconnecting...');
    });

    await Promise.race([
      new Promise((resolve, reject) => {
        redisClient.once('ready', resolve);
        redisClient.once('error', reject);
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout after 5s')), 5000)
      ),
    ]);

    logger.info('✅ Rate limiting using Redis store');
    return true;

  } catch (error) {
    logger.error('❌ Redis initialization failed:', {
      message: error.message,
      code: error.code,
    });
    logger.warn('⚠️  Falling back to memory store (in-memory rate limiting)');

    if (redisClient) {
      try {
        await redisClient.quit();
      } catch (e) { }
      redisClient = null;
    }

    isRedisReady = false;
    return false;
  }
};

// ================================================
// 🔴 FACTORY FUNCTIONS - VERSION DYNAMIQUE
// ================================================

/**
 * ✅ Crée un store DYNAMIQUEMENT à chaque requête
 * Cela permet d'utiliser Redis s'il devient disponible
 */
const createDynamicStore = (prefix) => {
  // Retourne un objet qui implémente l'interface Store
  return {
    // Méthode appelée par express-rate-limit
    async increment(key) {
      // Vérifier si Redis est disponible À CE MOMENT
      if (isRedisReady && redisClient && redisClient.status === 'ready' && RedisStore) {
        try {
          const redisKey = `rate_limit:${prefix}:${key}`;
          const config = rateLimitConfig[prefix];
          const windowMs = typeof config.windowMs === 'function' ? config.windowMs() : config.windowMs;

          // Incrémenter dans Redis
          const current = await redisClient.incr(redisKey);

          // Si c'est la première incrémentation, définir l'expiration
          if (current === 1) {
            await redisClient.pexpire(redisKey, windowMs);
          }

          // Récupérer le TTL
          const ttl = await redisClient.pttl(redisKey);
          const resetTime = ttl > 0 ? Date.now() + ttl : undefined;

          return {
            totalHits: current,
            resetTime: resetTime ? new Date(resetTime) : undefined,
          };
        } catch (error) {
          logger.error(`Redis increment error for ${prefix}:`, error);
          // Fallback sur memory store en cas d'erreur
          return this.memoryIncrement(key);
        }
      }

      // Utiliser memory store
      return this.memoryIncrement(key);
    },

    async decrement(key) {
      if (isRedisReady && redisClient && redisClient.status === 'ready') {
        try {
          const redisKey = `rate_limit:${prefix}:${key}`;
          await redisClient.decr(redisKey);
        } catch (error) {
          logger.error(`Redis decrement error for ${prefix}:`, error);
        }
      }
    },

    async resetKey(key) {
      if (isRedisReady && redisClient && redisClient.status === 'ready') {
        try {
          const redisKey = `rate_limit:${prefix}:${key}`;
          await redisClient.del(redisKey);
        } catch (error) {
          logger.error(`Redis reset error for ${prefix}:`, error);
        }
      }
    },

    // Fallback memory store simple
    _memoryStore: new Map(),
    memoryIncrement(key) {
      const config = rateLimitConfig[prefix];
      const windowMs = typeof config.windowMs === 'function' ? config.windowMs() : config.windowMs;

      const now = Date.now();
      const record = this._memoryStore.get(key) || { hits: 0, resetTime: now + windowMs };

      // Reset si la fenêtre est expirée
      if (now > record.resetTime) {
        record.hits = 0;
        record.resetTime = now + windowMs;
      }

      record.hits++;
      this._memoryStore.set(key, record);

      return {
        totalHits: record.hits,
        resetTime: new Date(record.resetTime),
      };
    },
  };
};

/**
 * Factory pour créer un rate limiter
 */
const createRateLimiter = (type) => {
  const config = rateLimitConfig[type];

  if (!config) {
    throw new Error(`Unknown rate limiter type: ${type}`);
  }

  return rateLimit({
    // ✅ Store dynamique qui vérifie Redis à chaque requête
    store: createDynamicStore(type),
    windowMs: typeof config.windowMs === 'function' ? config.windowMs() : config.windowMs,
    max: typeof config.max === 'function' ? config.max() : config.max,
    message: config.message,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: config.skipSuccessfulRequests || false,

    keyGenerator: (req) => {
      if (config.useUserId && req.userId) {
        return req.userId;
      }
      return req.ip;
    },

    skip: (req) => {
      if (config.skipAdmin && req.user && req.user.role === 'admin') {
        logger.info(`Admin bypass rate limit: ${req.user.email || req.user.id}`);
        return true;
      }
      return false;
    },

    handler: (req, res, next, options) => {
      const storeType = isRedisReady ? 'Redis' : 'Memory';
      logger.warn({
        type: 'rate_limit_exceeded',
        store: storeType,
        limiter: type,
        ip: req.ip,
        userId: req.userId || 'anonymous',
        path: req.path,
        method: req.method,
      });
      res.status(429).json(options.message);
    },
  });
};

// ================================================
// 🔴 UTILITIES
// ================================================

const resetUserLimits = async (userId) => {
  if (!redisClient || !isRedisReady) {
    logger.warn('Cannot reset user limits: Redis not available');
    return false;
  }

  const types = Object.keys(rateLimitConfig);
  const patterns = types.map(type => `rate_limit:${type}:${userId}`);

  try {
    let deletedCount = 0;

    for (const pattern of patterns) {
      const keys = await redisClient.keys(`${pattern}*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        deletedCount += keys.length;
      }
    }

    logger.info(`Rate limits reset for user: ${userId} (${deletedCount} keys deleted)`);
    return true;
  } catch (error) {
    logger.error('Error resetting rate limits:', error);
    return false;
  }
};

const getRedisStatus = () => {
  return {
    enabled: !!redisClient,
    connected: isRedisReady,
    status: redisClient ? redisClient.status : 'disconnected',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  };
};

const getRateLimitStats = async () => {
  if (!redisClient || !isRedisReady) {
    return {
      error: 'Redis not available',
      using: 'memory store',
    };
  }

  try {
    const allKeys = await redisClient.keys('rate_limit:*');
    const stats = {
      total_keys: allKeys.length,
      by_type: {},
    };

    for (const type of Object.keys(rateLimitConfig)) {
      const typeKeys = allKeys.filter(key => key.includes(`:${type}:`));
      stats.by_type[type] = typeKeys.length;
    }

    return stats;
  } catch (error) {
    logger.error('Error getting rate limit stats:', error);
    return { error: error.message };
  }
};

// ================================================
// 🔴 EXPORTS AVEC LAZY LOADING
// ================================================

module.exports = {
  initializeRedis,

  get authLimiter() {
    if (!this._authLimiter) {
      this._authLimiter = createRateLimiter('auth');
      logger.info('✅ authLimiter created with dynamic store');
    }
    return this._authLimiter;
  },

  get apiLimiter() {
    if (!this._apiLimiter) {
      this._apiLimiter = createRateLimiter('api');
      logger.info('✅ apiLimiter created with dynamic store');
    }
    return this._apiLimiter;
  },

  get chatLimiter() {
    if (!this._chatLimiter) {
      this._chatLimiter = createRateLimiter('chat');
      logger.info('✅ chatLimiter created with dynamic store');
    }
    return this._chatLimiter;
  },

  get uploadLimiter() {
    if (!this._uploadLimiter) {
      this._uploadLimiter = createRateLimiter('upload');
      logger.info('✅ uploadLimiter created with dynamic store');
    }
    return this._uploadLimiter;
  },

  get aiSummaryLimiter() {
    if (!this._aiSummaryLimiter) {
      this._aiSummaryLimiter = createRateLimiter('aiSummary');
      logger.info('✅ aiSummaryLimiter created with dynamic store');
    }
    return this._aiSummaryLimiter;
  },

  get strictLimiter() {
    if (!this._strictLimiter) {
      this._strictLimiter = createRateLimiter('strict');
      logger.info('✅ strictLimiter created with dynamic store');
    }
    return this._strictLimiter;
  },

  resetUserLimits,
  getRedisStatus,
  getRateLimitStats,
  redisClient,
};