import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = () => {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -10 },
  };
  
  return (
    <div className="flex items-center space-x-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-xs">
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full"
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: index * 0.1,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        AI is typing...
      </span>
    </div>
  );
};

export default TypingIndicator;
