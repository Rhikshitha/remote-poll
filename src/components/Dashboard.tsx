import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import soundManager from '../utils/soundManager';
import '../styles/Dashboard.css';

interface PollSummary {
  id: string;
  question: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  totalVotes: number;
  totalRatings: number;
  totalResponses: number;
}

const Dashboard: React.FC = () => {
  const [polls, setPolls] = useState<PollSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPolls();
    const interval = setInterval(fetchPolls, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_SERVER_URL || 'http://localhost:3001'}/api/polls`);
      const data = await response.json();
      setPolls(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching polls:', error);
      setLoading(false);
    }
  };

  const getTotalResponses = (poll: PollSummary) => {
    switch (poll.type) {
      case 'rating':
        return poll.totalRatings;
      case 'word-cloud':
        return poll.totalResponses;
      default:
        return poll.totalVotes;
    }
  };

  const handleViewPoll = (pollId: string) => {
    soundManager.play('click');
    navigate(`/poll-results/${pollId}`);
  };

  const handleShowQR = (pollId: string) => {
    soundManager.play('whoosh');
    setShowQR(showQR === pollId ? null : pollId);
  };

  const activePollsCount = polls.filter(p => p.isActive).length;
  const totalResponsesCount = polls.reduce((sum, poll) => sum + getTotalResponses(poll), 0);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Poll Dashboard</h1>
        <Link to="/" className="new-poll-btn">
          + Create New Poll
        </Link>
      </div>

      <div className="dashboard-stats">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="stat-card"
        >
          <h3>Total Polls</h3>
          <p className="stat-number">{polls.length}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat-card"
        >
          <h3>Active Polls</h3>
          <p className="stat-number active">{activePollsCount}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stat-card"
        >
          <h3>Total Responses</h3>
          <p className="stat-number">{totalResponsesCount}</p>
        </motion.div>
      </div>

      {loading ? (
        <div className="loading">Loading polls...</div>
      ) : polls.length === 0 ? (
        <div className="empty-state">
          <h2>No polls yet</h2>
          <p>Create your first poll to get started!</p>
          <Link to="/" className="create-first-btn">
            Create Poll
          </Link>
        </div>
      ) : (
        <div className="polls-grid">
          {polls.map((poll, index) => (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`poll-card ${!poll.isActive ? 'inactive' : ''}`}
            >
              <div className="poll-card-header">
                <span className={`poll-type ${poll.type}`}>
                  {poll.type.replace('-', ' ')}
                </span>
                <span className={`poll-status ${poll.isActive ? 'active' : 'closed'}`}>
                  {poll.isActive ? '● Active' : '○ Closed'}
                </span>
              </div>
              
              <h3 className="poll-question">{poll.question}</h3>
              
              <div className="poll-info">
                <span className="poll-id">ID: {poll.id}</span>
                <span className="poll-responses">
                  {getTotalResponses(poll)} {poll.type === 'rating' ? 'ratings' : 'responses'}
                </span>
              </div>
              
              <div className="poll-actions">
                <button
                  onClick={() => handleViewPoll(poll.id)}
                  className="view-btn"
                >
                  View Results
                </button>
                <button
                  onClick={() => handleShowQR(poll.id)}
                  className="qr-btn"
                >
                  {showQR === poll.id ? 'Hide QR' : 'Show QR'}
                </button>
              </div>
              
              {showQR === poll.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="qr-section"
                >
                  <QRCode
                    value={`${window.location.origin}/poll/${poll.id}`}
                    size={150}
                  />
                  <p className="qr-link">
                    {window.location.origin}/poll/{poll.id}
                  </p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;