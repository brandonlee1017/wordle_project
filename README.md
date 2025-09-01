# Wordle Game Project

A modern web-based Wordle game implementation with single-player and multi-player modes, built with React.js, Node.js, Express.js, and Socket.io.

## 🎮 Features

### Task 1: Normal Wordle
- **Word Selection**: Random 5-letter word selection from a comprehensive dictionary as the answer
- **Flexible Guessing**: Players can guess any 5-letter word (not restricted to dictionary)
- **Scoring System**: 
  - 🟩 Green (Hit): Correct letter in correct position
  - 🟨 Yellow (Present): Correct letter in wrong position  
  - ⬜ Gray (Miss): Letter not in the word
- **Duplicate Handling**: Proper handling of duplicate letters
- **Win/Lose Conditions**: 6 attempts to guess the word
- **Virtual Keyboard**: Color-coded feedback on keyboard keys

### Task 2: Server/Client Wordle
- **Client-Server Architecture**: React frontend with Node.js/Express backend
- **RESTful API**: 
  - `POST /api/start-game`: Initialize new game
  - `POST /api/guess`: Submit and validate guesses
  - `GET /api/game/:gameId`: Retrieve game state
- **Server-side Validation**: Input validation and word list checking
- **Secure Game Logic**: Answer hidden from client until game completion

### Task 4: Multi-Player Wordle
- **Real-time Gameplay**: Socket.io for live updates
- **Room System**: Create or join rooms with unique IDs
- **Turn-based Play**: Alternating turns between players
- **Live Opponent Tracking**: Real-time view of opponent's progress
- **Win/Lose/Tie Logic**: First to guess wins, same round = tie

### Bonus Features
- **Dark Mode Toggle**: Persistent theme preference
- **High Score Tracking**: LocalStorage for single-player best scores
- **Animations**: Framer Motion for smooth tile reveals and transitions
- **Confetti Effect**: Celebration animation on wins
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation


1. **Install all dependencies**
   ```bash
   npm run install-all
   ```

2. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start both the backend server (port 5001) and frontend development server (port 3000) concurrently.

### Manual Setup (Alternative)

If you prefer to run servers separately:

1. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Install client dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```

4. **Start the frontend server** (in a new terminal)
   ```bash
   cd client
   npm start
   ```

## 🏗️ Project Structure

```
wordle_project/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Menu.js
│   │   │   ├── SinglePlayerGame.js
│   │   │   ├── MultiPlayerGame.js
│   │   │   ├── GameBoard.js
│   │   │   ├── Keyboard.js
│   │   │   ├── GameOverModal.js
│   │   │   └── MultiPlayerGameOverModal.js
│   │   ├── contexts/       # React contexts
│   │   │   └── DarkModeContext.js
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Node.js backend
│   ├── app.js             # Main server file
│   ├── words.json         # Word dictionary
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

## 🎯 Game Rules

### Single Player Mode
1. The game selects a random 5-letter word
2. You have 6 attempts to guess the word
3. After each guess, tiles show:
   - 🟩 Green: Letter is correct and in right position
   - 🟨 Yellow: Letter is correct but in wrong position
   - ⬜ Gray: Letter is not in the word
4. Win by guessing the word, lose by running out of attempts

### Multi Player Mode
1. Create a room or join with a room ID
2. Play simultaneously guessing the same word
3. Player who got the answer with the less amount of guess wins
4. For tied guesses, the player who got the answer first wins
5. If neither guesses within 6 attempts, both lose

Benefits for this multi-player rule: 
1. While maintaining accuracy, players are now also competing for time, therefore they cannot spend too much time on one guess.

## 🔧 Configuration

### Word List
The game uses `server/words.json` containing 200+ common 5-letter English words. You can modify this file to add or remove words.

## 🎨 UI/UX Features

### Design System
- **Colors**: Wordle's official color scheme (green, yellow, gray)
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent spacing using Tailwind's design system
- **Responsive**: Mobile-first design with breakpoint optimization

### Animations
- **Tile Reveals**: Flip animation with staggered timing
- **Keyboard Feedback**: Smooth color transitions
- **Page Transitions**: Framer Motion page animations
- **Confetti**: Particle animation on wins
- **Loading States**: Spinner animations

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Proper ARIA labels and semantic HTML
- **Color Contrast**: WCAG compliant color combinations
- **Focus Management**: Clear focus indicators

## 🛠️ Technical Implementation

### Frontend (React)
- **State Management**: React hooks and Context API
- **Routing**: React Router for navigation
- **Styling**: Tailwind CSS with custom components
- **Animations**: Framer Motion for smooth transitions
- **HTTP Client**: Axios for API calls
- **Real-time**: Socket.io client for multiplayer

### Backend (Node.js)
- **Framework**: Express.js with middleware
- **Real-time**: Socket.io for multiplayer functionality
- **Validation**: Joi for input validation
- **CORS**: Cross-origin resource sharing enabled
- **Error Handling**: Comprehensive error responses

### Game Logic
- **Word Selection**: Random selection from JSON file
- **Scoring Algorithm**: Two-pass system for duplicate handling
- **Turn Management**: Alternating turns with validation
- **Room Management**: In-memory storage with cleanup

## 🧪 Testing

### Manual Testing Checklist
- [ ] Single player game flow
- [ ] Multi player room creation and joining
- [ ] Turn-based gameplay
- [ ] Win/lose/tie scenarios
- [ ] Dark mode toggle
- [ ] Responsive design on mobile
- [ ] Keyboard input validation
- [ ] Error handling and messages

### API Testing
Use tools like Postman or curl to test endpoints:

```bash
# Start a new game
curl -X POST http://localhost:5001/api/start-game

# Submit a guess
curl -X POST http://localhost:5001/api/guess \
  -H "Content-Type: application/json" \
  -d '{"gameId": "1234567890", "guess": "HELLO"}'
```

**Built using React, Node.js, and Socket.io**
