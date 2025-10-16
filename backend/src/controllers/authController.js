const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, UserSummary } = require('../models');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { Op } = require('sequelize');


// Générer un JWT pour la vérification d'email
const generateEmailVerificationToken = (userId, email) => {
    return jwt.sign(
        {
            userId,
            email,
            type: 'email_verification'
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' } // Expire dans 24h
    );
};



const signup = asyncHandler(async (req, res, next) => {
    const { username, email, password, language = 'en' } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
        where: {
            [Op.or]: [{ email }, { username }],
        },
    });

    if (existingUser) {
        // Utiliser la traduction selon le champ
        if (existingUser.email === email) {
            throw new AppError(req.t('auth.emailExists'), 409);
        } else {
            throw new AppError(req.t('auth.usernameExists'), 409);
        }
    }

    // Créer le nouvel utilisateur (NON VÉRIFIÉ)
    const user = await User.create({
        username,
        email,
        password,
        language,
        emailVerified: false,
        isActive: false, // Désactivé jusqu'à vérification
    });

    // Créer un résumé utilisateur vide
    await UserSummary.create({
        userId: user.id,
        summary: req.t('auth.newUserSummary'),
        summaryAr: req.t('auth.newUserSummary', { lng: 'ar' }), // version arabe forcée
    });

    // Générer JWT de vérification
    const verificationToken = generateEmailVerificationToken(user.id, user.email);

    // Envoyer l'email de vérification
    if (process.env.SMTP_HOST) {
        await emailService.sendVerificationEmail(
            user.email,
            verificationToken,
            user.language
        );
    } else {
        // En développement, logger le lien
        logger.info(
            `Verification link: ${process.env.FRONTEND_URL}/verify-email/${verificationToken}`
        );
    }

    logger.info(`New user registered: ${user.email}`);

    // NE PAS retourner de tokens - forcer la vérification
    res.status(201).json({
        success: true,
        message: req.t('auth.signupSuccess'),
        requiresVerification: true,
        email: user.email,
    });
});


const verifyEmail = asyncHandler(async (req, res, next) => {
    const { token } = req.params;

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'email_verification') {
            throw new AppError(req.t('auth.invalidVerificationToken'), 400);
        }
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError(req.t('auth.verificationLinkExpired'), 400);
        }
        throw new AppError(req.t('auth.invalidVerificationToken'), 400);
    }

    const user = await User.findOne({
        where: {
            id: decoded.userId,
            email: decoded.email,
        },
    });

    if (!user) {
        throw new AppError(req.t('auth.userNotFound'), 404);
    }

    // ✅ Si déjà vérifié → ERREUR (pas de success: true)
    if (user.emailVerified) {
        throw new AppError(req.t('auth.emailAlreadyVerified'), 400);
    }

    // Vérifier et activer le compte
    await user.update({
        emailVerified: true,
        isActive: true,
    });

    const { accessToken, refreshToken } = generateTokens(user.id);

    res.json({
        success: true,
        message: req.t('auth.emailVerifiedSuccess'),
        token: accessToken,
        refreshToken,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            language: user.language,
            emailVerified: true,
        },
    });
});

// Renvoyer l'email de vérification
const resendVerificationEmail = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({
        where: { email },
    });

    if (!user) {
        // Ne pas révéler si l'email existe
        res.json({
            success: true,
            message: 'If the email exists, a verification link has been sent',
        });
        return;
    }

    // Vérifier si déjà vérifié
    if (user.emailVerified) {
        throw new AppError('Email already verified', 400);
    }

    // Générer nouveau JWT
    const verificationToken = generateEmailVerificationToken(user.id, user.email);

    // Envoyer l'email
    if (process.env.SMTP_HOST) {
        await emailService.sendVerificationEmail(
            user.email,
            verificationToken,
            user.language
        );
    } else {
        logger.info(`Verification link: ${process.env.FRONTEND_URL}/verify-email/${verificationToken}`);
    }

    res.json({
        success: true,
        message: 'Verification email sent',
    });
});

// À AJOUTER à la fin de authController.js, AVANT module.exports
const googleAuthCallback = asyncHandler(async (req, res, next) => {
    const user = req.user;

    // Générer tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Mettre à jour lastLogin
    await user.update({ lastLogin: new Date() });

    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}`;

    res.redirect(redirectUrl);
});;

const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Trouver l'utilisateur par email
    const user = await User.findOne({
        where: { email },
        include: [{
            model: UserSummary,
            as: 'summary',
        }],
    });

    if (!user) {
        throw new AppError(req.t('auth.invalidCredentials'), 401);
    }

    // ✅ VÉRIFIER SI C'EST UN COMPTE OAUTH (NOUVEAU)
    if (user.provider === 'google') {
        throw new AppError(
            req.t('auth.useGoogleLogin') || 'This account uses Google login. Please sign in with Google.',
            400
        );
    }

    // Vérifier si le compte est verrouillé
    if (user.isLocked()) {
        throw new AppError(req.t('auth.accountLocked'), 423);
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        await user.incrementLoginAttempts();
        throw new AppError(req.t('auth.invalidCredentials'), 401);
    }

    // Vérifier si l'email est vérifié
    if (!user.emailVerified) {
        // Générer un nouveau token et renvoyer
        const verificationToken = generateEmailVerificationToken(user.id, user.email);

        if (process.env.SMTP_HOST) {
            await emailService.sendVerificationEmail(user.email, verificationToken, user.language);
        } else {
            logger.info(`Verification link: ${process.env.FRONTEND_URL}/verify-email/${verificationToken}`);
        }

        throw new AppError(req.t('auth.pleaseVerifyEmail'), 403);
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
        throw new AppError(req.t('auth.accountDeactivated'), 403);
    }

    // Réinitialiser les tentatives de connexion
    await user.resetLoginAttempts();

    // Mettre à jour la date de dernière connexion
    await user.update({ lastLogin: new Date() });

    // Générer les tokens JWT
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Changer la langue de la requête selon la préférence de l'utilisateur
    req.i18n.changeLanguage(user.language);

    // Logger la connexion avec le provider
    logger.info(`User logged in: ${user.email} (provider: ${user.provider || 'local'})`);

    // Réponse de succès
    res.json({
        success: true,
        message: req.t('auth.loginSuccess'),
        token: accessToken,
        refreshToken,
        user: user.toJSON(),
    });
});
// Refresh Token
const refreshToken = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new AppError(req.t('auth.refreshTokenRequired'), 400);
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive || !user.emailVerified) {
        throw new AppError(req.t('auth.invalidRefreshToken'), 401);
    }

    const tokens = generateTokens(user.id);

    res.json({
        success: true,
        ...tokens,
    });
});

// Déconnexion
const logout = asyncHandler(async (req, res, next) => {
    if (req.session) {
        req.session.destroy();
    }

    logger.info(`User logged out: ${req.user.email}`);

    res.json({
        success: true,
        message: req.t('auth.logoutSuccess'),
    });
});


const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
        res.json({
            success: true,
            message: 'Password reset email sent if account exists',
        });
        return;
    }

    // Générer JWT
    const resetToken = jwt.sign(
        {
            userId: user.id,
            email: user.email,
            type: 'password_reset'
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Sauvegarder le token en DB
    const resetExpires = new Date(Date.now() + 3600000); // 1 heure

    await user.update({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
        resetPasswordUsed: false, // ← Réinitialiser à false
    });

    if (process.env.SMTP_HOST) {
        await emailService.sendPasswordResetEmail(user.email, resetToken, user.language);
    }

    res.json({
        success: true,
        message: 'Password reset email sent if account exists',
    });
});

const resetPassword = asyncHandler(async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'password_reset') {
            throw new AppError(req.t('auth.invalidResetTokenType'), 400);
        }
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError(req.t('auth.resetLinkExpired'), 400);
        }
        throw new AppError(req.t('auth.invalidResetToken'), 400);
    }

    const user = await User.findOne({
        where: {
            id: decoded.userId,
            email: decoded.email,
        },
    });

    if (!user) {
        throw new AppError(req.t('auth.userNotFound'), 404);
    }

    // Déjà utilisé
    if (user.resetPasswordToken === token && user.resetPasswordUsed) {
        throw new AppError(req.t('auth.resetLinkUsed'), 400);
    }

    // Ne correspond pas
    if (user.resetPasswordToken !== token) {
        throw new AppError(req.t('auth.invalidResetToken'), 400);
    }

    // Expiration
    if (user.resetPasswordExpires && user.resetPasswordExpires < Date.now()) {
        throw new AppError(req.t('auth.resetLinkExpired'), 400);
    }

    // Mettre à jour le mot de passe
    await user.update({
        password,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        resetPasswordUsed: true,
    });

    // Générer des tokens pour login auto
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.json({
        success: true,
        message: req.t('auth.passwordResetSuccess'),
        token: accessToken,
        refreshToken,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            language: user.language,
            emailVerified: user.emailVerified,
        },
    });
});


const checkEmailExists = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    res.json({
        success: true,
        exists: !!user,
        message: user ? 'Email found' : 'Email not found',
    });
});

// Vérifier le token de reset avec tous les états possibles
const verifyResetToken = asyncHandler(async (req, res, next) => {
    const { token } = req.params;

    // 1. Vérifier et décoder le JWT
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'password_reset') {
            throw new AppError(req.t('auth.invalidResetTokenType') || 'Invalid token type', 400);
        }
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError(req.t('auth.resetLinkExpired') || 'Reset link has expired', 400, 'expired');
        }

        console.log('error', error);
        throw new AppError(req.t('auth.invalidResetToken') || 'Invalid reset token', 400, 'invalid');
    }

    // 2. Trouver l'utilisateur
    const user = await User.findOne({
        where: {
            id: decoded.userId,
            email: decoded.email,
        },
    });

    if (!user) {
        throw new AppError(req.t('auth.userNotFound') || 'User not found', 404, 'notfound');
    }

    // 3. Vérifier si le token a déjà été utilisé
    if (user.resetPasswordToken === token && user.resetPasswordUsed) {
        throw new AppError(req.t('auth.resetLinkUsed') || 'This reset link has already been used', 400, 'used');
    }

    // 4. Vérifier si le token correspond
    if (user.resetPasswordToken !== token) {
        throw new AppError(req.t('auth.resetLinkMismatch') || 'Reset link does not match', 400, 'mismatch');
    }

    // 5. Vérifier l'expiration en DB
    if (user.resetPasswordExpires && user.resetPasswordExpires < Date.now()) {
        throw new AppError(req.t('auth.resetLinkExpired') || 'Reset link has expired', 400, 'expired');
    }

    // 6. Token valide et inutilisé
    res.json({
        success: true,
        status: 'valid',
        message: req.t('auth.resetTokenValid') || 'Token is valid',
    });
});



// Changement de mot de passe
const changePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    const isValid = await user.comparePassword(currentPassword);

    if (!isValid) {
        throw new AppError(req.t('auth.currentPasswordIncorrect'), 401);
    }

    await user.update({ password: newPassword });

    res.json({
        success: true,
        message: req.t('auth.passwordChangedSuccess')
    });
});


module.exports = {
    signup,
    login,
    refreshToken,
    logout,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    changePassword,
    verifyResetToken, checkEmailExists, googleAuthCallback,
};