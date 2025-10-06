import api from './api';

const chatService = {
  // Envoyer un message
  sendMessage: async ({ message, model, chatId }) => {

    console.log(" message, model, chatId", message, model, chatId)
    return await api.post('/chat/message', { message, model, chatId });
  },

  // Créer ou récupérer un chat
  createOrGetChat: async (chatId) => {
    return await api.post('/chat/chat', { chatId });
  },
 toggleArchiveChat: async (chatId) => {
    return await api.patch(`/chat/chat/${chatId}/archive`);
  },

  // Renommer un chat
  renameChat: async (chatId, title) => {
    return await api.patch(`/chat/chat/${chatId}/rename`, { title });
  },
  // Récupérer l'historique des chats
  getChatHistory: async (params = {}) => {
    return await api.get('/chat/history', { params });
  },

  // Récupérer un chat spécifique
  getChat: async (chatId) => {
    return await api.get(`/chat/chat/${chatId}`);
  },

  // Mettre à jour un chat
  updateChat: async (chatId, updates) => {
    return await api.patch(`/chat/chat/${chatId}`, updates);
  },

  // Supprimer un chat
  deleteChat: async (chatId) => {
    return await api.delete(`/chat/chat/${chatId}`);
  },

  // Régénérer une réponse
  regenerateResponse: async (messageId) => {
    return await api.post(`/chat/message/${messageId}/regenerate`);
  },

  // Exporter un chat
  exportChat: async (chatId, format = 'json') => {
    const response = await api.get(`/chat/chat/${chatId}/export`, {
      params: { format },
      responseType: 'blob',
    });

    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `chat-${chatId}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    return response;
  },

  // Obtenir les modèles disponibles
  getAvailableModels: async () => {
    return await api.get('/chat/models');
  },

  // Vérifier la santé des services AI
  checkAIHealth: async () => {
    return await api.get('/chat/health');
  },

  // Éditer un message
  editMessage: async (messageId, content) => {
    return await api.patch(`/chat/message/${messageId}`, { content });
  },

  // Supprimer un message
  deleteMessage: async (messageId) => {
    return await api.delete(`/chat/message/${messageId}`);
  },

  // Donner un feedback sur un message
  feedbackMessage: async (messageId, feedback) => {
    return await api.post(`/chat/message/${messageId}/feedback`, { feedback });
  },
  editMessage: async (messageId, content) => {
    return await api.patch(`/chat/message/${messageId}/edit`, { content });
},
};

export default chatService;