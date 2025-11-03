require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const http = require('http');
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const i18nextMiddleware = require('i18next-http-middleware');
const path = require('path');
const session = require('express-session');
const passport = require('./src/config/passport');  // ← Importer TON fichier

const cookieParser = require('cookie-parser');

// Import des middlewares personnalisés
const { errorHandler } = require('./src/middleware/errorHandler');
const { authMiddleware } = require('./src/middleware/authMiddleware');
const logger = require('./src/utils/logger');

// ✅ Import du rate limiter
const {
    initializeRedis,
    getRedisStatus,
    getRateLimitStats,
    apiLimiter,
    authLimiter,
    chatLimiter,
    uploadLimiter,
    aiSummaryLimiter,
    strictLimiter
} = require('./src/middleware/rateLimiter');

// Import des routes
const authRoutes = require('./src/routes/authRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const userRoutes = require('./src/routes/userRoutes');

// Import de la configuration de la base de données
const sequelize = require('./src/config/database');

// Initialisation de l'application Express
const app = express();
const server = http.createServer(app);

// ================================================
// 🔴 CONFIGURATION i18n
// ================================================
i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
        backend: {
            loadPath: path.join(__dirname, 'src', 'locales', '{{lng}}.json'),
        },
        fallbackLng: 'en',
        supportedLngs: ['en', 'ar'],
        detection: {
            order: ['querystring', 'cookie', 'header'],
            caches: ['cookie'],
            lookupQuerystring: 'lng',
            lookupCookie: 'i18next',
            lookupHeader: 'accept-language',
        },
        saveMissing: true,
        interpolation: {
            escapeValue: false,
        },
    });

// ================================================
// 🔴 CONFIGURATION SOCKET.IO
// ================================================
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
});

global.io = io;

// ================================================
// 🔴 CONFIGURATION CORS
// ================================================
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Accept-Language'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
};

// ================================================
// 🔴 MIDDLEWARES DE SÉCURITÉ
// ================================================
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
}));

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
    },
}));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

// ================================================
// 🔴 MIDDLEWARES GÉNÉRAUX
// ================================================
// app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(i18nextMiddleware.handle(i18next));
app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
}));

// ================================================
// 🔴 RATE LIMITING GLOBAL
// ================================================

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes max
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // ✅ IMPORTANT : Ignorer les health checks
    skip: (req) => req.path === '/health' || req.path === '/api/v1/health',
    handler: (req, res) => {
        logger.warn(`Global rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many requests',
            message: 'You have made too many requests. Please try again later.',
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
        });
    },
});
// ================================================
// 🔴 ROUTES DE SANTÉ (sans rate limiting)
// ================================================
app.get('/health', (req, res) => {
    res.json({
        status: 'healthya',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
    });
});
// app.use(globalLimiter);

// ================================================
// 🔴 MIDDLEWARE DE LOGGING
// ================================================
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userId: req.userId || 'anonymous',
            userAgent: req.get('user-agent'),
        });
    });
    next();
});



app.get('/api/status', async (req, res) => {
    try {
        await sequelize.authenticate();
        const redisStatus = getRedisStatus();

        res.json({
            status: 'operational',
            database: 'connected',
            redis: redisStatus,
            version: process.env.npm_package_version || '1.0.0',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error('Database connection failed:', error);
        res.status(503).json({
            status: 'degraded',
            database: 'disconnected',
            error: 'Database connection failed',
            timestamp: new Date().toISOString(),
        });
    }
});

// ================================================
// 🔴 ROUTES DE DEBUG (développement uniquement)
// ================================================
if (process.env.NODE_ENV === 'development') {
    // Voir les statistiques Redis
    app.get('/api/debug/redis', async (req, res) => {
        try {
            const status = getRedisStatus();
            const stats = await getRateLimitStats();

            res.json({
                redis_status: status,
                rate_limit_stats: stats,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            res.status(500).json({
                error: error.message,
                timestamp: new Date().toISOString(),
            });
        }
    });

    // Voir les détails d'une clé Redis spécifique
    app.get('/api/debug/redis/keys', async (req, res) => {
        try {
            const { redisClient } = require('./src/middleware/rateLimiter');

            if (!redisClient || redisClient.status !== 'ready') {
                return res.status(503).json({
                    error: 'Redis not connected',
                    status: getRedisStatus()
                });
            }

            const allKeys = await redisClient.keys('rate_limit:*');
            const details = {};

            for (const key of allKeys) {
                const value = await redisClient.get(key);
                const ttl = await redisClient.ttl(key);

                details[key] = {
                    count: parseInt(value) || value,
                    ttl_seconds: ttl,
                    ttl_minutes: Math.round(ttl / 60),
                    expires_in: ttl > 0 ? `${Math.floor(ttl / 60)}m ${ttl % 60}s` : 'permanent',
                };
            }

            res.json({
                total_keys: allKeys.length,
                keys: details,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Vider Redis (avec confirmation)
    app.delete('/api/debug/redis/clear', async (req, res) => {
        try {
            const { redisClient } = require('./src/middleware/rateLimiter');

            if (!redisClient || redisClient.status !== 'ready') {
                return res.status(503).json({ error: 'Redis not connected' });
            }

            const keys = await redisClient.keys('rate_limit:*');
            if (keys.length > 0) {
                await redisClient.del(...keys);
                logger.warn(`Redis cleared: ${keys.length} rate limit keys deleted`);
                res.json({
                    message: 'Redis rate limit keys cleared',
                    deleted_keys: keys.length,
                    keys: keys,
                    timestamp: new Date().toISOString(),
                });
            } else {
                res.json({
                    message: 'Redis already empty',
                    timestamp: new Date().toISOString(),
                });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}

// ================================================
// 🔴 ROUTES API AVEC RATE LIMITING
// ================================================

// ✅ Routes d'authentification avec authLimiter
app.use('/api/v1/auth', authRoutes);

// ✅ Routes de chat avec chatLimiter (nécessite authentification)
app.use('/api/v1/chat', authMiddleware, chatLimiter, chatRoutes);

// ✅ Routes utilisateur avec apiLimiter (nécessite authentification)
// Les routes spécifiques (upload, AI summary) ont leurs propres limiters dans userRoutes
app.use('/api/v1/user', authMiddleware, apiLimiter, userRoutes);

// ================================================
// 🔴 FICHIERS STATIQUES
// ================================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================================================
// 🔴 WEBSOCKET HANDLERS
// ================================================
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        const decoded = require('./src/utils/jwt').verifyToken(token);
        socket.userId = decoded.userId;
        next();
    } catch (err) {
        logger.warn('Socket authentication failed:', err.message);
        next(new Error('Authentication error: Invalid token'));
    }
});

io.on('connection', (socket) => {
    logger.info(`User ${socket.userId} connected via WebSocket`);
    socket.join(`user:${socket.userId}`);

    socket.on('join_chat', (chatId) => {
        socket.join(`chat:${chatId}`);
        logger.info(`User ${socket.userId} joined chat ${chatId}`);
    });

    socket.on('leave_chat', (chatId) => {
        socket.leave(`chat:${chatId}`);
        logger.info(`User ${socket.userId} left chat ${chatId}`);
    });

    socket.on('typing', (data) => {
        socket.to(`chat:${data.chatId}`).emit('user_typing', {
            userId: socket.userId,
            chatId: data.chatId,
        });
    });

    socket.on('stop_typing', (data) => {
        socket.to(`chat:${data.chatId}`).emit('user_stop_typing', {
            userId: socket.userId,
            chatId: data.chatId,
        });
    });

    socket.on('disconnect', () => {
        logger.info(`User ${socket.userId} disconnected from WebSocket`);
    });
});

// ================================================
// 🔴 GESTION DES ERREURS 404
// ================================================
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `The requested URL ${req.url} was not found on this server.`,
        path: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
    });
});

app.use((req, res, next) => {
    console.log('📨 Request:', req.method, req.path);
    console.log('🍪 Cookies:', req.cookies);
    next();
});

// ================================================
// 🔴 MIDDLEWARE DE GESTION DES ERREURS GLOBAL
// ================================================
app.use(errorHandler);

// ================================================
// 🔴 GESTION DES ERREURS NON CAPTURÉES
// ================================================
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    server.close(() => {
        process.exit(1);
    });
    setTimeout(() => {
        process.exit(1);
    }, 10000);
});

// ================================================
// 🔴 FONCTION DE DÉMARRAGE DU SERVEUR
// ================================================
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        console.log('='.repeat(50));
        console.log('🚀 Starting AI Chat Application');
        console.log('='.repeat(50));

        // ✅ 1. Initialiser Redis EN PREMIER
        logger.info('🔄 Step 1/4: Initializing Redis...');
        await initializeRedis();

        const redisStatus = getRedisStatus();
        logger.info(`✅ Redis Status: ${JSON.stringify(redisStatus)}`);

        // 2. Connexion à la base de données
        logger.info('🔄 Step 2/4: Connecting to database...');
        await sequelize.authenticate();
        logger.info('✅ Database connection established successfully');

        // 3. Synchronisation des tables
        logger.info('🔄 Step 3/4: Checking database schema...');
        // if (process.env.NODE_ENV === 'development'
        if (true) {
            const queryInterface = sequelize.getQueryInterface();
            const tables = await queryInterface.showAllTables();
            logger.info(`📊 Existing tables: ${tables.join(', ') || 'none'}`);

            if (tables.length === 0) {
                logger.info('📝 No tables found. Creating database schema...');
                await sequelize.sync();
                logger.info('✅ All tables created successfully');
            } else {
                const requiredTables = ['User', 'UserSummary', 'Chat', 'Message'];
                const missingTables = requiredTables.filter(t => !tables.includes(t));

                if (missingTables.length > 0) {
                    logger.info(`📝 Missing tables: ${missingTables.join(', ')}`);
                    logger.info('Creating missing tables...');
                    await sequelize.sync();
                    logger.info('✅ Missing tables created');
                } else {
                    logger.info('✅ All required tables exist');
                }
            }
        }

        // 4. Démarrage du serveur
        logger.info('🔄 Step 4/4: Starting HTTP server...');
        server.listen(PORT, '::', () => {
            console.log('='.repeat(50));
            console.log('✅ SERVER READY!');
            console.log('='.repeat(50));
            console.log(`🔊 Port:              ${PORT}`);
            console.log(`📱 Environment:       ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Frontend URL:      ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
            console.log(`🔐 Redis:             ${redisStatus.connected ? 'Connected ✅' : 'Disabled ⚠️'}`);
            console.log(`⏰ Started at:        ${new Date().toISOString()}`);
            console.log('='.repeat(50));
            console.log('📍 Available routes:');
            console.log('   GET    /health');
            console.log('   GET    /api/status');
            console.log('   POST   /api/v1/auth/register    (authLimiter: 5/15min)');
            console.log('   POST   /api/v1/auth/login       (authLimiter: 5/15min)');
            console.log('   POST   /api/v1/chat/messages    (chatLimiter: 60/1min)');
            console.log('   GET    /api/v1/user/profile     (apiLimiter: 30/1min)');
            console.log('   POST   /api/v1/user/summary     (aiSummaryLimiter: 20/1h)');
            console.log('='.repeat(50));
        });

    } catch (error) {
        console.error('='.repeat(50));
        console.error('❌ FATAL ERROR');
        console.error('='.repeat(50));
        console.error(error);
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// ================================================
// 🔴 GRACEFUL SHUTDOWN
// ================================================
let isShuttingDown = false;

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
    if (isShuttingDown) {
        logger.warn('⚠️  Shutdown already in progress...');
        return;
    }

    isShuttingDown = true;
    console.log('');
    console.log('='.repeat(50));
    logger.info('🛑 Received shutdown signal, closing gracefully...');
    console.log('='.repeat(50));

    server.close(async () => {
        logger.info('✅ HTTP server closed');

        const shutdownTasks = [];

        // 1. Fermer la base de données
        shutdownTasks.push(
            sequelize.close()
                .then(() => logger.info('✅ Database connection closed'))
                .catch((err) => logger.error('❌ Error closing database:', err))
        );

        // 2. Fermer Redis
        const { redisClient } = require('./src/middleware/rateLimiter');
        if (redisClient && redisClient.status === 'ready') {
            shutdownTasks.push(
                redisClient.quit()
                    .then(() => logger.info('✅ Redis connection closed'))
                    .catch((err) => logger.error('❌ Error closing Redis:', err))
            );
        } else {
            logger.info('ℹ️  Redis was not connected');
        }

        // 3. Fermer Socket.io
        if (global.io) {
            shutdownTasks.push(
                new Promise((resolve) => {
                    global.io.close(() => {
                        logger.info('✅ Socket.io connections closed');
                        resolve();
                    });
                })
            );
        }

        try {
            await Promise.allSettled(shutdownTasks);
            console.log('='.repeat(50));
            logger.info('✅ Graceful shutdown completed successfully');
            console.log('='.repeat(50));
            process.exit(0);
        } catch (error) {
            logger.error('❌ Error during graceful shutdown:', error);
            process.exit(1);
        }
    });

    setTimeout(() => {
        logger.error('⏰ Forced shutdown after 30s timeout');
        process.exit(1);
    }, 30000);
}

// ================================================
// 🔴 DÉMARRAGE DE L'APPLICATION
// ================================================
startServer();

module.exports = { app, server, io };