import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/PollMascot.css';

interface PollMascotProps {
  mood?: 'happy' | 'excited' | 'thinking' | 'celebrating';
  message?: string;
}

const PollMascot: React.FC<PollMascotProps> = ({ mood = 'happy', message }) => {
  const [currentMessage, setCurrentMessage] = useState(message || '');
  const [isBlinking, setIsBlinking] = useState(false);

  const mascotMoods = {
    happy: { eyes: '^^', mouth: 'w', color: '#FFD93D' },
    excited: { eyes: '**', mouth: 'O', color: '#FF6B6B' },
    thinking: { eyes: '--', mouth: '~', color: '#4ECDC4' },
    celebrating: { eyes: '><', mouth: 'D', color: '#95E1D3' }
  };

  const currentMood = mascotMoods[mood];

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000);

    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
    } else {
      const defaultMessages = {
        happy: "Let's learn together! 📚",
        excited: "Wow! Great participation! 🎉",
        thinking: "Hmm, interesting question... 🤔",
        celebrating: "Amazing job everyone! 🏆"
      };
      setCurrentMessage(defaultMessages[mood]);
    }
  }, [mood, message]);

  return (
    <div className="poll-mascot-container">
      <motion.div
        className="poll-mascot"
        animate={{
          y: [0, -10, 0],
          rotate: [-5, 5, -5]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        whileHover={{
          scale: 1.1,
          rotate: 360,
          transition: { duration: 0.5 }
        }}
        style={{ backgroundColor: currentMood.color }}
      >
        <div className="mascot-face">
          <div className="mascot-eyes">
            <span className={`eye left ${isBlinking ? 'blink' : ''}`}>
              {isBlinking ? '-' : currentMood.eyes[0]}
            </span>
            <span className={`eye right ${isBlinking ? 'blink' : ''}`}>
              {isBlinking ? '-' : currentMood.eyes[1]}
            </span>
          </div>
          <div className="mascot-mouth">{currentMood.mouth}</div>
        </div>
        
        <motion.div
          className="mascot-arms"
          animate={{
            rotate: mood === 'celebrating' ? [0, -20, 20, -20, 0] : [0, -10, 10, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity
          }}
        >
          <span className="arm left">(</span>
          <span className="arm right">)</span>
        </motion.div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentMessage}
          className="mascot-speech-bubble"
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          {currentMessage}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PollMascot;