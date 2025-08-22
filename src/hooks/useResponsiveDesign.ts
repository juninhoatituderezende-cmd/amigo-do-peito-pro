import { useState, useEffect } from 'react';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface UseResponsiveDesignReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
  width: number;
  height: number;
}

export function useResponsiveDesign(): UseResponsiveDesignReturn {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getBreakpoint = (width: number): Breakpoint => {
    if (width >= 1536) return '2xl';
    if (width >= 1280) return 'xl';
    if (width >= 1024) return 'lg';
    if (width >= 768) return 'md';
    return 'sm';
  };

  const breakpoint = getBreakpoint(dimensions.width);
  const isMobile = breakpoint === 'sm';
  const isTablet = breakpoint === 'md';
  const isDesktop = ['lg', 'xl', '2xl'].includes(breakpoint);

  return {
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
    width: dimensions.width,
    height: dimensions.height,
  };
}