import React, { useEffect } from 'react';
import '../styles/FunTheme.css';

interface FunThemeProps {
  children: React.ReactNode;
}

const spaceTheme = {
  colors: ['#1a1a2e', '#16213e', '#0f3460', '#533483']
};

const FunTheme: React.FC<FunThemeProps> = ({ children }) => {
  useEffect(() => {
    // Set CSS variables for space theme colors
    spaceTheme.colors.forEach((color, index) => {
      document.documentElement.style.setProperty(`--theme-color-${index + 1}`, color);
    });
  }, []);

  return (
    <div className="fun-theme theme-space">
      {children}
    </div>
  );
};

export default FunTheme;