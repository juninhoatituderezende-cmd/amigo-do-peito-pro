import { useEffect } from 'react';

interface MobileOptimizationHook {
  isMobile: boolean;
  isTablet: boolean;
  touchDevice: boolean;
}

export function useMobileOptimization(): MobileOptimizationHook {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
  const touchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

  useEffect(() => {
    // Debug console para mobile
    if (typeof window !== 'undefined') {
      console.log('🔍 MOBILE DEBUG:', {
        isMobile,
        isTablet,
        touchDevice,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        screen: {
          width: window.screen.width,
          height: window.screen.height
        }
      });

      // Detecta eventos touch
      const logTouchEvent = (eventType: string) => (event: Event) => {
        console.log(`🔍 TOUCH EVENT: ${eventType}`, {
          target: (event.target as Element)?.tagName,
          timestamp: Date.now()
        });
      };

      if (touchDevice) {
        document.addEventListener('touchstart', logTouchEvent('touchstart'), { passive: true });
        document.addEventListener('touchend', logTouchEvent('touchend'), { passive: true });
        document.addEventListener('click', logTouchEvent('click'), { passive: true });
      }

      // Previne zoom duplo toque
      document.addEventListener('touchend', (event) => {
        const now = Date.now();
        const lastTouch = (document as any).lastTouchEnd || 0;
        
        if (now - lastTouch <= 300) {
          event.preventDefault();
        }
        
        (document as any).lastTouchEnd = now;
      }, { passive: false });

      // Otimizações específicas para mobile
      if (isMobile) {
        // Força aceleração de hardware
        document.body.style.transform = 'translateZ(0)';
        document.body.style.webkitTransform = 'translateZ(0)';
        
        // Desabilita seleção de texto em elementos interativos
        const interactiveElements = document.querySelectorAll('button, a, [role="button"]');
        interactiveElements.forEach(element => {
          (element as HTMLElement).style.webkitUserSelect = 'none';
          (element as HTMLElement).style.userSelect = 'none';
        });
      }
    }
  }, [isMobile, isTablet, touchDevice]);

  return {
    isMobile,
    isTablet,
    touchDevice
  };
}

// Hook para debugging de performance
export function useMobilePerformanceDebug() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let frameCount = 0;
    let lastTime = Date.now();

    const checkPerformance = () => {
      frameCount++;
      const now = Date.now();
      
      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        
        if (fps < 30) {
          console.warn('🐌 PERFORMANCE WARNING: Low FPS detected:', fps);
        }
        
        console.log('🔍 MOBILE PERFORMANCE:', {
          fps,
          memory: (performance as any).memory ? {
            used: Math.round((performance as any).memory.usedJSHeapSize / 1048576),
            total: Math.round((performance as any).memory.totalJSHeapSize / 1048576)
          } : 'not available'
        });
        
        frameCount = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(checkPerformance);
    };

    const animationId = requestAnimationFrame(checkPerformance);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);
}