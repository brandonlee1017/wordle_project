import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MultiPlayerGameOverModal = ({ winner, playerNumber, myGuesses, opponentGuesses, maxRounds, onNewGame, onBackToMenu }) => {
  const isWin = winner === playerNumber;
  const isTie = winner === 'tie';
  const myScore = myGuesses.length;
  const opponentScore = opponentGuesses.length;

  const getResultMessage = () => {
    if (isTie) {
      if (myScore === maxRounds && opponentScore === maxRounds) {
        return "It's a tie! Both players ran out of tries.";
      } else {
        return "It's a tie! Both players found the word in the same number of tries.";
      }
    } else if (isWin) {
      if (myScore < opponentScore) {
        return `You won! You found the word in ${myScore} ${myScore === 1 ? 'try' : 'tries'} (fewer than opponent)!`;
      } else {
        return `You won! You found the word first in ${myScore} ${myScore === 1 ? 'try' : 'tries'}!`;
      }
    } else {
      if (opponentScore < myScore) {
        return `You lost! Opponent found the word in ${opponentScore} ${opponentScore === 1 ? 'try' : 'tries'} (fewer than you).`;
      } else {
        return `You lost! Opponent found the word first in ${opponentScore} ${opponentScore === 1 ? 'try' : 'tries'}.`;
      }
    }
  };

  const getResultColor = () => {
    if (isTie) return 'text-yellow-600 dark:text-yellow-400';
    if (isWin) return 'text-green-600 dark:text-green-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getResultIcon = () => {
    if (isTie) {
      return (
        <svg className="w-10 h-10 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      );
    } else if (isWin) {
      return (
        <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={(e) => e.target === e.currentTarget && onBackToMenu()}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="card max-w-2xl w-full text-center relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600"></div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                isTie 
                  ? 'bg-yellow-100 dark:bg-yellow-900'
                  : isWin 
                    ? 'bg-green-100 dark:bg-green-900' 
                    : 'bg-red-100 dark:bg-red-900'
              }`}
            >
              {getResultIcon()}
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-2xl font-bold mb-2 ${getResultColor()}`}
            >
              {isTie ? 'Tie Game!' : isWin ? 'You Won!' : 'You Lost!'}
            </motion.h2>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 dark:text-gray-300 mb-8"
            >
              {getResultMessage()}
            </motion.p>

            {/* Score Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <h3 className="text-lg font-semibold mb-4">Final Scores</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Your Score */}
                <div className={`p-4 rounded-lg border-2 ${
                  isWin 
                    ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                    : 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
                }`}>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">You</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {myScore}/{maxRounds}
                  </div>
                  {myScore < maxRounds && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Found the word!
                    </div>
                  )}
                </div>

                {/* Opponent Score */}
                <div className={`p-4 rounded-lg border-2 ${
                  !isWin && !isTie
                    ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                    : 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
                }`}>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Opponent</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {opponentScore}/{maxRounds}
                  </div>
                  {opponentScore < maxRounds && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Found the word!
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Game Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8 text-left"
            >
              <h4 className="text-md font-semibold mb-3">Game Summary</h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Your guesses:</span>
                  <span className="font-mono">{myGuesses.map(g => g.word).join(', ') || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Opponent's guesses:</span>
                  <span className="font-mono">{opponentGuesses.length} guesses (hidden)</span>
                </div>
              </div>
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <motion.button
                onClick={onNewGame}
                className="btn-primary flex-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Play Again
              </motion.button>
              <motion.button
                onClick={onBackToMenu}
                className="btn-secondary flex-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Back to Menu
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MultiPlayerGameOverModal;
