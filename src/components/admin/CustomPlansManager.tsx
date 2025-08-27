import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/hooks/use-toast";
import { useResponsiveDesign } from "@/hooks/useResponsiveDesign";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Package, Users, DollarSign } from 'lucide-react';

interface CustomPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_months: number;
  features: string[];
  category: string;
  active: boolean;
  max_participants: number;
  professional_id: string | null;
  image_url: string | null;
  created_at: string;
}

export function CustomPlansManager() {
  const [plans, setPlans] = useState<CustomPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CustomPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_months: '1',
    features: '',
    category: 'service',
    max_participants: '10',
    active: true,
    image_url: null as string | null
  });
  const { toast } = useToast();
  const { isMobile } = useResponsiveDesign();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedPlans = (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) 
          ? plan.features.map(f => String(f)) 
          : []
      }));
      
      setPlans(formattedPlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planos customizados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting) return;

    // Validação de campos
    if (!formData.name.trim()) {
      toast({
        title: "❌ Erro de Validação",
        description: "Nome do plano é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: "❌ Erro de Validação", 
        description: "Preço deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.duration_months || parseInt(formData.duration_months) <= 0) {
      toast({
        title: "❌ Erro de Validação",
        description: "Duração deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.max_participants || parseInt(formData.max_participants) <= 0) {
      toast({
        title: "❌ Erro de Validação",
        description: "Máximo de participantes deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const featuresArray = formData.features.split('\n').filter(f => f.trim());
      
      const planData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        price: parseFloat(formData.price),
        duration_months: parseInt(formData.duration_months),
        features: featuresArray,
        category: formData.category,
        max_participants: parseInt(formData.max_participants),
        active: formData.active,
        image_url: formData.image_url
      };

      console.log('Enviando dados do plano:', planData);

      if (editingPlan) {
        const { data, error } = await supabase
          .from('custom_plans')
          .update(planData)
          .eq('id', editingPlan.id)
          .select();
        
        if (error) {
          console.error('Erro detalhado ao atualizar:', error);
          throw error;
        }
        
        console.log('Plano atualizado:', data);
        
        toast({
          title: "✅ Sucesso",
          description: "Plano atualizado com sucesso!",
        });
      } else {
        const { data, error } = await supabase
          .from('custom_plans')
          .insert([planData])
          .select();
        
        if (error) {
          console.error('Erro detalhado ao criar:', error);
          throw error;
        }
        
        console.log('Plano criado:', data);
        
        toast({
          title: "✅ Sucesso",
          description: "Plano criado com sucesso!",
        });
      }

      setIsDialogOpen(false);
      setEditingPlan(null);
      resetForm();
      await loadPlans();
    } catch (error: any) {
      console.error('Erro ao salvar plano:', error);
      toast({
        title: "❌ Erro",
        description: error.message || "Erro ao salvar plano. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (plan: CustomPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      duration_months: plan.duration_months.toString(),
      features: plan.features.join('\n'),
      category: plan.category,
      max_participants: plan.max_participants.toString(),
      active: plan.active,
      image_url: plan.image_url
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (planId: string) => {
    if (deleting) return; // Evitar múltiplas exclusões simultâneas
    
    setDeleting(planId);
    try {
      console.log('Tentando excluir plano:', planId);
      
      // Primeiro verificar se o plano existe
      const { data: existingPlan, error: fetchError } = await supabase
        .from('custom_plans')
        .select('id, name')
        .eq('id', planId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar plano:', fetchError);
        throw new Error('Plano não encontrado.');
      }

      console.log('Plano encontrado:', existingPlan);
      
      // Tentar excluir o plano
      const { data, error } = await supabase
        .from('custom_plans')
        .delete()
        .eq('id', planId)
        .select();

      if (error) {
        console.error('Erro detalhado ao excluir:', error);
        throw new Error(`Erro ao excluir: ${error.message}`);
      }

      console.log('Plano excluído com sucesso:', data);

      toast({
        title: "✅ Sucesso",
        description: `Plano "${existingPlan.name}" excluído com sucesso!`,
      });
      
      await loadPlans();
    } catch (error: any) {
      console.error('Erro ao excluir plano:', error);
      toast({
        title: "❌ Erro de Exclusão",
        description: error.message || "Não foi possível excluir o plano. Verifique se não há dependências.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('custom_plans')
        .update({ active: !currentStatus })
        .eq('id', planId);

      if (error) throw error;

      setPlans(prev => 
        prev.map(plan => 
          plan.id === planId 
            ? { ...plan, active: !currentStatus }
            : plan
        )
      );

      toast({
        title: "Sucesso",
        description: `Plano ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do plano.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration_months: '1',
      features: '',
      category: 'service',
      max_participants: '10',
      active: true,
      image_url: null
    });
  };

  const handleNewPlan = () => {
    setEditingPlan(null);
    resetForm();
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          {isMobile ? 'Planos' : 'Gerenciar Planos Customizados'}
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <MobileButton onClick={handleNewPlan} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Plano
            </MobileButton>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl h-[85vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
              </DialogTitle>
              <DialogDescription>
                {editingPlan ? 'Modifique as informações do plano.' : 'Preencha os dados para criar um novo plano.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2">
              <form onSubmit={handleSubmit} className="space-y-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nome do Plano</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: Plano Premium"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Categoria *</label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => {
                        console.log('Categoria selecionada:', value);
                        setFormData(prev => ({...prev, category: value}));
                      }}
                    >
                      <SelectTrigger className="bg-background border focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent 
                        className="bg-background border shadow-lg z-[100]" 
                        position="popper"
                        sideOffset={4}
                      >
                        <SelectItem value="service" className="hover:bg-muted focus:bg-muted">
                          🔧 Serviço
                        </SelectItem>
                        <SelectItem value="tattoo" className="hover:bg-muted focus:bg-muted">
                          🎨 Tatuagem
                        </SelectItem>
                        <SelectItem value="dental" className="hover:bg-muted focus:bg-muted">
                          🦷 Dental
                        </SelectItem>
                        <SelectItem value="course" className="hover:bg-muted focus:bg-muted">
                          📚 Curso
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <ImageUpload
                  currentImageUrl={formData.image_url}
                  onImageChange={(imageUrl) => setFormData({...formData, image_url: imageUrl})}
                  bucketName="plan-images"
                  path="plans"
                  maxSizeMB={5}
                />

                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descreva o plano..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Preço (R$) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="99.99"
                      className="bg-background"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duração (meses) *</label>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={formData.duration_months}
                      onChange={(e) => setFormData({...formData, duration_months: e.target.value})}
                      className="bg-background"
                      placeholder="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Máx. Participantes *</label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.max_participants}
                      onChange={(e) => setFormData({...formData, max_participants: e.target.value})}
                      className="bg-background"
                      placeholder="10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Recursos (um por linha)</label>
                  <Textarea
                    value={formData.features}
                    onChange={(e) => setFormData({...formData, features: e.target.value})}
                    placeholder="Acesso à plataforma&#10;Suporte prioritário&#10;Materiais exclusivos"
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({...formData, active: Boolean(checked)})}
                  />
                  <label htmlFor="active" className="text-sm font-medium">Plano ativo</label>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="w-full sm:w-auto"
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <MobileButton 
                    type="submit" 
                    className="w-full sm:w-auto"
                    disabled={submitting}
                  >
                    {submitting ? 'Salvando...' : (editingPlan ? 'Atualizar' : 'Criar')} Plano
                  </MobileButton>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Lista de Planos Customizados
          </CardTitle>
          <CardDescription>
            Gerencie todos os planos disponíveis na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isMobile ? (
            // Mobile Card Layout
            <div className="space-y-4 p-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="border border-border/50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        {plan.image_url && (
                          <img
                            src={plan.image_url}
                            alt={plan.name}
                            className="w-16 h-16 object-cover rounded-lg border border-border flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-medium text-lg truncate">{plan.name}</h3>
                            {plan.active ? (
                              <Badge className="bg-green-500">Ativo</Badge>
                            ) : (
                              <Badge variant="secondary">Inativo</Badge>
                            )}
                          </div>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{plan.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Categoria:</span>
                          <Badge variant="outline" className="ml-2">{plan.category}</Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Preço:</span>
                          <span className="ml-2 font-medium">R$ {plan.price.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duração:</span>
                          <span className="ml-2">{plan.duration_months} {plan.duration_months === 1 ? 'mês' : 'meses'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Máx. usuários:</span>
                          <span className="ml-2">{plan.max_participants}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <MobileButton
                            variant="outline"
                            size="sm"
                            onClick={() => togglePlanStatus(plan.id, plan.active)}
                            className="flex-1"
                          >
                            {plan.active ? 'Desativar' : 'Ativar'}
                          </MobileButton>
                          <MobileButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </MobileButton>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <MobileButton
                              variant="outline"
                              size="sm"
                              className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
                              disabled={deleting === plan.id}
                            >
                              {deleting === plan.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1" />
                                  Excluindo...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Excluir
                                </>
                              )}
                            </MobileButton>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-background border shadow-lg max-w-[90vw]">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription className="text-left">
                                Tem certeza que deseja excluir o plano <strong>"{plan.name}"</strong>?
                                <br /><br />
                                ⚠️ Esta ação não pode ser desfeita e removerá permanentemente:
                                <br />• O plano e suas configurações
                                <br />• Todos os dados relacionados
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel className="bg-background w-full sm:w-auto" disabled={deleting === plan.id}>
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(plan.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                                disabled={deleting === plan.id}
                              >
                                {deleting === plan.id ? 'Excluindo...' : 'Sim, Excluir'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Desktop Table Layout
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Participantes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {plan.image_url && (
                            <img
                              src={plan.image_url}
                              alt={plan.name}
                              className="w-12 h-12 object-cover rounded-lg border border-border flex-shrink-0"
                            />
                          )}
                          <div>
                            <div className="font-medium">{plan.name}</div>
                            {plan.description && (
                              <div className="text-sm text-muted-foreground">{plan.description}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{plan.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          R$ {plan.price.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>{plan.duration_months} {plan.duration_months === 1 ? 'mês' : 'meses'}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {plan.max_participants}
                        </div>
                      </TableCell>
                      <TableCell>
                        {plan.active ? (
                          <Badge className="bg-green-500">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePlanStatus(plan.id, plan.active)}
                          >
                            {plan.active ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-background border shadow-lg">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o plano "{plan.name}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-background">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(plan.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {plans.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum plano encontrado</h3>
              <p className="text-muted-foreground">Crie seu primeiro plano customizado para começar.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}