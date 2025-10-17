// src/components/chat/ChatInterface.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    PaperAirplaneIcon,
    TrashIcon,
    PencilIcon,
    SparklesIcon,
    ChatBubbleLeftRightIcon,
    ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useSocket } from '../../hooks/useSocket';
import { useMutation } from '@tanstack/react-query';
import MessageList from './MessageList';
import ModelSelector from './ModelSelector';
import TypingIndicator from '../common/TypingIndicator';
import chatService from '../../services/chatService';
import LoadingSpinner from '../common/LoadingSpinner';

import {
    setCurrentChat,
    updateMessage,
    deleteMessage,
} from '../../store/chatSlice';

const ChatInterface = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { chatId } = useParams();
    const socket = useSocket();
    const isRTL = i18n.language === 'ar';

    // State
    const [input, setInput] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
    const [isEditing, setIsEditing] = useState(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [localMessages, setLocalMessages] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(chatId || null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);

    // Refs
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Redux state
    const { currentChat } = useSelector(state => state.chat);
    const { user } = useSelector(state => state.auth);

    // Initialize or get chat when component mounts or chatId changes
    useEffect(() => {
        const initializeChat = async () => {
            if (chatId) {
                try {
                    const response = await chatService.getChat(chatId);
                    dispatch(setCurrentChat(response.chat));
                    setLocalMessages(response.chat.messages || []);
                    setCurrentChatId(chatId);
                } catch (error) {
                    console.error('Error loading chat:', error);
                    toast.error(t('errors.loadingFailed'));
                }
            } else {
                dispatch(setCurrentChat(null));
                setLocalMessages([]);
                setCurrentChatId(null);
            }
        };

        initializeChat();
    }, [chatId, dispatch, t]);

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest'
            });
        }
    }, []);

    useEffect(() => {
        if (localMessages.length > 0 && shouldAutoScroll) {
            requestAnimationFrame(() => {
                scrollToBottom();
            });
        }
    }, [localMessages, shouldAutoScroll, scrollToBottom]);

    // Handle scroll
    const handleScroll = useCallback(() => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);

            if (!isNearBottom) {
                setShouldAutoScroll(false);
            } else {
                setShouldAutoScroll(true);
            }
        }
    }, []);

    // Handle input change
    const handleInputChange = (e) => {
        setInput(e.target.value);
        const textarea = e.target;
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 200);
        textarea.style.height = newHeight + 'px';
        textarea.style.overflowY = textarea.scrollHeight > 200 ? 'auto' : 'hidden';
    };

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            handleSend();
        }
    };

    // Send message
    const handleSend = async () => {
        if (!input.trim()) return;

        const messageContent = input.trim();
        setInput('');

        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.overflowY = 'hidden';
        }

        setShouldAutoScroll(true);
        const payload = {
            message: messageContent,
            model: selectedModel,
        };

        if (currentChatId) {
            payload.chatId = currentChatId;
        }

        try {
            await sendMessageMutation.mutateAsync(payload);
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: async ({ message, model, chatId }) => {
            return await chatService.sendMessage({ message, model, chatId });
        },
        onSuccess: (data) => {
            const messagesWithNew = [
                data.userMessage,
                { ...data.message, isNew: true }
            ];
            setLocalMessages(prev => [...prev, ...messagesWithNew]);

            if (!currentChatId && data.chatId) {
                setCurrentChatId(data.chatId);
                navigate(`/chat/${data.chatId}`, { replace: true });

                dispatch(setCurrentChat({
                    id: data.chatId,
                    title: 'New Chat',
                    messages: messagesWithNew
                }));
            }
        },
        onError: (error) => {
            toast.error(error.message || t('errors.messageSendFailed'));
        },
    });

    // Regenerate response mutation
    const regenerateMutation = useMutation({
        mutationFn: async (messageId) => {
            return await chatService.regenerateResponse(messageId);
        },
        onSuccess: (data) => {
            const updatedMessage = { ...data.message, isNew: true };
            setLocalMessages(prev =>
                prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
            );
            dispatch(updateMessage(updatedMessage));
        },
        onError: (error) => {
            toast.error(error.message || t('errors.regenerateFailed'));
        },
    });

    // Feedback mutation
    const feedbackMutation = useMutation({
        mutationFn: async ({ messageId, feedback }) => {
            return await chatService.feedbackMessage(messageId, feedback);
        },
        onSuccess: (data, variables) => {
            const { messageId, feedback } = variables;
            setLocalMessages(prev =>
                prev.map(msg =>
                    msg.id === messageId ? { ...msg, feedback } : msg
                )
            );
        },
        onError: (error) => {
            toast.error(error.message || t('errors.feedbackFailed'));
        },
    });

    // Handle feedback
    const handleFeedback = async (messageId, feedback) => {
        try {
            await feedbackMutation.mutateAsync({ messageId, feedback });
        } catch (error) {
            console.error('Error sending feedback:', error);
        }
    };

    // Copy message to clipboard
    const handleCopy = (content) => {
        navigator.clipboard.writeText(content);
    };

    // Delete message
    const handleDelete = async (messageId) => {
        setLocalMessages(prev => prev.filter(msg => msg.id !== messageId));
        dispatch(deleteMessage(messageId));
    };

    // Edit message
    const handleEdit = async (messageId, newContent) => {
        try {
            const messageIndex = localMessages.findIndex(msg => msg.id === messageId);
            if (messageIndex === -1) return;

            setIsEditing(null);

            setLocalMessages(prev => {
                const updated = [...prev];
                updated[messageIndex] = {
                    ...updated[messageIndex],
                    content: newContent,
                    isEdited: true,
                };
                return updated.slice(0, messageIndex + 1);
            });

            const response = await chatService.editMessage(messageId, newContent);
            setLocalMessages(prev => [...prev, { ...response.newMessage, isNew: true }]);

        } catch (error) {
            console.error('Error editing message:', error);
            toast.error(t('errors.editFailed'));

            const chatData = await chatService.getChat(currentChatId);
            setLocalMessages(chatData.chat.messages);
        }
    };

    // Rename chat
    const handleRenameChat = async () => {
        if (!newTitle.trim() || !currentChatId) {
            toast.error(t('errors.titleEmpty'));
            return;
        }

        try {
            await chatService.updateChat(currentChatId, { title: newTitle });
            dispatch(setCurrentChat({ ...currentChat, title: newTitle }));
            setRenameModalOpen(false);
        } catch (error) {
            toast.error(t('errors.renameFailed'));
        }
    };

    // Delete chat
    const handleDeleteChat = async () => {
        if (!currentChatId) return;

        if (window.confirm(t('history.confirmDelete'))) {
            try {
                await chatService.deleteChat(currentChatId);
                navigate('/chat');
            } catch (error) {
                toast.error(t('errors.deleteFailed'));
            }
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex-shrink-0 flex items-center justify-center px-3 sm:px-6 py-3 sm:py-4"
            >
                <div className="flex items-center gap-3">
                    {currentChatId && (
                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                onClick={() => setMenuOpen(!menuOpen)}
                                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                                <h1 className="text-base sm:text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate max-w-[150px] sm:max-w-none">
                                    {currentChat?.title || t('chat.newConversation')}
                                </h1>
                                <ChevronDownIcon className={`h-4 w-4 sm:h-5 sm:w-5 text-slate-400 transition-transform flex-shrink-0 ${menuOpen ? 'rotate-180' : ''}`} />
                            </motion.button>

                            <AnimatePresence>
                                {menuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className={`absolute top-full mt-2 ${isRTL ? 'right-0' : 'left-0'} w-48 sm:w-56 bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50`}
                                    >
                                        <button
                                            onClick={() => {
                                                setNewTitle(currentChat?.title || '');
                                                setRenameModalOpen(true);
                                                setMenuOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                                        >
                                            <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
                                            <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">{t('chat.renameConversation')}</span>
                                        </button>
                                        <button
                                            onClick={handleDeleteChat}
                                            className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-t border-slate-200 dark:border-slate-700 ${isRTL ? 'flex-row-reverse' : ''}`}
                                        >
                                            <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                                            <span className="text-xs sm:text-sm text-red-600 dark:text-red-400">{t('common.delete')}</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {!currentChatId && (
                        <h1 className="text-base sm:text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {t('chat.newConversation')}
                        </h1>
                    )}
                </div>
            </motion.div>

            {/* Messages Container */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className={`flex-1 overflow-y-auto px-3 sm:px-6 ${localMessages.length === 0 ? 'py-0 flex items-center justify-center' : 'py-4 sm:py-6'}`}
            >
                <AnimatePresence mode="wait">
                    {localMessages.length === 0 ? (

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center mb-8 px-4"
                        >
                            <div className="relative mb-6 sm:mb-8">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
                                <div className="relative h-16 w-16 sm:h-24 sm:w-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl">
                                    <ChatBubbleLeftRightIcon className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
                                </div>
                            </div>
                            <h2 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 sm:mb-3 text-center">
                                {t('chat.startConversation')} {user?.username}
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 text-center text-sm sm:text-base px-4">
                                {t('chat.selectModelHint')}
                            </p>
                        </motion.div>

                    ) : (
                        <div className="max-w-4xl mx-auto">
                            <MessageList
                                messages={localMessages}
                                onCopy={handleCopy}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                                onRegenerate={regenerateMutation.mutate}
                                onFeedback={handleFeedback}
                                isEditing={isEditing}
                                setIsEditing={setIsEditing}
                                currentUserId={user?.id || 1}
                            />

                            {sendMessageMutation.isPending && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`flex ${isRTL ? 'justify-end' : 'justify-start'} mb-6`}
                                >
                                    <div className={`flex max-w-3xl gap-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {/* Avatar AI */}
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                                                <SparklesIcon className="h-5 w-5 text-white" />
                                            </div>
                                        </div>

                                        {/* Typing Indicator */}
                                        <TypingIndicator />
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Scroll to bottom button */}
            <AnimatePresence>
                {showScrollButton && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => {
                            setShouldAutoScroll(true);
                            scrollToBottom();
                        }}
                        className={`fixed bottom-28 sm:bottom-36 ${isRTL ? 'left-4 sm:left-8' : 'right-4 sm:right-8'} p-2.5 sm:p-3 bg-white dark:bg-slate-800 rounded-full shadow-xl hover:shadow-2xl transition-all border border-slate-200 dark:border-slate-700 z-50`}
                    >
                        <ChevronDownIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-300" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Input Area - TOUJOURS EN BAS */}
            <div className="flex-shrink-0 px-3 sm:px-6 py-3 sm:py-5 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 z-30">
                {/* Empty State Content - Au-dessus de l'input */}


                <div className="max-w-4xl mx-auto">
                    <motion.div
                        layout
                        className="relative bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl hover:shadow-3xl transition-all"
                    >
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder={t('chat.placeholder')}
                            disabled={sendMessageMutation.isPending}
                            className={`border-none outline-none focus:outline-none focus:ring-0 focus:border-none w-full px-4 sm:px-6 py-3 sm:py-4 bg-transparent resize-none text-slate-900 dark:text-white focus:outline-none rounded-2xl sm:rounded-3xl text-sm sm:text-base ${isRTL ? 'text-right' : 'text-left'} ${sendMessageMutation.isPending ? 'cursor-not-allowed opacity-60' : ''}`}
                            rows={1}
                            style={{
                                minHeight: '3rem',
                                maxHeight: '200px',
                                overflow: 'hidden',
                            }}
                        />

                        <div className="flex justify-end p-2 sm:p-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                                {/* Sélecteur du modèle */}
                                <div className="relative">
                                    <ModelSelector
                                        value={selectedModel}
                                        onChange={setSelectedModel}
                                        disabled={sendMessageMutation.isPending}
                                        className={`${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}
                                    />
                                </div>

                                {/* Bouton envoyer */}
                                <motion.button
                                    whileHover={{ scale: sendMessageMutation.isPending ? 1 : 1.05 }}
                                    whileTap={{ scale: sendMessageMutation.isPending ? 1 : 0.95 }}
                                    onClick={handleSend}
                                    disabled={sendMessageMutation.isPending || !input.trim()}
                                    className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all ${sendMessageMutation.isPending
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg cursor-wait'
                                        : input.trim()
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg cursor-pointer'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {sendMessageMutation.isPending ? (
                                        <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5">
                                            <LoadingSpinner size="small" color="white" />
                                        </div>
                                    ) : (
                                        <PaperAirplaneIcon
                                            className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 ${i18n.language === 'ar' ? 'rotate-180' : ''}`}
                                        />
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>

                    {localMessages.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 mt-1.5 sm:mt-2"
                        >
                            <span className="flex items-center gap-1.5 sm:gap-2">
                                <SparklesIcon className="h-3 w-3" />
                                <span className="text-xs hidden sm:inline">{t('chat.poweredBy', { model: selectedModel })}</span>
                                <span className="text-xs sm:hidden">{selectedModel}</span>
                            </span>
                        </motion.div>
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
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
                        onClick={() => setRenameModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700"
                        >
                            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {t('chat.renameConversation')}
                            </h3>

                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleRenameChat();
                                    }
                                }}
                                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base ${isRTL ? 'text-right' : 'text-left'}`}
                                placeholder={t('chat.newTitle')}
                                autoFocus
                            />

                            <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-end gap-2 sm:gap-3`}>
                                <button
                                    onClick={() => setRenameModalOpen(false)}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg sm:rounded-xl transition-colors text-sm sm:text-base"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={handleRenameChat}
                                    className="px-4 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-sm sm:text-base"
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

export default ChatInterface;