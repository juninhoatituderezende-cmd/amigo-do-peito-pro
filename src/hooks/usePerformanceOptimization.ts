import { useEffect, useCallback, useMemo } from 'react';

// Debounce hook otimizado
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook para eventos de scroll
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = React.useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

// Hook para lazy loading de imagens
export function useLazyImage(src: string, threshold = 0.1) {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [imageRef, setImageRef] = React.useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!imageRef || !src) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(imageRef);

    return () => observer.disconnect();
  }, [imageRef, src, threshold]);

  return [imageSrc, setImageRef] as const;
}

// Hook para componentes lazy loading
export function useLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  deps: React.DependencyList = []
) {
  const [Component, setComponent] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    importFunc()
      .then(module => {
        setComponent(() => module.default);
      })
      .catch(err => {
        console.error('Failed to load component:', err);
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, deps);

  return { Component, loading, error };
}

// Hook para cleanup automático
export function useCleanup(cleanup: () => void, deps: React.DependencyList = []) {
  useEffect(() => {
    return cleanup;
  }, deps);
}

// Hook para performance monitoring
export function usePerformanceMonitor(componentName: string, enabled = false) {
  const startTime = useMemo(() => performance.now(), []);

  useEffect(() => {
    if (!enabled) return;

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Log apenas se for mais lento que 16ms (60fps)
    if (renderTime > 16) {
      console.warn(`Performance warning: ${componentName} took ${renderTime.toFixed(2)}ms to render`);
    }
  });

  return {
    mark: useCallback((label: string) => {
      if (enabled) {
        performance.mark(`${componentName}-${label}`);
      }
    }, [componentName, enabled]),

    measure: useCallback((startMark: string, endMark: string) => {
      if (enabled) {
        try {
          performance.measure(
            `${componentName}-duration`,
            `${componentName}-${startMark}`,
            `${componentName}-${endMark}`
          );
        } catch (error) {
          console.warn('Performance measurement failed:', error);
        }
      }
    }, [componentName, enabled])
  };
}

// Hook otimizado para API calls
export function useOptimizedFetch<T>(
  url: string | null,
  options: RequestInit = {}
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(options)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

import React from 'react';