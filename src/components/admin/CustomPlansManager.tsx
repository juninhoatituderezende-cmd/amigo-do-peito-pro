import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Copy, Users, DollarSign, Eye, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Professional {
  id: string;
  nome: string;
  especialidade: string;
  local_atendimento: string;
}

interface CustomPlan {
  id: string;
  plan_code: string;
  name: string;
  description: string;
  category_name: string;
  total_price: number;
  entry_price: number;
  max_participants: number;
  active: boolean;
  public_enrollment: boolean;
  total_groups: number;
  forming_groups: number;
  full_groups: number;
  completed_groups: number;
  total_participants: number;
  total_revenue: number;
  created_by_name: string;
  created_at: string;
}

interface PlanForm {
  name: string;
  description: string;
  category_id: string;
  total_price: string;
  entry_price: string;
  max_participants: string;
  professional_id: string;
  allow_professional_choice: boolean;
  image_url: string;
  benefits: string[];
}

export function CustomPlansManager() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [plans, setPlans] = useState<CustomPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [planForm, setPlanForm] = useState<PlanForm>({
    name: '',
    description: '',
    category_id: '',
    total_price: '',
    entry_price: '',
    max_participants: '9',
    professional_id: '',
    allow_professional_choice: false,
    image_url: '',
    benefits: ['']
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar categorias
      const { data: categoriesData } = await supabase
        .from('service_categories')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (categoriesData) setCategories(categoriesData);

      // Carregar profissionais
      const { data: professionalsData } = await supabase
        .from('profissionais')
        .select('id, nome, especialidade, local_atendimento')
        .order('nome');
      
      if (professionalsData) setProfessionals(professionalsData);

      // Carregar planos existentes
      const { data: plansData } = await supabase
        .from('admin_plans_overview')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (plansData) setPlans(plansData);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!planForm.name || !planForm.category_id || !planForm.total_price || !planForm.entry_price) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_custom_plan', {
        p_name: planForm.name,
        p_description: planForm.description,
        p_category_id: planForm.category_id,
        p_total_price: parseFloat(planForm.total_price),
        p_entry_price: parseFloat(planForm.entry_price),
        p_max_participants: parseInt(planForm.max_participants),
        p_professional_id: planForm.professional_id || null,
        p_allow_professional_choice: planForm.allow_professional_choice,
        p_admin_id: (await supabase.auth.getUser()).data.user?.id,
        p_image_url: planForm.image_url || null,
        p_benefits: planForm.benefits.filter(b => b.trim())
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Plano criado com código: ${data.plan_code}`,
      });

      // Reset form
      setPlanForm({
        name: '',
        description: '',
        category_id: '',
        total_price: '',
        entry_price: '',
        max_participants: '9',
        professional_id: '',
        allow_professional_choice: false,
        image_url: '',
        benefits: ['']
      });

      setActiveTab('overview');
      loadData();

    } catch (error) {
      console.error('Erro ao criar plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar plano. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPlanLink = (planCode: string) => {
    const url = `${window.location.origin}/inscrever/${planCode}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "Link do plano copiado para a área de transferência.",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const addBenefit = () => {
    setPlanForm(prev => ({
      ...prev,
      benefits: [...prev.benefits, '']
    }));
  };

  const updateBenefit = (index: number, value: string) => {
    setPlanForm(prev => ({
      ...prev,
      benefits: prev.benefits.map((benefit, i) => i === index ? value : benefit)
    }));
  };

  const removeBenefit = (index: number) => {
    setPlanForm(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Planos Customizados</h2>
          <p className="text-muted-foreground">
            Gerencie planos personalizados e acompanhe inscrições
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="create">Criar Plano</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-semibold">{plan.name}</h3>
                      <Badge variant={plan.active ? "default" : "secondary"}>
                        {plan.active ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline">{plan.plan_code}</Badge>
                    </div>
                    <p className="text-muted-foreground">{plan.description}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="flex items-center">
                        <DollarSign className="mr-1 h-4 w-4" />
                        Total: {formatCurrency(plan.total_price)}
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="mr-1 h-4 w-4" />
                        Entrada: {formatCurrency(plan.entry_price)}
                      </span>
                      <span className="flex items-center">
                        <Users className="mr-1 h-4 w-4" />
                        {plan.max_participants} participantes/grupo
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyPlanLink(plan.plan_code)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Link
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-background rounded-lg border">
                    <div className="text-2xl font-bold text-blue-600">{plan.total_groups}</div>
                    <div className="text-sm text-muted-foreground">Total Grupos</div>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg border">
                    <div className="text-2xl font-bold text-green-600">{plan.forming_groups}</div>
                    <div className="text-sm text-muted-foreground">Formando</div>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg border">
                    <div className="text-2xl font-bold text-orange-600">{plan.total_participants}</div>
                    <div className="text-sm text-muted-foreground">Participantes</div>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg border">
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(plan.total_revenue)}</div>
                    <div className="text-sm text-muted-foreground">Receita</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Criar Novo Plano</CardTitle>
              <CardDescription>
                Configure um novo plano personalizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Plano *</Label>
                  <Input
                    id="name"
                    value={planForm.name}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Tatuagem Premium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={planForm.category_id} onValueChange={(value) => setPlanForm(prev => ({ ...prev, category_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_price">Preço Total (R$) *</Label>
                  <Input
                    id="total_price"
                    type="number"
                    step="0.01"
                    value={planForm.total_price}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, total_price: e.target.value }))}
                    placeholder="4000.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entry_price">Preço de Entrada (R$) *</Label>
                  <Input
                    id="entry_price"
                    type="number"
                    step="0.01"
                    value={planForm.entry_price}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, entry_price: e.target.value }))}
                    placeholder="400.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_participants">Participantes por Grupo</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={planForm.max_participants}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, max_participants: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="professional">Profissional</Label>
                  <Select value={planForm.professional_id} onValueChange={(value) => setPlanForm(prev => ({ ...prev, professional_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um profissional (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionals.map((professional) => (
                        <SelectItem key={professional.id} value={professional.id}>
                          {professional.nome} - {professional.especialidade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={planForm.description}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o plano e seus benefícios..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL da Imagem</Label>
                <Input
                  id="image_url"
                  value={planForm.image_url}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label>Benefícios</Label>
                {planForm.benefits.map((benefit, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      value={benefit}
                      onChange={(e) => updateBenefit(index, e.target.value)}
                      placeholder="Descreva um benefício..."
                    />
                    {planForm.benefits.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeBenefit(index)}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addBenefit}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Benefício
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={planForm.allow_professional_choice}
                  onCheckedChange={(checked) => setPlanForm(prev => ({ ...prev, allow_professional_choice: checked }))}
                />
                <Label>Permitir que o cliente escolha o profissional</Label>
              </div>

              <Button onClick={handleCreatePlan} disabled={loading} className="w-full">
                {loading ? "Criando..." : "Criar Plano"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Planos</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{plans.length}</div>
                <p className="text-xs text-muted-foreground">
                  {plans.filter(p => p.active).length} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Participantes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {plans.reduce((sum, plan) => sum + plan.total_participants, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Em {plans.reduce((sum, plan) => sum + plan.total_groups, 0)} grupos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(plans.reduce((sum, plan) => sum + plan.total_revenue, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Receita acumulada
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}