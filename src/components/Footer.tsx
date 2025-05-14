
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  const handleAdminClick = () => {
    navigate("/admin-login");
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-10">
      <div className="ap-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Amigo do Peito</h3>
            <p className="text-gray-300">Conectando profissionais de saúde estética com clientes através de um sistema único de marketing multinível.</p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-3">Links Úteis</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-gray-300 hover:text-white transition-colors">
                  Sobre nós
                </Link>
              </li>
              <li>
                <Link to="/cadastro" className="text-gray-300 hover:text-white transition-colors">
                  Cadastro de Profissionais
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-3">Contato</h4>
            <p className="text-gray-300">contato@amigodopeito.com</p>
            <p className="text-gray-300">São Paulo - SP, Brasil</p>
            <button 
              onClick={handleAdminClick} 
              className="mt-4 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm">Acesso Admin</span>
            </button>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-gray-400">
            &copy; {currentYear} Amigo do Peito. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
