const { validationResult } = require('express-validator'); // ← AJOUTÉ
const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log de l'erreur
  if (err.statusCode >= 500 || !err.isOperational) {
    logger.error({
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userId: req.userId,
    });
  } else {
    logger.warn({
      error: err.message,
      url: req.url,
      method: req.method,
      statusCode: err.statusCode,
    });
  }

  // Erreur de validation Sequelize
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
    }));
    error.statusCode = 400;
    error.message = 'Validation error';
    error.errors = errors;
  }

  // Erreur de contrainte unique Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = Object.keys(err.fields)[0];
    error.statusCode = 409;
    error.message = `${field} already exists`;
  }

  // Erreur de cast MongoDB (si utilisé)
  if (err.name === 'CastError') {
    error.statusCode = 400;
    error.message = 'Invalid ID format';
  }

  // Erreur de duplication MongoDB (si utilisé)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.statusCode = 409;
    error.message = `${field} already exists`;
  }

  // Erreur de validation
  if (err.name === 'ValidationError') {
    error.statusCode = 400;
    error.message = 'Validation error';
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    error.statusCode = 401;
    error.message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    error.statusCode = 401;
    error.message = 'Token expired';
  }

  // Réponse d'erreur
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Server error',
      code: error.code,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: error.errors,
      }),
    },
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
  });
};

// Wrapper pour les fonctions async
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware de validation pour express-validator
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      errors: formattedErrors,
    });
  }
  
  next();
};

module.exports = { 
  errorHandler, 
  AppError, 
  asyncHandler, 
  validate 
};