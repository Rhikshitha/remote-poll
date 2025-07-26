import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TeacherView from './components/TeacherView';
import StudentView from './components/StudentView';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<TeacherView />} />
          <Route path="/poll/:pollId" element={<StudentView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
