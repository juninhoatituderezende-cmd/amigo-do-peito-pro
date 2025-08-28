import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertTriangle, Users, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  name: string;
  price: number;
  max_participants: number;
  active: boolean;
  table_source: string;
}

interface DeletionReport {
  planName: string;
  affectedUsers: number;
  affectedGroups: number;
  success: boolean;
}

export const GlobalPlanDeletion = () => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deletionReport, setDeletionReport] = useState<DeletionReport | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todos os planos ativos
  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('unified-plans-loader', {
        body: { admin_view: true, include_inactive: true }
      });
      
      if (error) throw error;
      return data.plans as Plan[];
    }
  });

  // Mutation para excluir plano globalmente
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { data, error } = await supabase.functions.invoke('global-plan-deletion', {
        body: { plan_id: planId, confirm: true }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setDeletionReport(data.report);
      setShowConfirmDialog(false);
      setSelectedPlanId('');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      
      toast({
        title: "Plano excluído com sucesso!",
        description: `${data.report.affectedUsers} usuários foram atualizados.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir plano",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const selectedPlan = plans?.find(p => p.id === selectedPlanId);

  const handleDelete = () => {
    if (!selectedPlanId) return;
    setShowConfirmDialog(true);
  };

  const confirmDeletion = () => {
    deletePlanMutation.mutate(selectedPlanId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Excluir Plano Global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Carregando planos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Excluir Plano Global
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Remove completamente um plano de todos os usuários cadastrados
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Selecionar Plano para Exclusão
            </label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um plano..." />
              </SelectTrigger>
              <SelectContent>
                {plans?.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    <div className="flex items-center gap-2">
                      <span>{plan.name}</span>
                      <Badge variant={plan.active ? "default" : "secondary"}>
                        {plan.active ? "Ativo" : "Inativo"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        R$ {plan.price}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlan && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-destructive">
                    Atenção: Ação Irreversível
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Ao excluir o plano <strong>"{selectedPlan.name}"</strong>, as seguintes ações serão executadas:
                  </p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Plano será marcado como inativo/excluído</li>
                    <li>• Todas as associações de usuários serão removidas</li>
                    <li>• Status dos usuários será atualizado</li>
                    <li>• Cache será invalidado automaticamente</li>
                  </ul>
                  <p className="text-xs text-destructive font-medium mt-3">
                    Esta ação não pode ser desfeita!
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={handleDelete}
            disabled={!selectedPlanId || deletePlanMutation.isPending}
            variant="destructive"
            className="w-full"
          >
            {deletePlanMutation.isPending ? 'Excluindo...' : 'Excluir Plano Global'}
          </Button>
        </CardContent>
      </Card>

      {/* Relatório de Exclusão */}
      {deletionReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Relatório de Exclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {deletionReport.affectedUsers}
                </div>
                <div className="text-sm text-muted-foreground">
                  Usuários Atualizados
                </div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {deletionReport.affectedGroups}
                </div>
                <div className="text-sm text-muted-foreground">
                  Grupos Afetados
                </div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  Concluído
                </div>
                <div className="text-sm text-muted-foreground">
                  Status da Operação
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ Plano <strong>"{deletionReport.planName}"</strong> foi excluído com sucesso!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Confirmação */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão Global
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir o plano <strong>"{selectedPlan?.name}"</strong> de todos os usuários cadastrados?
              <br /><br />
              <span className="text-destructive font-medium">
                Isso não poderá ser desfeito.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeletion}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sim, Excluir Plano
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};