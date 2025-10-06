import api from './api';

const userService = {
  // Récupérer le profil
  getProfile: async () => {
    return await api.get('/user/profile');
  },
  
  // Mettre à jour le profil
  updateProfile: async (updates) => {
    return await api.patch('/user/profile', updates);
  },
  
  // Uploader un avatar
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return await api.post('/user/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Supprimer l'avatar
  deleteAvatar: async () => {
    return await api.delete('/user/profile/avatar');
  },
  
  // Mettre à jour les préférences
  updatePreferences: async (preferences) => {
    return await api.patch('/user/preferences', preferences);
  },
  
  // Récupérer le résumé utilisateur
  getUserSummary: async () => {
    return await api.get('/user/summary');
  },
  
  // Générer un nouveau résumé
  generateUserSummary: async () => {
    return await api.post('/user/summary/generate');
  },
  
  // Récupérer les statistiques
  getUserStatistics: async () => {
    return await api.get('/user/statistics');
  },
  
  // Supprimer le compte
  deleteAccount: async (password) => {
    return await api.delete('/user/account', { data: { password } });
  },
  
  // Exporter les données utilisateur
  exportUserData: async (format = 'json') => {
    const response = await api.post('/user/export-data', { format }, {
      responseType: 'blob',
    });
    
    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `user-data.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return response;
  },
};

export default userService;