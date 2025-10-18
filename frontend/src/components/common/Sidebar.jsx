import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlusIcon,
    ChatBubbleLeftRightIcon,
    ChevronDownIcon,
    ArrowRightOnRectangleIcon,
    Cog6ToothIcon,
    LanguageIcon,
    CheckIcon,
    Bars3Icon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { logout } from '../../store/authSlice';
import { toast } from 'react-hot-toast';

const Sidebar = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    // Desktop: saved state, Mobile: always closed
    const [isOpen, setIsOpen] = useState(() => {
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
            const saved = localStorage.getItem('sidebarOpen');
            return saved !== null ? JSON.parse(saved) : true;
        }
        return false;
    });

    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [languageMenuOpen, setLanguageMenuOpen] = useState(false);

    useEffect(() => {
        setProfileMenuOpen(false);
        setLanguageMenuOpen(false);
    }, [isOpen]);

    // Fermer la sidebar sur mobile lors du changement de route
    useEffect(() => {
        if (window.innerWidth < 1024) {
            setIsOpen(false);
        }
    }, [location.pathname]);

    // Sauvegarder l'état seulement sur desktop
    useEffect(() => {
        if (window.innerWidth >= 1024) {
            localStorage.setItem('sidebarOpen', JSON.stringify(isOpen));
        }
    }, [isOpen]);

    // Gérer le resize de la fenêtre
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsOpen(false);
            } else {
                const saved = localStorage.getItem('sidebarOpen');
                setIsOpen(saved !== null ? JSON.parse(saved) : true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleNewChat = () => {
        navigate('/chat');
        if (window.innerWidth < 1024) setIsOpen(false);
    };

    const handleHistory = () => {
        navigate('/history');
        if (window.innerWidth < 1024) setIsOpen(false);
    };

    const handleLanguageChange = (lang) => {
        i18n.changeLanguage(lang);
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        setLanguageMenuOpen(false);
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const getUserInitials = () => {
        if (!user?.username) return 'U';
        return user.username.charAt(0).toUpperCase();
    };

    return (
        <>
            {/* Mobile Hamburger Button - Only when sidebar is CLOSED */}
            {!isOpen && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className={`fixed top-4 z-50 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-blue-500/50 transition-all lg:hidden ${isRTL ? 'right-4' : 'left-4'
                        }`}
                >
                    <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </motion.button>
            )}

            {/* Desktop Toggle Button - Arrow */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl hover:shadow-blue-500/50 transition-all hidden lg:block"
                style={{
                    [isRTL ? 'right' : 'left']: isOpen ? '15rem' : '1rem',
                }}
            >
                <svg
                    className={`h-6 w-6 transition-transform duration-300 ${isRTL ? (isOpen ? 'rotate-180' : '') : (isOpen ? '' : 'rotate-180')
                        }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            </motion.button>

            {/* Overlay for Mobile */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: isRTL ? 300 : -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: isRTL ? 300 : -300 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className={`fixed ${isRTL ? 'right-0' : 'left-0'} top-0 h-screen w-64 sm:w-72 lg:w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col ${isRTL ? 'border-l' : 'border-r'
                            } border-slate-700/50 shadow-2xl z-40 overflow-y-auto`}
                    >
                        {/* Header */}
                        <div className="p-3 sm:p-5 pt-5 sm:pt-6 border-b border-slate-700/30">
                            <div className="flex items-center justify-between">
                                <div className={`flex items-center gap-3`}>
                                    <div className="h-5 w-5 sm:h-9 sm:w-9 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <ChatBubbleLeftRightIcon className="h-2 w-2 sm:h-5 sm:w-5 text-white" />
                                    </div>
                                    <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                        AI Chat
                                    </span>
                                </div>

                                {/* Close Button - Mobile Only */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsOpen(false)}
                                    className="lg:hidden p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                                >
                                    <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
                                </motion.button>
                            </div>
                        </div>

                        {/* New Chat Button */}
                        <div className="px-3 sm:px-4 pt-5">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleNewChat}
                                className="w-full group relative overflow-hidden rounded-full p-1 mb-2"
                            >
                                <div className="absolute inset-0 opacity-90 group-hover:opacity-100 transition-opacity" />
                                <div className={`relative flex items-center gap-2 sm:gap-3 `}>
                                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600">
                                        <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                    </div>
                                    <span className="font-semibold text-white text-sm sm:text-base">{t('chat.newChat')}</span>
                                </div>
                            </motion.button>
                        </div>

                        {/* Navigation */}
                        <div className="px-3 sm:px-4 space-y-1">
                            <motion.button
                                whileHover={{ x: isRTL ? -5 : 5 }}
                                onClick={handleHistory}
                                className={`w-full flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:py-3 rounded-xl transition-colors text-sm sm:text-base ${location.pathname === '/history'
                                    ? 'bg-slate-700/50 text-white'
                                    : 'text-slate-400 hover:bg-slate-700/30 hover:text-white'
                                    } `}
                            >
                                <ChatBubbleLeftRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span className="font-medium">{t('history.conversations')}</span>
                            </motion.button>
                        </div>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Language Menu */}
                        <AnimatePresence>
                            {languageMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="mx-3 sm:mx-4 mb-2 bg-slate-800/80 backdrop-blur-xl rounded-xl overflow-hidden border border-slate-700/50"
                                >
                                    <button
                                        onClick={() => handleLanguageChange('en')}
                                        className={`w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-700/50 transition-colors `}
                                    >
                                        <span className="text-xs sm:text-sm font-medium">English</span>
                                        {i18n.language === 'en' && <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />}
                                    </button>
                                    <button
                                        onClick={() => handleLanguageChange('ar')}
                                        className={`w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-700/50 transition-colors `}
                                    >
                                        <span className="text-xs sm:text-sm font-medium">العربية</span>
                                        {i18n.language === 'ar' && <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Profile Menu */}
                        <AnimatePresence>
                            {profileMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="mx-3 sm:mx-4 mb-2 bg-slate-800/80 backdrop-blur-xl rounded-xl overflow-hidden border border-slate-700/50"
                                >
                                    {/* User Info */}
                                    <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-700/50">
                                        <div className={`flex items-center gap-2 sm:gap-3 `}>
                                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                                <span className="text-xs sm:text-sm font-semibold">{getUserInitials()}</span>
                                            </div>
                                            <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                                                <p className="text-xs sm:text-sm font-semibold truncate">{user?.username}</p>
                                                <p className="text-[10px] sm:text-xs text-slate-400 truncate">{user?.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Settings */}
                                    <button
                                        onClick={() => {
                                            navigate('/profile');
                                            setProfileMenuOpen(false);
                                            if (window.innerWidth < 1024) setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-700/50 transition-colors `}
                                    >
                                        <Cog6ToothIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                                        <span className="text-xs sm:text-sm font-medium">{t('common.settings')}</span>
                                    </button>

                                    {/* Language Toggle */}
                                    <button
                                        onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                                        className={`w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-700/50 transition-colors `}
                                    >
                                        <div className={`flex items-center gap-2 sm:gap-3 `}>
                                            <LanguageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                                            <span className="text-xs sm:text-sm font-medium">{t('profile.language')}</span>
                                        </div>
                                        <ChevronDownIcon
                                            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 transition-transform ${languageMenuOpen ? 'rotate-180' : ''
                                                }`}
                                        />
                                    </button>

                                    {/* Logout */}
                                    <button
                                        onClick={handleLogout}
                                        className={`w-full flex items-center flex  justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-700/50 transition-colors border-t border-slate-700/50 ${isRTL ? 'flex-row-reverse' : ''
                                            }`}
                                    >
                                        <ArrowRightOnRectangleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                                        <span className="text-xs sm:text-sm font-medium">{t('auth.logout')}</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Profile Button */}
                        <div className="p-3 sm:p-4 border-slate-700/50">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                className="w-full rounded-xl flex items-center justify-between p-2.5 sm:p-3 hover:bg-slate-700/30 transition-colors"
                            >
                                <div className={`flex items-center gap-2 sm:gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                                        <span className="text-xs sm:text-sm font-semibold">{getUserInitials()}</span>
                                    </div>
                                    <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
                                        <p className="text-xs sm:text-sm font-semibold truncate max-w-[120px] sm:max-w-[150px]">
                                            {user?.username}
                                        </p>
                                    </div>
                                </div>
                                <ChevronDownIcon
                                    className={`h-4 w-4 sm:h-5 sm:w-5 text-slate-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''
                                        }`}
                                />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;