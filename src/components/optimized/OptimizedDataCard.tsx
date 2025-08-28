import React, { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OptimizedDataCardProps {
  title: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

const OptimizedDataCard = memo<OptimizedDataCardProps>(({
  title,
  description,
  loading = false,
  error = null,
  children,
  className = '',
  actions,
  icon
}) => {
  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <div>
            <CardTitle className="text-base font-medium">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
});

const LoadingSkeleton = memo(() => (
  <div className="space-y-2">
    <div className="flex items-center space-x-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-muted-foreground">Carregando...</span>
    </div>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
));

const ErrorState = memo<{ error: string }>(({ error }) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{error}</AlertDescription>
  </Alert>
));

OptimizedDataCard.displayName = 'OptimizedDataCard';
LoadingSkeleton.displayName = 'LoadingSkeleton';
ErrorState.displayName = 'ErrorState';

export { OptimizedDataCard };