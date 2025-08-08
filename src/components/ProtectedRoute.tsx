
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role: "admin" | "professional" | "influencer";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      // User not logged in, redirect to login
      navigate("/");
    } else if (!loading && user && user.role !== role) {
      // User doesn't have the required role
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
