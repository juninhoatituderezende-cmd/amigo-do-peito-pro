
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { user, session, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    console.log('🔍 Index useEffect - Auth State:', { 
      loading, 
      hasSession: !!session, 
      hasUser: !!user,
      userRole: user?.role,
      currentUrl: window.location.href,
      currentPath: window.location.pathname,
      searchParams: window.location.search
    });

    // Detectar se está retornando do OAuth (tem parâmetros específicos)
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthParams = urlParams.has('code') || urlParams.has('access_token') || urlParams.has('token_type');
    
    if (hasOAuthParams) {
      console.log('🔄 OAuth callback detected in URL params:', {
        hasCode: urlParams.has('code'),
        hasAccessToken: urlParams.has('access_token'),
        hasTokenType: urlParams.has('token_type'),
        allParams: Object.fromEntries(urlParams.entries())
      });
    }

    // Detectar se o usuário acabou de fazer login via OAuth
    if (!loading && session && user) {
      console.log('🔄 OAuth return detected, user authenticated:', {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        sessionPresent: !!session
      });
      
      // Mostrar toast de sucesso
      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para seu dashboard...",
        variant: "default",
      });
      
      // Redirecionar baseado no role do usuário
      setTimeout(() => {
        const targetRoute = user.role === 'admin' ? '/admin' :
                          user.role === 'professional' ? '/profissional/dashboard' :
                          user.role === 'influencer' ? '/influenciador/dashboard' :
                          '/usuario/dashboard';
        
        console.log('🎯 Redirecting to:', targetRoute);
        navigate(targetRoute);
      }, 1500);
    }

    // Log quando há problemas
    if (!loading && hasOAuthParams && !session) {
      console.error('❌ OAuth params detected but no session created');
    }
  }, [loading, session, user, navigate, toast]);

  // Show loading state during OAuth callback processing or if URL has OAuth params
  const urlParams = new URLSearchParams(window.location.search);
  const hasOAuthParams = urlParams.has('code') || urlParams.has('access_token') || urlParams.has('token_type');
  
  if (loading || hasOAuthParams) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">
            {hasOAuthParams ? 'Processando retorno do Google...' : 'Processando login...'}
          </p>
          {hasOAuthParams && (
            <p className="text-sm text-gray-600 mt-2">
              Aguarde enquanto validamos sua autenticação
            </p>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section - Focused and Direct */}
      <section className="py-20 md:py-32 gradient-dark text-white min-h-screen flex items-center">
        <div className="ap-container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 text-white animate-fade-in">
              <span className="text-primary">
                Amigo do Peito
              </span>
            </h1>
            <p className="text-2xl md:text-3xl text-gray-200 mb-12 max-w-3xl mx-auto animate-fade-in">
              A plataforma que conecta profissionais de saúde estética com clientes através de um sistema inovador de marketing multinível.
            </p>
            
            {/* 3 Main Action Buttons */}
            <div className="flex flex-col lg:flex-row gap-6 justify-center items-center max-w-4xl mx-auto">
              <Link to="/auth?mode=register" className="w-full lg:w-auto">
                <Button className="w-full lg:w-auto bg-primary text-black font-bold px-12 py-8 text-xl shadow-2xl hover:scale-105 transition-all duration-300">
                  🚀 Criar Conta
                </Button>
              </Link>
              
              <Link to="/auth?mode=login" className="w-full lg:w-auto">
                <Button className="w-full lg:w-auto bg-white/10 border-2 border-primary text-white font-bold px-12 py-8 text-xl backdrop-blur-sm transition-all duration-300 hover:bg-primary hover:text-black hover:scale-105">
                  🔑 Fazer Login
                </Button>
              </Link>
              
              <Link to="/admin-login" className="w-full lg:w-auto">
                <Button className="w-full lg:w-auto border-2 border-primary text-primary bg-white/5 font-bold px-12 py-8 text-xl backdrop-blur-sm transition-all duration-300 hover:bg-primary hover:text-black hover:scale-105">
                  🛡️ Admin
                </Button>
              </Link>
            </div>
            
            <p className="text-gray-400 mt-12 text-lg">
              Escolha seu perfil e comece agora mesmo
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
