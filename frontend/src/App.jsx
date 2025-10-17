import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { I18nextProvider } from 'react-i18next';
import i18n from './config/i18n';
import store from './store/store';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';

// Lazy loading des pages
const HomePage = React.lazy(() => import('./pages/HomePage'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const HistoryPage = React.lazy(() => import('./pages/HistoryPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const SignupPage = React.lazy(() => import('./pages/SignupPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmailPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));

import Footer from './components/common/Footer';

// Components
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import AuthCallback from './pages/AuthCallback';

// Configuration Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="large" />
  </div>
);

// Layout avec Sidebar conditionnelle
const Layout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Routes protégées qui affichent la sidebar
  const protectedRoutes = ['/chat', '/profile', '/history', '/settings'];
  const showSidebar = isAuthenticated && protectedRoutes.some(route =>
    location.pathname.startsWith(route)
  );

  // Page d'accueil a son propre header intégré
  const isHomePage = location.pathname === '/';

  // Routes publiques qui affichent le header séparé
  const publicRoutesWithHeader = ['/login', '/signup', '/forgot-password'];
  const showHeader = publicRoutesWithHeader.some(route =>
    location.pathname === route || location.pathname.startsWith(route)
  );

  return (
    <>
      {/* Header pour les pages publiques (login, signup, etc.) */}
      {showHeader && <Header />}

      {/* Layout avec Sidebar pour les pages protégées */}
      {showSidebar ? (
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          {/* Main content - padding top seulement pour le bouton hamburger mobile */}
          <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 pt-16 lg:pt-0">
            <ErrorBoundary>
              <AnimatePresence mode="wait">
                {children}
              </AnimatePresence>
            </ErrorBoundary>
          </main>
        </div>
      ) : isHomePage ? (
        // Page d'accueil : pas de layout wrapper, HomePage gère tout
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </ErrorBoundary>
      ) : (
        // Autres pages publiques : avec container et padding
        <div className="min-h-screen">
          <main>
            <ErrorBoundary>
              <AnimatePresence mode="wait">
                {children}
              </AnimatePresence>
            </ErrorBoundary>
          </main>
        </div>
      )}
    </>
  );
};

// Hook pour wrapper le Layout avec Router
const LayoutWrapper = ({ children }) => {
  return (
    <Router>
      <Layout>{children}</Layout>
    </Router>
  );
};

// Composant principal de l'application
function App() {
  useEffect(() => {
    // Initialiser la direction du texte selon la langue
    const handleLanguageChange = (lng) => {
      document.documentElement.lang = lng;
      document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';

      // Charger les polices appropriées
      if (lng === 'ar') {
        document.body.classList.add('font-arabic');
      } else {
        document.body.classList.remove('font-arabic');
      }
    };

    i18n.on('languageChanged', handleLanguageChange);
    handleLanguageChange(i18n.language);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <SocketProvider>
              <LayoutWrapper>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Route publique avec redirection si authentifié */}
                    <Route
                      path="/"
                      element={
                        <PublicRoute>
                          <HomePage />
                        </PublicRoute>
                      }
                    />

                    {/* Autres routes publiques */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />

                    {/* Routes protégées */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/chat" element={<ChatPage />} />
                      <Route path="/chat/:chatId" element={<ChatPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/history" element={<HistoryPage />} />
                    </Route>

                    {/* Route 404 */}
                    <Route path="/404" element={<NotFoundPage />} />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </Suspense>
              </LayoutWrapper>

              {/* Notifications Toast - Responsive */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  className: 'text-sm sm:text-base',
                  style: {
                    background: '#363636',
                    color: '#fff',
                    padding: '12px 16px',
                    fontSize: '14px',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#4ade80',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
                containerStyle={{
                  top: 16,
                  right: 16,
                  bottom: 16,
                  left: 16,
                }}
                toastStyle={{
                  maxWidth: '90vw',
                }}
              />
            </SocketProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </Provider>
  );
}

export default App;