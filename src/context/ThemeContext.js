// FieldSync v2 - Theme Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme, getTheme } from '../constants/theme';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fieldsync-darkmode');
      return saved === 'true';
    }
    return false;
  });

  const colors = getTheme(isDarkMode);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('fieldsync-darkmode', String(newValue));
      return newValue;
    });
  };

  // Apply CSS custom properties to document root
  useEffect(() => {
    const root = document.documentElement;
    const theme = isDarkMode ? darkTheme : lightTheme;

    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    root.style.setProperty('--color-background', theme.background);
    root.style.setProperty('--color-card', theme.cardBg);
    root.style.setProperty('--color-text-primary', theme.textPrimary);
    root.style.setProperty('--color-text-secondary', theme.textSecondary);
    root.style.setProperty('--color-border', theme.border);
    root.style.setProperty('--color-input-bg', theme.inputBg);
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, colors, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
