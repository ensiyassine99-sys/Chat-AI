import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { oauthLogin, error, clearError } = useAuth();
  const { t, i18n } = useTranslation();


  const [status, setStatus] = useState('processing'); // processing | success | error

  useEffect(() => {
    if (error) {
      console.log('❌ OAuth Callback Error:', error);
      toast.error(error);
      clearError();
    }
  }, [error, clearError, t]);

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // ============================================
        // 1. RÉCUPÉRER LES PARAMÈTRES DE L'URL
        // ============================================
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const error = searchParams.get('error');

        console.log('🔍 OAuth Callback - Params:', {
          hasToken: !!token,
          hasRefreshToken: !!refreshToken,
          error
        });

        // ============================================
        // 2. GÉRER LES ERREURS D'OAUTH
        // ============================================
        if (error) {
          console.error('❌ OAuth error:', error);
          setStatus('error');

          const errorMessages = {
            auth_failed: 'Authentication failed. Please try again.',
            no_account: 'No account found. Please sign up first.',
            account_exists: 'Account already exists. Please log in.',
            default: 'An error occurred during authentication.'
          };

          toast.error(errorMessages[error] || errorMessages.default, {
            duration: 5000
          });
          return;
        }

        // ============================================
        // 3. VALIDER LES TOKENS
        // ============================================
        if (!token || !refreshToken) {
          console.error('❌ Missing tokens');
          setStatus('error');
          toast.error('Invalid authentication response. Please try again.', {
            duration: 5000
          });
          return;
        }

        // ============================================
        // 4. AUTHENTIFIER VIA LE HOOK
        // ============================================
        console.log('🔐 Authenticating via OAuth...');
        const result = await oauthLogin(token, refreshToken);

        if (result.success) {
          console.log('✅ OAuth authentication successful');
          setStatus('success');

          const username = result.data?.user?.username
            || result.data?.user?.email?.split('@')[0]
            || 'there';



          // La redirection est gérée par le hook useAuth
        } else {
          console.error('❌ OAuth authentication failed');
          setStatus('error');
          toast.error(result.error || 'Authentication failed', {
            duration: 5000
          });
        }

      } catch (err) {
        console.error('❌ Unexpected error in OAuth callback:', err);
        setStatus('error');
        toast.error('An unexpected error occurred. Please try again.', {
          duration: 5000
        });
      }
    };

    processOAuthCallback();
  }, [searchParams, oauthLogin]);

  // ============================================
  // RENDER : ÉCRAN DE CHARGEMENT
  // ============================================
  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <>
            <LoadingSpinner size="large" />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 space-y-2"
            >
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Completing authentication...
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Please wait while we securely log you in
              </p>
            </motion.div>

            {/* Progress Dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center items-center space-x-2 mt-6"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
                />
              ))}
            </motion.div>
          </>
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Authentication Successful!
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Redirecting you to the app...
            </p>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Authentication Failed
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              There was a problem authenticating your account
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/login'}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Return to Login
            </motion.button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

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

      {/* Content Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-12 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 min-w-[400px]"
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};

export default AuthCallback;