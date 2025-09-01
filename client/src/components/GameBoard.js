import React from 'react';
import { motion } from 'framer-motion';

const GameBoard = ({ guesses, currentGuess, currentRound, maxRounds, isComplete, showWords = true }) => {
  const renderTile = (letter, status, index, rowIndex) => {
    const isCurrentRow = rowIndex === currentRound;
    const isFilled = letter && letter !== '';
    
    return (
      <motion.div
        key={index}
        className={`wordle-tile ${isFilled ? 'filled' : ''} ${status ? status.toLowerCase() : ''}`}
        initial={false}
        animate={isFilled ? {
          scale: [1, 1.1, 1],
          rotateX: status ? [0, 90, 0] : 0
        } : {}}
        transition={{
          duration: 0.3,
          delay: status ? index * 0.1 : 0
        }}
      >
        {showWords && letter ? letter.toUpperCase() : ''}
      </motion.div>
    );
  };

  const renderRow = (rowIndex) => {
    const rowGuesses = guesses.filter(g => g.round === rowIndex + 1);
    const currentRowGuess = rowGuesses.length > 0 ? rowGuesses[0] : null;
    
    return (
      <motion.div
        key={rowIndex}
        className="flex gap-1 mb-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: rowIndex * 0.1 }}
      >
        {Array.from({ length: 5 }, (_, index) => {
          let letter = '';
          let status = null;
          
          if (currentRowGuess) {
            letter = currentRowGuess.word[index] || '';
            status = currentRowGuess.result[index] || null;
          } else if (rowIndex === currentRound) {
            letter = currentGuess[index] || '';
          }
          
          return renderTile(letter, status, index, rowIndex);
        })}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col gap-1">
        {Array.from({ length: maxRounds }, (_, index) => renderRow(index))}
      </div>
    </div>
  );
};

export default GameBoard;
