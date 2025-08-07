import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const AuthRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      console.log('Redirecting user based on role:', user.role);
      
      // Redirect based on user role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'professional') {
        navigate('/profissional');
      } else if (user.role === 'influencer') {
        navigate('/influenciador/dashboard');
      } else {
        // Regular user (role === null)
        navigate('/usuario/dashboard');
      }
    }
  }, [user, loading, navigate]);

  return null; // This component doesn't render anything
};