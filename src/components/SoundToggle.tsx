import React, { useState } from 'react';
import soundManager from '../utils/soundManager';
import '../styles/SoundToggle.css';

const SoundToggle: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());

  const handleToggle = () => {
    const newState = soundManager.toggle();
    setSoundEnabled(newState);
    if (newState) {
      soundManager.play('click');
    }
  };

  return (
    <button
      className={`sound-toggle ${soundEnabled ? 'enabled' : 'disabled'}`}
      onClick={handleToggle}
      title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
    >
      {soundEnabled ? '🔊' : '🔇'}
    </button>
  );
};

export default SoundToggle;