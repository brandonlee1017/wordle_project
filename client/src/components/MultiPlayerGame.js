import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import GameBoard from './GameBoard';
import Keyboard from './Keyboard';
import MultiPlayerGameOverModal from './MultiPlayerGameOverModal';
import { useDarkMode } from '../contexts/DarkModeContext';

const MultiPlayerGame = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const socketRef = useRef();
  const playerNumberRef = useRef();
  const currentGuessRef = useRef();
  const isCompleteRef = useRef();
  const isLoadingRef = useRef();
  
  const [roomId, setRoomId] = useState('');
  const [playerNumber, setPlayerNumber] = useState(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [isGameReady, setIsGameReady] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [myGuesses, setMyGuesses] = useState([]);
  const [opponentGuesses, setOpponentGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [maxRounds] = useState(6);
  const [isComplete, setIsComplete] = useState(false);
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyStates, setKeyStates] = useState({});

  // Update refs when state changes
  useEffect(() => {
    currentGuessRef.current = currentGuess;
  }, [currentGuess]);

  useEffect(() => {
    isCompleteRef.current = isComplete;
  }, [isComplete]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection only once
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:5001', {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setError('Failed to connect to server');
        setIsLoading(false);
      });
    }

    // Remove existing event listeners to prevent duplicates
    if (socketRef.current) {
      socketRef.current.off('room-joined');
      socketRef.current.off('room-full');
      socketRef.current.off('player-joined');
      socketRef.current.off('game-ready');
      socketRef.current.off('guess-submitted');
      socketRef.current.off('guess-error');
      socketRef.current.off('player-left');
      socketRef.current.off('disconnect');
      socketRef.current.off('reconnect');
    }

    socketRef.current.on('room-joined', (data) => {
      console.log('Room joined:', data, 'Current roomId:', roomId, 'Current playerNumber:', playerNumber);
      // Prevent duplicate room-joined events
      if (roomId !== data.roomId || playerNumber !== data.playerNumber) {
        console.log('Setting new room state');
        setRoomId(data.roomId);
        setPlayerNumber(data.playerNumber);
        playerNumberRef.current = data.playerNumber;
        console.log('Player number set to:', data.playerNumber);
        setIsInRoom(true);
        setIsLoading(false);
        // maxRounds is already set as a constant
      } else {
        console.log('Duplicate room-joined event, ignoring');
      }
    });

    socketRef.current.on('room-full', () => {
      console.log('Room is full');
      setError('Room is full. Please try another room.');
      setIsLoading(false);
    });

    socketRef.current.on('player-joined', (data) => {
      setOpponentConnected(true);
    });

    socketRef.current.on('game-ready', (data) => {
      console.log('Game ready:', data);
      setIsGameReady(true);
      setCurrentTurn(data.currentTurn);
    });

    socketRef.current.on('guess-submitted', (data) => {
      const { playerNumber: guessPlayerNumber, guess, result, isCorrect, currentTurn: newTurn, gameComplete, winner: gameWinner } = data;
      
      console.log('Guess submitted:', {
        guessPlayerNumber,
        myPlayerNumber: playerNumberRef.current,
        guess,
        isMyGuess: guessPlayerNumber === playerNumberRef.current,
        comparison: `${guessPlayerNumber} === ${playerNumberRef.current} = ${guessPlayerNumber === playerNumberRef.current}`
      });
      
      if (guessPlayerNumber === playerNumberRef.current) {
        // My guess - should go to my board
        console.log('Adding to my guesses:', guess);
        setMyGuesses(prev => {
          const newGuesses = [...prev, { word: guess, result, round: prev.length + 1 }];
          console.log('Updated myGuesses:', newGuesses);
          return newGuesses;
        });
        updateKeyStates(guess, result);
      } else {
        // Opponent's guess - should go to opponent board
        console.log('Adding to opponent guesses:', guess);
        setOpponentGuesses(prev => {
          const newGuesses = [...prev, { word: guess, result, round: prev.length + 1 }];
          console.log('Updated opponentGuesses:', newGuesses);
          return newGuesses;
        });
      }
      
      setCurrentTurn(newTurn);
      setIsComplete(gameComplete);
      setWinner(gameWinner);
      setCurrentGuess('');
      setIsLoading(false); // Reset loading state after guess is processed
    });

    socketRef.current.on('guess-error', (data) => {
      setError(data.error);
    });

    socketRef.current.on('player-left', () => {
      console.log('Opponent left');
      setOpponentConnected(false);
      setError('Opponent disconnected');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setError('Disconnected from server');
      setIsLoading(false);
      setIsConnected(false);
    });

    socketRef.current.on('reconnect', () => {
      console.log('Reconnected to server');
      setError('');
      // If we were in a room, try to rejoin
      if (roomId && playerNumber) {
        console.log('Attempting to rejoin room:', roomId);
        socketRef.current.emit('join-room', roomId);
      }
    });

    return () => {
      // Only disconnect if we're not in a room and not navigating
      // This prevents the "waiting for opponent" issue
      if (socketRef.current && !isInRoom && !roomId) {
        console.log('Cleaning up socket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once on mount

  const joinRoom = (roomId) => {
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }
    
    console.log('Joining room:', roomId);
    setIsLoading(true);
    setError('');
    setOpponentConnected(false);
    setIsGameReady(false);
    socketRef.current.emit('join-room', roomId);
    
    // Add timeout to prevent infinite loading
    setTimeout(() => {
      if (isLoading) {
        setError('Connection timeout. Please try again.');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout
  };

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log('Creating room:', newRoomId);
    setRoomId(newRoomId);
    joinRoom(newRoomId);
  };

  const submitGuess = () => {
    if (currentGuess.length !== 5 || isComplete || isLoading) return;

    setIsLoading(true);
    setError('');
    
    socketRef.current.emit('submit-guess', {
      roomId,
      guess: currentGuess
    });
  };

  const updateKeyStates = (word, result) => {
    setKeyStates(prev => {
      const newStates = { ...prev };
      for (let i = 0; i < word.length; i++) {
        const letter = word[i];
        const status = result[i];
        
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

  const handleKeyDown = useCallback((e) => {
    // Only handle keyboard events when we're in the actual game (not room joining or waiting)
    if (!isInRoom || !isGameReady) {
      return;
    }

    // Don't interfere with input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    // Don't handle if game is complete or loading
    if (isComplete || isLoading) {
      return;
    }

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
  }, [isInRoom, isGameReady, isComplete, isLoading, currentGuess, submitGuess]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const leaveRoom = () => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('leave-room', roomId);
    }
    setMyGuesses([]);
    setOpponentGuesses([]);
    setCurrentGuess('');
    setIsComplete(false);
    setWinner(null);
    setError('');
    setKeyStates({});
    setIsGameReady(false);
    setOpponentConnected(false);
    setRoomId('');
    setPlayerNumber(null);
    setIsInRoom(false);
  };

  const startNewGame = () => {
    setMyGuesses([]);
    setOpponentGuesses([]);
    setCurrentGuess('');
    setIsComplete(false);
    setWinner(null);
    setError('');
    setKeyStates({});
    setIsGameReady(false);
    setOpponentConnected(false);
    setRoomId('');
    setPlayerNumber(null);
    setIsInRoom(false);
  };

  if (!isInRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card max-w-md w-full"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">Multi-Player Wordle</h2>
            <div className={`mb-4 px-3 py-1 rounded-full text-sm font-medium ${
              isConnected 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
            
            <div className="space-y-4">
              <motion.button
                onClick={createRoom}
                className="btn-primary w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
              >
                {isLoading ? 'Creating Room...' : 'Create New Room'}
              </motion.button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={6}
                />
                <motion.button
                  onClick={() => joinRoom(roomId)}
                  className="btn-secondary w-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Joining...' : 'Join Room'}
                </motion.button>
              </div>
            </div>
            
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}
            
            <motion.button
              onClick={() => navigate('/')}
              className="mt-6 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              whileHover={{ scale: 1.05 }}
            >
              ← Back to Menu
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isGameReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card max-w-md w-full text-center"
        >
          <div className="mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"
            />
          </div>
          <h3 className="text-xl font-semibold mb-2">Waiting for opponent...</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Room ID: <span className="font-mono font-bold text-blue-600">{roomId}</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Share this room ID with your friend to start playing!
          </p>
          {opponentConnected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg"
            >
              Opponent joined! Starting game...
            </motion.div>
          )}
          
          <motion.button
            onClick={leaveRoom}
            className="mt-4 btn-secondary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Leave Room
          </motion.button>
        </motion.div>
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

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Room: <span className="font-mono font-bold">{roomId}</span>
          </div>
          <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            Simultaneous Play
          </div>
          <motion.button
            onClick={leaveRoom}
            className="btn-secondary text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Leave Room
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
      </div>

      {/* Game Boards */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* My Board */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col items-center"
        >
          <h3 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400">
            You (Player {playerNumber})
          </h3>
          <GameBoard
            guesses={myGuesses}
            currentGuess={currentGuess}
            currentRound={myGuesses.length}
            maxRounds={maxRounds}
            isComplete={isComplete}
            showWords={true}
          />

        </motion.div>

        {/* Opponent Board */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center"
        >
          <h3 className="text-lg font-semibold mb-4 text-purple-600 dark:text-purple-400">
            Opponent (Player {playerNumber === 1 ? 2 : 1})
          </h3>
          <GameBoard
            guesses={opponentGuesses}
            currentGuess=""
            currentRound={opponentGuesses.length}
            maxRounds={maxRounds}
            isComplete={isComplete}
            showWords={false}
          />

        </motion.div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
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
          <MultiPlayerGameOverModal
            winner={winner}
            playerNumber={playerNumber}
            myGuesses={myGuesses}
            opponentGuesses={opponentGuesses}
            maxRounds={maxRounds}
            onNewGame={startNewGame}
            onBackToMenu={() => navigate('/')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiPlayerGame;
