const { validationResult } = require('express-validator');
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

  const t = req.t || ((key) => key); // fallback si i18n non dispo

  // 🔹 Logger (différent selon gravité)
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

  // 🔹 Sequelize Validation
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
    }));
    error.statusCode = 400;
    error.message = t('auth.validationError');
    error.errors = errors;
  }

  // 🔹 Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = Object.keys(err.fields)[0];
    error.statusCode = 409;
    error.message = t('auth.fieldExists', { field });
  }

  // 🔹 Mongo CastError
  if (err.name === 'CastError') {
    error.statusCode = 400;
    error.message = t('auth.invalidId');
  }

  // 🔹 Mongo duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.statusCode = 409;
    error.message = t('auth.fieldExists', { field });
  }

  // 🔹 Generic validation error
  if (err.name === 'ValidationError') {
    error.statusCode = 400;
    error.message = t('auth.validationError');
  }

  // 🔹 JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.statusCode = 401;
    error.message = t('auth.invalidToken');
  }

  if (err.name === 'TokenExpiredError') {
    error.statusCode = 401;
    error.message = t('auth.tokenExpired');
  }

  // 🔹 Réponse JSON
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || t('auth.serverError'),
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

// ✅ Wrapper async
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ✅ Validation middleware (express-validator)
const validate = (req, res, next) => {
  const errors = validationResult(req);
  const t = req.t || ((key) => key);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg || t('auth.validationError'),
      value: error.value,
    }));

    return res.status(400).json({
      success: false,
      error: t('auth.validationError'),
      errors: formattedErrors,
    });
  }

  next();
};

module.exports = {
  errorHandler,
  AppError,
  asyncHandler,
  validate,
};
