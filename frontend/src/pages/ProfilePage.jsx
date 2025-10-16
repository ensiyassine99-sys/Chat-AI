import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { Tab } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Settings, BarChart3, FileText, Shield, Trash2, Camera,
  Check, X, MessageSquare, Zap, Brain, Download, Mail, Globe,
  ChevronRight, AlertTriangle, Sparkles, TrendingUp, Clock, Calendar
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import userService from '../services/userService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    language: user?.language || 'en',
    theme: user?.theme || 'light',
  });

  const [statistics, setStatistics] = useState(null);
  const [userSummary, setUserSummary] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    loadUserData();
  }, [isRTL]);

  const loadUserData = async () => {
    try {
      const stats = await userService.getUserStatistics();
      setStatistics(stats.statistics);

      const summary = await userService.getUserSummary();
      if (summary.summary) {
        setUserSummary(isRTL ? summary.summary.summaryAr : summary.summary.summary);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error(t('errors.loadingFailed'));
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await userService.updateProfile(profileData);
      dispatch({ type: 'auth/updateUser', payload: response.user });
      toast.success(t('profile.updateSuccess'));
      setIsEditing(false);
    } catch (error) {
      toast.error(t('errors.updateFailed'));
    }
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const response = await userService.generateUserSummary();
      setUserSummary(isRTL ? response.summary.summaryAr : response.summary.summary);
      toast.success(t('profile.summaryGenerated'));
    } catch (error) {
      toast.error(t('errors.summaryGenerationFailed'));
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleExportData = async (format = 'json') => {
    try {
      await userService.exportUserData(format);
      toast.success(t('profile.dataExported'));
    } catch (error) {
      toast.error(t('errors.exportFailed'));
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm(t('profile.confirmDelete'))) {
      const password = window.prompt(t('profile.enterPasswordToDelete'));
      if (password) {
        try {
          await userService.deleteAccount(password);
          toast.success(t('profile.accountDeleted'));
        } catch (error) {
          toast.error(t('errors.deleteFailed'));
        }
      }
    }
  };

  // Generate mock data for charts (replace with real API data)
  const generateDailyTokenData = () => {
    const days = 30;
    const data = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tokens: Math.floor(Math.random() * 5000) + 1000,
        messages: Math.floor(Math.random() * 50) + 10
      });
    }
    return data;
  };

  const generateWeeklyActivity = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((day, index) => ({
      day,
      messages: Math.floor(Math.random() * 100) + 20,
      tokens: Math.floor(Math.random() * 8000) + 2000
    }));
  };

  const generateModelDistribution = () => {
    return [
      { name: 'GPT-4', value: 45, color: '#3b82f6' },
      { name: 'GPT-3.5', value: 30, color: '#8b5cf6' },
      { name: 'Gemini Pro', value: 15, color: '#10b981' },
      { name: 'Claude', value: 10, color: '#f59e0b' }
    ];
  };

  const dailyTokenData = generateDailyTokenData();
  const weeklyActivity = generateWeeklyActivity();
  const modelDistribution = generateModelDistribution();

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };
  const statsCards = statistics ? [
    {
      icon: MessageSquare,
      label: t('profile.totalChats'),
      value: statistics.chats.total,
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      icon: Zap,
      label: t('profile.totalMessages'),
      value: statistics.chats.totalMessages,
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      icon: Brain,
      label: t('profile.tokensUsed'),
      value: statistics.chats.totalTokensUsed.toLocaleString(),
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      icon: BarChart3,
      label: t('profile.avgMessageLength'),
      value: `${statistics.avgMessageLength} chars`,
      gradient: 'from-orange-500 to-red-600',
    }
  ] : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xl">
          <p className="font-semibold text-slate-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {/* Profile Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-8"
        >
          <div className="relative h-48 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900">
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  'linear-gradient(to right, rgb(51, 65, 85), rgb(30, 41, 59), rgb(15, 23, 42))',
                  'linear-gradient(to right, rgb(30, 41, 59), rgb(15, 23, 42), rgb(51, 65, 85))'
                ]
              }}
              transition={{ duration: 10, repeat: Infinity }}
            />
          </div>

          <div className="relative px-8 pb-8">
            <div className="flex items-end justify-between -mt-20 mb-6">
              <div className="relative group">
                <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                  <div className="h-32 w-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl p-1 shadow-2xl">
                    <div className="h-full w-full bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center">
                      <User className="h-16 w-16 text-slate-400" />
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute bottom-2 right-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-2.5 gap-2 shadow-lg"
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </motion.button>
                </motion.div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEditing(!isEditing)}
                className="px-6 py-3 bg-gradient-to-r gap-2 from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
              >
                {isEditing ? <><X className="h-5 w-5" /><span>{t('common.cancel')}</span></> : <><Settings className="h-5 w-5" /><span>{t('profile.edit')}</span></>}
              </motion.button>
            </div>

            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{user?.username}</h1>
              <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Mail className="h-4 w-4 mr-2 " />
                {user?.email}
              </p>
            </div>

            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        {t('auth.username')}
                      </label>
                      <input
                        type="text"
                        value={profileData.username}
                        onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700/50 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        {t('auth.email')}
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700/50 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUpdateProfile}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg"
                    >
                      <Check className="h-5 w-5 mr-2" />{t('common.save')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsEditing(false)}
                      className="flex items-center px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-semibold"
                    >
                      <X className="h-5 w-5 mr-2" />{t('common.cancel')}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <Tab.Group>
          <Tab.List className="flex space-x-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-2 mb-8 border border-slate-200 dark:border-slate-700 overflow-x-auto">
            {[
              { icon: BarChart3, label: t('profile.statistics') },
              { icon: FileText, label: t('profile.aiSummary') },
              { icon: Settings, label: t('profile.settings') },
              { icon: Shield, label: t('profile.security') }
            ].map((tab, idx) => (
              <Tab key={idx} className="focus:outline-none min-w-max">
                {({ selected }) => (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`gap-2 flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all  ${selected
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </motion.div>
                )}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels>
            {/* Statistics Tab */}
            <Tab.Panel>
              <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="space-y-6">
                {isLoadingStats ? (
                  <div className="flex justify-center py-20">
                    <LoadingSpinner />
                  </div>
                ) : statistics ? (
                  <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {statsCards.map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="relative group"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-2xl transition-all">
                              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.gradient} mb-4`}>
                                <Icon className="h-6 w-6 text-white" />
                              </div>
                              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                {stat.value}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {stat.label}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Additional Info Cards - Only Favorite Model */}
                    <div className="grid grid-cols-1 gap-6">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg"
                      >
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-3">
                          <Brain className="h-5 w-5 mr-2 text-blue-600" />
                          {t('profile.favoriteModel')}
                        </h3>
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {statistics.favoriteModel}
                        </p>
                      </motion.div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20">
                    <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">{t('profile.noStatistics')}</p>
                  </div>
                )}
              </motion.div>
            </Tab.Panel>

            {/* AI Summary Tab */}
            <Tab.Panel>
              <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="space-y-6">
                {userSummary ? (
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg"
                  >
                    <div className="flex items-center mb-6 gap-3">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white ml-4">
                        {t('profile.yourAISummary')}
                      </h3>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed mb-6">
                      {userSummary}
                    </p>
                  </motion.div>
                ) : (
                  <div className="text-center py-20 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 gap-3">
                    <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 mb-4">{t('profile.noSummary')}</p>
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                >
                  {isGeneratingSummary ? (
                    <LoadingSpinner size="small" color="white" />
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      {t('profile.generateSummary')}
                    </>
                  )}
                </motion.button>
              </motion.div>
            </Tab.Panel>

            {/* Settings Tab */}
            <Tab.Panel>
              <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="space-y-6">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
                  <div className="flex items-center mb-6 gap-2" >
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-3 rounded-xl">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white ml-4">
                      {t('profile.preferences')}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-3">
                        <Globe className="h-4 w-4 mr-2" />
                        {t('profile.language')}
                      </label>
                      <select
                        value={profileData.language}
                        onChange={(e) => {
                          setProfileData({ ...profileData, language: e.target.value });
                          i18n.changeLanguage(e.target.value);
                        }}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700/50 dark:text-white transition-all"
                      >
                        <option value="en">English</option>
                        <option value="ar">العربية</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
                  <div className="flex items-center mb-6 gap-3">
                    <div className="bg-gradient-to-r from-orange-600 to-red-600 p-3 rounded-xl gap-3">
                      <Download className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white ml-4">
                      {t('profile.dataManagement')}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExportData('json')}
                      className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all text-left font-medium flex items-center justify-between group"
                    >
                      <span>{t('profile.exportDataJSON')}</span>
                      <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExportData('csv')}
                      className="w-full py-3 gap-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all text-left font-medium flex items-center justify-between group"
                    >
                      <span>{t('profile.exportDataCSV')}</span>
                      <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </Tab.Panel>

            {/* Security Tab */}
            <Tab.Panel>
              <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="space-y-6">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 backdrop-blur-xl rounded-2xl p-8 border-2 border-red-200 dark:border-red-800 shadow-lg">
                  <div className="flex items-center mb-6 gap-3" >
                    <div className="bg-gradient-to-r from-red-600 to-orange-600 p-3 rounded-xl">
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 ml-4">
                      {t('profile.dangerZone')}
                    </h3>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 mb-6">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteAccount}
                    className="w-full py-4 px-6 bg-gradient-to-r gap-3 from-red-600 to-orange-600 text-white rounded-xl hover:shadow-2xl transition-all flex items-center justify-center font-semibold"
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    {t('profile.deleteAccount')}
                  </motion.button>
                </div>
              </motion.div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default ProfilePage