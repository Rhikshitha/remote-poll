import React from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Pie, Radar } from 'react-chartjs-2';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import '../styles/EnhancedPollResults.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

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

interface EnhancedPollResultsProps {
  poll: Poll;
}

const EnhancedPollResults: React.FC<EnhancedPollResultsProps> = ({ poll }) => {
  const renderMultipleChoice = () => {
    const totalVotes = Object.values(poll.votes).reduce((sum, count) => sum + count, 0);
    
    const chartData = {
      labels: poll.options,
      datasets: [
        {
          label: 'Votes',
          data: poll.options.map(option => poll.votes[option] || 0),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 2,
        },
      ],
    };

    const barOptions = {
      responsive: true,
      animation: {
        duration: 500,
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: `Total Votes: ${totalVotes}`,
        },
      },
    };

    return (
      <div className="results-grid">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="chart-container"
        >
          <Bar data={chartData} options={barOptions} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="chart-container"
        >
          <Pie data={chartData} />
        </motion.div>
      </div>
    );
  };

  const renderRating = () => {
    if (!poll.ratings || poll.ratings.length === 0) {
      return <p>No ratings yet</p>;
    }

    const avgRating = poll.ratings.reduce((a, b) => a + b, 0) / poll.ratings.length;
    const ratingCounts = [0, 0, 0, 0, 0];
    poll.ratings.forEach(rating => {
      if (rating >= 1 && rating <= 5) {
        ratingCounts[rating - 1]++;
      }
    });

    const chartData = {
      labels: ['1⭐', '2⭐', '3⭐', '4⭐', '5⭐'],
      datasets: [
        {
          label: 'Ratings',
          data: ratingCounts,
          backgroundColor: 'rgba(255, 206, 86, 0.6)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 2,
        },
      ],
    };

    return (
      <div className="rating-results">
        <div className="average-rating">
          <h3>Average Rating</h3>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="rating-display"
          >
            <span className="rating-number">{avgRating.toFixed(1)}</span>
            <span className="rating-stars">{'⭐'.repeat(Math.round(avgRating))}</span>
          </motion.div>
          <p>{poll.ratings.length} responses</p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="chart-container"
        >
          <Bar data={chartData} options={{ 
            responsive: true,
            plugins: {
              legend: { display: false }
            }
          }} />
        </motion.div>
      </div>
    );
  };

  const renderWordCloud = () => {
    if (!poll.wordCloudResponses || poll.wordCloudResponses.length === 0) {
      return <p>No responses yet</p>;
    }

    const wordFrequency: { [word: string]: number } = {};
    poll.wordCloudResponses.forEach(response => {
      const words = response.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) {
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
      });
    });

    const sortedWords = Object.entries(wordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);

    return (
      <div className="word-cloud-results">
        <h3>Word Cloud ({poll.wordCloudResponses.length} responses)</h3>
        <div className="word-cloud">
          {sortedWords.map(([word, count], index) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="word"
              style={{
                fontSize: `${Math.max(1, Math.min(3, count / 2))}rem`,
                color: `hsl(${index * 20}, 70%, 50%)`,
              }}
            >
              {word}
            </motion.span>
          ))}
        </div>
      </div>
    );
  };

  const renderYesNo = () => {
    const totalVotes = Object.values(poll.votes).reduce((sum, count) => sum + count, 0);
    const yesVotes = poll.votes['Yes'] || 0;
    const noVotes = poll.votes['No'] || 0;
    const yesPercentage = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0;
    const noPercentage = totalVotes > 0 ? (noVotes / totalVotes) * 100 : 0;

    return (
      <div className="yes-no-results">
        <div className="vote-bars">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(yesPercentage, 20)}%` }}
            className="yes-bar"
          >
            <span className="vote-label">Yes: {yesVotes}</span>
            <span className="vote-percentage">{yesPercentage.toFixed(1)}%</span>
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(noPercentage, 20)}%` }}
            className="no-bar"
          >
            <span className="vote-label">No: {noVotes}</span>
            <span className="vote-percentage">{noPercentage.toFixed(1)}%</span>
          </motion.div>
        </div>
        <p className="total-votes">Total votes: {totalVotes}</p>
      </div>
    );
  };

  return (
    <div className="enhanced-poll-results">
      <div className="results-header">
        <h3>Live Results</h3>
        {poll.timer && poll.isActive && (
          <CountdownCircleTimer
            isPlaying
            duration={poll.timer}
            colors={['#004777', '#F7B801', '#A30000', '#A30000']}
            colorsTime={[poll.timer, poll.timer / 2, poll.timer / 4, 0]}
            size={60}
            strokeWidth={6}
          >
            {({ remainingTime }) => remainingTime}
          </CountdownCircleTimer>
        )}
      </div>
      
      {poll.type === 'multiple-choice' && renderMultipleChoice()}
      {poll.type === 'rating' && renderRating()}
      {poll.type === 'word-cloud' && renderWordCloud()}
      {poll.type === 'yes-no' && renderYesNo()}
    </div>
  );
};

export default EnhancedPollResults;