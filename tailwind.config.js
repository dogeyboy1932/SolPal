/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}", 
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/screens/**/*.{js,jsx,ts,tsx}",
    "./src/features/**/*.{js,jsx,ts,tsx}",
    "./index.html" // For web
  ],
  theme: {
    extend: {
      colors: {
        // Warm AI Theme Colors (Claude-inspired)
        warm: {
          primary: '#D97539',
          secondary: '#B85C38', 
          tertiary: '#8B4513',
          dark: '#2B1810',
        },
        neutral: {
          light: '#FDF7F0',
          gentle: '#F9EEE1',
          warm: '#F5E6D3',
          medium: '#E8D5B7',
          muted: '#D4B896',
        },
        accent: {
          gold: '#E49B3F',
          amber: '#CD853F',
          copper: '#B87333',
          bronze: '#A0622D',
        },
        surface: {
          primary: '#1A1A1A',
          secondary: '#2D2D2D',
          tertiary: '#404040',
          elevated: '#4A4A4A',
        },
        // iOS System Colors (adapted for warm theme)
        system: {
          blue: '#007AFF',
          green: '#34C759', 
          orange: '#FF9500',
          red: '#FF3B30',
          purple: '#AF52DE',
          pink: '#FF2D92',
        }
      },
      fontFamily: {
        'ios': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'ios': '12px',
        'elevated': '16px',
      },
      boxShadow: {
        'warm': '0 4px 12px rgba(217, 117, 57, 0.15)',
        'ios': '0 1px 3px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
