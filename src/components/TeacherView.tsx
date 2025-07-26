import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import QRCode from 'react-qr-code';
import { motion, AnimatePresence } from 'framer-motion';
import PollResults from './PollResults';
import '../styles/TeacherView.css';

interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: { [option: string]: number };
  isActive: boolean;
}

const TeacherView: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [currentPoll, setCurrentPoll] = useState<Poll | null>(null);
  const [pollUrl, setPollUrl] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('poll-created', ({ pollId, poll }) => {
      setCurrentPoll(poll);
      const url = `${window.location.origin}/poll/${pollId}`;
      setPollUrl(url);
    });

    newSocket.on('vote-update', ({ votes }) => {
      setCurrentPoll(prev => prev ? { ...prev, votes } : null);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleCreatePoll = () => {
    if (!socket || !question || options.filter(o => o).length < 2) return;

    const validOptions = options.filter(o => o.trim());
    socket.emit('create-poll', { question, options: validOptions });
    setShowResults(true);
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleClosePoll = () => {
    if (!socket || !currentPoll) return;
    socket.emit('close-poll', currentPoll.id);
    setCurrentPoll(null);
    setPollUrl('');
    setQuestion('');
    setOptions(['', '']);
    setShowResults(false);
  };

  const resetForm = () => {
    setQuestion('');
    setOptions(['', '']);
    setCurrentPoll(null);
    setPollUrl('');
    setShowResults(false);
  };

  return (
    <div className="teacher-view">
      <h1>Classroom Poll</h1>
      
      <AnimatePresence mode="wait">
        {!currentPoll ? (
          <motion.div
            key="create-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="poll-form"
          >
            <h2>Create New Poll</h2>
            <input
              type="text"
              placeholder="Enter your question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="question-input"
            />
            
            <div className="options-container">
              <h3>Options</h3>
              {options.map((option, index) => (
                <div key={index} className="option-input-group">
                  <input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="option-input"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => handleRemoveOption(index)}
                      className="remove-option-btn"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button onClick={handleAddOption} className="add-option-btn">
                Add Option
              </button>
            </div>
            
            <button
              onClick={handleCreatePoll}
              disabled={!question || options.filter(o => o).length < 2}
              className="create-poll-btn"
            >
              Create Poll
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="poll-display"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="poll-display"
          >
            <div className="poll-header">
              <h2>{currentPoll.question}</h2>
              <div className="poll-controls">
                <button onClick={handleClosePoll} className="close-poll-btn">
                  Close Poll
                </button>
                <button onClick={resetForm} className="new-poll-btn">
                  New Poll
                </button>
              </div>
            </div>
            
            <div className="poll-content">
              <div className="qr-container">
                <h3>Scan to Vote</h3>
                <QRCode value={pollUrl} size={256} />
                <p className="poll-id">Poll ID: {currentPoll.id}</p>
                <a href={pollUrl} target="_blank" rel="noopener noreferrer" className="poll-link">
                  {pollUrl}
                </a>
              </div>
              
              {showResults && (
                <div className="results-container">
                  <PollResults poll={currentPoll} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeacherView;