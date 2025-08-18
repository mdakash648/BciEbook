import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme colors for light mode
const lightTheme = {
  // Background colors
  background: '#FFFFFF',
  surface: '#F8F9FA',
  card: '#FFFFFF',
  modal: '#FFFFFF',
  
  // Text colors
  text: '#212529',
  textSecondary: '#6C757D',
  textMuted: '#495057',
  textInverse: '#FFFFFF',
  
  // Border colors
  border: '#E5E7EB',
  borderLight: '#F1F3F5',
  borderDark: '#DEE2E6',
  
  // Button colors
  primary: '#4A90E2',
  primaryLight: '#E3F2FD',
  secondary: '#EEF2F7',
  danger: '#FDECEC',
  success: '#D4EDDA',
  warning: '#FFF3CD',
  
  // Status colors
  successText: '#155724',
  dangerText: '#D7263D',
  warningText: '#856404',
  
  // Shadow
  shadow: '#000000',
  
  // Special colors
  favorite: '#FF6B6B',
  favoriteLight: '#FFE5E5',
  overlay: 'rgba(0,0,0,0.5)',
  
  // Navigation
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
  tabBarActive: '#4A90E2',
  tabBarInactive: '#6C757D',
};

// Theme colors for dark mode
const darkTheme = {
  // Background colors
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2D2D2D',
  modal: '#2D2D2D',
  
  // Text colors
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#808080',
  textInverse: '#121212',
  
  // Border colors
  border: '#404040',
  borderLight: '#2D2D2D',
  borderDark: '#505050',
  
  // Button colors
  primary: '#4A90E2',
  primaryLight: '#1A3A5F',
  secondary: '#2D2D2D',
  danger: '#4A1A1A',
  success: '#1A4A1A',
  warning: '#4A3A1A',
  
  // Status colors
  successText: '#4CAF50',
  dangerText: '#F44336',
  warningText: '#FF9800',
  
  // Shadow
  shadow: '#000000',
  
  // Special colors
  favorite: '#FF6B6B',
  favoriteLight: '#4A1A1A',
  overlay: 'rgba(0,0,0,0.7)',
  
  // Navigation
  tabBar: '#1E1E1E',
  tabBarBorder: '#404040',
  tabBarActive: '#4A90E2',
  tabBarInactive: '#808080',
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from cache on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // Default to light mode if no preference is saved
        setIsDarkMode(false);
        await AsyncStorage.setItem('theme_preference', 'light');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      // Fallback to light mode
      setIsDarkMode(false);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('theme_preference', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setTheme = async (theme) => {
    try {
      const isDark = theme === 'dark';
      setIsDarkMode(isDark);
      await AsyncStorage.setItem('theme_preference', theme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value = {
    theme,
    isDarkMode,
    isLoading,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
