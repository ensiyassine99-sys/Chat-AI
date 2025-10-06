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

// Import des middlewares personnalisés
const { errorHandler } = require('./src/middleware/errorHandler');
const { authMiddleware } = require('./src/middleware/authMiddleware');
const logger = require('./src/utils/logger');

// Import des routes
const authRoutes = require('./src/routes/authRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const userRoutes = require('./src/routes/userRoutes');

// Import de la configuration de la base de données
const sequelize = require('./src/config/database');

// Initialisation de l'application Express
const app = express();
const server = http.createServer(app);

// Configuration i18n
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

// Configuration Socket.io pour le chat en temps réel
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
});

// Configuration CORS avancée
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
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
};

// Middlewares de sécurité
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

// Rate limiting global
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite de 100 requêtes
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many requests',
            retryAfter: req.rateLimit.resetTime,
        });
    },
});

// Rate limiting pour l'authentification
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: 'Too many authentication attempts, please try again later.',
});

// Application des middlewares
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(i18nextMiddleware.handle(i18next));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(globalLimiter);

// Middleware de logging des requêtes
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
            userAgent: req.get('user-agent'),
        });
    });
    next();
});

// Routes de santé
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
    });
});

app.get('/api/status', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({
            status: 'operational',
            database: 'connected',
            version: process.env.npm_package_version,
        });
    } catch (error) {
        logger.error('Database connection failed:', error);
        res.status(503).json({
            status: 'degraded',
            database: 'disconnected',
            error: 'Database connection failed',
        });
    }
});

// Routes API avec versioning
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/chat', authMiddleware, chatRoutes);
app.use('/api/v1/user', authMiddleware, userRoutes);

// Route pour les fichiers statiques (si nécessaire)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// WebSocket handlers pour le chat en temps réel
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        // Vérifier le token JWT
        const decoded = require('./src/utils/jwt').verifyToken(token);
        socket.userId = decoded.userId;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    logger.info(`User ${socket.userId} connected`);

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
        logger.info(`User ${socket.userId} disconnected`);
    });
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `The requested URL ${req.url} was not found on this server.`,
        timestamp: new Date().toISOString(),
    });
});

// Middleware de gestion des erreurs global
app.use(errorHandler);

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Ne pas quitter l'application en production
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Fermeture gracieuse
    server.close(() => {
        process.exit(1);
    });
    // Force la fermeture après 10 secondes
    setTimeout(() => {
        process.exit(1);
    }, 10000);
});

// Connexion à la base de données et démarrage du serveur
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        console.log('--- Starting server initialization ---');

        // Connexion à la base de données
        await sequelize.authenticate();
        logger.info('Database connection established successfully');

        // Vérification et synchronisation intelligente des tables
        if (process.env.NODE_ENV === 'development') {
            const queryInterface = sequelize.getQueryInterface();
            const tables = await queryInterface.showAllTables();

            logger.info(`Existing tables: ${tables.join(', ') || 'none'}`);

            // Si aucune table n'existe, créer toutes les tables
            if (tables.length === 0) {
                logger.info('No tables found. Creating database schema...');
                await sequelize.sync();
                logger.info('All tables created successfully');
            } else {
                // Vérifier et créer uniquement les tables manquantes
                const requiredTables = ['Users', 'UserSummaries', 'Chats', 'Messages'];
                const missingTables = requiredTables.filter(t => !tables.includes(t));

                if (missingTables.length > 0) {
                    logger.info(`Missing tables: ${missingTables.join(', ')}`);
                    logger.info('Creating missing tables...');
                    await sequelize.sync();
                    logger.info('Missing tables created');
                } else {
                    logger.info('All required tables exist');
                }
            }
        }

        // Démarrage du serveur
        server.listen(PORT, () => {
            logger.info(`
        🚀 Server is running!
        🔊 Listening on port ${PORT}
        📱 Environment: ${process.env.NODE_ENV || 'development'}
        🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
        ⏰ Started at: ${new Date().toISOString()}
      `);
        });
    } catch (error) {
        console.error('=== ERREUR FATALE ===');
        console.error(error);
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Gestion de l'arrêt gracieux
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
    logger.info('Received shutdown signal, closing server gracefully...');

    server.close(async () => {
        logger.info('HTTP server closed');

        try {
            await sequelize.close();
            logger.info('Database connection closed');

            // Fermer les connexions Redis si utilisées
            if (global.redisClient) {
                await global.redisClient.quit();
                logger.info('Redis connection closed');
            }

            process.exit(0);
        } catch (error) {
            logger.error('Error during graceful shutdown:', error);
            process.exit(1);
        }
    });

    // Force la fermeture après 30 secondes
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
}

// Démarrage de l'application
startServer();

module.exports = { app, server, io };