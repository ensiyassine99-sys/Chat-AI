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

    const [isOpen, setIsOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [languageMenuOpen, setLanguageMenuOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('sidebarOpen', JSON.stringify(isOpen));
    }, [isOpen]);

    const handleNewChat = () => {
        navigate('/chat');
        toast.success(t('chat.newChat'));
    };

    const handleHistory = () => {
        navigate('/history');
    };

    const handleLanguageChange = (lang) => {
        i18n.changeLanguage(lang);
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        setLanguageMenuOpen(false);
        toast.success(lang === 'ar' ? 'تم تغيير اللغة' : 'Language changed');
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
        toast.success(t('auth.logoutSuccess'));
    };

    const getUserInitials = () => {
        if (!user?.username) return 'U';
        return user.username.charAt(0).toUpperCase();
    };

    return (
        <>
            {/* Toggle Button - SOLUTION SIMPLE */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl hover:shadow-blue-500/50 transition-all"
                style={{
                    [isRTL ? 'right' : 'left']: isOpen ? '15rem' : '1rem',
                }}
            >
                {/* SVG AVEC ROTATION CSS */}
                <svg
                    className={`h-6 w-6 transition-transform duration-300 ${isRTL ? (isOpen ?  'rotate-180':'') : (isOpen ? '':'rotate-180')
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

            {/* Sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                        />

                        <motion.div
                            initial={{ x: isRTL ? 300 : -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: isRTL ? 300 : -300 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className={`fixed ${isRTL ? 'right-0' : 'left-0'} top-0 h-screen w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col ${isRTL ? 'border-l' : 'border-r'
                                } border-slate-700/50 shadow-2xl z-40`}
                        >
                            <div className="p-6 pt-8">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                        AI Chat
                                    </span>
                                </div>
                            </div>

                            <div className="px-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleNewChat}
                                    className="w-full group relative overflow-hidden rounded-xl p-3 mb-2"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                                            <PlusIcon className="h-5 w-5 text-white" />
                                        </div>
                                        <span className="font-semibold text-white">{t('chat.newChat')}</span>
                                    </div>
                                </motion.button>
                            </div>

                            <div className="px-4 space-y-1">
                                <motion.button
                                    whileHover={{ x: isRTL ? -5 : 5 }}
                                    onClick={handleHistory}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${location.pathname === '/history'
                                        ? 'bg-slate-700/50 text-white'
                                        : 'text-slate-400 hover:bg-slate-700/30 hover:text-white'
                                        }`}
                                >
                                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                                    <span className="font-medium">{t('history.conversations')}</span>
                                </motion.button>
                            </div>

                            <div className="flex-1" />

                            <AnimatePresence>
                                {languageMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="mx-4 mb-2 bg-slate-800/80 backdrop-blur-xl rounded-xl overflow-hidden border border-slate-700/50"
                                    >
                                        <button
                                            onClick={() => handleLanguageChange('en')}
                                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/50 transition-colors"
                                        >
                                            <span className="text-sm font-medium">English</span>
                                            {i18n.language === 'en' && <CheckIcon className="h-4 w-4 text-blue-400" />}
                                        </button>
                                        <button
                                            onClick={() => handleLanguageChange('ar')}
                                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/50 transition-colors"
                                        >
                                            <span className="text-sm font-medium">العربية</span>
                                            {i18n.language === 'ar' && <CheckIcon className="h-4 w-4 text-blue-400" />}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {profileMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="mx-4 mb-2 bg-slate-800/80 backdrop-blur-xl rounded-xl overflow-hidden border border-slate-700/50"
                                    >
                                        <div className="px-4 py-3 border-b border-slate-700/50">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-semibold">{getUserInitials()}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate">{user?.username}</p>
                                                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                navigate('/profile');
                                                setProfileMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors"
                                        >
                                            <Cog6ToothIcon className="h-5 w-5 text-slate-400" />
                                            <span className="text-sm font-medium">{t('common.settings')}</span>
                                        </button>

                                        <button
                                            onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <LanguageIcon className="h-5 w-5 text-slate-400" />
                                                <span className="text-sm font-medium">{t('profile.language')}</span>
                                            </div>
                                            <ChevronDownIcon
                                                className={`h-4 w-4 text-slate-400 transition-transform ${languageMenuOpen ? 'rotate-180' : ''
                                                    }`}
                                            />
                                        </button>

                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors border-t border-slate-700/50"
                                        >
                                            <ArrowRightOnRectangleIcon className="h-5 w-5 text-slate-400" />
                                            <span className="text-sm font-medium">{t('auth.logout')}</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="p-4 border-t border-slate-700/50">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    className="w-full rounded-xl flex items-center justify-between p-3 hover:bg-slate-700/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                                            <span className="text-sm font-semibold">{getUserInitials()}</span>
                                        </div>
                                        <div className="text-left rtl:text-right">
                                            <p className="text-sm font-semibold">{user?.username}</p>
                                            <p className="text-xs text-slate-400">Online</p>
                                        </div>
                                    </div>
                                    <ChevronDownIcon
                                        className={`h-5 w-5 text-slate-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''
                                            }`}
                                    />
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;