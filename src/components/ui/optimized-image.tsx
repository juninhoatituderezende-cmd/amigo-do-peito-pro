import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  lazy?: boolean;
  quality?: number;
  priority?: boolean;
}

export function OptimizedImage({ 
  src, 
  alt, 
  className, 
  fallback,
  lazy = true,
  quality = 85,
  priority = false,
  ...props 
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (lazy && !priority && imgRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observerRef.current?.disconnect();
            }
          });
        },
        { rootMargin: '50px' }
      );

      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const defaultFallback = (
    <div className={cn("flex items-center justify-center bg-muted", className)}>
      <ImageIcon className="w-8 h-8 text-muted-foreground" />
    </div>
  );

  if (hasError) {
    return fallback || defaultFallback;
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!isLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          loading={priority ? "eager" : "lazy"}
          {...props}
        />
      )}
    </div>
  );
}

// Avatar component with optimizations
export function OptimizedAvatar({ 
  src, 
  alt, 
  size = "md",
  fallback,
  ...props 
}: OptimizedImageProps & { 
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={cn(
        "rounded-full object-cover",
        sizeClasses[size]
      )}
      fallback={fallback}
      {...props}
    />
  );
}