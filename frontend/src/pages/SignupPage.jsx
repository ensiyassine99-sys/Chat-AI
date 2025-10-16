import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  LanguageIcon,
  CheckIcon,
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';


const SignupPage = () => {
  const { t, i18n } = useTranslation();



  const schema = yup.object({
    username: yup
      .string()
      .min(3, t('errors.username_min'))
      .max(50, t('errors.username_max'))
      .matches(/^[a-zA-Z0-9_]+$/, t('errors.username_regex'))
      .required(t('errors.username_required')),
    email: yup
      .string()
      .email(t('errors.email_invalid'))
      .required(t('errors.email_required')),
    password: yup
      .string()
      .min(8, t('errors.password_min'))
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, t('errors.password_pattern'))
      .required(t('errors.password_required')),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], t('errors.confirmPassword_match'))
      .required(t('errors.confirmPassword_required')),
    language: yup.string().oneOf(['en', 'ar']).default(i18n.language),
    terms: yup
      .boolean()
      .oneOf([true], t('errors.terms_oneOf'))
      .required(),
  });

  const navigate = useNavigate();
  const { signup, isLoading, error, clearError } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const isRTL = i18n.language === 'ar';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setFocus,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      language: i18n.language,
      terms: false,
    },
  });

  const watchPassword = watch('password');

  useEffect(() => {
    if (!emailSent) setFocus('username');
  }, [setFocus, emailSent]);

  useEffect(() => {
    if (error) {

      toast.error(error);
      clearError();
    }
  }, [error, clearError, t]);

  useEffect(() => {
    if (watchPassword) {
      let strength = 0;
      if (watchPassword.length >= 8) strength++;
      if (watchPassword.length >= 12) strength++;
      if (/[a-z]/.test(watchPassword) && /[A-Z]/.test(watchPassword)) strength++;
      if (/\d/.test(watchPassword)) strength++;
      if (/[^a-zA-Z\d]/.test(watchPassword)) strength++;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [watchPassword]);
  const handleGoogleSignup = () => {
    const currentLang = i18n.language;
    const googleAuthUrl = `${import.meta.env.VITE_API_URL}/auth/google?lng=${currentLang}`;
    window.location.href = googleAuthUrl; // ← Même URL pour tout
  };

  const onSubmit = async (data) => {
    try {
      const result = await signup({
        username: data.username,
        email: data.email,
        password: data.password,
        language: data.language,
      });

      if (result) {
        setUserEmail(data.email);
        setEmailSent(true);
        toast.success(t('auth.signupEmailSent'));
      }
    } catch (err) {
      console.error('Signup error:', err);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return t('auth.passwordWeak');
    if (passwordStrength === 3) return t('auth.passwordMedium');
    return t('auth.passwordStrong');
  };

  if (emailSent) {
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full relative z-10"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl"
            >
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-white" />
            </motion.div>

            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Check Your Email
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              We sent you a verification link
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700"
          >
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="mx-auto h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500/20"
              >
                <CheckIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
              </motion.div>

              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Check your inbox at
                </p>
                <p className="text-slate-900 dark:text-white font-semibold mt-1">
                  {userEmail}
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-3">
                  and click the link to verify your account.
                </p>
              </div>

              <button
                onClick={() => setEmailSent(false)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
              >
                Send to another email
              </button>

              <Link
                to="/login"
                className="flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors group"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform" />
                Back to Login
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

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
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.5, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50" />
            <UserIcon className="h-10 w-10 text-white relative z-10" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {t('auth.createAccount')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors outline-none focus:outline-none focus:underline hover:underline underline-offset-2"
              >
                {t('auth.loginNow')}
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 space-y-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="space-y-5">
            {/* Username Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('auth.username')}
              </label>
              <div className="relative group">
                <input
                  {...register('username')}
                  type="text"
                  autoComplete="username"
                  className={`appearance-none block w-full px-4 py-3 pl-11 border ${errors.username
                    ? 'border-red-500 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/20'
                    : 'border-slate-200 dark:border-slate-600 focus:border-blue-400 dark:focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20'
                    } rounded-xl shadow-sm placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:outline-none focus:ring-0 dark:bg-slate-700/50 dark:text-white transition-all hover:border-slate-300 dark:hover:border-slate-500 autofill:bg-white dark:autofill:bg-slate-700/50 autofill:text-slate-900 dark:autofill:text-white`}
                  placeholder="johndoe"
                  style={{
                    WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.05) inset',
                    WebkitTextFillColor: 'inherit',
                  }}
                />
                <UserIcon className="h-5 w-5 text-slate-400 absolute left-3.5 top-3.5 transition-colors pointer-events-none group-focus-within:text-blue-500" />
              </div>
              {errors.username && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.username.message}
                </motion.p>
              )}
            </motion.div>

            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('auth.email')}
              </label>
              <div className="relative group">
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={`appearance-none block w-full px-4 py-3 pl-11 border ${errors.email
                    ? 'border-red-500 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/20'
                    : 'border-slate-200 dark:border-slate-600 focus:border-blue-400 dark:focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20'
                    } rounded-xl shadow-sm placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:outline-none focus:ring-0 dark:bg-slate-700/50 dark:text-white transition-all hover:border-slate-300 dark:hover:border-slate-500`}
                  placeholder="you@example.com"
                  style={{
                    WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.05) inset',
                    WebkitTextFillColor: 'inherit',
                  }}
                />
                <EnvelopeIcon className="h-5 w-5 text-slate-400 absolute left-3.5 top-3.5 transition-colors pointer-events-none group-focus-within:text-blue-500" />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.email.message}
                </motion.p>
              )}
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative group">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`appearance-none block w-full px-4 py-3 pl-11 pr-11 border ${errors.password
                    ? 'border-red-500 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/20'
                    : 'border-slate-200 dark:border-slate-600 focus:border-blue-400 dark:focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20'
                    } rounded-xl shadow-sm placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:outline-none focus:ring-0 dark:bg-slate-700/50 dark:text-white transition-all hover:border-slate-300 dark:hover:border-slate-500`}
                  placeholder="••••••••"
                  style={{
                    WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.05) inset',
                    WebkitTextFillColor: 'inherit',
                  }}
                />
                <LockClosedIcon className="h-5 w-5 text-slate-400 absolute left-3.5 top-3.5 transition-colors pointer-events-none group-focus-within:text-blue-500" />
                <button
                  type="button"
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:scale-110 focus:scale-110 transition-all outline-none focus:outline-none focus:ring-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.password.message}
                </motion.p>
              )}

              {/* Password Strength */}
              {watchPassword && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {t('auth.passwordStrength')}
                    </span>
                    <span className={`text-xs font-semibold ${passwordStrength <= 2 ? 'text-red-600' : passwordStrength === 3 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                      className={`h-2 rounded-full transition-all ${getPasswordStrengthColor()}`}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Confirm Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
            >
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative group">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`appearance-none block w-full px-4 py-3 pl-11 pr-11 border ${errors.confirmPassword
                    ? 'border-red-500 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/20'
                    : 'border-slate-200 dark:border-slate-600 focus:border-blue-400 dark:focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20'
                    } rounded-xl shadow-sm placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:outline-none focus:ring-0 dark:bg-slate-700/50 dark:text-white transition-all hover:border-slate-300 dark:hover:border-slate-500`}
                  placeholder="••••••••"
                  style={{
                    WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.05) inset',
                    WebkitTextFillColor: 'inherit',
                  }}
                />
                <LockClosedIcon className="h-5 w-5 text-slate-400 absolute left-3.5 top-3.5 transition-colors pointer-events-none group-focus-within:text-blue-500" />
                <button
                  type="button"
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:scale-110 focus:scale-110 transition-all outline-none focus:outline-none focus:ring-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.confirmPassword.message}
                </motion.p>
              )}
            </motion.div>

            {/* Language Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
            >
              <label htmlFor="language" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('auth.preferredLanguage')}
              </label>
              <div className="relative group">
                <select
                  {...register('language')}
                  className="appearance-none block w-full px-4 py-3 pl-11 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm outline-none focus:outline-none focus:ring-0 focus:border-blue-400 dark:focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20 dark:bg-slate-700/50 dark:text-white transition-all hover:border-slate-300 dark:hover:border-slate-500"
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
                <LanguageIcon className="h-5 w-5 text-slate-400 absolute left-3.5 top-3.5 transition-colors pointer-events-none group-focus-within:text-blue-500" />
              </div>
            </motion.div>
          </div>

          {/* Terms */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="flex items-start"
          >
            <div className="flex items-center h-5">
              <input
                {...register('terms')}
                id="terms"
                type="checkbox"
                className="h-5 w-5 rounded-lg border-slate-200 dark:border-slate-600 text-blue-600 outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 focus:shadow-lg focus:shadow-blue-500/30"
              />
            </div>
            <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
              <label htmlFor="terms" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                {t('auth.agreeToTerms')}{' '}
                <Link to="/terms" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors outline-none focus:outline-none focus:underline hover:underline underline-offset-2">
                  {t('auth.termsAndConditions')}
                </Link>
              </label>
              {errors.terms && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.terms.message}
                </p>
              )}
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting || isLoading}
            className="group relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl focus:shadow-2xl outline-none focus:outline-none focus:ring-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
            <span className="relative flex items-center">
              {isSubmitting || isLoading ? (
                <LoadingSpinner size="small" color="white" />
              ) : (
                <>
                  <SparklesIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('auth.createAccount')}
                </>
              )}
            </span>
          </motion.button>

          {/* OAuth Options */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl text-slate-500">
                  {t('auth.orContinueWith')}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignup}
                className="w-full inline-flex justify-center items-center py-3.5 px-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg transition-all outline-none focus:outline-none focus:ring-0 focus:border-slate-300 dark:focus:border-slate-600 focus:shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>
                  {t('auth.continueWithGoogle')}
                </span>
              </button>
            </div>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default SignupPage;