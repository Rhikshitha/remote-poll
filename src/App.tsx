import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TeacherView from './components/TeacherView';
import StudentView from './components/StudentView';
import Dashboard from './components/Dashboard';
import PollResults from './components/PollResults';
import FunTheme from './components/FunTheme';
import SoundToggle from './components/SoundToggle';
import './App.css';

function App() {
  return (
    <Router>
      <FunTheme>
        <div className="App">
          <SoundToggle />
          <Routes>
            <Route path="/" element={<TeacherView />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/poll/:pollId" element={<StudentView />} />
            <Route path="/poll-results/:pollId" element={<PollResults />} />
          </Routes>
        </div>
      </FunTheme>
    </Router>
  );
}

export default App;
