import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeletionResult {
  user_id: string;
  profile_name?: string;
  success: boolean;
  sales_updated?: number;
  error?: string;
}

export const ForceDeleteUsers = () => {
  const [userIds, setUserIds] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [results, setResults] = useState<DeletionResult[] | null>(null);
  const { toast } = useToast();

  // Mutation para exclusão forçada
  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase.functions.invoke('force-delete-users', {
        body: { user_ids: ids, force_delete: true }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setResults(data.results);
      setShowConfirmDialog(false);
      setUserIds('');
      
      const successCount = data.summary.successful;
      const errorCount = data.summary.failed;
      
      toast({
        title: "Exclusão processada!",
        description: `${successCount} usuários excluídos, ${errorCount} erros.`,
        variant: successCount > 0 ? "default" : "destructive"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na exclusão",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleDelete = () => {
    const ids = userIds
      .split('\n')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (ids.length === 0) {
      toast({
        title: "IDs necessários",
        description: "Insira pelo menos um ID de usuário.",
        variant: "destructive"
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmDeletion = () => {
    const ids = userIds
      .split('\n')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    deleteMutation.mutate(ids);
  };

  const userIdsList = userIds
    .split('\n')
    .map(id => id.trim())
    .filter(id => id.length > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Exclusão Forçada de Usuários
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Remove usuários e todas as suas referências no sistema, incluindo constraints de foreign key
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              IDs dos Usuários (um por linha)
            </label>
            <Textarea
              value={userIds}
              onChange={(e) => setUserIds(e.target.value)}
              placeholder={`7ec1ca22-df8b-4fb8-9821-cad3889efef6
94e10050-3a14-4ccd-a02a-8dc2504fe9ad
268ed86a-706a-480b-b119-ef90a12bae64`}
              className="min-h-[120px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cole os IDs dos usuários que falharam na exclusão devido a constraints
            </p>
          </div>

          {userIdsList.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-sm font-medium mb-2">
                {userIdsList.length} usuário(s) serão processados:
              </div>
              <div className="space-y-1">
                {userIdsList.slice(0, 5).map((id, index) => (
                  <div key={index} className="text-xs font-mono bg-background px-2 py-1 rounded">
                    {id}
                  </div>
                ))}
                {userIdsList.length > 5 && (
                  <div className="text-xs text-muted-foreground">
                    ... e mais {userIdsList.length - 5} usuário(s)
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">
                  ⚠️ AÇÃO IRREVERSÍVEL
                </h4>
                <p className="text-sm text-muted-foreground">
                  Esta função irá:
                </p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Remover TODAS as referências de foreign key</li>
                  <li>• Atualizar vendas onde usuário é referenciador</li>
                  <li>• Excluir participações, créditos, notificações</li>
                  <li>• Remover perfis e contas de autenticação</li>
                </ul>
                <p className="text-xs text-destructive font-medium mt-3">
                  Use apenas para resolver constraints que impedem exclusão normal!
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleDelete}
            disabled={userIdsList.length === 0 || deleteMutation.isPending}
            variant="destructive"
            className="w-full"
          >
            {deleteMutation.isPending ? 'Processando...' : `Excluir ${userIdsList.length} Usuário(s)`}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resultados da Exclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {result.user_id}
                        </div>
                        {result.profile_name && (
                          <div className="font-medium text-sm">
                            {result.profile_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <div className="text-right">
                          <Badge variant="outline" className="text-green-700">
                            Excluído
                          </Badge>
                          {result.sales_updated && result.sales_updated > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {result.sales_updated} vendas atualizadas
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-right">
                          <Badge variant="destructive">Erro</Badge>
                          <div className="text-xs text-red-600 mt-1 max-w-[200px]">
                            {result.error}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
              Confirmar Exclusão Forçada
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja forçar a exclusão de <strong>{userIdsList.length} usuário(s)</strong>?
              <br /><br />
              Esta ação irá:
              <ul className="list-disc ml-4 mt-2">
                <li>Remover todas as referências de foreign key</li>
                <li>Excluir dados relacionados (créditos, participações, etc.)</li>
                <li>Remover contas de autenticação</li>
              </ul>
              <br />
              <span className="text-destructive font-medium">
                Esta ação não pode ser desfeita!
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeletion}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sim, Excluir Forçadamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};