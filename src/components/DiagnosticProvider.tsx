import React, { createContext, useContext, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface DiagnosticContextType {
  connectionStatus: 'testing' | 'connected' | 'failed' | 'unknown';
  lastError: string | null;
  testConnection: () => Promise<void>;
}

const DiagnosticContext = createContext<DiagnosticContextType | undefined>(undefined);

export const useDiagnostic = () => {
  const context = useContext(DiagnosticContext);
  if (context === undefined) {
    throw new Error('useDiagnostic must be used within a DiagnosticProvider');
  }
  return context;
};

interface DiagnosticProviderProps {
  children: React.ReactNode;
}

export const DiagnosticProvider: React.FC<DiagnosticProviderProps> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed' | 'unknown'>('unknown');
  const [lastError, setLastError] = useState<string | null>(null);

  const testConnection = async () => {
    setConnectionStatus('testing');
    setLastError(null);

    try {
      await logger.logActivity('diagnostic_test_started');
      
      const isConnected = await logger.testSupabaseConnection();
      
      if (isConnected) {
        setConnectionStatus('connected');
        await logger.logActivity('diagnostic_test_success');
      } else {
        setConnectionStatus('failed');
        setLastError('Falha na conexão com Supabase');
        await logger.logActivity('diagnostic_test_failed', { reason: 'connection_failed' });
      }
    } catch (error) {
      console.error('Diagnostic error:', error);
      setConnectionStatus('failed');
      setLastError(error instanceof Error ? error.message : 'Erro desconhecido');
      await logger.logError(error as Error, 'DiagnosticProvider');
    }
  };

  useEffect(() => {
    // Teste automático na inicialização
    testConnection();
  }, []);

  const value: DiagnosticContextType = {
    connectionStatus,
    lastError,
    testConnection
  };

  return (
    <DiagnosticContext.Provider value={value}>
      {children}
    </DiagnosticContext.Provider>
  );
};