import axios from 'axios';
import toast from 'react-hot-toast';
import i18n from '../config/i18n';
import store from '../store/store';
import { logout, refreshAccessToken } from '../store/authSlice';

// Créer une instance Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ajouter la langue actuelle
    config.headers['Accept-Language'] = i18n.language;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor pour gérer les erreurs et le refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Gestion du refresh token
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login') && !originalRequest.url.includes('/auth/signup') ) {
      if (originalRequest.url.includes('/auth/refresh-token')) {
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      try {
        const response = await api.post('/auth/refresh-token', { refreshToken });
        const { accessToken } = response;
        
        localStorage.setItem('accessToken', accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        processQueue(null, accessToken);
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Gestion des autres erreurs
    if (error.response) {
      const { status, data } = error.response;
      
      
      switch (status) {
        case 400:
          toast.error(data.message || i18n.t('errors.validation'));
          break;
        case 403:
          toast.error(data.message || i18n.t('errors.unauthorized'));
          break;
        // case 404:
        //   toast.error(data.message || i18n.t('errors.notFound'));
        //   break;
        case 429:
          toast.error(data.message || i18n.t('errors.rateLimit'));
          break;
        case 500:
          toast.error(data.message || i18n.t('errors.server'));
          break;
        default:
          // toast.error(data.message || i18n.t('errors.network'));
      }
    } else if (error.request) {
      toast.error(i18n.t('errors.network'));
    } else {
      toast.error(error.message || i18n.t('errors.unknown'));
    }
    
    return Promise.reject(error);
  }
);

export default api;