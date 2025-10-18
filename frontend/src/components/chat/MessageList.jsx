import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  UserCircleIcon,
  SparklesIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  PencilIcon,
  ArrowPathIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

// Composant pour l'effet de typing mot par mot
const TypingText = ({ text, onComplete, onStart }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Notify parent that typing started
    if (currentIndex === 0 && onStart) {
      onStart();
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 20);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete, onStart]);

  return <span>{displayedText}</span>;
};

// Composant Message individuel
const Message = ({
  message,
  index,
  onCopy,
  onDelete,
  onEdit,
  onRegenerate,
  onFeedback,
  isEditing,
  setIsEditing,
  currentUserId,
  isLast,
  onTypingChange
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [copiedId, setCopiedId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [isTyping, setIsTyping] = useState(message.isNew && message.role !== 'user');

  const isUser = message.role === 'user';
  const isCurrentUser = message.userId === currentUserId || isUser;
  const isEditingThis = isEditing === message.id;

  const handleCopy = () => {
    onCopy(message.content);
    setCopiedId(message.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEditing = () => {
    setIsEditing(message.id);
    setEditingContent(message.content);
  };

  const saveEdit = () => {
    onEdit(message.id, editingContent);
    setIsEditing(null);
    setEditingContent('');
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setEditingContent('');
  };

  // NOUVEAU: Gérer le typing start
  const handleTypingStart = () => {
    if (onTypingChange) {
      onTypingChange(true);
    }
  };

  // NOUVEAU: Gérer le typing complete
  const handleTypingComplete = () => {
    setIsTyping(false);
    if (onTypingChange) {
      onTypingChange(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.03 }}
      className={`flex ${isUser ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')} mb-4 sm:mb-6`}
    >
      <div className={`flex max-w-[90%] sm:max-w-3xl gap-2 sm:gap-4 ${isUser ? (isRTL ? 'flex-row' : 'flex-row-reverse') : (isRTL ? 'flex-row-reverse' : 'flex-row')}`}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg ${isUser
            ? 'bg-gradient-to-br from-purple-500 to-pink-500'
            : 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500'
            }`}>
            {isUser ? (
              <UserCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            ) : (
              <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex-1 min-w-0 ${isUser ? (isRTL ? 'items-start' : 'items-end') : (isRTL ? 'items-end' : 'items-start')} flex flex-col`}>
          <div
            className={`px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg ${isUser
              ? `bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-tr-sm `
              : `bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-tl-sm `
              }`}
          >
            {isEditingThis ? (
              <div className="space-y-2 sm:space-y-3">
                <textarea
                  value={editingContent}
                  onChange={(e) => {
                    setEditingContent(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  className={`
                    w-full p-2 sm:p-3 break-words rounded-lg sm:rounded-xl resize-none overflow-hidden
                    border border-slate-300 dark:border-slate-600 
                    focus:outline-none focus:border-blue-500 
                    dark:bg-slate-700 text-slate-900 dark:text-white 
                    focus:ring-2 focus:ring-blue-500 min-w-[60vw] sm:min-w-[40vw]
                    text-sm sm:text-base
                    ${isRTL ? 'text-right' : 'text-left'}
                  `}
                  style={{
                    minHeight: '80px',
                    height: 'auto'
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  autoFocus
                />
                <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={saveEdit}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 dark:bg-slate-700 text-white rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-700 transition-all shadow-lg flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                  >
                    <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>{t('common.save')}</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={cancelEdit}
                    className="dark:bg-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 text-slate-700 dark:text-slate-300 rounded-lg sm:rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm sm:text-base"
                  >
                    {t('common.cancel')}
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className={`prose max-w-none ${isUser ? 'prose-invert' : 'prose-slate dark:prose-invert'}`}>
                {isUser ? (
                  <p className={` break-all whitespace-pre-wrap m-0 text-xs sm:text-sm leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
                    {message.content}
                  </p>
                ) : (
                  <>
                    {isTyping ? (
                      <div className={`text-xs sm:text-sm leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
                        <TypingText
                          text={message.content}
                          onStart={handleTypingStart}
                          onComplete={handleTypingComplete}
                        />
                      </div>
                    ) : (
                      <ReactMarkdown
                        className={`break-all text-xs sm:text-sm ${isRTL ? 'text-right' : 'text-left'}`}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-lg sm:rounded-xl my-2 sm:my-4 shadow-lg text-xs sm:text-sm"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code
                                className="px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-mono"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                          p({ children }) {
                            return <p className="mb-2 sm:mb-3 last:mb-0 leading-relaxed">{children}</p>;
                          },
                          ul({ children }) {
                            return <ul className="list-disc pl-4 sm:pl-5 mb-2 sm:mb-3 space-y-1">{children}</ul>;
                          },
                          ol({ children }) {
                            return <ol className="list-decimal pl-4 sm:pl-5 mb-2 sm:mb-3 space-y-1">{children}</ol>;
                          },
                          h1({ children }) {
                            return <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 mt-3 sm:mt-4">{children}</h1>;
                          },
                          h2({ children }) {
                            return <h2 className="text-lg sm:text-xl font-bold mb-2 mt-2 sm:mt-3">{children}</h2>;
                          },
                          h3({ children }) {
                            return <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2 mt-1.5 sm:mt-2">{children}</h3>;
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </>
                )}
              </div>
            )}

            {message.isEdited && (
              <p className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 opacity-60 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('chat.edited')}
              </p>
            )}
          </div>

          {/* Actions */}
          {!isEditingThis && (
            <div className={`flex items-center gap-1 sm:gap-2 mt-1.5 sm:mt-2 px-1 sm:px-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Copy */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCopy}
                className="p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={t('chat.copy')}
              >
                {copiedId === message.id ? (
                  <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                ) : (
                  <ClipboardDocumentIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 dark:text-slate-400" />
                )}
              </motion.button>

              {/* Edit (user messages only) */}
              {isUser && isCurrentUser && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={startEditing}
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title={t('chat.edit')}
                >
                  <PencilIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 dark:text-slate-400" />
                </motion.button>
              )}

              {/* Regenerate (AI messages only, last message) */}
              {!isUser && isLast && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onRegenerate(message.id)}
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title={t('chat.regenerate')}
                >
                  <ArrowPathIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 dark:text-slate-400" />
                </motion.button>
              )}

              {/* Like/Dislike (AI messages only) */}
              {!isUser && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onFeedback?.(message.id, 'like')}
                    className={`p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${message.feedback === 'like' ? 'text-green-500' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    title={t('chat.helpful')}
                  >
                    <HandThumbUpIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onFeedback?.(message.id, 'dislike')}
                    className={`p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${message.feedback === 'dislike' ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    title={t('chat.notHelpful')}
                  >
                    <HandThumbDownIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </motion.button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Composant MessageList principal
const MessageList = ({
  messages,
  onCopy,
  onDelete,
  onEdit,
  onRegenerate,
  onFeedback,
  isEditing,
  setIsEditing,
  currentUserId,
  onTypingChange
}) => {
  return (
    <AnimatePresence>
      {messages.map((message, index) => (
        <Message
          key={message.id}
          message={message}
          index={index}
          onCopy={onCopy}
          onDelete={onDelete}
          onEdit={onEdit}
          onRegenerate={onRegenerate}
          onFeedback={onFeedback}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          currentUserId={currentUserId}
          isLast={index === messages.length - 1}
          onTypingChange={onTypingChange}
        />
      ))}
    </AnimatePresence>
  );
};

export default MessageList;