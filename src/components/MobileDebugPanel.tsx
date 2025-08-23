import React, { useState, useEffect } from 'react';
import { useMobileOptimization, useMobilePerformanceDebug } from '@/hooks/useMobileOptimization';

export const MobileDebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { isMobile, isTablet, touchDevice } = useMobileOptimization();
  
  useMobilePerformanceDebug();

  useEffect(() => {
    // Só ativa em desenvolvimento
    if (process.env.NODE_ENV !== 'development') return;

    // Captura apenas erros críticos
    const originalError = console.error;

    console.error = (...args) => {
      setLogs(prev => [...prev.slice(-5), `❌ ${args.join(' ')}`]);
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  // Só mostra em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Botão para mostrar/esconder debug */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-[9999] bg-destructive text-destructive-foreground p-2 rounded-full text-xs font-mono"
        style={{ fontSize: '10px' }}
      >
        🔍
      </button>

      {/* Panel de debug */}
      {isVisible && (
        <div className="fixed top-0 left-0 right-0 z-[9998] bg-background/90 text-foreground p-4 max-h-[300px] overflow-y-auto text-xs font-mono">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Mobile Debug Panel</h3>
            <button onClick={() => setIsVisible(false)} className="text-red-400">✕</button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-2 text-[10px]">
            <div>Mobile: {isMobile ? '✅' : '❌'}</div>
            <div>Tablet: {isTablet ? '✅' : '❌'}</div>
            <div>Touch: {touchDevice ? '✅' : '❌'}</div>
          </div>
          
          <div className="border-t border-gray-600 pt-2">
            <h4 className="font-semibold mb-1">Recent Errors:</h4>
            {logs.length === 0 ? (
              <div className="text-green-400">No errors detected</div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-[10px] break-all">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-600 pt-2 mt-2">
            <button
              onClick={() => setLogs([])}
              className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-[10px]"
            >
              Clear Logs
            </button>
          </div>
        </div>
      )}
    </>
  );
};