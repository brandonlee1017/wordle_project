import React from 'react';
import { motion } from 'framer-motion';

const Keyboard = ({ onKeyPress, keyStates, disabled }) => {
  const keys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ];

  const handleKeyClick = (key) => {
    if (!disabled) {
      onKeyPress(key);
    }
  };

  const getKeyClass = (key) => {
    const baseClass = 'keyboard-key';
    const status = keyStates[key.toLowerCase()];
    
    if (status) {
      return `${baseClass} ${status.toLowerCase()}`;
    }
    
    return baseClass;
  };

  const renderKey = (key, index) => {
    const isSpecialKey = key === 'ENTER' || key === 'BACKSPACE';
    
    return (
      <motion.button
        key={index}
        className={`${getKeyClass(key)} ${isSpecialKey ? 'px-2 text-xs' : ''}`}
        onClick={() => handleKeyClick(key)}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.1 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        transition={{ duration: 0.1 }}
      >
        {key === 'BACKSPACE' ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l9-9 12 12-9 9z" />
          </svg>
        ) : key === 'ENTER' ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        ) : (
          key
        )}
      </motion.button>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-2 max-w-md">
      {keys.map((row, rowIndex) => (
        <motion.div
          key={rowIndex}
          className="flex gap-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: rowIndex * 0.1 }}
        >
          {row.map((key, index) => renderKey(key, index))}
        </motion.div>
      ))}
    </div>
  );
};

export default Keyboard;

