
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  TrendingUp, 
  ShoppingCart, 
  Settings, 
  LogOut,
  Home,
  Info
} from "lucide-react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isMobile, touchDevice } = useMobileOptimization();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="gradient-dark text-foreground shadow-xl sticky top-0 z-50 border-b border-primary/20">
      <div className="ap-container py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">Amigo do Peito</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-foreground hover:text-primary transition-all hover-gold">
            Início
          </Link>
          <Link to="/sobre" className="text-foreground hover:text-primary transition-all hover-gold">
            Sobre
          </Link>
          <Link to="/marketplace" className="text-foreground hover:text-primary transition-all hover-gold">
            Marketplace
          </Link>
          <Link to="/todos" className="text-foreground hover:text-primary transition-all hover-gold">
            Tarefas
          </Link>
          {!user && (
            <Button 
              onClick={() => navigate("/cadastro")}
              className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-lg"
            >
              Cadastrar
            </Button>
          )}
          {user && user.role === "user" && (
            <Link to="/usuario/dashboard" className="text-foreground hover:text-primary transition-all hover-gold">
              Meu Painel
            </Link>
          )}
          {user && user.role === "professional" && (
            <Link to="/profissional/dashboard" className="text-foreground hover:text-primary transition-all hover-gold">
              Painel Profissional
            </Link>
          )}
          {user && user.role === "influencer" && (
            <Link to="/influenciador/dashboard" className="text-foreground hover:text-primary transition-all hover-gold">
              Painel Influenciador
            </Link>
          )}
          {user && user.role === "admin" && (
            <Link to="/admin" className="text-foreground hover:text-primary transition-all hover-gold">
              Dashboard Admin
            </Link>
          )}
          {user && (
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Sair
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-primary hover:text-primary/80 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={handleMobileMenuToggle}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleMobileMenuToggle();
          }}
          aria-label="Menu mobile"
        >
          {mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-sm py-4 px-6 border-t border-primary/20 mobile-menu">
          <div className="flex flex-col space-y-4">
            
            {/* Menu para usuários não logados */}
            {!user && (
              <>
                <Link to="/" 
                  className="text-foreground hover:text-primary transition-all hover-gold flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="h-5 w-5" />
                  Início
                </Link>
                <Link to="/sobre" 
                  className="text-foreground hover:text-primary transition-all hover-gold flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Info className="h-5 w-5" />
                  Sobre
                </Link>
                <Link to="/marketplace" 
                  className="text-foreground hover:text-primary transition-all hover-gold flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Marketplace
                </Link>
                <Link to="/cadastro" 
                  className="text-primary font-medium hover:text-primary/80"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Cadastrar
                </Link>
              </>
            )}

            {/* Menu otimizado para usuários comuns */}
            {user && user.role === "user" && (
              <>
                <Link to="/usuario/dashboard" 
                  className="text-foreground hover:text-primary transition-all hover-gold flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Meu Dashboard
                </Link>
                <Link to="/usuario/dashboard" 
                  className="text-foreground hover:text-primary transition-all hover-gold flex items-center gap-3"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    // Navegar para tab de créditos após um pequeno delay
                    setTimeout(() => {
                      const creditsTab = document.querySelector('[value="credits"]') as HTMLElement;
                      if (creditsTab) creditsTab.click();
                    }, 100);
                  }}
                >
                  <Wallet className="h-5 w-5" />
                  Créditos
                </Link>
                <Link to="/usuario/dashboard" 
                  className="text-foreground hover:text-primary transition-all hover-gold flex items-center gap-3"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setTimeout(() => {
                      const groupsTab = document.querySelector('[value="groups"]') as HTMLElement;
                      if (groupsTab) groupsTab.click();
                    }, 100);
                  }}
                >
                  <Users className="h-5 w-5" />
                  Grupos
                </Link>
                <Link to="/usuario/dashboard" 
                  className="text-foreground hover:text-primary transition-all hover-gold flex items-center gap-3"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setTimeout(() => {
                      const referralsTab = document.querySelector('[value="referrals"]') as HTMLElement;
                      if (referralsTab) referralsTab.click();
                    }, 100);
                  }}
                >
                  <TrendingUp className="h-5 w-5" />
                  Indicações
                </Link>
                <Link to="/marketplace" 
                  className="text-foreground hover:text-primary transition-all hover-gold flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Marketplace
                </Link>
                <Link to="/usuario/dashboard" 
                  className="text-foreground hover:text-primary transition-all hover-gold flex items-center gap-3"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setTimeout(() => {
                      const profileTab = document.querySelector('[value="profile"]') as HTMLElement;
                      if (profileTab) profileTab.click();
                    }, 100);
                  }}
                >
                  <Settings className="h-5 w-5" />
                  Configurações
                </Link>
                <button 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-primary text-left hover:text-primary/80 flex items-center gap-3"
                >
                  <LogOut className="h-5 w-5" />
                  Sair
                </button>
              </>
            )}

            {/* Menu para profissionais */}
            {user && user.role === "professional" && (
              <>
                <Link to="/profissional/dashboard" 
                  className="text-foreground hover:text-primary transition-all hover-gold flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Painel Profissional
                </Link>
                <Link to="/marketplace" 
                  className="text-foreground hover:text-primary transition-all hover-gold flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Marketplace
                </Link>
                <button 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-primary text-left hover:text-primary/80 flex items-center gap-3"
                >
                  <LogOut className="h-5 w-5" />
                  Sair
                </button>
              </>
            )}

            {/* Menu para influenciadores */}
            {user && user.role === "influencer" && (
              <>
                <Link to="/influenciador/dashboard" 
                  className="text-foreground hover:text-primary transition-all hover-gold flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Painel Influenciador
                </Link>
                <Link to="/marketplace" 
                  className="text-foreground hover:text-primary transition-all hover-gold flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Marketplace
                </Link>
                <button 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-primary text-left hover:text-primary/80 flex items-center gap-3"
                >
                  <LogOut className="h-5 w-5" />
                  Sair
                </button>
              </>
            )}

            {/* Menu para admins */}
            {user && user.role === "admin" && (
              <>
                <Link to="/admin" 
                  className="text-foreground hover:text-primary transition-all hover-gold flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard Admin
                </Link>
                <Link to="/marketplace" 
                  className="text-foreground hover:text-primary transition-all hover-gold flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Marketplace
                </Link>
                <button 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-primary text-left hover:text-primary/80 flex items-center gap-3"
                >
                  <LogOut className="h-5 w-5" />
                  Sair
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
