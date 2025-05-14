
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="ap-container py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-ap-orange">Amigo do Peito</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-gray-800 hover:text-ap-orange transition-colors">
            Início
          </Link>
          <Link to="/sobre" className="text-gray-800 hover:text-ap-orange transition-colors">
            Sobre
          </Link>
          {!user && (
            <Button 
              onClick={() => navigate("/cadastro")}
              className="bg-ap-orange hover:bg-ap-orange/90"
            >
              Cadastrar
            </Button>
          )}
          {user && user.role === "professional" && (
            <Link to="/profissional" className="text-gray-800 hover:text-ap-orange transition-colors">
              Meu Painel
            </Link>
          )}
          {user && user.role === "admin" && (
            <Link to="/admin" className="text-gray-800 hover:text-ap-orange transition-colors">
              Dashboard Admin
            </Link>
          )}
          {user && (
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="border-ap-orange text-ap-orange hover:bg-ap-orange hover:text-white"
            >
              Sair
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-gray-800"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
        <div className="md:hidden bg-white py-4 px-6 shadow-md">
          <div className="flex flex-col space-y-4">
            <Link to="/" 
              className="text-gray-800 hover:text-ap-orange transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Início
            </Link>
            <Link to="/sobre" 
              className="text-gray-800 hover:text-ap-orange transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sobre
            </Link>
            {!user && (
              <Link to="/cadastro" 
                className="text-ap-orange font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cadastrar
              </Link>
            )}
            {user && user.role === "professional" && (
              <Link to="/profissional" 
                className="text-gray-800 hover:text-ap-orange transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Meu Painel
              </Link>
            )}
            {user && user.role === "admin" && (
              <Link to="/admin" 
                className="text-gray-800 hover:text-ap-orange transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard Admin
              </Link>
            )}
            {user && (
              <button 
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="text-ap-orange text-left"
              >
                Sair
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
