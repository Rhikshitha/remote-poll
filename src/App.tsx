import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TeacherView from './components/TeacherView';
import StudentView from './components/StudentView';
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
            <Route path="/poll/:pollId" element={<StudentView />} />
          </Routes>
        </div>
      </FunTheme>
    </Router>
  );
}

export default App;
