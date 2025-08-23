import React, { createContext, useContext, useEffect } from 'react';
import { applyGlobalTheme } from '@/lib/theme';

interface ThemeContextType {
  theme: 'dark';
  isDarkMode: true;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isDarkMode: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply theme once on mount - NO aggressive polling
    applyGlobalTheme();
  }, []);

  const contextValue: ThemeContextType = {
    theme: 'dark',
    isDarkMode: true,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}