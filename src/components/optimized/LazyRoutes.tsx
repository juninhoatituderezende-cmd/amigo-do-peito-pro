import { lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy dashboard components
export const LazyAdminDashboard = lazy(() => 
  import('@/pages/admin/AdminDashboard').then(module => ({
    default: module.default
  }))
);

export const LazyUserDashboard = lazy(() => 
  import('@/pages/user/UserDashboard').then(module => ({
    default: module.default
  }))
);

export const LazyProDashboard = lazy(() => 
  import('@/pages/pro/ProDashboard').then(module => ({
    default: module.default
  }))
);

export const LazyInfluencerDashboard = lazy(() => 
  import('@/pages/influencer/InfluencerDashboard').then(module => ({
    default: module.default
  }))
);

// Lazy load admin components
export const LazyAdminMarketplace = lazy(() => 
  import('@/pages/admin/AdminMarketplace').then(module => ({
    default: module.default
  }))
);

export const LazyAdminRelatorios = lazy(() => 
  import('@/pages/admin/AdminRelatorios').then(module => ({
    default: module.default
  }))
);

export const LazyAdminUsuarios = lazy(() => 
  import('@/pages/admin/AdminUsuarios').then(module => ({
    default: module.default
  }))
);

// Lazy load marketplace
export const LazyMarketplace = lazy(() => 
  import('@/pages/Marketplace').then(module => ({
    default: module.default
  }))
);

export const LazyUserMarketplace = lazy(() => 
  import('@/pages/user/UserMarketplace').then(module => ({
    default: module.default
  }))
);

// Loading fallback component
export const DashboardLoadingFallback = () => (
  <div className="container mx-auto px-4 py-8 space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
    
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-6 border rounded-lg space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
      ))}
    </div>
    
    <div className="grid gap-6 md:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="p-6 border rounded-lg space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SimpleLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="space-y-2 text-center">
      <Skeleton className="h-8 w-32 mx-auto" />
      <Skeleton className="h-4 w-48 mx-auto" />
    </div>
  </div>
);