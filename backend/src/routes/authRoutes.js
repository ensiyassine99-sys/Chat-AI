const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { validate } = require('../middleware/errorHandler');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const passport = require('passport');
require('../config/passport'); // Charger la configuration passport

// =======================
// Validation rules (with i18n)
// =======================

const signupValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage((value, { req }) => req.t('auth.usernameLength'))
        .isAlphanumeric()
        .withMessage((value, { req }) => req.t('auth.usernameAlphanumeric')),

    body('email')
        .trim()
        .isEmail()
        .withMessage((value, { req }) => req.t('auth.validEmail'))
        .normalizeEmail(),

    body('password')
        .isLength({ min: 8 })
        .withMessage((value, { req }) => req.t('auth.passwordMin'))
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage((value, { req }) => req.t('auth.passwordPattern')),

    body('language')
        .optional()
        .isIn(['en', 'ar'])
        .withMessage((value, { req }) => req.t('auth.languageInvalid')),
];

const loginValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage((value, { req }) => req.t('auth.validEmail'))
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage((value, { req }) => req.t('auth.passwordRequired')),
];

const forgotPasswordValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage((value, { req }) => req.t('auth.validEmail'))
        .normalizeEmail(),
];

const resetPasswordValidation = [
    body('password')
        .isLength({ min: 8 })
        .withMessage((value, { req }) => req.t('auth.passwordMin'))
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage((value, { req }) => req.t('auth.passwordPattern')),
];

const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage((value, { req }) => req.t('auth.currentPasswordRequired')),

    body('newPassword')
        .isLength({ min: 8 })
        .withMessage((value, { req }) => req.t('auth.passwordMin'))
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage((value, { req }) => req.t('auth.passwordPattern')),
];
const checkEmailValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage((value, { req }) => req.t('auth.validEmail'))
        .normalizeEmail(),
];


// =======================
// Routes publiques
// =======================

router.post('/signup', signupValidation, validate, authController.signup);
router.post('/login', loginValidation, validate, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', forgotPasswordValidation, validate, authController.forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, validate, authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.get('/verify-reset-token/:token', authController.verifyResetToken);
router.post('/check-email', checkEmailValidation, validate, authController.checkEmailExists);


// Démarrer l'authentification Google
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
    })
);

// Callback après authentification Google
router.get('/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
    }),
    authController.googleAuthCallback
);

 

// =======================
// Routes protégées
// =======================

router.post('/logout', authMiddleware, authController.logout);
router.post('/change-password', authMiddleware, changePasswordValidation, validate, authController.changePassword);

// =======================
// Route de vérification du statut d'authentification
// =======================

router.get('/me', optionalAuth, (req, res) => {
    if (req.user) {
        res.json({
            success: true,
            authenticated: true,
            user: req.user.toJSON(),
        });
    } else {
        res.json({
            success: true,
            authenticated: false,
        });
    }
});

module.exports = router;
