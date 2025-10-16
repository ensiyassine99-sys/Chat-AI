import api from './api';

const authService = {
  // Inscription
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response;
  },

  // Connexion
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);


    if (response.token) {
      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
    }

    return response;
  }, verifyEmail: async (token) => {
    const data = await api.get(`/auth/verify-email/${token}`);
    // Sauvegarder les tokens SEULEMENT si success
    if (data.success && data.token) {
      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
    }

    return data;
    // L'erreur sera automatiquement lancée par l'interceptor
  },

  forgotPassword: async (email) => {
    const response = await api.post(`/auth/forgot-password`, { email });
    return response
  },


  checkEmail: async (email) => {
    const response = await api.post(`/auth/check-email`, { email });

    console.log('Response from checkEmail:', response); // Log de débogage  
    return response;
  },

  verifyResetToken: async (token) => {
    const data = await api.get(`/auth/verify-reset-token/${token}`);
    return data;
  },

  resetPassword: async (token, password) => {
    const data = await api.post(`/auth/reset-password/${token}`, { password });

    if (data.success && data.token) {
      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
    }

    return data;
  },
  // Déconnexion
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('persist:root'); // Si using redux-persist
    }
  },
  handleOAuthCallback: async (token, refreshToken) => {
    // Sauvegarder les tokens d'abord
    if (token && refreshToken) {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
    }

    // Récupérer les infos utilisateur
    const response = await api.get('/auth/me');
    return response;
  },


  // Vérifier l'authentification
  checkAuth: async () => {
    return await api.get('/auth/me');
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    return await api.post('/auth/refresh-token', { refreshToken });
  },



  // Changer le mot de passe
  changePassword: async (currentPassword, newPassword) => {
    return await api.post('/auth/change-password', { currentPassword, newPassword });
  },


};

export default authService;