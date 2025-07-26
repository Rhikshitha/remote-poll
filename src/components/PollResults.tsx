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
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import '../styles/PollResults.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: { [option: string]: number };
  isActive: boolean;
}

interface PollResultsProps {
  poll: Poll;
}

const PollResults: React.FC<PollResultsProps> = ({ poll }) => {
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
        borderWidth: 1,
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

  const pieOptions = {
    responsive: true,
    animation: {
      animateRotate: true,
      animateScale: true,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Vote Distribution',
      },
    },
  };

  return (
    <div className="poll-results">
      <h3>Live Results</h3>
      
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
          <Pie data={chartData} options={pieOptions} />
        </motion.div>
      </div>
      
      <div className="vote-details">
        {poll.options.map((option, index) => {
          const voteCount = poll.votes[option] || 0;
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
          
          return (
            <motion.div
              key={option}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="vote-item"
            >
              <div className="vote-header">
                <span className="option-name">{option}</span>
                <span className="vote-count">{voteCount} votes</span>
              </div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
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
    </div>
  );
};

export default PollResults;