import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import QRCode from 'react-qr-code';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import EnhancedPollResults from './EnhancedPollResults';
import '../styles/TeacherView.css';

type PollType = 'multiple-choice' | 'rating' | 'word-cloud' | 'yes-no';

interface Poll {
  id: string;
  question: string;
  type: PollType;
  options: string[];
  votes: { [option: string]: number };
  wordCloudResponses?: string[];
  ratings?: number[];
  isActive: boolean;
  timer?: number;
  anonymous: boolean;
}

const TeacherView: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [currentPoll, setCurrentPoll] = useState<Poll | null>(null);
  const [pollUrl, setPollUrl] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [pollType, setPollType] = useState<PollType>('multiple-choice');
  const [timer, setTimer] = useState<number>(0);
  const [anonymous, setAnonymous] = useState(true);
  const [showTemplate, setShowTemplate] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('poll-created', ({ pollId, poll }) => {
      setCurrentPoll(poll);
      const url = `${window.location.origin}/poll/${pollId}`;
      setPollUrl(url);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    });

    newSocket.on('vote-update', (data: any) => {
      setCurrentPoll(prev => {
        if (!prev) return null;
        
        switch (data.type) {
          case 'multiple-choice':
          case 'yes-no':
            return { ...prev, votes: data.votes };
          case 'rating':
            return { ...prev, ratings: data.ratings };
          case 'word-cloud':
            return { ...prev, wordCloudResponses: data.wordCloudResponses };
          default:
            return prev;
        }
      });
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const getOptionsForType = () => {
    switch (pollType) {
      case 'yes-no':
        return ['Yes', 'No'];
      case 'rating':
        return ['1', '2', '3', '4', '5'];
      case 'word-cloud':
        return [];
      default:
        return options.filter(o => o.trim());
    }
  };

  const handleCreatePoll = () => {
    if (!socket || !question) return;

    const pollOptions = getOptionsForType();
    
    if (pollType === 'multiple-choice' && pollOptions.length < 2) {
      return;
    }

    socket.emit('create-poll', { 
      question, 
      options: pollOptions,
      type: pollType,
      timer: timer > 0 ? timer : undefined,
      anonymous
    });
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
    setPollType('multiple-choice');
    setTimer(0);
    setAnonymous(true);
  };

  const pollTemplates = [
    {
      name: 'Understanding Check',
      question: 'How well do you understand the topic?',
      type: 'rating' as PollType,
    },
    {
      name: 'Yes/No Question',
      question: 'Do you have any questions?',
      type: 'yes-no' as PollType,
    },
    {
      name: 'Feedback',
      question: 'What\'s one thing you learned today?',
      type: 'word-cloud' as PollType,
    },
    {
      name: 'Quiz',
      question: 'What is the correct answer?',
      type: 'multiple-choice' as PollType,
      options: ['Option A', 'Option B', 'Option C', 'Option D']
    }
  ];

  const applyTemplate = (template: any) => {
    setQuestion(template.question);
    setPollType(template.type);
    if (template.options) {
      setOptions(template.options);
    }
    setShowTemplate(false);
  };

  return (
    <div className="teacher-view">
      {showConfetti && <Confetti width={width} height={height} />}
      <h1>Remote Poll</h1>
      
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
            
            <button 
              onClick={() => setShowTemplate(!showTemplate)}
              className="template-btn"
            >
              {showTemplate ? 'Hide Templates' : 'Use Template'}
            </button>
            
            {showTemplate && (
              <div className="templates-grid">
                {pollTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => applyTemplate(template)}
                    className="template-card"
                  >
                    <h4>{template.name}</h4>
                    <p>{template.question}</p>
                  </button>
                ))}
              </div>
            )}
            
            <div className="poll-type-selector">
              <label>Poll Type:</label>
              <select 
                value={pollType} 
                onChange={(e) => setPollType(e.target.value as PollType)}
                className="type-select"
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="yes-no">Yes/No</option>
                <option value="rating">Rating (1-5)</option>
                <option value="word-cloud">Word Cloud</option>
              </select>
            </div>
            
            <input
              type="text"
              placeholder="Enter your question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="question-input"
            />
            
            {pollType === 'multiple-choice' && (
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
            )}
            
            <div className="advanced-options">
              <div className="timer-option">
                <label>
                  <input
                    type="checkbox"
                    checked={timer > 0}
                    onChange={(e) => setTimer(e.target.checked ? 60 : 0)}
                  />
                  Set Timer
                </label>
                {timer > 0 && (
                  <input
                    type="number"
                    value={timer}
                    onChange={(e) => setTimer(parseInt(e.target.value) || 0)}
                    min="10"
                    max="300"
                    className="timer-input"
                  />
                )}
              </div>
            </div>
            
            <button
              onClick={handleCreatePoll}
              disabled={!question || (pollType === 'multiple-choice' && options.filter(o => o).length < 2)}
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
                  <EnhancedPollResults poll={currentPoll} />
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