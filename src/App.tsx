// Place this file as: src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import BetPage from './pages/BetPage';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bet/:marketId" element={<BetPage />} />
      </Routes>
    </Router>
  );
};

export default App;