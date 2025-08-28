import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import SimpleImageUpload from "@/components/SimpleImageUpload";

interface ServiceType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  table: string;
  color: string;
}

interface ServicePlan {
  id: string;
  name: string;
  description: string;
  price: number;
  max_participants: number;
  image_url?: string;
  active: boolean;
  professional_id?: string;
  created_at: string;
  updated_at: string;
}

interface SpecificServicePlansManagerProps {
  serviceType: ServiceType;
  onBack: () => void;
}

export function SpecificServicePlansManager({ serviceType, onBack }: SpecificServicePlansManagerProps) {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    max_participants: "10",
    image_url: "",
    active: true,
  });

  useEffect(() => {
    loadPlans();
  }, [serviceType.table]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      console.log("🔄 Carregando planos da tabela:", serviceType.table);
      
      let query;
      if (serviceType.table === 'planos_tatuador') {
        query = supabase.from('planos_tatuador').select('*');
      } else if (serviceType.table === 'planos_dentista') {
        query = supabase.from('planos_dentista').select('*');
      } else {
        throw new Error(`Tabela não suportada: ${serviceType.table}`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error("❌ Erro ao carregar planos:", error);
        throw error;
      }

      console.log("✅ Planos carregados:", data?.length || 0);
      setPlans(data || []);
    } catch (error) {
      console.error("❌ Erro ao carregar planos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planos. Tente novamente.",
        variant: "destructive",
      });
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast({
        title: "Erro",
        description: "Nome e preço são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      console.log("💾 Salvando plano...", { editingPlan, formData });

      const planData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        max_participants: parseInt(formData.max_participants),
        image_url: formData.image_url || null,
        active: formData.active,
      };

      if (editingPlan) {
        console.log("✏️ Editando plano ID:", editingPlan.id);
        
        let updateQuery;
        if (serviceType.table === 'planos_tatuador') {
          updateQuery = supabase.from('planos_tatuador');
        } else if (serviceType.table === 'planos_dentista') {
          updateQuery = supabase.from('planos_dentista');
        } else {
          throw new Error(`Tabela não suportada: ${serviceType.table}`);
        }

        const { data, error } = await updateQuery
          .update({
            ...planData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPlan.id)
          .select()
          .single();

        if (error) {
          console.error("❌ Erro ao atualizar:", error);
          throw error;
        }

        console.log("✅ Plano atualizado:", data);
        toast({
          title: "Sucesso",
          description: "Plano atualizado com sucesso!",
        });
      } else {
        console.log("➕ Criando novo plano");
        
        let insertQuery;
        if (serviceType.table === 'planos_tatuador') {
          insertQuery = supabase.from('planos_tatuador');
        } else if (serviceType.table === 'planos_dentista') {
          insertQuery = supabase.from('planos_dentista');
        } else {
          throw new Error(`Tabela não suportada: ${serviceType.table}`);
        }

        const { data, error } = await insertQuery
          .insert(planData)
          .select()
          .single();

        if (error) {
          console.error("❌ Erro ao criar:", error);
          throw error;
        }

        console.log("✅ Plano criado:", data);
        toast({
          title: "Sucesso",
          description: "Plano criado com sucesso!",
        });
      }

      resetForm();
      setDialogOpen(false);
      await loadPlans();
    } catch (error: any) {
      console.error("❌ Erro ao salvar plano:", error);
      const errorMessage = error?.message || "Erro desconhecido";
      toast({
        title: "Erro",
        description: `Erro ao salvar plano: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (plan: ServicePlan) => {
    console.log("✏️ Editando plano:", plan);
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: plan.price.toString(),
      max_participants: plan.max_participants.toString(),
      image_url: plan.image_url || "",
      active: plan.active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (planId: string) => {
    try {
      setDeleting(planId);
      console.log("🗑️ Excluindo plano:", planId);
      
      let deleteQuery;
      if (serviceType.table === 'planos_tatuador') {
        deleteQuery = supabase.from('planos_tatuador');
      } else if (serviceType.table === 'planos_dentista') {
        deleteQuery = supabase.from('planos_dentista');
      } else {
        throw new Error(`Tabela não suportada: ${serviceType.table}`);
      }

      const { error } = await deleteQuery
        .delete()
        .eq('id', planId);

      if (error) {
        console.error("❌ Erro ao excluir:", error);
        throw error;
      }

      console.log("✅ Plano excluído com sucesso");
      toast({
        title: "Sucesso",
        description: "Plano excluído com sucesso!",
      });
      
      await loadPlans();
    } catch (error: any) {
      console.error("❌ Erro ao excluir plano:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir plano. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      console.log("🔄 Alterando status do plano:", planId, "para:", !currentStatus);
      
      let updateQuery;
      if (serviceType.table === 'planos_tatuador') {
        updateQuery = supabase.from('planos_tatuador');
      } else if (serviceType.table === 'planos_dentista') {
        updateQuery = supabase.from('planos_dentista');
      } else {
        throw new Error(`Tabela não suportada: ${serviceType.table}`);
      }

      const { error } = await updateQuery
        .update({
          active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (error) {
        console.error("❌ Erro ao alterar status:", error);
        throw error;
      }

      console.log("✅ Status alterado com sucesso");
      toast({
        title: "Sucesso",
        description: `Plano ${!currentStatus ? "ativado" : "desativado"} com sucesso!`,
      });
      
      await loadPlans();
    } catch (error: any) {
      console.error("❌ Erro ao alterar status:", error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do plano",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      max_participants: "10",
      image_url: "",
      active: true,
    });
    setEditingPlan(null);
  };

  const handleNewPlan = () => {
    resetForm();
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="text-3xl font-bold">{serviceType.name}</h2>
          <p className="text-muted-foreground">{serviceType.description}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">
          {plans.length} plano(s) cadastrado(s)
        </h3>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewPlan}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                {editingPlan ? "Editar Plano" : "Novo Plano"}
              </DialogTitle>
              <DialogDescription>
                {editingPlan ? "Edite as informações do plano" : "Preencha os dados para criar um novo plano"}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-2 max-h-[calc(90vh-120px)]">
              <form onSubmit={handleSubmit} className="space-y-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Plano *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Tatuagem Pequena"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva os detalhes do plano..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_participants">Máximo de Participantes</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    min="1"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Imagem do Plano</Label>
                  <SimpleImageUpload
                    onUpload={(url) => setFormData({ ...formData, image_url: url })}
                    label="Escolher imagem do plano"
                    currentImageUrl={formData.image_url}
                    showPreview={true}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Plano ativo</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-6 border-t sticky bottom-0 bg-background">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Salvando..." : editingPlan ? "Atualizar Plano" : "Criar Plano"}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Planos Cadastrados</span>
            <span className="text-sm font-normal text-muted-foreground">
              {plans.length} {plans.length === 1 ? 'plano' : 'planos'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-[80vh] overflow-y-auto">
          {plans.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Plus className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-2">Nenhum plano cadastrado</p>
              <p className="text-muted-foreground mb-6">
                Comece criando seu primeiro plano de {serviceType.name.toLowerCase()}
              </p>
              <Button onClick={handleNewPlan} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Criar Primeiro Plano
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className="border-2 hover:shadow-lg transition-shadow overflow-hidden">
                  <CardHeader className="pb-3">
                    {plan.image_url && (
                      <div className="relative mb-2">
                        <img
                          src={plan.image_url}
                          alt={plan.name}
                          className="w-full h-56 object-cover rounded-md"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-md" />
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{plan.name}</h4>
                        <p className="text-2xl font-bold text-primary">
                          R$ {plan.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={plan.active}
                          onCheckedChange={() => togglePlanStatus(plan.id, plan.active)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {plan.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mb-3">
                      Máx. {plan.max_participants} participantes
                    </p>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(plan)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleting === plan.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o plano "{plan.name}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}