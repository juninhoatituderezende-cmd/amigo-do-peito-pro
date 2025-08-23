import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { ReactNode, useEffect } from "react";

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading, session } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('🔒 AdminProtectedRoute check:', {
      loading,
      hasSession: !!session,
      hasUser: !!user,
      userRole: user?.role,
      currentPath: location.pathname
    });
  }, [loading, session, user, location.pathname]);

  // Show loading while authentication state is being determined
  if (loading) {
    console.log('⏳ AdminProtectedRoute: Still loading auth state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // If no session or user, redirect to admin login
  if (!session || !user) {
    console.log('🚫 AdminProtectedRoute: No session or user, redirecting to admin login');
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  // If user is not admin, redirect to their appropriate dashboard
  if (user.role !== 'admin') {
    console.log('🚫 AdminProtectedRoute: User is not admin, redirecting to user dashboard');
    const targetRoute = user.role === 'professional' ? '/profissional/dashboard' :
                       user.role === 'influencer' ? '/influenciador/dashboard' :
                       '/usuario/dashboard';
    return <Navigate to={targetRoute} replace />;
  }

  console.log('✅ AdminProtectedRoute: Access granted to admin user');
  // User is admin, allow access
  return <>{children}</>;
};