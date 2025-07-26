import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/StudentView.css';

interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: { [option: string]: number };
  isActive: boolean;
}

const StudentView: React.FC = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);
  const [userId] = useState(() => {
    const stored = localStorage.getItem('userId');
    if (stored) return stored;
    const newId = Math.random().toString(36).substring(2);
    localStorage.setItem('userId', newId);
    return newId;
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001');
    setSocket(newSocket);

    if (pollId) {
      newSocket.emit('join-poll', pollId);
    }

    newSocket.on('poll-data', (pollData: Poll) => {
      setPoll(pollData);
      const votedKey = `voted-${pollData.id}`;
      if (localStorage.getItem(votedKey)) {
        setHasVoted(true);
      }
    });

    newSocket.on('vote-update', ({ votes }) => {
      setPoll(prev => prev ? { ...prev, votes } : null);
    });

    newSocket.on('poll-closed', () => {
      setPoll(prev => prev ? { ...prev, isActive: false } : null);
    });

    newSocket.on('error', ({ message }) => {
      setError(message);
    });

    return () => {
      newSocket.close();
    };
  }, [pollId]);

  const handleVote = () => {
    if (!socket || !poll || !selectedOption || hasVoted) return;

    socket.emit('vote', {
      pollId: poll.id,
      option: selectedOption,
      userId
    });

    setHasVoted(true);
    localStorage.setItem(`voted-${poll.id}`, 'true');
  };

  const totalVotes = poll ? Object.values(poll.votes).reduce((sum, count) => sum + count, 0) : 0;

  if (error) {
    return (
      <div className="student-view error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="student-view loading">
        <h2>Loading poll...</h2>
      </div>
    );
  }

  return (
    <div className="student-view">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="poll-container"
      >
        <h1>{poll.question}</h1>
        
        {!poll.isActive && (
          <div className="poll-closed-message">
            This poll has been closed
          </div>
        )}

        {poll.isActive && !hasVoted ? (
          <div className="voting-section">
            <h3>Select your answer:</h3>
            <div className="options-list">
              {poll.options.map((option, index) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`option-button ${selectedOption === option ? 'selected' : ''}`}
                  onClick={() => setSelectedOption(option)}
                >
                  {option}
                </motion.button>
              ))}
            </div>
            
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="vote-button"
              onClick={handleVote}
              disabled={!selectedOption}
            >
              Submit Vote
            </motion.button>
          </div>
        ) : (
          <div className="results-section">
            <h3>{hasVoted ? 'Thank you for voting!' : 'Current Results'}</h3>
            <div className="results-list">
              {poll.options.map((option, index) => {
                const voteCount = poll.votes[option] || 0;
                const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                
                return (
                  <motion.div
                    key={option}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="result-item"
                  >
                    <div className="result-header">
                      <span className="option-text">
                        {option} {hasVoted && selectedOption === option && '(Your vote)'}
                      </span>
                      <span className="vote-count">{voteCount} votes</span>
                    </div>
                    <div className="result-bar">
                      <motion.div
                        className="result-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      />
                    </div>
                    <span className="percentage">{percentage.toFixed(1)}%</span>
                  </motion.div>
                );
              })}
            </div>
            <p className="total-votes">Total votes: {totalVotes}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentView;