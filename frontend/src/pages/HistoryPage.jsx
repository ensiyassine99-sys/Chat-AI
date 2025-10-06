import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ar, enUS, fr } from 'date-fns/locale';
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ChevronRightIcon,
  ArchiveBoxIcon,
  TagIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  XMarkIcon,
  PlusIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useChat } from '../hooks/useChat';
import chatService from '../services/chatService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const HistoryPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { chats, loadChatHistory, deleteChat, isLoading } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterArchived, setFilterArchived] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [selectedChats, setSelectedChats] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);

  const isRTL = i18n.language === 'ar';

  // Get the appropriate locale for date-fns
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ar':
        return ar;
      case 'fr':
        return fr;
      default:
        return enUS;
    }
  };

  useEffect(() => {
    loadChatHistory({ archived: filterArchived });
  }, [filterArchived, loadChatHistory]);

  // Filter and sort chats
  const filteredChats = chats
    .filter(chat => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        chat.title?.toLowerCase().includes(query) ||
        chat.summary?.toLowerCase().includes(query) ||
        chat.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'messages':
          return b.messageCount - a.messageCount;
        case 'recent':
        default:
          return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      }
    });

  const handleChatClick = (chatId) => {
    navigate(`/chat/${chatId}`);
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (window.confirm(t('history.confirmDelete'))) {
      try {
        await deleteChat(chatId);
        toast.success(t('history.chatDeleted'));
      } catch (error) {
        toast.error(t('errors.deleteFailed'));
      }
    }
  };

  const handleArchiveChat = async (e, chatId) => {
    e.stopPropagation();
    try {
      await chatService.toggleArchiveChat(chatId);
      await loadChatHistory({ archived: filterArchived });
      toast.success(t('history.archiveToggled'));
    } catch (error) {
      toast.error(t('errors.archiveFailed'));
    }
  };

  const openRenameModal = (chat) => {
    setSelectedChat(chat);
    setNewTitle(chat.title);
    setRenameModalOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!newTitle.trim()) {
      toast.error(t('errors.titleEmpty'));
      return;
    }

    try {
      await chatService.renameChat(selectedChat.id, newTitle);
      await loadChatHistory({ archived: filterArchived });
      setRenameModalOpen(false);
      toast.success(t('history.renamed'));
    } catch (error) {
      toast.error(t('errors.renameFailed'));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedChats.length === 0) return;

    if (window.confirm(t('history.confirmBulkDelete', { count: selectedChats.length }))) {
      try {
        await Promise.all(selectedChats.map(id => deleteChat(id)));
        setSelectedChats([]);
        toast.success(t('history.bulkDeleteSuccess'));
      } catch (error) {
        toast.error(t('errors.bulkDeleteFailed'));
      }
    }
  };

  const toggleChatSelection = (chatId) => {
    setSelectedChats(prev =>
      prev.includes(chatId)
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedChats.length === filteredChats.length) {
      setSelectedChats([]);
    } else {
      setSelectedChats(filteredChats.map(chat => chat.id));
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Fixed Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('history.title')}
              </h1>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                {t('history.description')}
              </p>
            </div>

            <Link
              to="/chat"
              className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl ${
                isRTL ? 'flex-row-reverse' : ''
              }`}
            >
              <PlusIcon className="h-5 w-5" />
              <span>{t('chat.newChat')}</span>
            </Link>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white/80 dark:bg-slate-900/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Search Bar */}
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('history.search')}
                className={`w-full ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white transition-all shadow-sm`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <MagnifyingGlassIcon className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-3.5 h-5 w-5 text-slate-400`} />
            </div>

            {/* Filter Bar */}
            <div className={`flex items-center justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {!selectionMode ? (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {filteredChats.length} {t('history.conversations')}
                    </span>

                    <button
                      onClick={() => setSelectionMode(true)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      {t('history.select')}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <label className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedChats.length === filteredChats.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                      />
                      <span className="text-slate-900 dark:text-white font-medium">
                        {selectedChats.length} {t('history.selected')}
                      </span>
                    </label>

                    <label className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <input
                        type="checkbox"
                        checked={filterArchived}
                        onChange={(e) => setFilterArchived(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                      />
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        {t('history.showArchived')}
                      </span>
                    </label>

                    <motion.button
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => {
                        selectedChats.forEach(id => {
                          const e = { stopPropagation: () => {} };
                          handleArchiveChat(e, id);
                        });
                      }}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title={t('common.archive')}
                    >
                      <ArchiveBoxIcon className="h-5 w-5" />
                    </motion.button>

                    <motion.button
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2, delay: 0.05 }}
                      onClick={handleBulkDelete}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title={t('common.delete')}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </motion.button>
                  </motion.div>
                )}
              </div>

              {selectionMode && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => {
                    setSelectionMode(false);
                    setSelectedChats([]);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title={t('common.cancel')}
                >
                  <XMarkIcon className="h-5 w-5" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scrollable Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : filteredChats.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
                <div className="relative h-20 w-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl">
                  <ChatBubbleLeftRightIcon className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {t('history.noHistory')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {searchQuery ? t('history.noResultsForSearch') : t('history.startChatting')}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredChats.map((chat, index) => (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleChatClick(chat.id)}
                  className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="p-5">
                    <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {/* Checkbox - Bordure gauche en LTR */}
                      {selectionMode && !isRTL && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex-shrink-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedChats.includes(chat.id)}
                            onChange={() => toggleChatSelection(chat.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 w-5 h-5 rounded text-blue-600 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                          />
                        </motion.div>
                      )}

                      {/* Actions Menu - Gauche en RTL */}
                      {isRTL && (
                        <Menu as="div" className="relative flex-shrink-0">
                          <Menu.Button
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <EllipsisVerticalIcon className="h-5 w-5" />
                          </Menu.Button>

                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-left rounded-xl bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700 focus:outline-none z-20 border border-slate-200 dark:border-slate-700">
                              <div className="py-2">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!selectionMode) setSelectionMode(true);
                                        toggleChatSelection(chat.id);
                                      }}
                                      className={`${active ? 'bg-slate-100 dark:bg-slate-700 rounded-lg' : ''} flex items-center flex-row-reverse justify-end text-right w-full px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-300`}
                                    >
                                      <XMarkIcon className="h-5 w-5 ml-3" />
                                      <span className="text-right w-full">{t('history.select')}</span>
                                    </button>
                                  )}
                                </Menu.Item>

                                <div className="border-t dark:border-slate-700 my-1" />

                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openRenameModal(chat);
                                      }}
                                      className={`${active ? 'bg-slate-100 dark:bg-slate-700 rounded-lg' : ''} flex items-center flex-row-reverse justify-end text-right w-full px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-300`}
                                    >
                                      <PencilIcon className="h-5 w-5 ml-3" />
                                      <span className="text-right w-full">{t('history.rename')}</span>
                                    </button>
                                  )}
                                </Menu.Item>

                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={(e) => handleArchiveChat(e, chat.id)}
                                      className={`${active ? 'bg-slate-100 dark:bg-slate-700 rounded-lg' : ''} flex items-center flex-row-reverse justify-end text-right w-full px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-300`}
                                    >
                                      <ArchiveBoxIcon className="h-5 w-5 ml-3" />
                                      <span className="text-right w-full">
                                        {chat.isArchived ? t('history.unarchive') : t('history.archive')}
                                      </span>
                                    </button>
                                  )}
                                </Menu.Item>

                                <div className="border-t dark:border-slate-700 my-1" />

                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={(e) => handleDeleteChat(e, chat.id)}
                                      className={`${active ? 'bg-red-50 dark:bg-red-900/20 rounded-lg' : ''} flex items-center flex-row-reverse justify-end text-right w-full px-5 py-3 text-sm font-medium text-red-600 dark:text-red-400`}
                                    >
                                      <TrashIcon className="h-5 w-5 ml-3" />
                                      <span className="text-right w-full">{t('common.delete')}</span>
                                    </button>
                                  )}
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      )}

                      {/* Chat Details */}
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center gap-2 mb-1.5 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                          <h3 className={`text-base font-semibold text-slate-900 dark:text-white truncate ${isRTL ? 'text-right' : ''}`}>
                            {chat.title}
                          </h3>
                          {chat.isPinned && (
                            <span className="px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full">
                              {t('common.pinned')}
                            </span>
                          )}
                          {chat.isArchived && (
                            <ArchiveBoxIcon className="h-4 w-4 text-slate-400" />
                          )}
                        </div>

                        {chat.summary && (
                          <p className={`text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2 ${isRTL ? 'text-right' : ''}`}>
                            {chat.summary}
                          </p>
                        )}

                        <div className={`flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                          <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <ClockIcon className="h-4 w-4" />
                            {format(new Date(chat.lastMessageAt), 'PPp', { locale: getDateLocale() })}
                          </span>
                          <span className="font-medium">
                            {chat.messageCount} {t('history.messages')}
                          </span>
                          {chat.model && (
                            <span className="px-2.5 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 rounded-lg font-semibold border border-blue-500/20">
                              {chat.model}
                            </span>
                          )}
                        </div>

                        {chat.tags && chat.tags.length > 0 && (
                          <div className={`mt-2 flex flex-wrap gap-1.5 ${isRTL ? 'justify-end' : ''}`}>
                            {chat.tags.map((tag) => (
                              <span
                                key={tag}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 ${
                                  isRTL ? 'flex-row-reverse' : ''
                                }`}
                              >
                                <TagIcon className="h-3 w-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Checkbox - Bordure droite en RTL */}
                      {selectionMode && isRTL && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex-shrink-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedChats.includes(chat.id)}
                            onChange={() => toggleChatSelection(chat.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 w-5 h-5 rounded text-blue-600 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                          />
                        </motion.div>
                      )}

                      {/* Actions Menu - Droite en LTR */}
                      {!isRTL && (
                        <Menu as="div" className="relative flex-shrink-0">
                          <Menu.Button
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <EllipsisVerticalIcon className="h-5 w-5" />
                          </Menu.Button>

                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700 focus:outline-none z-20 border border-slate-200 dark:border-slate-700">
                              <div className="py-2">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!selectionMode) setSelectionMode(true);
                                        toggleChatSelection(chat.id);
                                      }}
                                      className={`${active ? 'bg-slate-100 dark:bg-slate-700 rounded-lg' : ''} flex items-center w-full px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-300`}
                                    >
                                      <XMarkIcon className="h-5 w-5 mr-3" />
                                      <span>{t('history.select')}</span>
                                    </button>
                                  )}
                                </Menu.Item>

                                <div className="border-t dark:border-slate-700 my-1" />

                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openRenameModal(chat);
                                      }}
                                      className={`${active ? 'bg-slate-100 dark:bg-slate-700 rounded-lg' : ''} flex items-center w-full px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-300`}
                                    >
                                      <PencilIcon className="h-5 w-5 mr-3" />
                                      <span>{t('history.rename')}</span>
                                    </button>
                                  )}
                                </Menu.Item>

                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={(e) => handleArchiveChat(e, chat.id)}
                                      className={`${active ? 'bg-slate-100 dark:bg-slate-700 rounded-lg' : ''} flex items-center w-full px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-300`}
                                    >
                                      <ArchiveBoxIcon className="h-5 w-5 mr-3" />
                                      <span>
                                        {chat.isArchived ? t('history.unarchive') : t('history.archive')}
                                        {chat.isArchived ? t('history.unarchive') : t('history.archive')}
                                      </span>
                                    </button>
                                  )}
                                </Menu.Item>

                                <div className="border-t dark:border-slate-700 my-1" />

                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={(e) => handleDeleteChat(e, chat.id)}
                                      className={`${active ? 'bg-red-50 dark:bg-red-900/20 rounded-lg' : ''} flex items-center w-full px-5 py-3 text-sm font-medium text-red-600 dark:text-red-400`}
                                    >
                                      <TrashIcon className="h-5 w-5 mr-3" />
                                      <span>{t('common.delete')}</span>
                                    </button>
                                  )}
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rename Modal */}
      <AnimatePresence>
        {renameModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setRenameModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700"
            >
              <h3 className={`text-xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${isRTL ? 'text-right' : ''}`}>
                {t('chat.renameConversation')}
              </h3>

              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRenameSubmit()}
                className={`w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white mb-4 ${isRTL ? 'text-right' : ''}`}
                placeholder={t('chat.newTitle')}
                autoFocus
                dir={isRTL ? 'rtl' : 'ltr'}
              />

              <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : 'justify-end'}`}>
                <button
                  onClick={() => setRenameModalOpen(false)}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleRenameSubmit}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-medium transition-all shadow-lg"
                >
                  {t('common.save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HistoryPage;