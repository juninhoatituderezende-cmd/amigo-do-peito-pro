import React from 'react';

// Performance optimization utilities

// Console log remover for production
export const createLogger = (isDevelopment: boolean) => {
  if (isDevelopment) {
    return {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug
    };
  }
  
  // Production - only critical errors
  return {
    log: () => {},
    warn: () => {},
    error: console.error, // Keep critical errors
    info: () => {},
    debug: () => {}
  };
};

// Timer management for cleanup
export class TimerManager {
  private timers: Set<NodeJS.Timeout> = new Set();
  private intervals: Set<NodeJS.Timeout> = new Set();

  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, delay);
    
    this.timers.add(timer);
    return timer;
  }

  setInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay);
    this.intervals.add(interval);
    return interval;
  }

  clearTimeout(timer: NodeJS.Timeout): void {
    clearTimeout(timer);
    this.timers.delete(timer);
  }

  clearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

  cleanup(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.intervals.forEach(interval => clearInterval(interval));
    this.timers.clear();
    this.intervals.clear();
  }
}

// Memory leak detector
export const detectMemoryLeaks = (componentName: string) => {
  if (process.env.NODE_ENV !== 'development') return () => {};

  const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  return () => {
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryDiff = finalMemory - initialMemory;
    
    if (memoryDiff > 5 * 1024 * 1024) { // 5MB threshold
      console.warn(`Possible memory leak in ${componentName}: ${(memoryDiff / 1024 / 1024).toFixed(2)}MB`);
    }
  };
};

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Component performance tracker
export const performanceTracker = {
  start: (componentName: string) => {
    if (process.env.NODE_ENV === 'development') {
      performance.mark(`${componentName}-start`);
    }
  },
  
  end: (componentName: string) => {
    if (process.env.NODE_ENV === 'development') {
      performance.mark(`${componentName}-end`);
      performance.measure(
        `${componentName}-duration`,
        `${componentName}-start`,
        `${componentName}-end`
      );
      
      const measure = performance.getEntriesByName(`${componentName}-duration`)[0];
      if (measure && measure.duration > 16) {
        console.warn(`Performance warning: ${componentName} took ${measure.duration.toFixed(2)}ms`);
      }
    }
  }
};

// Bundle size analyzer
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    // Analyze loaded modules
    const modules = Object.keys(window as any).filter(key => 
      key.startsWith('__webpack') || key.startsWith('webpackChunk')
    );
    
    console.log('Loaded modules:', modules.length);
    
    // Memory usage
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      console.log('Memory usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      });
    }
  }
};

// Lazy component loader with error boundary
export const lazyLoad = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback: React.ComponentType = () => React.createElement('div', null, 'Loading...')
) => {
  return React.lazy(async () => {
    try {
      const module = await importFunc();
      return module;
    } catch (error) {
      console.error('Failed to load component:', error);
      // Return fallback component on error
      return { default: fallback as T };
    }
  });
};