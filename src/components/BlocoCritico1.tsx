import React from 'react';

interface BlocoCritico1Props {
  title: string;
  description: string;
}

export const BlocoCritico1: React.FC<BlocoCritico1Props> = ({ title, description }) => {
  return (
    <div className="bloco-critico-1">
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="features">
        <div className="feature">
          <h3>Sistema de Autenticação Aprimorado</h3>
          <p>Implementação de autenticação mais robusta com melhorias na segurança.</p>
        </div>
        <div className="feature">
          <h3>Otimizações de Performance</h3>
          <p>Redução do tempo de carregamento e melhorias na responsividade.</p>
        </div>
        <div className="feature">
          <h3>Correções de Bugs</h3>
          <p>Correção de problemas de sincronização e resolução de conflitos de estado.</p>
        </div>
      </div>
    </div>
  );
};

export default BlocoCritico1;