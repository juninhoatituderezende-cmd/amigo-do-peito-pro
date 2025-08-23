
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Simple loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-pulse rounded-full h-12 w-12 bg-primary mx-auto mb-4"></div>
          <p className="text-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="bg-background border-b border-border p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-primary text-2xl font-bold">Amigo do Peito</h1>
          {user && (
            <span className="text-foreground">Olá, {user.name || user.email}</span>
          )}
        </div>
      </header>

      {/* Minimal Hero */}
      <main className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold text-foreground mb-4">
          <span className="text-primary">Amigo do Peito</span>
        </h2>
        
        <p className="text-foreground/80 mb-12 text-lg max-w-2xl mx-auto">
          Plataforma MLM para profissionais de estética
        </p>

        {/* Simple Action Buttons */}
        <div className="space-y-4 max-w-md mx-auto">
          <button 
            onClick={() => navigate('/auth?mode=register')}
            className="w-full bg-primary text-black p-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            🚀 Criar Conta
          </button>
          
          <button 
            onClick={() => navigate('/auth?mode=login')}
            className="w-full bg-card text-foreground border border-primary p-4 rounded-lg font-semibold hover:bg-primary hover:text-black transition-colors"
          >
            🔑 Fazer Login
          </button>
          
          <button 
            onClick={() => navigate('/marketplace')}
            className="w-full bg-card text-foreground border border-border p-4 rounded-lg font-semibold hover:bg-card/80 transition-colors"
          >
            🛍️ Ver Marketplace
          </button>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-background border-t border-border p-4 text-center mt-auto">
        <p className="text-foreground/60">© 2024 Amigo do Peito</p>
      </footer>
    </div>
  );
};

export default Index;
