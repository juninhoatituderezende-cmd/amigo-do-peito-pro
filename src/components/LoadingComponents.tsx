import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
  className?: string;
  variant?: "default" | "dots" | "bars" | "pulse";
}

export function LoadingSpinner({ 
  size = "md", 
  text, 
  fullScreen = false, 
  className = "",
  variant = "default"
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  const containerClasses = fullScreen 
    ? "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    : "flex items-center justify-center";

  const renderSpinner = () => {
    switch (variant) {
      case "dots":
        return (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          </div>
        );
      case "bars":
        return (
          <div className="flex space-x-1">
            <div className="w-1 h-6 bg-primary animate-pulse [animation-delay:-0.4s]" />
            <div className="w-1 h-6 bg-primary animate-pulse [animation-delay:-0.2s]" />
            <div className="w-1 h-6 bg-primary animate-pulse" />
          </div>
        );
      case "pulse":
        return <div className={`${sizeClasses[size]} bg-primary rounded-full animate-pulse`} />;
      default:
        return <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />;
    }
  };

  const SpinnerComponent = (
    <div className={`flex items-center justify-center space-x-3 ${className}`}>
      {renderSpinner()}
      {text && (
        <span className="text-sm text-muted-foreground animate-fade-in">{text}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={containerClasses}>
        <div className="bg-background border rounded-lg p-6 shadow-lg">
          {SpinnerComponent}
        </div>
      </div>
    );
  }

  return SpinnerComponent;
}

export function LoadingButton({ children, loading, loadingText = "Carregando...", variant = "default", size = "default", ...props }: any) {
  return (
    <Button {...props} disabled={loading || props.disabled} variant={variant} size={size}>
      {loading ? (
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </Button>
  );
}

export function SkeletonCard({ animate = true }: { animate?: boolean }) {
  return (
    <Card className={animate ? "animate-pulse" : ""}>
      <CardHeader>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex space-x-2 pt-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4 pb-2 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 w-24" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={`row-${i}`} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton 
              key={`cell-${i}-${j}`} 
              className={`h-4 ${j === 0 ? 'w-32' : j === columns - 1 ? 'w-16' : 'w-24'}`} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${
            i === lines - 1 ? 'w-2/3' : i === 0 ? 'w-full' : 'w-5/6'
          }`} 
        />
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-16 mt-2" />
            <Skeleton className="h-3 w-24 mt-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-end space-x-2">
              <Skeleton className="h-3 w-8" />
              <Skeleton className={`w-4 h-${8 + (i * 2)}`} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}