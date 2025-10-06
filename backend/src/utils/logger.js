const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const logDir = process.env.LOG_FILE_PATH || './logs';

// Fonction pour gérer les références circulaires
const safeStringify = (obj) => {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Circular Reference]';
            }
            seen.add(value);
        }
        return value;
    }, 2);
};

// Format personnalisé pour les logs
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;

        if (Object.keys(metadata).length > 0) {
            try {
                // Utiliser safeStringify au lieu de JSON.stringify
                msg += ` ${safeStringify(metadata)}`;
            } catch (err) {
                msg += ` [Unable to stringify metadata: ${err.message}]`;
            }
        }

        return msg;
    })
);

// Configuration des transports
const transports = [
    // Console
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...metadata }) => {
                let msg = `${timestamp} [${level}]: ${message}`;

                if (Object.keys(metadata).length > 0) {
                    try {
                        msg += ` ${safeStringify(metadata)}`;
                    } catch (err) {
                        msg += ` [Error logging metadata]`;
                    }
                }

                return msg;
            })
        ),
    }),
];

// Fichiers rotatifs en production
if (process.env.NODE_ENV === 'production') {
    transports.push(
        // Fichier pour toutes les logs
        new DailyRotateFile({
            filename: path.join(logDir, 'application-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: process.env.LOG_MAX_SIZE || '20m',
            maxFiles: process.env.LOG_MAX_FILES || '14d',
            format: logFormat,
        }),

        // Fichier pour les erreurs uniquement
        new DailyRotateFile({
            filename: path.join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
            level: 'error',
            format: logFormat,
        })
    );
}

// Créer le logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exitOnError: false,
});

// Stream pour Morgan
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    },
};

// Méthode helper pour logger des erreurs de manière sécurisée
logger.logError = function (message, error) {
    const errorInfo = {
        message: error.message,
        name: error.name,
        stack: error.stack,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
    };

    this.error(message, errorInfo);
};

module.exports = logger;