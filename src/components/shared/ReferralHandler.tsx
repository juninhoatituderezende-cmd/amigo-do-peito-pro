import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// Hook para capturar e processar códigos de referência
export const useReferralHandler = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const referralCode = searchParams.get('ref');
    
    if (referralCode) {
      // Salva o código de referência no localStorage para usar no cadastro
      localStorage.setItem('referralCode', referralCode);
      
      toast({
        title: "Indicação detectada!",
        description: `Você foi indicado pelo código: ${referralCode}`,
      });
    }
  }, [searchParams, toast]);

  const getReferralCode = () => {
    return localStorage.getItem('referralCode');
  };

  const clearReferralCode = () => {
    localStorage.removeItem('referralCode');
  };

  return {
    getReferralCode,
    clearReferralCode
  };
};

// Componente para gerar links de referência
export const generateReferralLink = (referralCode: string, baseUrl: string = window.location.origin) => {
  return `${baseUrl}/register?ref=${referralCode}`;
};

// Função para gerar código de referência único
export const generateReferralCode = (userName: string) => {
  const cleanName = userName.replace(/\s+/g, '').toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${cleanName.substring(0, 6)}${randomSuffix}`;
};

// Componente wrapper para páginas que precisam lidar com referências
export const ReferralHandler = ({ children }: { children: React.ReactNode }) => {
  useReferralHandler();
  return <>{children}</>;
};