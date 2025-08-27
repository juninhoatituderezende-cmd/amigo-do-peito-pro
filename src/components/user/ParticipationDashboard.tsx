import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Target, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Gift
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface PlanParticipation {
  id: string;
  plan_id: string;
  group_id: string;
  contemplation_status: string;
  payment_status: string;
  contemplation_date?: string;
  joined_at: string;
  plan_groups: {
    current_participants: number;
    status: string;
    start_date?: string;
    end_date?: string;
  };
  custom_plans: {
    name: string;
    entry_price: number;
    total_price: number;
    max_participants: number;
  };
}

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  confirmedReferrals: number;
  pendingReferrals: number;
}

export const ParticipationDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [participations, setParticipations] = useState<PlanParticipation[]>([]);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadParticipationData();
      loadReferralData();
    }
  }, [user]);

  const loadParticipationData = async () => {
    try {
      const { data, error } = await supabase
        .from('group_participants')
        .select(`
          *,
          plan_groups(*)
        `)
        .eq('user_id', user?.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        const formattedParticipations: PlanParticipation[] = data.map(participation => ({
          id: participation.id,
          plan_id: participation.group_id,
          group_id: participation.group_id,
          contemplation_status: participation.plan_groups?.status === 'complete' ? 'contemplated' : 'waiting',
          payment_status: 'paid', // Default since they're participants
          contemplation_date: participation.plan_groups?.contemplated_at,
          joined_at: participation.joined_at,
          plan_groups: {
            current_participants: participation.plan_groups?.current_participants || 0,
            status: participation.plan_groups?.status || 'forming',
            start_date: participation.plan_groups?.created_at,
            end_date: participation.plan_groups?.contemplated_at,
          },
          custom_plans: {
            name: `Grupo ${participation.plan_groups?.group_number || 'N/A'}`,
            entry_price: participation.amount_paid || 100,
            total_price: participation.plan_groups?.target_amount || 1000,
            max_participants: participation.plan_groups?.max_participants || 10,
          }
        }));
        setParticipations(formattedParticipations);
      }
    } catch (error) {
      console.error('Erro ao carregar participações:', error);
    }
  };

  const loadReferralData = async () => {
    try {
      // Buscar dados do perfil do usuário para código de indicação
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', user?.id)
        .single();

      // Contar referências diretas
      const { count: totalReferrals } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('referred_by', user?.id);

      console.log('Profile data:', profileData);
      console.log('User ID:', user?.id);

      if (profileData?.referral_code) {
        const referralCode = profileData.referral_code;
        console.log('Código de referência encontrado:', referralCode);
        
        setReferralData({
          referralCode: referralCode,
          totalReferrals: totalReferrals || 0,
          confirmedReferrals: totalReferrals || 0,
          pendingReferrals: 0
        });
      } else {
        // Fallback: usar parte do ID do usuário
        const fallbackCode = user?.id?.slice(-8).toUpperCase() || 'N/A';
        console.log('Usando código fallback:', fallbackCode);
        
        setReferralData({
          referralCode: fallbackCode,
          totalReferrals: totalReferrals || 0,
          confirmedReferrals: totalReferrals || 0,
          pendingReferrals: 0
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados de indicação:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (contemplationStatus: string, paymentStatus: string) => {
    if (contemplationStatus === 'contemplated') {
      return <Badge className="bg-green-100 text-green-800">Contemplado</Badge>;
    }
    if (contemplationStatus === 'waiting' && paymentStatus === 'pending') {
      return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>;
    }
    if (paymentStatus === 'paid') {
      return <Badge className="bg-purple-100 text-purple-800">Finalizado</Badge>;
    }
    return <Badge variant="secondary">Aguardando</Badge>;
  };

  const getProgressPercentage = (currentParticipants: number, maxParticipants: number) => {
    return Math.min((currentParticipants / maxParticipants) * 100, 100);
  };

  const copyReferralLink = async () => {
    if (!referralData?.referralCode) {
      toast({
        title: "Erro",
        description: "Código de referência não encontrado.",
        variant: "destructive"
      });
      return;
    }

    const link = `${window.location.origin}/register?ref=${referralData.referralCode}`;
    console.log('🚀 FUNÇÃO EXECUTADA - Link:', link);
    
    // 1º: Tentar Web Share API (funciona no iOS)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Convite - Amigo do Peito',
          text: 'Junte-se ao meu grupo usando meu código de indicação!',
          url: link
        });
        console.log('✅ Compartilhado via Web Share API');
        toast({
          title: "Link compartilhado! 🎉",
          description: "Obrigado por indicar amigos!",
        });
        return;
      } catch (error) {
        console.log('⚠️ Web Share cancelado ou falhou:', error);
      }
    }

    // 2º: Tentar clipboard simples
    try {
      await navigator.clipboard.writeText(link);
      console.log('✅ Copiado via clipboard');
      toast({
        title: "Link copiado! 📋",
        description: "Cole em qualquer conversa para indicar amigos!",
      });
      return;
    } catch (error) {
      console.log('⚠️ Clipboard falhou:', error);
    }

    // 3º: Mostrar modal com link selecionável
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.8); z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
    `;
    
    modal.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 12px; max-width: 90%; text-align: center;">
        <p style="margin-bottom: 15px; font-weight: bold; color: #333;">Toque e segure para copiar:</p>
        <input type="text" value="${link}" readonly 
               style="width: 100%; padding: 12px; font-size: 14px; border: 2px solid #007AFF; 
                      border-radius: 8px; text-align: center; background: #f0f0f0;" 
               onclick="this.select()" />
        <button onclick="document.body.removeChild(this.closest('div'))" 
                style="margin-top: 15px; padding: 10px 20px; background: #007AFF; 
                       color: white; border: none; border-radius: 8px; font-size: 16px;">
          Fechar
        </button>
      </div>
    `;
    
    modal.onclick = (e) => {
      if (e.target === modal) document.body.removeChild(modal);
    };
    
    document.body.appendChild(modal);
    console.log('✅ Modal criado com sucesso');
    
    toast({
      title: "Toque e segure no link",
      description: "Selecione 'Copiar' no menu que aparecer",
      duration: 4000,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Participação ativa mais recente
  const activeParticipation = participations.find(p => 
    p.contemplation_status === 'waiting' && p.payment_status === 'pending'
  );

  return (
    <div className="space-y-6">
      {/* Status da Participação Atual */}
      {activeParticipation ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Plano Atual: {activeParticipation.custom_plans.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {activeParticipation.plan_groups.current_participants}
                </div>
                <div className="text-sm text-muted-foreground">Participantes Atuais</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {activeParticipation.custom_plans.max_participants}
                </div>
                <div className="text-sm text-muted-foreground">Meta do Grupo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {activeParticipation.custom_plans.max_participants - activeParticipation.plan_groups.current_participants}
                </div>
                <div className="text-sm text-muted-foreground">Faltam</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso do Grupo</span>
                <span>
                  {activeParticipation.plan_groups.current_participants}/
                  {activeParticipation.custom_plans.max_participants}
                </span>
              </div>
              <Progress 
                value={getProgressPercentage(
                  activeParticipation.plan_groups.current_participants,
                  activeParticipation.custom_plans.max_participants
                )} 
                className="h-3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Valor da Entrada:</span>
                <span className="ml-2 font-semibold">
                  {formatCurrency(activeParticipation.custom_plans.entry_price)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Valor Total:</span>
                <span className="ml-2 font-semibold">
                  {formatCurrency(activeParticipation.custom_plans.total_price)}
                </span>
              </div>
            </div>

            {getStatusBadge(activeParticipation.contemplation_status, activeParticipation.payment_status)}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="p-8 text-center">
            <Gift className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum plano ativo</h3>
            <p className="text-muted-foreground mb-4">
              Participe de um plano para começar a formar seu grupo!
            </p>
            <Button onClick={() => navigate('/plans')}>Escolher Plano</Button>
          </CardContent>
        </Card>
      )}

      {/* Dados de Indicação */}
      {referralData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status das Indicações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Minhas Indicações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {referralData.totalReferrals}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {referralData.confirmedReferrals}
                  </div>
                  <div className="text-xs text-muted-foreground">Confirmadas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {referralData.pendingReferrals}
                  </div>
                  <div className="text-xs text-muted-foreground">Pendentes</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso Pessoal</span>
                  <span>{referralData.confirmedReferrals}/9</span>
                </div>
                <Progress 
                  value={Math.min((referralData.confirmedReferrals / 9) * 100, 100)} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Link de Indicação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Meu Link de Indicação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Seu código:
                </div>
                <div className="font-mono text-lg font-bold">
                  {referralData.referralCode}
                </div>
              </div>

              <Button onClick={copyReferralLink} className="w-full">
                Copiar Link de Indicação
              </Button>

              <div className="text-xs text-muted-foreground">
                Compartilhe este link para que amigos se juntem ao seu grupo
              </div>
              
              {/* Fallback: mostrar link para cópia manual */}
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                <p className="font-medium mb-1">Link completo (caso precise copiar manualmente):</p>
                <p className="font-mono text-muted-foreground break-all select-all">
                  {referralData ? `${window.location.origin}/register?ref=${referralData.referralCode}` : 'Carregando...'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Histórico de Participações */}
      {participations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Participações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {participations.map((participation) => (
                <div 
                  key={participation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{participation.custom_plans.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Participou em: {new Date(participation.joined_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm">
                      Grupo: {participation.plan_groups.current_participants}/
                      {participation.custom_plans.max_participants} participantes
                    </p>
                  </div>
                  
                  <div className="text-right">
                    {getStatusBadge(participation.contemplation_status, participation.payment_status)}
                    {participation.contemplation_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Contemplado em: {new Date(participation.contemplation_date).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};