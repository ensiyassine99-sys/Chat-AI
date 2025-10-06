import { io } from 'socket.io-client';
import store from '../store/store';

class SocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  connect() {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.log('No token found, skipping socket connection');
      return;
    }
    
    this.socket = io(import.meta.env.VITE_WS_URL || 'ws://localhost:5000', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.socket.connect();
      }
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      
      if (error.message === 'Authentication error') {
        // Token might be expired, try to refresh
        store.dispatch('auth/refreshAccessToken');
      }
      
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });
    
    // Custom events
    this.socket.on('notification', (data) => {
      store.dispatch('notifications/addNotification', data);
    });
    
    this.socket.on('chat_update', (data) => {
      store.dispatch('chat/updateChat', data);
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }
  
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }
  
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
  
  // Méthodes spécifiques
  joinChat(chatId) {
    this.emit('join_chat', chatId);
  }
  
  leaveChat(chatId) {
    this.emit('leave_chat', chatId);
  }
  
  sendTyping(chatId) {
    this.emit('typing', { chatId });
  }
  
  stopTyping(chatId) {
    this.emit('stop_typing', { chatId });
  }
}

export default new SocketService();