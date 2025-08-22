import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  ArrowUp,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow
} from 'lucide-react';

// Toast notifications with better UX
interface ToastProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
}

export function CustomToast({ type = 'info', title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-orange-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const bgColors = {
    success: 'border-green-200 bg-green-50',
    error: 'border-red-200 bg-red-50',
    warning: 'border-orange-200 bg-orange-50',
    info: 'border-blue-200 bg-blue-50'
  };

  if (!isVisible) return null;

  return (
    <Card className={cn("border-l-4 shadow-lg animate-slide-in-right", bgColors[type])}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {icons[type]}
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{title}</h4>
            {message && <p className="text-sm text-muted-foreground mt-1">{message}</p>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
            className="h-auto p-1"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Scroll to top button
export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-shadow"
      size="icon"
    >
      <ArrowUp className="w-5 h-5" />
    </Button>
  );
}

// Connection status indicator
export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white p-2 text-center text-sm">
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span>Conexão perdida. Tentando reconectar...</span>
      </div>
    </div>
  );
}

// Status badges with animations
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'error';
  children: React.ReactNode;
  animate?: boolean;
}

export function StatusBadge({ status, children, animate = true }: StatusBadgeProps) {
  const variants = {
    active: 'bg-green-100 text-green-800 border-green-300',
    inactive: 'bg-gray-100 text-gray-800 border-gray-300',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    completed: 'bg-blue-100 text-blue-800 border-blue-300',
    error: 'bg-red-100 text-red-800 border-red-300'
  };

  const animations = animate ? {
    active: 'animate-pulse',
    pending: 'animate-bounce',
    error: 'animate-pulse'
  } : {};

  return (
    <Badge 
      className={cn(
        variants[status], 
        animations[status as keyof typeof animations],
        'border'
      )}
    >
      {children}
    </Badge>
  );
}

// Progress indicator with steps
interface ProgressStepsProps {
  steps: string[];
  currentStep: number;
  completedSteps?: number[];
}

export function ProgressSteps({ steps, currentStep, completedSteps = [] }: ProgressStepsProps) {
  return (
    <div className="flex items-center space-x-4 overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index);
        const isCurrent = index === currentStep;
        const isPending = index > currentStep && !isCompleted;

        return (
          <div key={step} className="flex items-center space-x-2 flex-shrink-0">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              isCompleted && "bg-green-500 text-white",
              isCurrent && "bg-primary text-primary-foreground animate-pulse",
              isPending && "bg-muted text-muted-foreground"
            )}>
              {isCompleted ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            <span className={cn(
              "text-sm whitespace-nowrap",
              isCompleted && "text-green-600",
              isCurrent && "font-medium",
              isPending && "text-muted-foreground"
            )}>
              {step}
            </span>
            {index < steps.length - 1 && (
              <div className={cn(
                "w-8 h-0.5 transition-colors",
                isCompleted ? "bg-green-500" : "bg-muted"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Loading overlay for better UX during navigation
export function NavigationLoader({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50">
      <div className="h-full bg-primary animate-pulse" style={{
        background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)',
        animation: 'slide 1s infinite'
      }} />
    </div>
  );
}