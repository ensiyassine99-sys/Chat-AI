import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useEffect } from 'react';
import {
  fetchChatHistory,
  fetchChat,
  sendMessage,
  deleteChat,
  setCurrentChat,
  clearCurrentChat,
  setSelectedModel,
  addMessage,
  updateMessage,
  deleteMessage,
  setTyping,
} from '../store/chatSlice';
import socketService from '../services/socketService';

export const useChat = (chatId = null) => {
  const dispatch = useDispatch();
  const {
    currentChat,
    messages,
    chats,
    totalChats,
    isLoading,
    isSending,
    isTyping,
    error,
    selectedModel,
    availableModels,
  } = useSelector(state => state.chat);
  
  // Load chat if chatId is provided
  useEffect(() => {
    if (chatId) {
      dispatch(fetchChat(chatId));
      socketService.joinChat(chatId);
      
      return () => {
        socketService.leaveChat(chatId);
      };
    } else {
      dispatch(clearCurrentChat());
    }
  }, [chatId, dispatch]);
  
  // Socket event listeners
  useEffect(() => {
    const handleNewMessage = (message) => {
      dispatch(addMessage(message));
    };
    
    const handleMessageUpdated = (message) => {
      dispatch(updateMessage(message));
    };
    
    const handleMessageDeleted = (messageId) => {
      dispatch(deleteMessage(messageId));
    };
    
    const handleUserTyping = () => {
      dispatch(setTyping(true));
    };
    
    const handleUserStopTyping = () => {
      dispatch(setTyping(false));
    };
    
    socketService.on('new_message', handleNewMessage);
    socketService.on('message_updated', handleMessageUpdated);
    socketService.on('message_deleted', handleMessageDeleted);
    socketService.on('user_typing', handleUserTyping);
    socketService.on('user_stop_typing', handleUserStopTyping);
    
    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.off('message_updated', handleMessageUpdated);
      socketService.off('message_deleted', handleMessageDeleted);
      socketService.off('user_typing', handleUserTyping);
      socketService.off('user_stop_typing', handleUserStopTyping);
    };
  }, [dispatch]);
  
  const handleSendMessage = useCallback(async (message) => {
    const result = await dispatch(sendMessage({
      message,
      model: selectedModel,
      chatId: currentChat?.id,
    }));
    
    return sendMessage.fulfilled.match(result);
  }, [dispatch, selectedModel, currentChat]);
  
  const handleDeleteChat = useCallback(async (chatIdToDelete) => {
    const result = await dispatch(deleteChat(chatIdToDelete));
    return deleteChat.fulfilled.match(result);
  }, [dispatch]);
  
  const handleSelectModel = useCallback((model) => {
    dispatch(setSelectedModel(model));
  }, [dispatch]);
  
  const loadChatHistory = useCallback(async (params = {}) => {
    await dispatch(fetchChatHistory(params));
  }, [dispatch]);
  
  const startTyping = useCallback(() => {
    if (currentChat?.id) {
      socketService.sendTyping(currentChat.id);
    }
  }, [currentChat]);
  
  const stopTyping = useCallback(() => {
    if (currentChat?.id) {
      socketService.stopTyping(currentChat.id);
    }
  }, [currentChat]);
  
  return {
    currentChat,
    messages,
    chats,
    totalChats,
    isLoading,
    isSending,
    isTyping,
    error,
    selectedModel,
    availableModels,
    sendMessage: handleSendMessage,
    deleteChat: handleDeleteChat,
    selectModel: handleSelectModel,
    loadChatHistory,
    startTyping,
    stopTyping,
  };
};