
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Profissional */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-foreground">Amigo do Peito</h1>
            {user && (
              <span className="text-sm text-muted-foreground">
                Olá, {user.name || user.email}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-primary mb-6">
            Amigo do Peito
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Plataforma MLM para profissionais de estética
          </p>
        </div>

        {/* Botões Profissionais */}
        <div className="max-w-md mx-auto space-y-4">
          <button
            onClick={() => navigate('/auth?mode=register')}
            className="w-full bg-primary text-primary-foreground p-4 rounded-lg font-semibold hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Criar Conta
          </button>
          
          <button
            onClick={() => navigate('/auth?mode=login')}
            className="w-full bg-card text-foreground border-2 border-primary p-4 rounded-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Fazer Login
          </button>
          
          <button
            onClick={() => navigate('/marketplace')}
            className="w-full bg-card text-foreground border border-border p-4 rounded-lg font-semibold hover:bg-card/80 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Ver Marketplace
          </button>
        </div>
      </main>

      {/* Footer Profissional com Admin Access */}
      <footer className="bg-card border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2024 Amigo do Peito
            </p>
            
            {/* Botão Admin Discreto */}
            <button
              onClick={() => navigate('/admin')}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded"
              title="Acesso Administrativo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
