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
  // TEMPORARILY DISABLED - Testing mobile freeze issue
  // useEffect(() => {
  //   // Aplicar tema global centralizado
  //   applyGlobalTheme();
  //   
  //   // Observar mudanças e reforçar o tema
  //   const observer = new MutationObserver(() => {
  //     applyGlobalTheme();
  //   });
  //   
  //   observer.observe(document.documentElement, { 
  //     attributes: true, 
  //     attributeFilter: ['class'] 
  //   });
  //   observer.observe(document.body, { 
  //     attributes: true, 
  //     attributeFilter: ['class'] 
  //   });
  //   
  //   // Reaplicar tema a cada segundo como segurança
  //   const interval = setInterval(applyGlobalTheme, 1000);
  //   
  //   return () => {
  //     observer.disconnect();
  //     clearInterval(interval);
  //   };
  // }, []);

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