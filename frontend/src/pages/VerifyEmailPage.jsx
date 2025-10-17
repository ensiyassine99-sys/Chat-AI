import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
    CheckCircleIcon,
    XCircleIcon,
    EnvelopeIcon,
    ArrowPathIcon,
    ChatBubbleLeftRightIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import authService from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';

const VerifyEmailPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { isAuthenticated, error, clearError, verifyEmail, clearUser } = useAuth();

    const [status, setStatus] = useState('verifying');
    const [errorType, setErrorType] = useState('');
    const [resendEmail, setResendEmail] = useState('');
    const [isResending, setIsResending] = useState(false);

    const isRTL = i18n.language === 'ar';

    useEffect(() => {
        if (isAuthenticated) navigate('/chat', { replace: true });
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (error) {
            setStatus('error');
            let type = 'invalid';
            const errorLower = error.toLowerCase();

            if (errorLower.includes('expired') || errorLower.includes('expiré') || errorLower.includes('منتهي')) {
                type = 'expired';
            } else if (errorLower.includes('not found') || errorLower.includes('introuvable') || errorLower.includes('غير موجود')) {
                type = 'notfound';
            } else if (errorLower.includes('already verified') || errorLower.includes('déjà vérifié') || errorLower.includes('تم التحقق')) {
                type = 'alreadyUsed';
                setStatus('alreadyUsed');
            }

            setErrorType(type);
            clearError();
        }
    }, [error, clearError]);

    useEffect(() => {
        clearUser()
        if (!token) {
            setStatus('error');
            setErrorType('invalid');
            return;
        }
        handleVerifyEmail();
    }, [token]);

    const handleVerifyEmail = async () => {
        setStatus('verifying');
        const result = await verifyEmail(token);

        if (result.success) {
            setStatus('connecting');
            setTimeout(() => {
                navigate('/chat', { replace: true });
            }, 1500);
        }
    };

    const handleResendEmail = async () => {
        if (!resendEmail || !resendEmail.includes('@')) {
            toast.error(t('auth.enterValidEmail'));
            return;
        }

        setIsResending(true);

        try {
            await authService.resendVerification(resendEmail);
            setResendEmail('');
        } catch (error) {
            const message = error.response?.data?.message || t('auth.resendFailed');
            toast.error(message);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ scale: [1, 1.3, 1], x: [0, -50, 0], y: [0, 50, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full space-y-8 relative z-10"
            >
                <div className="text-center">
                    <motion.div
                        initial={{ scale: 0.5, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50" />
                        <ChatBubbleLeftRightIcon className="h-10 w-10 text-white relative z-10" />
                    </motion.div>
                </div>

                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-2xl rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
                    {status === 'verifying' && (
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-20 w-20">
                                <LoadingSpinner size="large" />
                            </div>
                            <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
                                {t('auth.verifyingEmail')}
                            </h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                {t('auth.pleaseWait')}
                            </p>
                        </div>
                    )}

                    {status === 'connecting' && (
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-500/10 border-2 border-green-500/20"
                            >
                                <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
                            </motion.div>

                            <h2 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">
                                {t('auth.emailVerified')}
                            </h2>

                            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
                                {t('auth.connectingToAccount')}
                            </p>

                            <div className="mt-6">
                                <LoadingSpinner size="medium" />
                            </div>

                            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                                {t('auth.redirectingToChat')}
                            </p>
                        </motion.div>
                    )}

                    {status === 'alreadyUsed' && (
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                                className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-500/10 border-2 border-yellow-500/20"
                            >
                                <CheckCircleIcon className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
                            </motion.div>

                            <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
                                {t('auth.linkAlreadyUsed')}
                            </h2>

                            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                                {t('auth.emailAlreadyVerifiedMessage')}
                            </p>

                            <div className="mt-8 space-y-3">
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Link
                                        to="/login"
                                        className="block w-full py-3 px-6 text-center font-semibold text-white rounded-xl overflow-hidden relative group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
                                        <span className="relative flex items-center justify-center">
                                            <SparklesIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                            {t('auth.goToLogin')}
                                        </span>
                                    </Link>
                                </motion.div>

                                <Link
                                    to="/"
                                    className="block text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    ← {t('auth.backToHome')}
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <div className="text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                                className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-500/10 border-2 border-red-500/20"
                            >
                                <XCircleIcon className="h-12 w-12 text-red-600 dark:text-red-400" />
                            </motion.div>

                            <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
                                {t('auth.verificationFailedTitle')}
                            </h2>

                            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                                {error || t('auth.verificationFailed')}
                            </p>

                            {errorType === 'expired' && (
                                <div className="mt-8 space-y-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {t('auth.enterEmailForNewLink')}
                                    </p>

                                    <div className="space-y-3">
                                        <div className="relative group">
                                            <input
                                                type="email"
                                                value={resendEmail}
                                                onChange={(e) => setResendEmail(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleResendEmail()}
                                                placeholder={t('auth.emailPlaceholder')}
                                                className="appearance-none block w-full px-4 py-3 pl-11 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700/50 dark:text-white transition-all"
                                            />
                                            <EnvelopeIcon className="h-5 w-5 text-slate-400 absolute left-3.5 top-3.5 group-focus-within:text-blue-600 transition-colors" />
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleResendEmail}
                                            disabled={isResending}
                                            className="group relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
                                            <span className="relative flex items-center">
                                                {isResending ? (
                                                    <LoadingSpinner size="small" color="white" />
                                                ) : (
                                                    <>
                                                        <ArrowPathIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                                        {t('auth.resendVerification')}
                                                    </>
                                                )}
                                            </span>
                                        </motion.button>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 space-y-3">
                                {errorType === 'notfound' && (
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Link
                                            to="/signup"
                                            className="block w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium text-center"
                                        >
                                            {t('auth.signupAgain')}
                                        </Link>
                                    </motion.div>
                                )}

                                <div className="text-center">
                                    <Link
                                        to="/login"
                                        className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    >
                                        ← {t('auth.backToLogin')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center"
                >
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('auth.needHelp')}{' '}

                        <a href="mailto:support@example.com"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                            {t('auth.contactSupport')}
                        </a>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default VerifyEmailPage;