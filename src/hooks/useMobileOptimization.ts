import { useEffect, useMemo } from 'react';

interface MobileOptimizationHook {
  isMobile: boolean;
  isTablet: boolean;
  touchDevice: boolean;
}

export function useMobileOptimization(): MobileOptimizationHook {
  const mobileData = useMemo(() => {
    if (typeof window === 'undefined') {
      return { isMobile: false, isTablet: false, touchDevice: false };
    }
    
    return {
      isMobile: window.innerWidth < 768,
      isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
      touchDevice: 'ontouchstart' in window
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Previne zoom duplo toque
    let lastTouchEnd = 0;
    const preventDoubleZoom = (event: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };

    // Otimizações específicas para mobile
    if (mobileData.isMobile) {
      // Força aceleração de hardware
      document.body.style.transform = 'translateZ(0)';
      document.body.style.webkitTransform = 'translateZ(0)';
      
      // Adiciona listener para prevenir zoom duplo
      document.addEventListener('touchend', preventDoubleZoom, { passive: false });
    }

    return () => {
      if (mobileData.isMobile) {
        document.removeEventListener('touchend', preventDoubleZoom);
      }
    };
  }, [mobileData.isMobile]);

  return mobileData;
}

// Hook para debugging de performance (apenas em desenvolvimento)
export function useMobilePerformanceDebug() {
  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return;

    let frameCount = 0;
    let lastTime = Date.now();
    let animationId: number;

    const checkPerformance = () => {
      frameCount++;
      const now = Date.now();
      
      if (now - lastTime >= 5000) { // Check every 5 seconds
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        
        if (fps < 30) {
          console.warn('Low FPS detected:', fps);
        }
        
        frameCount = 0;
        lastTime = now;
      }
      
      animationId = requestAnimationFrame(checkPerformance);
    };

    animationId = requestAnimationFrame(checkPerformance);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);
}