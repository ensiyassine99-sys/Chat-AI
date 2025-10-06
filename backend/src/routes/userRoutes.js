
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { validate } = require('../middleware/errorHandler');
const { aiSummaryLimiter, uploadLimiter } = require('../middleware/rateLimiter');
const multer = require('multer');
const path = require('path');

// Configuration de Multer pour l'upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  },
});

// Validation rules
const updateProfileValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('language')
    .optional()
    .isIn(['en', 'ar'])
    .withMessage('Language must be either en or ar'),
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Theme must be light, dark, or auto'),
];

const updatePreferencesValidation = [
  body('notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications must be a boolean'),
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  body('soundEnabled')
    .optional()
    .isBoolean()
    .withMessage('Sound enabled must be a boolean'),
  body('autoSave')
    .optional()
    .isBoolean()
    .withMessage('Auto save must be a boolean'),
];

// Routes
router.get('/profile', userController.getProfile);
router.patch('/profile', updateProfileValidation, validate, userController.updateProfile);
router.post('/profile/avatar', upload.single('avatar'), userController.uploadAvatar);
router.delete('/profile/avatar', userController.deleteAvatar);
router.patch('/preferences', updatePreferencesValidation, validate, userController.updatePreferences);
router.get('/summary', userController.getUserSummary);
router.post('/summary/generate',  userController.generateUserSummary);
router.get('/statistics', userController.getUserStatistics);
router.delete('/account', userController.deleteAccount);
router.post('/export-data', userController.exportUserData);

module.exports = router;