// Warm AI-Inspired Dark Theme Configuration for UI Libraries

import { MD3DarkTheme } from 'react-native-paper';

// Warm AI Color Palette (Claude-inspired)
export const warmAIColors = {
  // Primary Warm Tones
  warm: {
    primary: '#D97539', // Warm orange
    secondary: '#B85C38', // Rich auburn
    tertiary: '#8B4513', // Deep brown
    dark: '#2B1810', // Dark chocolate
  },
  
  // Neutral Creams
  neutral: {
    light: '#FDF7F0', // Soft cream
    gentle: '#F9EEE1', // Between light and warm
    warm: '#F5E6D3', // Warm cream
    medium: '#E8D5B7', // Medium cream
    muted: '#D4B896', // Muted cream
  },
  
  // Accent Colors
  accent: {
    gold: '#E49B3F', // Soft gold
    amber: '#CD853F', // Warm amber
    copper: '#B87333', // Copper tone
    bronze: '#A0622D', // Bronze accent
  },
  
  // Surface Tones
  surface: {
    primary: '#1A1A1A', // Deep charcoal
    secondary: '#2D2D2D', // Medium charcoal
    tertiary: '#404040', // Light charcoal
    elevated: '#4A4A4A', // Elevated surface
  },
  
  // iOS System Colors (adapted)
  system: {
    blue: '#007AFF',
    green: '#34C759', 
    orange: '#FF9500',
    red: '#FF3B30',
    purple: '#AF52DE',
    pink: '#FF2D92',
  }
};

// React Native Paper Theme (Warm AI Dark)
export const warmAIPaperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary colors
    primary: warmAIColors.warm.primary,
    primaryContainer: warmAIColors.warm.secondary,
    onPrimary: warmAIColors.neutral.light,
    onPrimaryContainer: warmAIColors.neutral.warm,
    
    // Secondary colors
    secondary: warmAIColors.accent.amber,
    secondaryContainer: warmAIColors.warm.tertiary,
    onSecondary: warmAIColors.neutral.light,
    onSecondaryContainer: warmAIColors.neutral.medium,
    
    // Tertiary colors
    tertiary: warmAIColors.accent.copper,
    tertiaryContainer: warmAIColors.warm.dark,
    onTertiary: warmAIColors.neutral.warm,
    onTertiaryContainer: warmAIColors.neutral.light,
    
    // Surface colors
    surface: warmAIColors.surface.secondary,
    surfaceVariant: warmAIColors.surface.tertiary,
    onSurface: warmAIColors.neutral.light,
    onSurfaceVariant: warmAIColors.neutral.medium,
    
    // Background colors
    background: warmAIColors.surface.primary,
    onBackground: warmAIColors.neutral.light,
    
    // Error colors
    error: warmAIColors.system.red,
    onError: warmAIColors.neutral.light,
    errorContainer: '#5A1A1A',
    onErrorContainer: warmAIColors.neutral.warm,
    
    // Outline colors
    outline: warmAIColors.surface.elevated,
    outlineVariant: warmAIColors.surface.tertiary,
    
    // Inverse colors
    inverseSurface: warmAIColors.neutral.light,
    onInverseSurface: warmAIColors.surface.primary,
    inversePrimary: warmAIColors.warm.secondary,
    
    // Shadow
    shadow: warmAIColors.surface.primary,
    scrim: warmAIColors.surface.primary,
    
    // Surface tints
    surfaceTint: warmAIColors.warm.primary,
  },
  roundness: 12, // iOS-style rounded corners
};

// Gluestack UI Theme (simplified)
export const warmAIGluestackConfig = {
  tokens: {
    colors: {
      primary: {
        50: warmAIColors.neutral.light,
        100: warmAIColors.neutral.warm,
        200: warmAIColors.neutral.medium,
        300: warmAIColors.neutral.muted,
        400: warmAIColors.accent.gold,
        500: warmAIColors.warm.primary,
        600: warmAIColors.accent.amber,
        700: warmAIColors.warm.secondary,
        800: warmAIColors.warm.tertiary,
        900: warmAIColors.warm.dark,
        950: warmAIColors.surface.primary,
      },
      secondary: {
        50: warmAIColors.neutral.light,
        100: warmAIColors.neutral.warm,
        200: warmAIColors.neutral.medium,
        300: warmAIColors.accent.copper,
        400: warmAIColors.accent.bronze,
        500: warmAIColors.surface.elevated,
        600: warmAIColors.surface.tertiary,
        700: warmAIColors.surface.secondary,
        800: warmAIColors.surface.primary,
        900: '#0F0F0F',
        950: '#000000',
      },
    },
    space: {
      0: 0,
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 20,
      6: 24,
      7: 28,
      8: 32,
      9: 36,
      10: 40,
    },
    borderRadius: {
      none: 0,
      sm: 4,
      md: 8,
      lg: 12, // iOS standard
      xl: 16, // Elevated style
      '2xl': 20,
      '3xl': 24,
      full: 9999,
    },
  },
};

export default {
  colors: warmAIColors,
  paperTheme: warmAIPaperTheme,
  gluestackConfig: warmAIGluestackConfig,
};
