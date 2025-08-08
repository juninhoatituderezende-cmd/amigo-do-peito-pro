import React, { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Componente para loading skeleton customizável
export const LoadingSkeleton = ({ 
  type = 'card',
  count = 1 
}: { 
  type?: 'card' | 'list' | 'table' | 'dashboard';
  count?: number;
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[80%]" />
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'list':
        return (
          <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'table':
        return (
          <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        );
      
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-8 w-[60px]" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
            ))}
          </div>
        );
      
      default:
        return <Skeleton className="h-20 w-full" />;
    }
  };

  return renderSkeleton();
};

// HOC para lazy loading com skeleton personalizado
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));
  
  return React.forwardRef<any, P>((props, ref) => (
    <Suspense fallback={fallback || <LoadingSkeleton type="card" count={3} />}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));
};

// Componente para lazy loading de imagens
export const LazyImage = ({ 
  src, 
  alt, 
  className,
  fallback 
}: {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}) => {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  return (
    <div className={`relative ${className}`}>
      {!loaded && !error && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      <img
        src={error ? fallback : src}
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        loading="lazy"
      />
    </div>
  );
};

// Hook para intersection observer (lazy loading ao entrar na viewport)
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
};

// Componente para carregar conteúdo só quando visível
export const LazySection = ({ 
  children, 
  fallback,
  className = ""
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, { rootMargin: '100px' });

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : (fallback || <LoadingSkeleton type="card" />)}
    </div>
  );
};