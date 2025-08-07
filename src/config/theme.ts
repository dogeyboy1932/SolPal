// Cyberpunk Theme Configuration for UI Libraries

import { MD3DarkTheme } from 'react-native-paper';

// Cyberpunk Color Palette
export const cyberpunkColors = {
  primary: '#00f6ff', // Neon Blue
  secondary: '#ff00ff', // Neon Pink
  tertiary: '#9d00ff', // Neon Purple
  background: '#0d0d0d', // Near Black
  surface: '#1a1a1a', // Dark Gray
  text: '#ffffff', // White
  subtext: '#a0a0a0', // Light Gray
  error: '#ff3b30', // Red
};

// React Native Paper Theme (Cyberpunk)
export const cyberpunkPaperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: cyberpunkColors.primary,
    accent: cyberpunkColors.secondary,
    background: cyberpunkColors.background,
    surface: cyberpunkColors.surface,
    text: cyberpunkColors.text,
    placeholder: cyberpunkColors.subtext,
    error: cyberpunkColors.error,
  },
};

// Gluestack UI Theme (Cyberpunk)
export const cyberpunkGluestackConfig = {
  tokens: {
    colors: {
      primary: {
        500: cyberpunkColors.primary,
      },
      secondary: {
        500: cyberpunkColors.secondary,
      },
    },
  },
};

export default {
  colors: cyberpunkColors,
  paperTheme: cyberpunkPaperTheme,
  gluestackConfig: cyberpunkGluestackConfig,
};
