import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface ReferralTracking {
  referralCode: string | null;
  isReferred: boolean;
  setReferralCode: (code: string) => void;
  clearReferralCode: () => void;
  validateReferralCode: (code: string) => boolean;
}

// Enhanced security validation for referral codes
const validateReferralCodeFormat = (code: string): boolean => {
  // Check format: Must be alphanumeric, 3-16 characters
  const formatRegex = /^[A-Z0-9]{3,16}$/;
  if (!formatRegex.test(code)) {
    return false;
  }
  
  // Check for common patterns that might indicate malicious input
  const suspiciousPatterns = [
    /script/i,
    /javascript/i,
    /eval/i,
    /onclick/i,
    /onerror/i,
    /<|>|&lt;|&gt;/,
    /['"]/,
    /\\/
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(code));
};

// Secure storage with validation and encryption-like obfuscation
const secureStorage = {
  setItem: (key: string, value: string) => {
    if (!validateReferralCodeFormat(value)) {
      console.warn('Invalid referral code format, not storing');
      return;
    }
    
    // Simple obfuscation (not real encryption, but adds a layer)
    const obfuscated = btoa(value + '|' + Date.now());
    localStorage.setItem(key, obfuscated);
  },
  
  getItem: (key: string): string | null => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      const decoded = atob(stored);
      const [code, timestamp] = decoded.split('|');
      
      // Check if stored referral is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - parseInt(timestamp) > maxAge) {
        localStorage.removeItem(key);
        return null;
      }
      
      return validateReferralCodeFormat(code) ? code : null;
    } catch {
      // Invalid stored data, remove it
      localStorage.removeItem(key);
      return null;
    }
  },
  
  removeItem: (key: string) => {
    localStorage.removeItem(key);
  }
};

export const useReferralTracking = (): ReferralTracking => {
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCodeState] = useState<string | null>(null);

  useEffect(() => {
    // Verifica se há um código de referência na URL
    const urlReferralCode = searchParams.get('ref');
    
    // Verifica se há um código salvo no localStorage
    const savedReferralCode = secureStorage.getItem('pendingReferralCode');

    if (urlReferralCode && validateReferralCodeFormat(urlReferralCode)) {
      // Prioriza o código da URL se for válido
      setReferralCodeState(urlReferralCode);
      secureStorage.setItem('pendingReferralCode', urlReferralCode);
    } else if (savedReferralCode) {
      // Usa o código salvo se não houver na URL
      setReferralCodeState(savedReferralCode);
    }
  }, [searchParams]);

  const setReferralCode = (code: string) => {
    if (!validateReferralCodeFormat(code)) {
      console.warn('Invalid referral code format');
      return;
    }
    
    setReferralCodeState(code);
    secureStorage.setItem('pendingReferralCode', code);
  };

  const clearReferralCode = () => {
    setReferralCodeState(null);
    secureStorage.removeItem('pendingReferralCode');
  };

  return {
    referralCode,
    isReferred: !!referralCode,
    setReferralCode,
    clearReferralCode,
    validateReferralCode: validateReferralCodeFormat
  };
};