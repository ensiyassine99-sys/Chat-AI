const jwt = require('jsonwebtoken');
const logger = require('./logger');

/**
 * Générer les tokens d'accès et de rafraîchissement
 */
const generateTokens = (userId) => {
  const payload = { userId };
  
  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '15m',
      issuer: 'ai-chatbot',
      audience: 'ai-chatbot-users',
    }
  );
  
  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
      issuer: 'ai-chatbot',
      audience: 'ai-chatbot-users',
    }
  );
  
  return { accessToken, refreshToken };
};

/**
 * Vérifier un token d'accès
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'ai-chatbot',
      audience: 'ai-chatbot-users',
    });
  } catch (error) {
    logger.error('JWT verification error:', error.message);
    throw error;
  }
};

/**
 * Vérifier un refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'ai-chatbot',
      audience: 'ai-chatbot-users',
    });
  } catch (error) {
    logger.error('Refresh token verification error:', error.message);
    throw error;
  }
};

/**
 * Décoder un token sans vérification
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateTokens,
  verifyToken,
  verifyRefreshToken,
  decodeToken,
};