import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  User,
  ChevronDown,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  Globe,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { setLanguage, toggleMobileSidebar } from '../../store/uiSlice';

const Header = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { mobileSidebarOpen } = useSelector(state => state.ui);
  const { unreadCount } = useSelector(state => state.notifications || { unreadCount: 0 });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isRTL = i18n.language === 'ar';
  const isLoginPage = location.pathname === '/login';
  const isSignupPage = location.pathname === '/signup';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (showUserMenu || showLangMenu) {
      const handleClickOutside = () => {
        setShowUserMenu(false);
        setShowLangMenu(false);
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu, showLangMenu]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    dispatch(setLanguage(lang));
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    setShowLangMenu(false);
  };

  const navItems = [
    { path: '/chat', label: t('nav.chat') },
    { path: '/history', label: t('nav.history') },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
        ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg'
        : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50'
        }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Left side */}
          <div className="flex items-center gap-3">
            {/* Mobile sidebar toggle */}
            {isAuthenticated && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => dispatch(toggleMobileSidebar())}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
              >
                {mobileSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </motion.button>
            )}

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 rtl:space-x-reverse group">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl shadow-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
              </motion.div>
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Law CodeX
              </span>
            </Link>

            {/* Desktop Navigation */}
            {isAuthenticated && (
              <div className="hidden md:flex md:space-x-1 rtl:space-x-reverse md:ml-6 rtl:md:ml-0 rtl:md:mr-6">
                {navItems.map((item, idx) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
                  >
                    <Link
                      to={item.path}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all relative group ${location.pathname === item.path
                        ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                      {item.label}
                      {location.pathname !== item.path && (
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300" />
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse">
            {/* Language Selector */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLangMenu(!showLangMenu);
                  setShowUserMenu(false);
                }}
                className="p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <Globe className="h-5 w-5" />
              </motion.button>

              <AnimatePresence>
                {showLangMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 rtl:left-0 rtl:right-auto top-full mt-2 w-40 origin-top-right rtl:origin-top-left rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`block w-full text-left rtl:text-right px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${i18n.language === 'en'
                        ? 'text-slate-900 dark:text-white font-semibold bg-slate-50 dark:bg-slate-700'
                        : 'text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => handleLanguageChange('ar')}
                      className={`block w-full text-left rtl:text-right px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${i18n.language === 'ar'
                        ? 'text-slate-900 dark:text-white font-semibold bg-slate-50 dark:bg-slate-700'
                        : 'text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      العربية
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 right-1 rtl:right-auto rtl:left-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </motion.button>

                {/* User Menu */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserMenu(!showUserMenu);
                      setShowLangMenu(false);
                    }}
                    className="hidden md:flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                      {user?.username}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </motion.button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 rtl:left-0 rtl:right-auto top-full mt-2 w-64 origin-top-right rtl:origin-top-left rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {user?.username}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {user?.email}
                          </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <Link
                            to="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <User className={`${isRTL ? 'ml-3' : 'mr-3'} h-5 w-5`} />
                            {t('common.profile')}
                          </Link>

                          <Link
                            to="/settings"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Settings className={`${isRTL ? 'ml-3' : 'mr-3'} h-5 w-5`} />
                            {t('common.settings')}
                          </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-slate-200 dark:border-slate-700 py-1">
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              handleLogout();
                            }}
                            className="flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 w-full hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-medium"
                          >
                            <LogOut className={`${isRTL ? 'ml-3' : 'mr-3'} h-5 w-5`} />
                            {t('auth.logout')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile User Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/profile')}
                  className="md:hidden p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </motion.button>
              </>
            ) : (
              <div className="hidden sm:flex items-center space-x-3 rtl:space-x-reverse">
                {/* Login Button - shown on signup page or home */}
                {(isSignupPage || (!isLoginPage && !isSignupPage)) && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to="/login"
                      className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all"
                    >
                      {t('nav.login')}
                    </Link>
                  </motion.div>
                )}

                {/* Signup Button - shown on login page or home */}
                {(isLoginPage || (!isLoginPage && !isSignupPage)) && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to="/signup"
                      className="group relative px-6 py-2.5 text-sm font-semibold text-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                      <span className="relative flex items-center space-x-2 rtl:space-x-reverse">
                        <span>{t('nav.signup')}</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                      </span>
                    </Link>
                  </motion.div>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle */}
            {!isAuthenticated && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </motion.button>
            )}
          </div>
        </div>

        {/* Mobile Menu for non-authenticated users */}
        <AnimatePresence>
          {!isAuthenticated && mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="sm:hidden border-t border-slate-200 dark:border-slate-700 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
            >
              <div className="px-4 py-4 space-y-3">
                {isLoginPage ? (
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="group relative block w-full text-center px-4 py-3 text-sm font-semibold text-white rounded-xl overflow-hidden shadow-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
                    <span className="relative flex items-center justify-center space-x-2 rtl:space-x-reverse">
                      <span>{t('nav.signup')}</span>
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                ) : isSignupPage ? (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all"
                  >
                    {t('nav.login')}
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all"
                    >
                      {t('nav.login')}
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="group relative block w-full text-center px-4 py-3 text-sm font-semibold text-white rounded-xl overflow-hidden shadow-lg"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
                      <span className="relative flex items-center justify-center space-x-2 rtl:space-x-reverse">
                        <span>{t('nav.signup')}</span>
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
};

export default Header;