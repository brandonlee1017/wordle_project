import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Menu from './components/Menu';
import SinglePlayerGame from './components/SinglePlayerGame';
import MultiPlayerGame from './components/MultiPlayerGame';
import { DarkModeProvider } from './contexts/DarkModeContext';

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Menu />} />
              <Route path="/single-player" element={<SinglePlayerGame />} />
              <Route path="/multi-player" element={<MultiPlayerGame />} />
            </Routes>
          </AnimatePresence>
        </div>
      </Router>
    </DarkModeProvider>
  );
}

export default App;

