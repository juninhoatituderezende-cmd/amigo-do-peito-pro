import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AccountTypeSelector } from '@/components/auth/AccountTypeSelector';
import { AuthForm } from '@/components/auth/AuthForm';
import { SEOHead } from '@/components/ui/seo-head';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  const mode = (searchParams.get('mode') as 'login' | 'register') || 'login';
  const [selectedAccountType, setSelectedAccountType] = useState<'user' | 'professional' | 'influencer' | null>(null);
  const [step, setStep] = useState<'selection' | 'form'>('selection');

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (!loading && user) {
      const dashboardRoutes = {
        admin: '/admin',
        professional: '/profissional/dashboard',
        influencer: '/influenciador/dashboard',
        user: '/usuario/dashboard'
      };
      navigate(dashboardRoutes[user.role] || '/usuario/dashboard');
    }
  }, [user, loading, navigate]);

  const handleAccountTypeSelect = (type: 'user' | 'professional' | 'influencer') => {
    setSelectedAccountType(type);
    setStep('form');
  };

  const handleBackToSelection = () => {
    setSelectedAccountType(null);
    setStep('selection');
  };

  const handleAuthSuccess = () => {
    // Redirecionamento será feito automaticamente pelo useEffect
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title={mode === 'login' ? 'Login - Acesse sua conta' : 'Cadastro - Crie sua conta'}
        description={mode === 'login' 
          ? 'Faça login na sua conta como usuário, profissional ou influenciador'
          : 'Cadastre-se gratuitamente como usuário, profissional ou influenciador'
        }
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {step === 'selection' ? (
            <AccountTypeSelector
              selectedType={selectedAccountType}
              onSelect={handleAccountTypeSelect}
            />
          ) : (
            selectedAccountType && (
              <AuthForm
                mode={mode}
                accountType={selectedAccountType}
                onBack={handleBackToSelection}
                onSuccess={handleAuthSuccess}
              />
            )
          )}
          
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}
              <button
                onClick={() => {
                  const newMode = mode === 'login' ? 'register' : 'login';
                  navigate(`/auth?mode=${newMode}`);
                  setStep('selection');
                  setSelectedAccountType(null);
                }}
                className="ml-1 text-primary hover:underline"
              >
                {mode === 'login' ? 'Cadastre-se aqui' : 'Faça login aqui'}
              </button>
            </p>
          </div>
          
          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              ← Voltar ao início
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;