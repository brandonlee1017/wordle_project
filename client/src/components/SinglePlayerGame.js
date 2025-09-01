import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import GameBoard from './GameBoard';
import Keyboard from './Keyboard';
import GameOverModal from './GameOverModal';
import { useDarkMode } from '../contexts/DarkModeContext';

const SinglePlayerGame = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  
  const [gameId, setGameId] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRound, setCurrentRound] = useState(0);
  const [maxRounds] = useState(6);
  const [isComplete, setIsComplete] = useState(false);
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyStates, setKeyStates] = useState({});

  // Load high score from localStorage
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('wordleHighScore');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/start-game');
      setGameId(response.data.gameId);
      setGuesses([]);
      setCurrentGuess('');
      setCurrentRound(0);
      setIsComplete(false);
      setWinner(null);
      setError('');
      setKeyStates({});
    } catch (err) {
      setError('Failed to start game');
      console.error('Error starting game:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const submitGuess = async () => {
    if (currentGuess.length !== 5 || isComplete || isLoading) return;

    try {
      setIsLoading(true);
      setError('');
      
      const response = await axios.post('/api/guess', {
        gameId,
        guess: currentGuess
      });

      const { result, isCorrect, gameComplete, currentRound: newRound, winner: gameWinner } = response.data;

      // Add guess to state
      const newGuess = {
        word: currentGuess.toLowerCase(),
        result,
        round: newRound
      };

      setGuesses(prev => [...prev, newGuess]);
      setCurrentRound(newRound);
      setIsComplete(gameComplete);
      setWinner(gameWinner);
      setCurrentGuess('');

      // Update keyboard states
      updateKeyStates(currentGuess.toLowerCase(), result);

      // Update high score if won
      if (isCorrect && (!highScore || newRound < highScore)) {
        const newHighScore = newRound;
        setHighScore(newHighScore);
        localStorage.setItem('wordleHighScore', JSON.stringify(newHighScore));
      }

    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to submit guess');
      }
      console.error('Error submitting guess:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateKeyStates = (word, result) => {
    setKeyStates(prev => {
      const newStates = { ...prev };
      for (let i = 0; i < word.length; i++) {
        const letter = word[i];
        const status = result[i];
        
        // Only update if new status is better (Hit > Present > Miss)
        const currentStatus = newStates[letter];
        if (!currentStatus || 
            (status === 'Hit') || 
            (status === 'Present' && currentStatus !== 'Hit') ||
            (status === 'Miss' && currentStatus === 'Miss')) {
          newStates[letter] = status;
        }
      }
      return newStates;
    });
  };

  const handleKeyPress = (key) => {
    if (isComplete || isLoading) return;

    if (key === 'ENTER') {
      if (currentGuess.length === 5) {
        submitGuess();
      }
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  };

  const handleKeyDown = (e) => {
    if (isComplete || isLoading) return;

    const key = e.key.toUpperCase();
    if (key === 'ENTER') {
      e.preventDefault();
      if (currentGuess.length === 5) {
        submitGuess();
      }
    } else if (key === 'BACKSPACE') {
      e.preventDefault();
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
      e.preventDefault();
      setCurrentGuess(prev => prev + key);
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, isComplete, isLoading]);

  if (isLoading && !gameId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <motion.button
          onClick={() => navigate('/')}
          className="btn-secondary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Back to Menu
        </motion.button>

        <motion.button
          onClick={toggleDarkMode}
          className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isDarkMode ? (
            <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </motion.button>
      </div>

      {/* High Score Display */}
      {highScore && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-20 left-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium"
        >
          Best: {highScore}/6
        </motion.div>
      )}

      {/* Game Board */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <GameBoard
          guesses={guesses}
          currentGuess={currentGuess}
          currentRound={currentRound}
          maxRounds={maxRounds}
          isComplete={isComplete}
        />
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Keyboard
          onKeyPress={handleKeyPress}
          keyStates={keyStates}
          disabled={isComplete || isLoading}
        />
      </motion.div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {isComplete && (
          <GameOverModal
            winner={winner}
            currentRound={currentRound}
            maxRounds={maxRounds}
            highScore={highScore}
            onNewGame={startNewGame}
            onBackToMenu={() => navigate('/')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SinglePlayerGame;

