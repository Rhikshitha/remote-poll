import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import QRCode from 'react-qr-code';
import { motion } from 'framer-motion';
import EnhancedPollResults from './EnhancedPollResults';
import EmojiReaction from './EmojiReaction';
import soundManager from '../utils/soundManager';
import '../styles/PollResults.css';

interface Poll {
  id: string;
  question: string;
  type: 'multiple-choice' | 'rating' | 'word-cloud' | 'yes-no';
  options: string[];
  votes: { [option: string]: number };
  wordCloudResponses?: string[];
  ratings?: number[];
  isActive: boolean;
  timer?: number;
  anonymous: boolean;
}

const PollResults: React.FC = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001');
    setSocket(newSocket);

    if (pollId) {
      newSocket.emit('join-poll', pollId);
      
      newSocket.on('poll-data', (pollData: Poll) => {
        setPoll(pollData);
        setLoading(false);
      });

      newSocket.on('vote-update', (data) => {
        if (data.pollId === pollId) {
          setPoll(prev => {
            if (!prev) return null;
            return {
              ...prev,
              votes: data.votes || prev.votes,
              ratings: data.ratings || prev.ratings,
              wordCloudResponses: data.wordCloudResponses || prev.wordCloudResponses
            };
          });
        }
      });

      newSocket.on('poll-closed', (data) => {
        if (data.pollId === pollId) {
          setPoll(prev => prev ? { ...prev, isActive: false } : null);
        }
      });

      newSocket.on('error', (data) => {
        setError(data.message);
        setLoading(false);
      });
    }

    return () => {
      newSocket.disconnect();
    };
  }, [pollId]);

  const closePoll = () => {
    if (socket && pollId) {
      socket.emit('close-poll', pollId);
      soundManager.play('close');
    }
  };

  if (loading) {
    return (
      <div className="poll-results-container">
        <div className="loading">Loading poll...</div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="poll-results-container">
        <div className="error">
          <h2>Poll not found</h2>
          <p>{error || 'The poll you are looking for does not exist.'}</p>
          <Link to="/dashboard" className="back-link">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const pollUrl = `${window.location.origin}/poll/${pollId}`;

  return (
    <div className="poll-results-container">
      <div className="results-header">
        <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
        <div className="poll-status">
          <span className={`status-badge ${poll.isActive ? 'active' : 'closed'}`}>
            {poll.isActive ? '● Active' : '○ Closed'}
          </span>
          {poll.isActive && (
            <button onClick={closePoll} className="close-poll-btn">
              Close Poll
            </button>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="poll-content"
      >
        <h1>{poll.question}</h1>
        <p className="poll-id">Poll ID: {pollId}</p>

        <div className="poll-info-grid">
          <div className="qr-section">
            <h3>Scan to Vote</h3>
            <QRCode value={pollUrl} size={200} />
            <p className="poll-url">{pollUrl}</p>
          </div>

          <div className="results-section">
            <EnhancedPollResults poll={poll} />
          </div>
        </div>

        <EmojiReaction socket={socket} pollId={pollId || ''} />
      </motion.div>
    </div>
  );
};

export default PollResults;