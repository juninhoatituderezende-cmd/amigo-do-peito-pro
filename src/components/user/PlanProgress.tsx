import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Users, Clock, DollarSign, Share, Gift, ExternalLink } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface PlanProgress {
  participation_id: string;
  plan_code: string;
  plan_name: string;
  description: string;
  category_name: string;
  total_price: number;
  entry_amount: number;
  group_number: number;
  position_number: number;
  current_participants: number;
  max_participants: number;
  group_status: string;
  payment_status: string;
  contemplated: boolean;
  service_completed: boolean;
  professional_name: string;
  especialidade: string;
  local_atendimento: string;
  enrollment_date: string;
  contemplation_date: string;
  service_completion_date: string;
}

interface ReferralLink {
  id: string;
  referral_code: string;
  link_url: string;
  clicks_count: number;
  conversions_count: number;
  total_commission: number;
}

interface Commission {
  id: string;
  participation_amount: number;
  commission_amount: number;
  status: string;
  created_at: string;
  referrer_name: string;
}

export function PlanProgress() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<PlanProgress[]>([]);
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Buscar ID do cliente
      const { data: clientData } = await supabase
        .from('clientes')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();

      if (!clientData) return;

      // Carregar progresso dos planos
      const { data: plansData } = await supabase
        .from('user_plan_progress')
        .select('*')
        .eq('participant_id', clientData.id)
        .order('enrollment_date', { ascending: false });

      if (plansData) setPlans(plansData);

      // Carregar links de referência
      const { data: linksData } = await supabase
        .from('plan_referral_links')
        .select('*')
        .eq('user_id', clientData.id)
        .eq('active', true);

      if (linksData) setReferralLinks(linksData);

      // Carregar comissões
      const { data: commissionsData } = await supabase
        .from('plan_commissions')
        .select(`
          *,
          plan_participations(
            clientes(nome)
          )
        `)
        .eq('referrer_id', clientData.id)
        .order('created_at', { ascending: false });

      if (commissionsData) {
        const formattedCommissions = commissionsData.map(c => ({
          ...c,
          referrer_name: c.plan_participations?.clientes?.nome || 'Usuário'
        }));
        setCommissions(formattedCommissions);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar seus dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReferralLink = async (planCode: string) => {
    try {
      const { data: clientData } = await supabase
        .from('clientes')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();

      if (!clientData) return;

      const { data: planData } = await supabase
        .from('custom_plans')
        .select('id')
        .eq('plan_code', planCode)
        .single();

      if (!planData) return;

      const { data, error } = await supabase.rpc('generate_referral_link', {
        p_plan_id: planData.id,
        p_user_id: clientData.id
      });

      if (error) throw error;

      toast({
        title: "Link gerado!",
        description: "Seu link de indicação foi criado com sucesso.",
      });

      loadUserData(); // Recarregar dados

    } catch (error) {
      console.error('Erro ao gerar link:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar link de indicação.",
        variant: "destructive",
      });
    }
  };

  const copyReferralLink = (linkUrl: string) => {
    const fullUrl = `${window.location.origin}${linkUrl}`;
    navigator.clipboard.writeText(fullUrl);
    toast({
      title: "Link copiado!",
      description: "Link de indicação copiado para a área de transferência.",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'forming': { label: 'Formando', variant: 'secondary' as const },
      'full': { label: 'Completo', variant: 'default' as const },
      'contemplating': { label: 'Contemplando', variant: 'default' as const },
      'completed': { label: 'Finalizado', variant: 'default' as const }
    };
    
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
  };

  const getProgressPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Meus Planos</h2>
        <p className="text-muted-foreground">
          Acompanhe o progresso dos seus grupos e suas indicações
        </p>
      </div>

      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList>
          <TabsTrigger value="progress">Progresso dos Grupos</TabsTrigger>
          <TabsTrigger value="referrals">Indicações</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          {plans.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum plano encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Você ainda não está inscrito em nenhum plano.
                </p>
                <Button onClick={() => window.location.href = '/'}>
                  Explorar Planos
                </Button>
              </CardContent>
            </Card>
          ) : (
            plans.map((plan) => (
              <Card key={plan.participation_id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{plan.plan_name}</span>
                        <Badge variant="outline">{plan.category_name}</Badge>
                        <Badge {...getStatusBadge(plan.group_status)}>
                          {getStatusBadge(plan.group_status).label}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Grupo {plan.group_number} • Posição {plan.position_number}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(plan.entry_amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">pago</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progresso do grupo */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progresso do Grupo</span>
                      <span>{plan.current_participants}/{plan.max_participants} participantes</span>
                    </div>
                    <Progress 
                      value={getProgressPercentage(plan.current_participants, plan.max_participants)} 
                      className="w-full"
                    />
                  </div>

                  {/* Status especiais */}
                  {plan.contemplated && (
                    <Alert>
                      <Gift className="h-4 w-4" />
                      <AlertDescription>
                        🎉 <strong>Parabéns!</strong> Você foi contemplado! 
                        {plan.contemplation_date && (
                          <span> em {new Date(plan.contemplation_date).toLocaleDateString('pt-BR')}</span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {plan.service_completed && (
                    <Alert>
                      <AlertDescription>
                        ✅ Serviço realizado com sucesso!
                        {plan.service_completion_date && (
                          <span> em {new Date(plan.service_completion_date).toLocaleDateString('pt-BR')}</span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Informações do profissional */}
                  {plan.professional_name && (
                    <div className="bg-muted p-3 rounded-lg">
                      <h4 className="font-semibold">Profissional Designado</h4>
                      <p className="text-sm">
                        {plan.professional_name} - {plan.especialidade}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {plan.local_atendimento}
                      </p>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateReferralLink(plan.plan_code)}
                    >
                      <Share className="mr-2 h-4 w-4" />
                      Gerar Link de Indicação
                    </Button>
                    
                    {plan.contemplated && !plan.service_completed && (
                      <Button size="sm">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Agendar Serviço
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <div className="grid gap-4">
            {referralLinks.map((link) => (
              <Card key={link.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Link de Indicação</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyReferralLink(link.link_url)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded-lg mb-4">
                    <code className="text-sm break-all">
                      {window.location.origin}{link.link_url}
                    </code>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{link.clicks_count}</div>
                      <div className="text-sm text-muted-foreground">Cliques</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{link.conversions_count}</div>
                      <div className="text-sm text-muted-foreground">Conversões</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(link.total_commission)}
                      </div>
                      <div className="text-sm text-muted-foreground">Comissão</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          {commissions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma comissão encontrada</h3>
                <p className="text-muted-foreground">
                  Compartilhe seus links de indicação para ganhar comissões!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Resumo das comissões */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="text-center p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0))}
                    </div>
                    <div className="text-sm text-muted-foreground">Comissões Pagas</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0))}
                    </div>
                    <div className="text-sm text-muted-foreground">Pendentes</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(commissions.reduce((sum, c) => sum + c.commission_amount, 0))}
                    </div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de comissões */}
              {commissions.map((commission) => (
                <Card key={commission.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">
                          Indicação: {commission.referrer_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {formatCurrency(commission.commission_amount)}
                        </div>
                        <Badge 
                          variant={commission.status === 'paid' ? 'default' : 'secondary'}
                        >
                          {commission.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}