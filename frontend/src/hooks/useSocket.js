import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import socketService from '../services/socketService';

export const useSocket = () => {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const isConnected = useRef(false);
  
  useEffect(() => {
    if (isAuthenticated && !isConnected.current) {
      socketService.connect();
      isConnected.current = true;
    } else if (!isAuthenticated && isConnected.current) {
      socketService.disconnect();
      isConnected.current = false;
    }
    
    return () => {
      if (isConnected.current) {
        socketService.disconnect();
        isConnected.current = false;
      }
    };
  }, [isAuthenticated]);
  
  const emit = useCallback((event, data) => {
    socketService.emit(event, data);
  }, []);
  
  const on = useCallback((event, callback) => {
    socketService.on(event, callback);
    
    return () => {
      socketService.off(event, callback);
    };
  }, []);
  
  const off = useCallback((event, callback) => {
    socketService.off(event, callback);
  }, []);
  
  return {
    socket: socketService.socket,
    emit,
    on,
    off,
    isConnected: isConnected.current,
  };
};