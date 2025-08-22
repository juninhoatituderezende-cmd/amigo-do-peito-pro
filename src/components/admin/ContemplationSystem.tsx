import React from 'react';
import { ContemplationValidationSimple } from "./ContemplationValidationSimple";

interface ContemplationSystemProps {
  selectedGroup?: { id: string; name: string } | null;
}

export function ContemplationSystem({ selectedGroup }: ContemplationSystemProps) {
  if (!selectedGroup) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Selecione um grupo na aba "Grupos" para gerenciar contemplações</p>
      </div>
    );
  }

  return <ContemplationValidationSimple />;
}