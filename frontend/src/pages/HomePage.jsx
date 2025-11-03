import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Globe, Sparkles, Shield, Zap, MessageSquare,
  Brain, Check, ArrowRight, Star, Users, Cpu, ChevronUp, Heart
} from 'lucide-react';

const HomePage = () => {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const isRTL = i18n.language === 'ar';
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language, isRTL]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const features = [
    {
      icon: Cpu,
      gradient: 'from-blue-500 via-blue-600 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
      key: 'multipleModels'
    },
    {
      icon: Globe,
      gradient: 'from-emerald-500 via-teal-600 to-cyan-600',
      bgGradient: 'from-emerald-50 to-cyan-50 dark:from-emerald-950/30 dark:to-cyan-950/30',
      key: 'multiLanguage'
    },
    {
      icon: Zap,
      gradient: 'from-amber-500 via-orange-600 to-red-600',
      bgGradient: 'from-amber-50 to-red-50 dark:from-amber-950/30 dark:to-red-950/30',
      key: 'realTime'
    },
    {
      icon: Shield,
      gradient: 'from-purple-500 via-violet-600 to-fuchsia-600',
      bgGradient: 'from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30',
      key: 'secure'
    },
    {
      icon: Brain,
      gradient: 'from-pink-500 via-rose-600 to-red-600',
      bgGradient: 'from-pink-50 to-red-50 dark:from-pink-950/30 dark:to-red-950/30',
      key: 'aiInsights'
    },
    {
      icon: MessageSquare,
      gradient: 'from-indigo-500 via-blue-600 to-cyan-600',
      bgGradient: 'from-indigo-50 to-cyan-50 dark:from-indigo-950/30 dark:to-cyan-950/30',
      key: 'smartConversations'
    }
  ];

  const stats = [
    { icon: Users, value: '50K+', key: 'users' },
    { icon: MessageSquare, value: '5M+', key: 'messages' },
    { icon: Cpu, value: '7+', key: 'models' },
    { icon: Globe, value: '2+', key: 'languages' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const scaleIn = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <style>{`html { scroll-behavior: smooth; }`}</style>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50'
          : 'bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <Link to="/" className="flex items-center space-x-2 rtl:space-x-reverse group">
              <motion.div className="relative" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
              </motion.div>
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Law CodeX
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8 rtl:space-x-reverse">
              {['features', 'pricing', 'about'].map((item, idx) => (
                <motion.button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 + 0.3 }}
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative group"
                >
                  {t(`nav.${item}`)}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300" />
                </motion.button>
              ))}
            </div>

            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="relative group">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <Globe className="h-5 w-5" />
                </motion.button>
                <div className="absolute top-full mt-2 right-0 rtl:left-0 rtl:right-auto bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`block w-full text-left rtl:text-right px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${i18n.language === 'en' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                      }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => changeLanguage('ar')}
                    className={`block w-full text-left rtl:text-right px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${i18n.language === 'ar' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                      }`}
                  >
                    العربية
                  </button>
                </div>
              </div>

              <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse">
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/signup"
                    className="relative px-6 py-2.5 text-sm font-semibold text-white rounded-xl overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 group-hover:scale-105 transition-transform duration-300" />
                    <span className="relative flex items-center space-x-2 rtl:space-x-reverse">
                      <span>{t('nav.signup')}</span>
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </motion.div>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </motion.button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-4 py-4 space-y-3">
                {['features', 'pricing', 'about'].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item)}
                    className="block w-full text-left rtl:text-right px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    {t(`nav.${item}`)}
                  </button>
                ))}
                <Link
                  to="/login"
                  className="block w-full text-center px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/signup"
                  className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg transition-all"
                >
                  {t('nav.signup')}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], x: [0, -50, 0], y: [0, 50, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 dark:border-blue-500/30 mb-8"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('hero.subtitle')}
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              <span className="block text-slate-900 dark:text-white mb-2">{t('hero.title')}</span>
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('hero.subtitle')}
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed"
            >
              {t('hero.description')}
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/signup"
                  className="group relative px-8 py-4 rounded-xl font-semibold text-white overflow-hidden shadow-xl hover:shadow-2xl transition-shadow"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
                  <span className="relative flex items-center space-x-2 rtl:space-x-reverse">
                    <span>{t('hero.cta')}</span>
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <button
                  onClick={() => scrollToSection('features')}
                  className="px-8 py-4 rounded-xl font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 shadow-lg hover:shadow-xl transition-all"
                >
                  {t('hero.ctaSecondary')}
                </button>
              </motion.div>
            </motion.div>

            <motion.div
              variants={containerVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    variants={scaleIn}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="group p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Icon className="h-8 w-8 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
                    <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {t(`hero.stats.${stat.key}`)}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
              {t('features.title')}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = activeFeature === index;

              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -10 }}
                  onHoverStart={() => setActiveFeature(index)}
                  className={`group relative p-8 rounded-2xl bg-white dark:bg-slate-800 border-2 transition-all duration-500 cursor-pointer ${isActive
                    ? 'border-blue-500 dark:border-blue-500 shadow-2xl'
                    : 'border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-2xl'
                    }`}
                >
                  <motion.div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.bgGradient}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isActive ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                  />

                  <div className="relative">
                    <motion.div
                      className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6 shadow-lg`}
                      whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </motion.div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                      {t(`features.items.${feature.key}.title`)}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {t(`features.items.${feature.key}.description`)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 px-4 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
              {t('pricing.title')}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {t('pricing.subtitle')}
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {['free', 'pro', 'enterprise'].map((plan, index) => {
              const isPopular = plan === 'pro';

              return (
                <motion.div
                  key={plan}
                  variants={itemVariants}
                  whileHover={{ scale: isPopular ? 1.02 : 1.05, y: -10 }}
                  className={`relative p-8 rounded-2xl bg-white dark:bg-slate-800 transition-all duration-300 ${isPopular
                    ? 'border-2 border-blue-500 dark:border-blue-500 shadow-2xl md:scale-105'
                    : 'border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-2xl'
                    }`}
                >
                  {isPopular && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold shadow-lg"
                    >
                      {t('pricing.mostPopular')}
                    </motion.div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                      {t(`pricing.plans.${plan}.name`)}
                    </h3>
                    <div className="flex items-baseline justify-center mb-2">
                      {t(`pricing.plans.${plan}.price`) !== 'Custom' && t(`pricing.plans.${plan}.price`) !== 'مخصص' ? (
                        <>
                          <span className="text-5xl font-bold text-slate-900 dark:text-white">
                            ${t(`pricing.plans.${plan}.price`)}
                          </span>
                          <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-slate-600 dark:text-slate-400`}>
                            {t('pricing.perMonth')}
                          </span>
                        </>
                      ) : (
                        <span className="text-4xl font-bold text-slate-900 dark:text-white">
                          {t(`pricing.plans.${plan}.price`)}
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {t(`pricing.plans.${plan}.features`, { returnObjects: true }).map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/10 border border-green-500/30">
                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                        <span className={`${isRTL ? 'mr-3' : 'ml-3'} text-slate-700 dark:text-slate-300`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${isPopular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                  >
                    {t(`pricing.plans.${plan}.cta`)}
                  </motion.button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="about" className="py-20 md:py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-8"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ rotate: 360, scale: 1.1 }}
          >
            <Star className="h-8 w-8 text-white" />
          </motion.div>

          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {t('cta.title')}
          </motion.h2>

          <motion.p
            className="text-xl text-white/90 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {t('cta.description')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/signup"
              className="inline-flex items-center space-x-3 rtl:space-x-reverse px-8 py-4 rounded-xl font-semibold text-blue-600 bg-white hover:bg-slate-50 shadow-2xl hover:shadow-3xl transition-all"
            >
              <span>{t('cta.button')}</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <motion.div
                className="flex items-center mb-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <span className="ml-2 rtl:mr-2 text-xl font-bold text-slate-900 dark:text-white">
                  Law CodeX
                </span>
              </motion.div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                {t('footer.description')}
              </p>
              <div className="flex space-x-4 rtl:space-x-reverse">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-wider uppercase mb-4">
                {t('footer.product')}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/features" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {t('footer.features')}
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {t('footer.pricing')}
                  </Link>
                </li>
                <li>
                  <Link to="/api" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {t('footer.api')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-wider uppercase mb-4">
                {t('footer.support')}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/help" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {t('footer.help')}
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {t('footer.privacy')}
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {t('footer.terms')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              © {currentYear} Law CodeX. {t('footer.allRightsReserved')}.
              <span className="inline-flex items-center mx-1">
                {t('footer.madeWith')} <Heart className="h-4 w-4 mx-1 text-red-500" fill="currentColor" /> {t('footer.by')}
              </span>
            </p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 100 }}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 rtl:right-auto rtl:left-8 z-40 p-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl hover:shadow-blue-500/50 transition-shadow"
            aria-label="Scroll to top"
          >
            <ChevronUp className="w-6 h-6" strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;