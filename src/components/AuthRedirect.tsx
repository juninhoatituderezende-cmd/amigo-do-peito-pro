import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardRoute, shouldRedirectUser } from '@/lib/routes';

export const AuthRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user) {
      const currentPath = location.pathname;
      
      // Check if user should be redirected
      if (shouldRedirectUser(currentPath, user.role)) {
        const dashboardRoute = getDashboardRoute(user.role);
        console.log('🔄 AuthRedirect: Redirecting user based on role:', user.role, 'to:', dashboardRoute);
        navigate(dashboardRoute, { replace: true });
      }
    }
  }, [user, loading, navigate, location.pathname]);

  return null; // This component doesn't render anything
};