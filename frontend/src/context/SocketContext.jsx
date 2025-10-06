import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import socketService from '../services/socketService';

const SocketContext = createContext();

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  
  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
      
      socketService.on('connect', () => {
        setIsConnected(true);
        setConnectionError(null);
      });
      
      socketService.on('disconnect', () => {
        setIsConnected(false);
      });
      
      socketService.on('connect_error', (error) => {
        setConnectionError(error.message);
        setIsConnected(false);
      });
    } else {
      socketService.disconnect();
      setIsConnected(false);
    }
    
    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated]);
  
  const value = {
    socket: socketService.socket,
    isConnected,
    connectionError,
    emit: socketService.emit.bind(socketService),
    on: socketService.on.bind(socketService),
    off: socketService.off.bind(socketService),
  };
  
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};