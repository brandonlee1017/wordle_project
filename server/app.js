const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const Joi = require('joi');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Load word list
const words = JSON.parse(fs.readFileSync(path.join(__dirname, 'words.json'), 'utf8'));

// Game state storage (in-memory for simplicity)
const games = new Map();
const rooms = new Map();

// Configuration
const MAX_ROUNDS = process.env.MAX_ROUNDS || 6;

// Validation schemas
const guessSchema = Joi.object({
  guess: Joi.string().length(5).pattern(/^[a-zA-Z]+$/).required()
});

// Game logic functions
function selectRandomWord() {
  return words[Math.floor(Math.random() * words.length)].toLowerCase();
}

function evaluateGuess(guess, answer) {
  const result = [];
  const answerArray = answer.split('');
  const guessArray = guess.toLowerCase().split('');
  
  // First pass: mark hits (correct letter, correct position)
  const usedPositions = new Set();
  for (let i = 0; i < 5; i++) {
    if (guessArray[i] === answerArray[i]) {
      result[i] = 'Hit';
      usedPositions.add(i);
    }
  }
  
  // Second pass: mark presents and misses
  const letterCounts = {};
  for (let i = 0; i < 5; i++) {
    if (!usedPositions.has(i)) {
      letterCounts[answerArray[i]] = (letterCounts[answerArray[i]] || 0) + 1;
    }
  }
  
  for (let i = 0; i < 5; i++) {
    if (!usedPositions.has(i)) {
      const letter = guessArray[i];
      if (letterCounts[letter] && letterCounts[letter] > 0) {
        result[i] = 'Present';
        letterCounts[letter]--;
      } else {
        result[i] = 'Miss';
      }
    }
  }
  
  return result;
}

// REST API Routes
app.post('/api/start-game', (req, res) => {
  const gameId = Date.now().toString();
  const answer = selectRandomWord();
  
  const game = {
    id: gameId,
    answer: answer,
    guesses: [],
    currentRound: 0,
    maxRounds: MAX_ROUNDS,
    isComplete: false,
    winner: null,
    createdAt: new Date()
  };
  
  games.set(gameId, game);
  
  res.json({
    gameId: gameId,
    maxRounds: MAX_ROUNDS
  });
});

app.post('/api/guess', (req, res) => {
  const { gameId, guess } = req.body;
  
  // Validate input
  const { error } = guessSchema.validate({ guess });
  if (error) {
    return res.status(400).json({ error: 'Invalid guess format' });
  }
  
  const game = games.get(gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (game.isComplete) {
    return res.status(400).json({ error: 'Game is already complete' });
  }
  
  if (game.currentRound >= game.maxRounds) {
    return res.status(400).json({ error: 'Maximum rounds reached' });
  }
  
  const normalizedGuess = guess.toLowerCase();
  // Allow any 5-letter word to be guessed (no dictionary restriction)
  
  // Evaluate guess
  const result = evaluateGuess(normalizedGuess, game.answer);
  const isCorrect = result.every(status => status === 'Hit');
  
  // Update game state
  game.guesses.push({
    word: normalizedGuess,
    result: result,
    round: game.currentRound + 1
  });
  game.currentRound++;
  
  if (isCorrect || game.currentRound >= game.maxRounds) {
    game.isComplete = true;
    game.winner = isCorrect ? 'player' : null;
  }
  
  res.json({
    result: result,
    isCorrect: isCorrect,
    gameComplete: game.isComplete,
    currentRound: game.currentRound,
    winner: game.winner
  });
});

app.get('/api/game/:gameId', (req, res) => {
  const game = games.get(req.params.gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  // Don't send the answer to the client
  const gameInfo = {
    id: game.id,
    guesses: game.guesses,
    currentRound: game.currentRound,
    maxRounds: game.maxRounds,
    isComplete: game.isComplete,
    winner: game.winner
  };
  
  res.json(gameInfo);
});

// Socket.io event handlers for multi-player
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (roomId) => {
    console.log('Player joining room:', roomId, 'Socket ID:', socket.id);
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      const answer = selectRandomWord();
      rooms.set(roomId, {
        id: roomId,
        answer: answer,
        players: new Map(),
        currentTurn: 1,
        isComplete: false,
        winner: null,
        createdAt: new Date()
      });
      console.log('Created new room:', roomId);
    }
    
    const room = rooms.get(roomId);
    const playerId = socket.id;
    
    // Check if player is already in this room
    if (room.players.has(playerId)) {
      console.log('Player already in room, reconnecting');
      const existingPlayer = room.players.get(playerId);
      socket.emit('room-joined', {
        roomId: roomId,
        playerNumber: existingPlayer.number,
        maxRounds: MAX_ROUNDS
      });
      
      // If both players are present, start the game
      if (room.players.size === 2) {
        console.log('Both players present, starting game in room:', roomId);
        io.to(roomId).emit('game-ready', { currentTurn: room.currentTurn });
      }
      return;
    }
    
    const playerNumber = room.players.size + 1;
    
    if (playerNumber <= 2) {
      room.players.set(playerId, {
        id: playerId,
        number: playerNumber,
        guesses: [],
        currentRound: 0,
        isComplete: false
      });
      
      console.log('Player', playerNumber, 'joined room', roomId, 'Socket ID:', socket.id);
      socket.emit('room-joined', {
        roomId: roomId,
        playerNumber: playerNumber,
        maxRounds: MAX_ROUNDS
      });
      
      // Notify other players
      socket.to(roomId).emit('player-joined', { playerNumber: playerNumber });
      
      // If both players joined, start the game
      if (room.players.size === 2) {
        console.log('Both players joined, starting game in room:', roomId);
        io.to(roomId).emit('game-ready', { currentTurn: 1 });
      }
    } else {
      console.log('Room is full:', roomId);
      socket.emit('room-full');
    }
  });

  socket.on('leave-room', (roomId) => {
    console.log('Player leaving room:', roomId, 'Socket ID:', socket.id);
    socket.leave(roomId);
    
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      if (room.players.has(socket.id)) {
        const player = room.players.get(socket.id);
        console.log(`Player ${player.number} left room ${roomId}`);
        room.players.delete(socket.id);
        socket.to(roomId).emit('player-left', { playerId: socket.id });
        
        // If room is empty, clean it up
        if (room.players.size === 0) {
          console.log(`Deleting empty room ${roomId}`);
          rooms.delete(roomId);
        } else {
          // Reset game state if only one player remains
          room.isComplete = false;
          room.winner = null;
          room.currentTurn = 1;
          console.log(`Room ${roomId} has ${room.players.size} players remaining`);
        }
      }
    }
  });
  
  socket.on('submit-guess', (data) => {
    const { roomId, guess } = data;
    const room = rooms.get(roomId);
    
    if (!room || room.isComplete) return;
    
    const player = room.players.get(socket.id);
    if (!player) return;
    
    // Validate guess
    const { error } = guessSchema.validate({ guess });
    if (error) {
      socket.emit('guess-error', { error: 'Invalid guess format' });
      return;
    }
    
    const normalizedGuess = guess.toLowerCase();
    // Allow any 5-letter word to be guessed (no dictionary restriction)
    
    // Allow simultaneous guessing - no turn restriction
    // Players can guess at any time
    
    // Evaluate guess
    const result = evaluateGuess(normalizedGuess, room.answer);
    const isCorrect = result.every(status => status === 'Hit');
    
    // Update player state
    player.guesses.push({
      word: normalizedGuess,
      result: result,
      round: player.currentRound + 1
    });
    player.currentRound++;
    
    if (isCorrect) {
      player.isComplete = true;
      
      // Check if both players have completed
      const allPlayersDone = Array.from(room.players.values()).every(p => p.isComplete);
      if (allPlayersDone) {
        room.isComplete = true;
        // Determine winner based on number of guesses
        const player1 = Array.from(room.players.values()).find(p => p.number === 1);
        const player2 = Array.from(room.players.values()).find(p => p.number === 2);
        
        if (player1.guesses.length === player2.guesses.length) {
          // Same number of guesses - first to get it right wins
          if (player1.isComplete && player2.isComplete) {
            // Both got it right in same round - first to submit wins
            room.winner = player.number; // Current player wins
          } else if (player1.isComplete) {
            room.winner = 1;
          } else {
            room.winner = 2;
          }
        } else if (player1.guesses.length < player2.guesses.length) {
          room.winner = 1;
        } else {
          room.winner = 2;
        }
      }
    } else if (player.currentRound >= MAX_ROUNDS) {
      player.isComplete = true;
      
      // Check if both players are done
      const allPlayersDone = Array.from(room.players.values()).every(p => p.isComplete);
      if (allPlayersDone) {
        room.isComplete = true;
        // Determine winner based on number of guesses
        const player1 = Array.from(room.players.values()).find(p => p.number === 1);
        const player2 = Array.from(room.players.values()).find(p => p.number === 2);
        
        if (player1.guesses.length === player2.guesses.length) {
          room.winner = 'tie';
        } else if (player1.guesses.length < player2.guesses.length) {
          room.winner = 1;
        } else {
          room.winner = 2;
        }
      }
    }
    
    // No turn switching - players can guess simultaneously
    
    // Emit results
    const emitData = {
      playerNumber: player.number,
      guess: normalizedGuess,
      result: result,
      isCorrect: isCorrect,
      currentTurn: room.currentTurn,
      gameComplete: room.isComplete,
      winner: room.winner
    };
    
    console.log('Emitting guess-submitted:', emitData);
    io.to(roomId).emit('guess-submitted', emitData);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove player from rooms
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.has(socket.id)) {
        const player = room.players.get(socket.id);
        console.log(`Player ${player.number} disconnected from room ${roomId}`);
        room.players.delete(socket.id);
        socket.to(roomId).emit('player-left', { playerId: socket.id });
        
        // If room is empty, clean it up
        if (room.players.size === 0) {
          console.log(`Deleting empty room ${roomId}`);
          rooms.delete(roomId);
        } else {
          // Reset game state if only one player remains
          room.isComplete = false;
          room.winner = null;
          room.currentTurn = 1;
          console.log(`Room ${roomId} has ${room.players.size} players remaining`);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
