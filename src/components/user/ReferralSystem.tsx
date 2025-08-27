import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Share, Users, UserPlus, TrendingUp, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  groupsFormed: number;
  pendingInvites: number;
}

export const ReferralSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralData, setReferralData] = useState<UserReferralData>({
    referralCode: "",
    referralLink: "",
    totalReferrals: 0,
    groupsFormed: 0,
    pendingInvites: 0
  });
  const [loading, setLoading] = useState(true);
  const [userGroups, setUserGroups] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadReferralData();
      loadUserGroups();
    }
  }, [user]);

  const loadUserGroups = async () => {
    try {
      const { data: groups } = await supabase
        .from('group_participants')
        .select(`
          plan_groups!inner(
            id,
            referral_code,
            service_id
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active');
      
      // Para cada grupo, buscar os detalhes do plano
      const groupsWithPlans = await Promise.all(
        (groups || []).map(async (group) => {
          const { data: planData } = await supabase
            .from('custom_plans')
            .select('name')
            .eq('id', group.plan_groups.service_id)
            .single();

          return {
            plan_groups: {
              ...group.plan_groups,
              custom_plans: planData
            }
          };
        })
      );
      
      setUserGroups(groupsWithPlans);
    } catch (error) {
      console.error('Erro ao carregar grupos do usuário:', error);
    }
  };

  const loadReferralData = async () => {
    try {
      setLoading(true);

      // Buscar dados do perfil do usuário para código de indicação pessoal
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;

      // Contar referrals diretos através dos grupos (pessoas que usaram códigos dos grupos do usuário)
      const { data: groupReferrals } = await supabase
        .from('group_participants')
        .select(`
          referrer_code,
          plan_groups!inner(
            referral_code
          )
        `)
        .neq('user_id', user?.id)
        .not('referrer_code', 'is', null);

      // Buscar códigos dos grupos do usuário
      const { data: userGroupCodes } = await supabase
        .from('group_participants')
        .select(`
          plan_groups!inner(
            referral_code
          )
        `)
        .eq('user_id', user?.id);

      const myGroupCodes = userGroupCodes?.map(ug => ug.plan_groups.referral_code) || [];
      const totalReferrals = groupReferrals?.filter(gr => myGroupCodes.includes(gr.referrer_code)).length || 0;

      // Contar grupos formados (participações ativas do usuário)
      const { count: activeParticipations } = await supabase
        .from('group_participants')
        .select('id', { count: 'exact' })
        .eq('user_id', user?.id)
        .eq('status', 'active');

      const referralCode = profileData?.referral_code || user?.id?.slice(-8).toUpperCase() || '';
      
      setReferralData({
        referralCode,
        referralLink: `${window.location.origin}/register?ref=${referralCode}`,
        totalReferrals,
        groupsFormed: activeParticipations || 0,
        pendingInvites: 0 // Será calculado baseado no progresso dos grupos
      });

    } catch (error) {
      console.error('Erro ao carregar dados de indicação:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados de indicação.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async (groupId?: string, groupCode?: string) => {
    // Se tiver um grupo específico, usar o link do grupo, senão usar o link geral de cadastro
    let linkToCopy;
    if (groupId && groupCode) {
      linkToCopy = `${window.location.origin}/plano/${groupId}?ref=${groupCode}`;
    } else {
      if (!referralData.referralCode) {
        toast({
          title: "Erro",
          description: "Código de referência não disponível.",
          variant: "destructive"
        });
        return;
      }
      linkToCopy = `${window.location.origin}/register?ref=${referralData.referralCode}`;
    }

    try {
      await navigator.clipboard.writeText(linkToCopy);
      
      toast({
        title: "✅ Link copiado!",
        description: groupId ? "Link do grupo copiado!" : "Seu link de indicação foi copiado!",
        duration: 3000
      });
      
    } catch (error) {
      // Fallback para dispositivos móveis ou browsers antigos
      const textArea = document.createElement('textarea');
      textArea.value = linkToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        toast({
          title: "✅ Link copiado!",
          description: groupId ? "Link do grupo copiado!" : "Seu link de indicação foi copiado!",
          duration: 3000
        });
        
      } catch (fallbackError) {
        document.body.removeChild(textArea);
        
        toast({
          title: "📋 Copie manualmente",
          description: "Selecione o link abaixo e copie (Ctrl+C)",
          duration: 5000
        });
      }
    }
  };

  const shareReferralLink = (groupId?: string, groupCode?: string, serviceName?: string) => {
    const linkToShare = groupId && groupCode 
      ? `${window.location.origin}/plano/${groupId}?ref=${groupCode}`
      : `${window.location.origin}/register?ref=${referralData.referralCode}`;
      
    if (navigator.share) {
      navigator.share({
        title: groupId ? "Participe do meu grupo!" : "Cadastre-se com minha indicação!",
        text: groupId 
          ? `Venha formar grupo comigo para ${serviceName} e economizar!`
          : "Venha formar um grupo comigo e economizar em serviços estéticos!",
        url: linkToShare,
      });
    } else {
      copyReferralLink(groupId, groupCode);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Indicações</p>
                <p className="text-2xl font-bold">{referralData.totalReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grupos Formados</p>
                <p className="text-2xl font-bold">{referralData.groupsFormed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Convites Pendentes</p>
                <p className="text-2xl font-bold">{referralData.pendingInvites}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Meu Link de Indicação
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Compartilhe este link para que seus amigos se juntem ao seu grupo
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Links dos Grupos */}
          {userGroups.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Links dos Seus Grupos:</h4>
              {userGroups.map((group, index) => {
                const groupCode = group.plan_groups.referral_code;
                const serviceName = group.plan_groups.custom_plans?.name || 'Serviço';
                const groupLink = `${window.location.origin}/plano/${group.plan_groups.service_id}?ref=${groupCode}`;
                
                return (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-800">{serviceName}</span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {groupCode}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2 mb-2">
                      <Button 
                        size="sm"
                        variant="outline" 
                        onClick={() => copyReferralLink(group.plan_groups.service_id, groupCode)}
                        className="flex-1"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => shareReferralLink(group.plan_groups.service_id, groupCode, serviceName)}
                        className="flex-1"
                      >
                        <Share className="h-3 w-3 mr-1" />
                        Compartilhar
                      </Button>
                    </div>
                    
                    <div className="text-xs font-mono text-blue-600 bg-white p-2 rounded border break-all">
                      {groupLink}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Link Geral de Indicação */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Seu código pessoal:</p>
                <Badge variant="secondary" className="font-mono">
                  {referralData.referralCode}
                </Badge>
              </div>
            </div>
            
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Link de cadastro geral:</p>
              <div className="flex items-center gap-2 p-3 bg-card border rounded">
                <ExternalLink className="h-4 w-4 text-gray-400" />
                <span className="flex-1 text-sm font-mono text-gray-600 truncate">
                  {referralData.referralLink}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => copyReferralLink()}
                variant="outline" 
                size="sm"
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </Button>
              <Button 
                onClick={() => shareReferralLink()}
                size="sm"
                className="flex-1"
              >
                <Share className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona o Sistema de Indicação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium">Compartilhe seu link</h4>
                <p className="text-sm text-muted-foreground">
                  Envie seu link único para amigos e familiares
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium">Eles se cadastram</h4>
                <p className="text-sm text-muted-foreground">
                  Quando alguém se cadastra pelo seu link, vocês ficam no mesmo grupo
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium">Grupo completo = serviço liberado</h4>
                <p className="text-sm text-muted-foreground">
                  Com 10 pessoas, todos podem agendar seus serviços
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};