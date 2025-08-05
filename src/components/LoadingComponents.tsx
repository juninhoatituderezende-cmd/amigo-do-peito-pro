import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  text, 
  fullScreen = false,
  className = "" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  const SpinnerComponent = (
    <div className={`flex items-center justify-center space-x-3 ${className}`}>
      <div 
        className={`${sizeClasses[size]} border-4 border-gray-200 border-t-primary rounded-full animate-spin`}
      />
      {text && (
        <span className={`text-muted-foreground ${textSizeClasses[size]}`}>
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-background border rounded-lg p-6 shadow-lg">
          {SpinnerComponent}
        </div>
      </div>
    );
  }

  return SpinnerComponent;
}

// Loading states for buttons
export function LoadingButton({ 
  children, 
  loading, 
  loadingText = "Carregando...", 
  ...props 
}: any) {
  return (
    <button disabled={loading} {...props}>
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>{loadingText}</span>
        </div>
      ) : children}
    </button>
  );
}

// Loading skeleton components
export function SkeletonCard() {
  return (
    <div className="border rounded-lg p-4 space-y-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-8 bg-gray-200 rounded w-full"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-10 bg-gray-200 rounded"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 bg-gray-100 rounded"></div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={`h-4 bg-gray-200 rounded ${
            i === lines - 1 ? 'w-2/3' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  );
}