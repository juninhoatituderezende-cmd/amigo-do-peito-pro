import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading, session } = useAuth();
  const location = useLocation();

  // Show loading while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // If no session or user, redirect to admin login
  if (!session || !user) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  // If user is not admin, redirect to their appropriate dashboard
  if (user.role !== 'admin') {
    const targetRoute = user.role === 'professional' ? '/profissional/dashboard' :
                       user.role === 'influencer' ? '/influenciador/dashboard' :
                       '/usuario/dashboard';
    return <Navigate to={targetRoute} replace />;
  }

  // User is admin, allow access
  return <>{children}</>;
};