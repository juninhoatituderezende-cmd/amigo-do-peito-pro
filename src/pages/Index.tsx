
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { MobileButton } from "@/components/ui/mobile-button";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { user, session, loading } = useAuth();
  const { toast } = useToast();
  const { isMobile, touchDevice } = useMobileOptimization();

  useEffect(() => {
    // Detectar se está retornando do OAuth (tem parâmetros específicos)
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthParams = urlParams.has('code') || urlParams.has('access_token') || urlParams.has('token_type');

    // Detectar se o usuário acabou de fazer login via OAuth
    if (!loading && session && user && hasOAuthParams) {
      // Mostrar toast de sucesso
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo(a), ${user.name || user.email}!`,
      });

      // Limpar parâmetros da URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [loading, session, user, toast]);

  // Show loading state during OAuth callback processing
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
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section - Focused and Direct */}
      <section className="py-20 md:py-32 gradient-dark text-foreground min-h-screen flex items-center">
        <div className="ap-container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 text-foreground animate-fade-in">
              <span className="text-primary">
                Amigo do Peito
              </span>
            </h1>
            <p className="text-2xl md:text-3xl text-gray-200 mb-12 max-w-3xl mx-auto animate-fade-in">
              A plataforma que conecta profissionais de saúde estética com clientes através de um sistema inovador de marketing multinível.
            </p>
            
            <div className="flex flex-col lg:flex-row gap-6 justify-center items-center max-w-3xl mx-auto">
              <Link to="/auth?mode=register" className="w-full lg:w-auto">
                <MobileButton 
                  className="w-full lg:w-auto bg-primary text-primary-foreground font-bold px-12 py-8 text-xl shadow-gold-glow hover:shadow-gold hover:scale-105 transition-all duration-300"
                  onClick={() => navigate('/auth?mode=register')}
                >
                  🚀 Criar Conta
                </MobileButton>
              </Link>
              
              <Link to="/auth?mode=login" className="w-full lg:w-auto">
                <MobileButton 
                  className="w-full lg:w-auto bg-card border-2 border-primary text-primary font-bold px-12 py-8 text-xl hover:bg-primary hover:text-primary-foreground hover:scale-105 transition-all duration-300"
                  onClick={() => navigate('/auth?mode=login')}
                >
                  🔑 Fazer Login
                </MobileButton>
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
