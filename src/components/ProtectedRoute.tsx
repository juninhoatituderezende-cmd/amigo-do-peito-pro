import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role: "admin" | "professional" | "influencer" | "user";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('ProtectedRoute Debug:', { loading, user, requiredRole: role });
    
    if (!loading && !user) {
      console.log('User not logged in, redirecting to auth');
      // User not logged in, redirect to auth
      navigate("/auth");
    } else if (!loading && user && user.role !== role) {
      console.log('User role mismatch:', { userRole: user.role, requiredRole: role });
      // User doesn't have the required role, redirect to correct dashboard
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (user.role === "professional") {
        navigate("/profissional/dashboard");
      } else if (user.role === "influencer") {
        navigate("/influenciador/dashboard");
      } else {
        navigate("/usuario/dashboard");
      }
    }
    
    // For professionals, check if they are approved
    if (!loading && user && user.role === "professional" && role === "professional" && user.approved === false) {
      navigate("/confirmacao");
    }
    
    // For influencers, check if they are approved
    if (!loading && user && user.role === "influencer" && role === "influencer" && user.approved === false) {
      navigate("/confirmacao");
    }
  }, [loading, user, navigate, role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-ap-orange" />
      </div>
    );
  }

  if (!user || user.role !== role) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;