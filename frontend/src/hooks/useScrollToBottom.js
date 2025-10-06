import { useRef, useEffect } from 'react';

export const useScrollToBottom = (dependencies = []) => {
  const bottomRef = useRef(null);
  
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, dependencies);
  
  return [bottomRef, scrollToBottom];
};
