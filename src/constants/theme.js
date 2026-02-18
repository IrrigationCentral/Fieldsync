// FieldSync v2 - Theme Constants
export const lightTheme = {
  primary: '#2D5016',
  secondary: '#8FBC3B',
  accent: '#F4B942',
  danger: '#C73E1D',
  water: '#4A90A4',
  soil: '#8B6F47',
  sky: '#87CEEB',
  muted: '#9CA986',
  background: '#FEFDF8',
  cardBg: '#FFFFFF',
  textPrimary: '#1A1F16',
  textSecondary: '#5C6650',
  success: '#52C41A',
  warning: '#FAAD14',
  border: '#E8E5D7',
  inputBg: '#FFFFFF',
  headerBg: '#2D5016',
  navBg: '#FFFFFF'
};

export const darkTheme = {
  primary: '#8FBC3B',
  secondary: '#2D5016',
  accent: '#F4B942',
  danger: '#FF6B6B',
  water: '#5BA8BE',
  soil: '#A68B5B',
  sky: '#5C9EBF',
  muted: '#8B9A7A',
  background: '#0D1117',
  cardBg: '#161B22',
  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  success: '#7EE787',
  warning: '#F0B429',
  border: '#30363D',
  inputBg: '#21262D',
  headerBg: '#161B22',
  navBg: '#161B22'
};

/** @param {boolean} isDark */
export const getTheme = (isDark) => isDark ? darkTheme : lightTheme;
