import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
    LockClosedIcon,
    EyeIcon,
    EyeSlashIcon,
    CheckCircleIcon,
    XCircleIcon,
    EnvelopeIcon,
    ArrowPathIcon,
    ChatBubbleLeftRightIcon,
    CheckIcon,
    XMarkIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import authService from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const { error, clearError, verifyResetToken, resetPassword: resetPass } = useAuth();

    const [status, setStatus] = useState('verifying');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorType, setErrorType] = useState('');
    const [resendEmail, setResendEmail] = useState('');
    const [isResending, setIsResending] = useState(false);

    const [passwordTouched, setPasswordTouched] = useState(false);
    const [confirmTouched, setConfirmTouched] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [validations, setValidations] = useState({
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false,
        passwordsMatch: false,
    });

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorType('invalid');
        } else {
            handleVerifyToken();
        }
    }, [token]);

    useEffect(() => {
        validatePassword(password, confirmPassword);
    }, [password, confirmPassword]);

    useEffect(() => {
        if (error) {
            console.log("error")
            setErrorType(error);
            clearError();
        }
    }, [error, clearError]);

    const validatePassword = (pwd, confirmPwd) => {
        const newValidations = {
            minLength: pwd.length >= 8,
            hasUpper: /[A-Z]/.test(pwd),
            hasLower: /[a-z]/.test(pwd),
            hasNumber: /\d/.test(pwd),
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
            passwordsMatch: pwd === confirmPwd && pwd.length > 0,
        };

        setValidations(newValidations);

        let strength = 0;
        if (newValidations.minLength) strength++;
        if (newValidations.hasUpper && newValidations.hasLower) strength++;
        if (newValidations.hasNumber) strength++;
        if (newValidations.hasSpecial) strength++;
        if (pwd.length >= 12) strength++;

        setPasswordStrength(strength);
    };

    const handleVerifyToken = async () => {
        setStatus('verifying');
        const result = await verifyResetToken(token);

        if (result.success && result.data.status === 'valid') {
            setStatus('form');
        } else {
            setStatus('error');
            const status = result.data?.status || 'invalid';
            let type = 'invalid';

            if (status === 'expired') type = 'expired';
            else if (status === 'used') type = 'used';

            setErrorType(type);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setPasswordTouched(true);
        setConfirmTouched(true);

        if (!validations.minLength) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        if (!validations.hasUpper || !validations.hasLower || !validations.hasNumber) {
            toast.error('Password must contain uppercase, lowercase, and number');
            return;
        }

        if (!validations.passwordsMatch) {
            toast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);

        const result = await resetPass(token, password);

        if (result.success) {
            setStatus('success');
            toast.success('Password reset successfully!');

            setTimeout(() => {
                navigate('/chat', { replace: true });
            }, 2000);
        } else {
            toast.error(result.error || 'Failed to reset password');
        }

        setIsLoading(false);
    };

    const handleResendEmail = async () => {
        if (!resendEmail || !resendEmail.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setIsResending(true);

        try {
            await authService.forgotPassword(resendEmail);
            toast.success('Password reset email sent!');
            setResendEmail('');
        } catch (error) {
            toast.error('Failed to send reset email');
        } finally {
            setIsResending(false);
        }
    };

    const getStrengthColor = () => {
        if (passwordStrength <= 2) return 'bg-red-500';
        if (passwordStrength === 3) return 'bg-yellow-500';
        if (passwordStrength === 4) return 'bg-blue-500';
        return 'bg-green-500';
    };

    const getStrengthText = () => {
        if (passwordStrength <= 2) return t('auth.strengthWeak');
        if (passwordStrength === 3) return t('auth.strengthFair');
        if (passwordStrength === 4) return t('auth.strengthGood');
        return t('auth.strengthStrong');
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
                </div>

                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-2xl rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
                    {status === 'verifying' && (
                        <div className="text-center">
                            <LoadingSpinner size="large" />
                            <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
                                {t('auth.verifyingResetLink')}
                            </h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                {t('common.pleaseWait')}
                            </p>
                        </div>
                    )}

                    {status === 'form' && (
                        <>
                            <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-6">
                                {t('auth.resetYourPassword')}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        {t('auth.newPassword')}
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onBlur={() => setPasswordTouched(true)}
                                            className={`appearance-none block w-full px-4 py-3 pl-11 pr-11 border ${passwordTouched && !validations.minLength
                                                ? 'border-red-500'
                                                : 'border-slate-200 dark:border-slate-600'
                                                } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700/50 dark:text-white placeholder-slate-400 transition-all`}
                                            placeholder="••••••••"
                                        />
                                        <LockClosedIcon className="h-5 w-5 text-slate-400 absolute left-3.5 top-3.5 group-focus-within:text-blue-600 transition-colors" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        >
                                            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {password.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-3"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-slate-600 dark:text-slate-400">
                                                        {t('auth.passwordStrength')}
                                                    </span>
                                                    <span className={`text-xs font-semibold ${passwordStrength <= 2 ? 'text-red-600' :
                                                        passwordStrength === 3 ? 'text-yellow-600' :
                                                            passwordStrength === 4 ? 'text-blue-600' : 'text-green-600'
                                                        }`}>
                                                        {getStrengthText()}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                                                        className={`h-2 rounded-full transition-all ${getStrengthColor()}`}
                                                    />
                                                </div>

                                                <div className="mt-3 space-y-2">
                                                    <ValidationItem valid={validations.minLength} text={t('auth.validationMinLength')} />
                                                    <ValidationItem valid={validations.hasUpper} text={t('auth.validationUpper')} />
                                                    <ValidationItem valid={validations.hasLower} text={t('auth.validationLower')} />
                                                    <ValidationItem valid={validations.hasNumber} text={t('auth.validationNumber')} />
                                                    <ValidationItem valid={validations.hasSpecial} text={t('auth.validationSpecial')} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        {t('auth.confirmPassword')}
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            onBlur={() => setConfirmTouched(true)}
                                            className={`appearance-none block w-full px-4 py-3 pl-11 pr-11 border ${confirmTouched && !validations.passwordsMatch
                                                ? 'border-red-500'
                                                : 'border-slate-200 dark:border-slate-600'
                                                } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700/50 dark:text-white placeholder-slate-400 transition-all`}
                                            placeholder="••••••••"
                                        />
                                        <LockClosedIcon className="h-5 w-5 text-slate-400 absolute left-3.5 top-3.5 group-focus-within:text-blue-600 transition-colors" />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>

                                    {confirmTouched && confirmPassword.length > 0 && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`mt-2 text-sm flex items-center ${validations.passwordsMatch ? 'text-green-600' : 'text-red-600'
                                                }`}
                                        >
                                            {validations.passwordsMatch ? (
                                                <>
                                                    <CheckIcon className="h-4 w-4 mr-1" />
                                                    {t('auth.passwordsMatch')}
                                                </>
                                            ) : (
                                                <>
                                                    <XMarkIcon className="h-4 w-4 mr-1" />
                                                    {t('auth.passwordsDoNotMatch')}
                                                </>
                                            )}
                                        </motion.p>
                                    )}
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={isLoading || !validations.passwordsMatch}
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
                                                {t('auth.resetPassword')}
                                            </>
                                        )}
                                    </span>
                                </motion.button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link to="/login" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    ← {t('auth.backToLogin')}
                                </Link>
                            </div>
                        </>
                    )}

                    {status === 'success' && (
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                                className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-500/10 border-2 border-green-500/20"
                            >
                                <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
                            </motion.div>
                            <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
                                {t('auth.passwordResetSuccess')}
                            </h2>
                            <p className="mt-2 text-slate-600 dark:text-slate-400">
                                {t('auth.loggingYouIn')}
                            </p>
                            <div className="mt-4">
                                <LoadingSpinner size="medium" />
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
                                {t('auth.resetLinkInvalid')} {errorType === 'used' ? t('auth.alreadyUsed') : ''}
                            </h2>

                            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                                {error || (errorType === 'used' ? t('auth.linkAlreadyUsed') : t('auth.invalidOrExpiredLink'))}
                            </p>

                            {(errorType === 'expired' || errorType === 'used') && (
                                <div className="mt-8 space-y-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {t('auth.enterEmailForReset')}
                                    </p>
                                    <div className="space-y-3">
                                        <div className="relative group">
                                            <input
                                                type="email"
                                                value={resendEmail}
                                                onChange={(e) => setResendEmail(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleResendEmail()}
                                                placeholder="your@email.com"
                                                className="appearance-none block w-full px-4 py-3 pl-11 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700/50 dark:text-white placeholder-slate-400 transition-all"
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
                                                        {t('auth.sendNewResetLink')}
                                                    </>
                                                )}
                                            </span>
                                        </motion.button>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6">
                                <Link to="/login" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    ← {t('auth.backToLogin')}
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const ValidationItem = ({ valid, text }) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center text-xs ${valid ? 'text-green-600' : 'text-slate-500'}`}
    >
        {valid ? <CheckIcon className="h-3 w-3 mr-2" /> : <XMarkIcon className="h-3 w-3 mr-2" />}
        {text}
    </motion.div>
);

export default ResetPasswordPage;