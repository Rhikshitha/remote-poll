import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import soundManager from '../utils/soundManager';
import '../styles/EmojiReaction.css';

interface EmojiReactionProps {
  socket: any;
  pollId: string;
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

const EMOJIS = ['😂', '❤️', '👏', '🎉', '🤔', '😮', '🔥', '💡', '👍', '🚀'];

const EmojiReaction: React.FC<EmojiReactionProps> = ({ socket, pollId }) => {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const buttonSpring = useSpring({
    transform: selectedEmoji ? 'scale(1.2)' : 'scale(1)',
    config: { tension: 300, friction: 10 }
  });

  useEffect(() => {
    if (!socket) return;

    socket.on('emoji-reaction', ({ emoji, x, y }: { emoji: string; x: number; y: number }) => {
      const newEmoji: FloatingEmoji = {
        id: Math.random().toString(36).substr(2, 9),
        emoji,
        x,
        y
      };
      
      setFloatingEmojis(prev => [...prev, newEmoji]);
      
      setTimeout(() => {
        setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
      }, 3000);
    });

    return () => {
      socket.off('emoji-reaction');
    };
  }, [socket]);

  const sendEmoji = (emoji: string) => {
    if (!socket) return;
    
    const x = Math.random() * 80 + 10;
    const y = Math.random() * 80 + 10;
    
    socket.emit('send-emoji', { pollId, emoji, x, y });
    
    setSelectedEmoji(emoji);
    setTimeout(() => setSelectedEmoji(null), 500);
    
    soundManager.play('whoosh');
    
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  };

  return (
    <div className="emoji-reaction-container">
      <AnimatePresence>
        {floatingEmojis.map(({ id, emoji, x, y }) => (
          <motion.div
            key={id}
            className="floating-emoji"
            initial={{ 
              opacity: 0, 
              scale: 0,
              x: `${x}%`,
              y: `${y}%`
            }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0, 1.5, 1, 0.5],
              y: [`${y}%`, `${y - 20}%`, `${y - 30}%`, `${y - 50}%`]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3 }}
          >
            {emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      <animated.button
        style={buttonSpring}
        className="emoji-trigger"
        onClick={() => setShowPicker(!showPicker)}
      >
        {selectedEmoji || '😊'}
      </animated.button>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            className="emoji-picker"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
          >
            {EMOJIS.map((emoji, index) => (
              <motion.button
                key={emoji}
                className="emoji-option"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  sendEmoji(emoji);
                  setShowPicker(false);
                }}
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmojiReaction;