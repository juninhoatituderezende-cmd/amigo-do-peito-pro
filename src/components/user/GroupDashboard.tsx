import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Share2, 
  Copy, 
  CheckCircle, 
  Clock,
  ExternalLink,
  Calendar
} from "lucide-react";

interface GroupData {
  id: string;
  referral_code: string;
  status: 'forming' | 'complete' | 'cancelled';
  current_participants: number;
  max_participants: number;
  current_amount: number;
  target_amount: number;
  created_at: string;
  contemplated_at: string | null;
  service_name: string;
  service_category: string;
  user_amount_paid: number;
}

export const GroupDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserGroups();
    }
  }, [user]);

  const loadUserGroups = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('group_participants')
        .select(`
          amount_paid,
          joined_at,
          status,
          plan_groups!inner(
            id,
            referral_code,
            status,
            current_participants,
            max_participants,
            current_amount,
            target_amount,
            created_at,
            contemplated_at,
            service_id
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // Para cada grupo, buscar os detalhes do plano
      const groupsWithPlans = await Promise.all(
        (data || []).map(async (item) => {
          const { data: planData } = await supabase
            .from('custom_plans')
            .select('name, category')
            .eq('id', item.plan_groups.service_id)
            .single();

          return {
            id: item.plan_groups.id,
            referral_code: item.plan_groups.referral_code,
            status: item.plan_groups.status as 'forming' | 'complete' | 'cancelled',
            current_participants: item.plan_groups.current_participants,
            max_participants: item.plan_groups.max_participants,
            current_amount: item.plan_groups.current_amount,
            target_amount: item.plan_groups.target_amount,
            created_at: item.plan_groups.created_at,
            contemplated_at: item.plan_groups.contemplated_at,
            service_name: planData?.name || 'Serviço',
            service_category: planData?.category || 'service',
            user_amount_paid: item.amount_paid
          };
        })
      );

      setGroups(groupsWithPlans);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar seus grupos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async (referralCode: string) => {
    const linkToCopy = `${window.location.origin}/plano/${groups[0]?.id}?ref=${referralCode}`;
    
    try {
      await navigator.clipboard.writeText(linkToCopy);
      toast({
        title: "✅ Link copiado!",
        description: "Link de convite copiado para a área de transferência.",
        duration: 3000
      });
    } catch (error) {
      // Fallback para dispositivos móveis
      const textArea = document.createElement('textarea');
      textArea.value = linkToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast({
          title: "✅ Link copiado!",
          description: "Link de convite copiado para a área de transferência.",
        });
      } catch (fallbackError) {
        document.body.removeChild(textArea);
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar automaticamente. Tente novamente.",
          variant: "destructive"
        });
      }
    }
  };

  const shareReferralLink = (referralCode: string) => {
    const linkToShare = `${window.location.origin}/plano/${groups[0]?.id}?ref=${referralCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: "Participe do meu grupo!",
        text: `Venha fazer parte do meu grupo para ${groups[0]?.service_name} e economizar!`,
        url: linkToShare,
      });
    } else {
      copyReferralLink(referralCode);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'forming': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'complete': return 'Completo';
      case 'forming': return 'Formando';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Nenhum grupo encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Você ainda não está participando de nenhum grupo.
          </p>
          <Button onClick={() => window.location.href = '/plans'}>
            Escolher um Plano
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meus Grupos</h2>
        <Badge variant="secondary">
          {groups.length} grupo{groups.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {groups.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {group.service_name}
                  <Badge className={getStatusColor(group.status)}>
                    {getStatusLabel(group.status)}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Código do grupo: <span className="font-mono font-medium">{group.referral_code}</span>
                </p>
              </div>
              {group.status === 'complete' && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Grupo Completo!</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso do Grupo</span>
                <span className="text-sm text-muted-foreground">
                  {group.current_participants}/{group.max_participants} pessoas
                </span>
              </div>
              <Progress 
                value={(group.current_participants / group.max_participants) * 100} 
                className="h-2"
              />
              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                <span>R$ {group.current_amount.toLocaleString()} arrecadado</span>
                <span>Meta: R$ {group.target_amount.toLocaleString()}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-sm font-medium">{group.current_participants}</div>
                <div className="text-xs text-muted-foreground">Participantes</div>
              </div>
              
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-sm font-medium">
                  {Math.max(0, group.max_participants - group.current_participants)}
                </div>
                <div className="text-xs text-muted-foreground">Restam</div>
              </div>

              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium">R$ {group.user_amount_paid.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Sua contribuição</div>
              </div>

              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-sm font-medium">
                  {new Date(group.created_at).toLocaleDateString('pt-BR')}
                </div>
                <div className="text-xs text-muted-foreground">Criado em</div>
              </div>
            </div>

            {/* Actions */}
            {group.status === 'forming' && (
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Share2 className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Compartilhe e complete seu grupo</span>
                  </div>
                  <p className="text-sm text-blue-600 mb-3">
                    Compartilhe o link abaixo para que mais {group.max_participants - group.current_participants} 
                    {group.max_participants - group.current_participants === 1 ? ' pessoa se junte' : ' pessoas se juntem'} 
                    ao seu grupo:
                  </p>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyReferralLink(group.referral_code)}
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Link
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => shareReferralLink(group.referral_code)}
                      className="flex-1"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                  
                  <div className="mt-3 p-2 bg-white rounded border text-xs font-mono text-gray-600 break-all">
                    {`${window.location.origin}/plano/${group.id}?ref=${group.referral_code}`}
                  </div>
                </div>
              </div>
            )}

            {group.status === 'complete' && group.contemplated_at && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Parabéns! Grupo Completo</span>
                </div>
                <p className="text-sm text-green-600 mb-3">
                  Seu grupo foi contemplado em{' '}
                  {new Date(group.contemplated_at).toLocaleDateString('pt-BR')}. 
                  Agora você pode agendar seu serviço!
                </p>
                <Button size="sm" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Serviço
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};