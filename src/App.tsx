import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RandomVideoChatApp from '../random-video-chat-app';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RandomVideoChatApp />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
