import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Survey } from './pages/Survey';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/survey/:userId" element={<Survey />} />
      </Routes>
    </HashRouter>
  );
};

export default App;