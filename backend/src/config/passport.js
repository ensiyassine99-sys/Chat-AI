const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User, UserSummary } = require('../models');
const logger = require('../utils/logger');

// ============================================
// LOGS DE DÉMARRAGE
// ============================================

console.log('═══════════════════════════════════════');
console.log('🔐 PASSPORT GOOGLE OAUTH CONFIGURATION');
console.log('═══════════════════════════════════════');
console.log('📋 Client ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Configuré' : '❌ Manquant');
console.log('📋 Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Configuré' : '❌ Manquant');
console.log('📋 Callback URL:', process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback');
console.log('═══════════════════════════════════════\n');

// ============================================
// SÉRIALISATION / DÉSÉRIALISATION
// ============================================

passport.serializeUser((user, done) => {
    logger.info(`🔐 Serializing user: ${user.id}`);
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        if (user) {
            logger.info(`🔓 Deserializing user: ${user.id} (${user.email})`);
            done(null, user);
        } else {
            logger.warn(`⚠️ User not found for deserialization: ${id}`);
            done(null, false);
        }
    } catch (error) {
        logger.error(`❌ Deserialization error: ${error.message}`);
        done(error, null);
    }
});

// ============================================
// STRATÉGIE GOOGLE OAUTH
// ============================================

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback',
            passReqToCallback: true,
            scope: ['profile', 'email'],
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                // ============================================
                // ÉTAPE 1 : EXTRAIRE LES INFORMATIONS
                // ============================================

                const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
                const googleId = profile.id;
                const displayName = profile.displayName || 'User';

                if (!email) {
                    logger.error('❌ No email provided by Google');
                    return done(new Error('No email provided by Google'), null);
                }

                logger.info(`\n🔍 Google OAuth attempt`);
                logger.info(`   Email: ${email}`);
                logger.info(`   Display Name: ${displayName}`);
                logger.info(`   Google ID: ${googleId}`);

                // ============================================
                // ÉTAPE 2 : DÉTECTER LA LANGUE
                // ============================================

                const languageFromQuery = req.query.lng;
                const languageFromHeader = req.headers['accept-language']?.split(',')[0]?.split('-')[0];
                const detectedLanguage = languageFromQuery || languageFromHeader || 'en';
                const validLanguage = ['en', 'ar'].includes(detectedLanguage) ? detectedLanguage : 'en';

                logger.info(`   Langue détectée: ${validLanguage}`);

                // ============================================
                // ÉTAPE 3 : CHERCHER SI L'EMAIL EXISTE DÉJÀ
                // ============================================

                let user = await User.findOne({
                    where: { email },
                    include: [{
                        model: UserSummary,
                        as: 'summary',
                    }]
                });

                // ============================================
                // CAS 1 : UTILISATEUR EXISTE → LOGIN AUTOMATIQUE
                // ============================================

                if (user) {
                    logger.info(`✅ Utilisateur trouvé !`);
                    logger.info(`   ID: ${user.id}`);
                    logger.info(`   Username: ${user.username}`);
                    logger.info(`   Provider: ${user.provider}`);

                    // Migrer vers Google si le compte a été créé avec email/password
                    if (!user.googleId && user.provider === 'local') {
                        logger.info(`🔄 Migration du compte local vers Google OAuth...`);
                        await user.update({
                            googleId: googleId,
                            provider: 'google',
                            emailVerified: true,
                            isActive: true,
                        });
                        logger.info(`✅ Compte migré avec succès`);
                    }

                    // Si juste googleId manquant
                    if (!user.googleId) {
                        await user.update({ googleId: googleId });
                    }

                    logger.info(`✅ Login automatique réussi\n`);
                    return done(null, user);
                }

                // ============================================
                // CAS 2 : NOUVEL UTILISATEUR → CRÉATION
                // ============================================

                logger.info(`📝 Création d'un nouveau compte...`);

                // Générer un username avec espaces
                let username = generateUsername(displayName, email);
                logger.info(`   Username initial: "${username}"`);

                // Gérer les doublons de façon intelligente
                username = await findUniqueUsername(username);
                logger.info(`   Username final: "${username}"`);

                // Créer l'utilisateur
                user = await User.create({
                    googleId: googleId,
                    email: email,
                    username: username,
                    provider: 'google',
                    emailVerified: true,
                    isActive: true,
                    language: validLanguage,
                    password: null,
                });

                logger.info(`✅ Utilisateur créé avec succès`);
                logger.info(`   ID: ${user.id}`);
                logger.info(`   Email: ${user.email}`);
                logger.info(`   Username: ${user.username}`);

                // Créer le résumé utilisateur
                await UserSummary.create({
                    userId: user.id,
                    summary: validLanguage === 'ar' ? 'مستخدم جديد' : 'New user',
                    summaryAr: 'مستخدم جديد',
                });

                logger.info(`✅ Résumé utilisateur créé`);
                logger.info(`✅ Inscription et login réussis\n`);

                return done(null, user);

            } catch (error) {
                logger.error(`\n❌ ERREUR GOOGLE OAUTH`);
                logger.error(`   Message: ${error.message}`);
                logger.error(`   Stack: ${error.stack}\n`);
                return done(error, null);
            }
        }
    )
);

// ============================================
// FONCTION : Générer un username valide
// ============================================

/**
 * Génère un username à partir du nom Google
 * Accepte les espaces et les caractères alphanumériques
 * @param {string} displayName - Nom complet de Google
 * @param {string} email - Email de secours
 * @returns {string} Username propre
 */
function generateUsername(displayName, email) {
    // Nettoyer le nom en GARDANT les espaces
    let username = displayName
        .normalize('NFD')                     // Normaliser les accents (é → e)
        .replace(/[\u0300-\u036f]/g, '')      // Supprimer les marques diacritiques
        .replace(/[^a-zA-Z0-9\s]/g, '')       // Garder seulement lettres, chiffres, espaces
        .replace(/\s+/g, ' ')                 // Remplacer espaces multiples par un seul
        .trim();                              // Supprimer espaces début/fin

    // Si le résultat est vide ou trop court
    if (username.length < 3) {
        // Essayer avec l'email
        username = email
            .split('@')[0]                      // Prendre la partie avant @
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/[._-]/g, ' ')             // Remplacer . _ - par des espaces
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Si toujours trop court
    if (username.length < 3) {
        username = 'User';
    }

    // Capitaliser la première lettre de chaque mot
    username = username
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    // Limiter à 45 caractères (laisser place pour " 999" si doublon)
    if (username.length > 45) {
        username = username.substring(0, 45).trim();
    }

    return username;
}

// ============================================
// FONCTION : Trouver un username unique
// ============================================

/**
 * Vérifie si le username existe et ajoute un nombre si nécessaire
 * @param {string} baseUsername - Username de base
 * @returns {Promise<string>} Username unique
 */
async function findUniqueUsername(baseUsername) {
    let username = baseUsername;
    let counter = 1;
    let exists = await User.findOne({ where: { username } });

    // Tant que le username existe, incrémenter
    while (exists) {
        username = `${baseUsername} ${counter}`;
        counter++;
        exists = await User.findOne({ where: { username } });

        // Sécurité : arrêter après 1000 tentatives
        if (counter > 1000) {
            username = `${baseUsername} ${Date.now()}`;
            break;
        }
    }

    return username;
}

// ============================================
// CONFIRMATION DE CHARGEMENT
// ============================================

console.log('✅ Stratégie Google OAuth configurée avec succès !');
console.log('═══════════════════════════════════════\n');

module.exports = passport;