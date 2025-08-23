import React, { Suspense, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { TimerManager, performanceTracker, analyzeBundleSize } from '@/utils/performanceOptimizer';

// Lazy load componentes pesados
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const InfluencerDashboard = React.lazy(() => import('@/pages/influencer/InfluencerDashboard'));
const ProDashboard = React.lazy(() => import('@/pages/pro/ProDashboard'));

// Timer manager global
export const globalTimerManager = new TimerManager();

// Error fallback component
const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Algo deu errado</h2>
      <p className="text-muted-foreground mb-4">
        {error.message || 'Erro desconhecido'}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-primary text-primary-foreground px-4 py-2 rounded"
      >
        Recarregar Página
      </button>
    </div>
  </div>
);

// Loading fallback
const LoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-foreground">Carregando...</p>
    </div>
  </div>
);

// Performance wrapper
export const PerformanceWrapper: React.FC<{
  children: React.ReactNode;
  componentName: string;
}> = ({ children, componentName }) => {
  useEffect(() => {
    performanceTracker.start(componentName);
    
    return () => {
      performanceTracker.end(componentName);
    };
  }, [componentName]);

  return <>{children}</>;
};

// App cleanup hook
export const useAppCleanup = () => {
  useEffect(() => {
    // Performance tracking
    if (process.env.NODE_ENV === 'development') {
      analyzeBundleSize();
    }

    // Cleanup on unmount
    return () => {
      globalTimerManager.cleanup();
    };
  }, []);
};

// Optimized route component
export const OptimizedRoute: React.FC<{
  component: React.ComponentType;
  componentName: string;
  children?: React.ReactNode;
}> = ({ component: Component, componentName, children }) => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingFallback />}>
        <PerformanceWrapper componentName={componentName}>
          <Component>{children}</Component>
        </PerformanceWrapper>
      </Suspense>
    </ErrorBoundary>
  );
};

// Memory-optimized image component
export const OptimizedImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}> = ({ src, alt, className, loading = 'lazy' }) => {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current || loading === 'eager') {
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [src, loading]);

  return (
    <div ref={imgRef} className={className}>
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          loading={loading}
        />
      )}
    </div>
  );
};