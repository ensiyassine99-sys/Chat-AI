import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';

import {
    EnvelopeIcon,
    ArrowLeftIcon,
    ChatBubbleLeftRightIcon,
    XCircleIcon,
    CheckCircleIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import authService from '../services/authService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ForgotPasswordPage = () => {
    const { t, i18n } = useTranslation();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [emailNotFound, setEmailNotFound] = useState(false);

    const isRTL = i18n.language === 'ar';

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            toast.error(t('forgot.errors.invalidEmail'));
            return;
        }

        setIsLoading(true);
        setEmailNotFound(false);

        try {
            const checkResult = await authService.checkEmail(email);

            if (!checkResult.exists) {
                setEmailNotFound(true);
                toast.error(t('forgot.errors.emailNotFound'));
                setIsLoading(false);
                return;
            }

            await authService.forgotPassword(email);
            setEmailSent(true);
            toast.success(t('forgot.success.emailSent'));
        } catch (error) {
            toast.error(t('forgot.errors.sendFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4">
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
                className="max-w-md w-full space-y-8 relative z-10"
            >
                {/* Header */}
                <div className="text-center">
                    <motion.div
                        initial={{ scale: 0.5, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50" />
                        <ChatBubbleLeftRightIcon className="h-10 w-10 text-white relative z-10" />
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-6 text-3xl font-bold text-slate-900 dark:text-white"
                    >
                        {emailSent ? t('forgot.title.emailSent') : t('forgot.title.resetPassword')}
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-2 text-slate-600 dark:text-slate-400"
                    >
                        {emailSent
                            ? t('forgot.subtitle.emailSent')
                            : t('forgot.subtitle.enterEmail')}
                    </motion.p>
                </div>

                {/* Form / Success */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-2xl rounded-2xl p-8 border border-slate-200 dark:border-slate-700"
                >
                    {!emailSent ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    {t('forgot.emailLabel')}
                                </label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setEmailNotFound(false);
                                        }}
                                        className={`appearance-none block w-full px-4 py-3 pl-11 ${emailNotFound
                                            ? 'border-red-500 pr-11'
                                            : 'border-slate-200 dark:border-slate-600'
                                            } border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700/50 dark:text-white placeholder-slate-400 transition-all`}
                                        placeholder={t('forgot.emailPlaceholder')}
                                    />
                                    <EnvelopeIcon className="h-5 w-5 text-slate-400 absolute left-3.5 top-3.5 group-focus-within:text-blue-600 transition-colors" />
                                    {emailNotFound && (
                                        <XCircleIcon className="h-5 w-5 text-red-500 absolute right-3.5 top-3.5" />
                                    )}
                                </div>
                                {emailNotFound && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-2 text-sm text-red-600 dark:text-red-400"
                                    >
                                        {t('forgot.errors.emailNotFoundText')}{' '}
                                        <Link to="/signup" className="underline font-semibold">
                                            {t('forgot.signUpLink')}
                                        </Link>
                                        .
                                    </motion.p>
                                )}
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
                                <span className="relative flex items-center">
                                    {isLoading ? (
                                        <LoadingSpinner size="small" color="white" />
                                    ) : (
                                        <>
                                            <SparklesIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                            {t('forgot.sendResetLink')}
                                        </>
                                    )}
                                </span>
                            </motion.button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                                className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 border-2 border-green-500/20"
                            >
                                <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                            </motion.div>
                            <div>
                                <p className="text-slate-600 dark:text-slate-400 mb-1">
                                    {t('forgot.checkInbox')}
                                </p>
                                <p className="text-slate-900 dark:text-white font-semibold">
                                    {email}
                                </p>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mt-3">
                                    {t('forgot.instructions')}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setEmailSent(false);
                                    setEmail('');
                                }}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                            >
                                {t('forgot.sendAnother')}
                            </button>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group"
                        >
                            <ArrowLeftIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform`} />
                            {t('forgot.backToLogin')}
                        </Link>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
