const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: req.t('auth.token_required'),
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Vérifier si l'utilisateur existe toujours
      const user = await User.findByPk(decoded.userId, {
        attributes: ['id', 'email', 'username', 'language', 'role', 'isActive'],
      });

      if (!user) {
        return res.status(401).json({
          error: 'User not found',
          message: req.t('auth.user_not_found'),
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          error: 'Account deactivated',
          message: req.t('auth.account_deactivated'),
        });
      }

      // Attacher l'utilisateur à la requête
      req.user = user;
      req.userId = user.id;
      req.userLanguage = user.language || 'en';
      
      // Définir la langue pour i18n
      req.i18n.changeLanguage(req.userLanguage);
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          message: req.t('auth.token_expired'),
          code: 'TOKEN_EXPIRED',
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token',
          message: req.t('auth.invalid_token'),
        });
      }
      
      throw error;
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: req.t('auth.error'),
    });
  }
};

// Middleware pour vérifier les rôles
const requireRole = (roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: req.t('auth.required'),
      });
    }

    const userRole = req.user.role || 'user';
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      logger.warn(`Access denied for user ${req.user.id} with role ${userRole}`);
      return res.status(403).json({
        error: 'Access denied',
        message: req.t('auth.access_denied'),
      });
    }

    next();
  };
};

// Middleware optionnel d'authentification
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('📨 Authorization header:', authHeader);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('🔑 Token extrait:', token.substring(0, 20) + '...');
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token décodé:', decoded);
        
        const user = await User.findByPk(decoded.userId, {
          attributes: ['id', 'email', 'username', 'language', 'isActive'],
        });
        
        console.log('👤 User trouvé:', user ? user.toJSON() : 'NULL');
        console.log('🔓 User isActive:', user?.isActive);
        
        if (user && user.isActive) {
          req.user = user;
          req.userId = user.id;
          console.log('✅ Utilisateur authentifié:', user.email);
        } else {
          console.log('❌ User non trouvé ou inactif');
        }
      } catch (error) {
        console.log('❌ Erreur token:', error.message);
        logger.debug('Optional auth token error:', error.message);
      }
    } else {
      console.log('❌ Pas de header Authorization ou mauvais format');
    }
    
    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next();
  }
};

module.exports = { authMiddleware, requireRole, optionalAuth };
