import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long data stays fresh
      staleTime: 5 * 60 * 1000, // 5 minutes default
      
      // GC time: How long data stays in cache after components unmount
      gcTime: 10 * 60 * 1000, // 10 minutes default
      
      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry 4xx errors except 408 (timeout)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 408) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Background refetch configuration
      refetchOnWindowFocus: false, // Disable refetch on window focus
      refetchOnReconnect: true,    // Refetch when reconnecting
      refetchOnMount: true,        // Refetch when component mounts
      
      // Network mode
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations only once
      retry: 1,
      
      // Network mode for mutations
      networkMode: 'online',
    },
  },
});

// Performance monitoring for React Query
if (process.env.NODE_ENV === 'development') {
  queryClient.getQueryCache().subscribe((event) => {
    if (event?.type === 'observerResultsUpdated') {
      const queryKey = event.query.queryKey;
      const dataUpdateTime = event.query.state.dataUpdateCount;
      
      // Log slow queries
      if (dataUpdateTime > 1000) {
        console.warn(`🐌 Slow query detected:`, {
          queryKey,
          dataUpdateTime: `${dataUpdateTime}ms`,
          state: event.query.state.status
        });
      }
    }
  });
}

// Clear all queries on auth state change
export const clearAllQueries = () => {
  queryClient.clear();
};

// Invalidate specific query patterns
export const invalidateQueriesByPattern = (pattern: string[]) => {
  queryClient.invalidateQueries({ queryKey: pattern });
};

// Prefetch commonly used queries
export const prefetchCommonQueries = async () => {
  // Prefetch plans for faster loading
  queryClient.prefetchQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.functions.invoke('unified-plans-loader');
      return data?.plans || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};