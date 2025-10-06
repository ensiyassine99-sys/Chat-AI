import { useState, useEffect } from 'react';

export const useKeyPress = (targetKey, handler, options = {}) => {
  const { preventDefault = false, stopPropagation = false } = options;
  
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === targetKey) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        handler(event);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [targetKey, handler, preventDefault, stopPropagation]);
};
