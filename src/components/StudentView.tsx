import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/StudentView.css';

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

const StudentView: React.FC = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);
  const [wordInput, setWordInput] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
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

    newSocket.on('vote-update', (data: any) => {
      setPoll(prev => {
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
    if (!socket || !poll || hasVoted) return;

    switch (poll.type) {
      case 'multiple-choice':
      case 'yes-no':
        if (!selectedOption) return;
        socket.emit('vote', {
          pollId: poll.id,
          option: selectedOption,
          userId
        });
        break;
        
      case 'rating':
        if (selectedRating === 0) return;
        socket.emit('vote', {
          pollId: poll.id,
          rating: selectedRating,
          userId
        });
        break;
        
      case 'word-cloud':
        if (!wordInput.trim()) return;
        socket.emit('vote', {
          pollId: poll.id,
          wordCloudText: wordInput.trim(),
          userId
        });
        break;
    }

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
            {(poll.type === 'multiple-choice' || poll.type === 'yes-no') && (
              <>
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
              </>
            )}
            
            {poll.type === 'rating' && (
              <>
                <h3>Rate from 1 to 5:</h3>
                <div className="rating-buttons">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <motion.button
                      key={rating}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: rating * 0.05 }}
                      className={`rating-button ${selectedRating === rating ? 'selected' : ''}`}
                      onClick={() => setSelectedRating(rating)}
                    >
                      {rating}⭐
                    </motion.button>
                  ))}
                </div>
              </>
            )}
            
            {poll.type === 'word-cloud' && (
              <>
                <h3>Enter your response:</h3>
                <input
                  type="text"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder="Type your answer..."
                  className="word-input"
                  maxLength={50}
                />
                <p className="char-count">{wordInput.length}/50</p>
              </>
            )}
            
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="vote-button"
              onClick={handleVote}
              disabled={
                (poll.type === 'multiple-choice' || poll.type === 'yes-no') && !selectedOption ||
                poll.type === 'rating' && selectedRating === 0 ||
                poll.type === 'word-cloud' && !wordInput.trim()
              }
            >
              Submit
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