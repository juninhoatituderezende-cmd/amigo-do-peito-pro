import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { ReactNode, useEffect } from "react";

interface AdminLoginRedirectProps {
  children: ReactNode;
}

export const AdminLoginRedirect = ({ children }: AdminLoginRedirectProps) => {
  const { user, loading, session } = useAuth();

  useEffect(() => {
    console.log('🔄 AdminLoginRedirect check:', {
      loading,
      hasSession: !!session,
      hasUser: !!user,
      userRole: user?.role,
    });
  }, [loading, session, user]);

  // Show loading while authentication state is being determined
  if (loading) {
    console.log('⏳ AdminLoginRedirect: Still loading auth state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // If user is already logged in as admin, redirect to dashboard
  if (session && user && user.role === 'admin') {
    console.log('✅ AdminLoginRedirect: Admin already logged in, redirecting to dashboard');
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Show login form
  console.log('📝 AdminLoginRedirect: Showing admin login form');
  return <>{children}</>;
};