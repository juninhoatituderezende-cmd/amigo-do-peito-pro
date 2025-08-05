import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface ReferralTracking {
  referralCode: string | null;
  isReferred: boolean;
  setReferralCode: (code: string) => void;
  clearReferralCode: () => void;
}

export const useReferralTracking = (): ReferralTracking => {
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCodeState] = useState<string | null>(null);

  useEffect(() => {
    // Verifica se há um código de referência na URL
    const urlReferralCode = searchParams.get('ref');
    
    // Verifica se há um código salvo no localStorage
    const savedReferralCode = localStorage.getItem('pendingReferralCode');

    if (urlReferralCode) {
      // Prioriza o código da URL
      setReferralCodeState(urlReferralCode);
      localStorage.setItem('pendingReferralCode', urlReferralCode);
    } else if (savedReferralCode) {
      // Usa o código salvo se não houver na URL
      setReferralCodeState(savedReferralCode);
    }
  }, [searchParams]);

  const setReferralCode = (code: string) => {
    setReferralCodeState(code);
    localStorage.setItem('pendingReferralCode', code);
  };

  const clearReferralCode = () => {
    setReferralCodeState(null);
    localStorage.removeItem('pendingReferralCode');
  };

  return {
    referralCode,
    isReferred: !!referralCode,
    setReferralCode,
    clearReferralCode
  };
};