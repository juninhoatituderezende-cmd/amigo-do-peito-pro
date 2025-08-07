import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  Clock, 
  Award,
  Target,
  Gift,
  Share2,
  Copy,
  DollarSign,
  TrendingUp,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface GroupMember {
  user_id: string;
  position: number;
  referrer_id?: string;
  joined_at: string;
  is_validated: boolean;
  user_email?: string;
  user_name?: string;
}

interface GroupData {
  id: string;
  current_members: number;
  progress_message: string;
  status: string;
  created_at: string;
  completed_at?: string;
  members: GroupMember[];
}

const MILESTONE_REWARDS = [
  { members: 3, reward: 50, label: "Primeiro Marco" },
  { members: 6, reward: 100, label: "Meio Caminho" },
  { members: 9, reward: 500, label: "Grupo Completo" }
];

export const ReferralValidation = () => {
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadGroupData();
      generateReferralLink();
    }
  }, [user]);

  const loadGroupData = async () => {
    try {
      // Get user's active group
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'forming')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (groupsError && groupsError.code !== 'PGRST116') {
        throw groupsError;
      }

      if (groupsData) {
        // Get group members (simulating with transactions)
        const { data: membersData, error: membersError } = await supabase
          .from('transactions')
          .select('*')
          .eq('professional_id', groupsData.id)
          .order('created_at');

        if (membersError) throw membersError;

        const enrichedMembers = (membersData || []).map((member, index) => ({
          ...member,
          user_email: 'user@example.com',
          user_name: `Usuário ${index + 1}`,
          position: index + 1,
          joined_at: member.created_at,
          is_validated: true
        }));

        setGroupData({
          id: groupsData.id,
          current_members: enrichedMembers.length,
          progress_message: getProgressMessage(enrichedMembers.length),
          status: groupsData.status,
          created_at: groupsData.created_at,
          completed_at: groupsData.end_date,
          members: enrichedMembers
        });
      }
    } catch (error: any) {
      console.error('Error loading group data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReferralLink = () => {
    if (user?.id) {
      const link = `${window.location.origin}/registro?ref=${user.id}`;
      setReferralLink(link);
    }
  };

  const getProgressMessage = (members: number) => {
    if (members >= 9) return "🎉 Grupo completo! Parabéns!";
    if (members >= 6) return `Quase lá! Faltam apenas ${9 - members} membros`;
    if (members >= 3) return `Ótimo progresso! Faltam ${9 - members} membros`;
    return `Começando! Você precisa de ${9 - members} indicações para completar`;
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Link copiado!",
        description: "Seu link de indicação foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive"
      });
    }
  };

  const shareReferralLink = async () => {
    const shareData = {
      title: "Participe do Amigo do Peito!",
      text: "Junte-se ao melhor sistema de grupos de WhatsApp e ganhe dinheiro!",
      url: referralLink
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  const sendInviteEmail = async () => {
    if (!inviteEmail) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, insira um email válido.",
        variant: "destructive"
      });
      return;
    }

    setSendingInvite(true);
    try {
      // Call edge function to send invite email
      const { error } = await supabase.functions.invoke('send-invite-email', {
        body: {
          email: inviteEmail,
          referral_link: referralLink,
          referrer_name: user?.email
        }
      });

      if (error) throw error;

      toast({
        title: "Convite enviado!",
        description: `Convite enviado para ${inviteEmail} com sucesso.`,
      });
      setInviteEmail("");
    } catch (error: any) {
      toast({
        title: "Erro ao enviar convite",
        description: error.message || "Erro inesperado ao enviar convite.",
        variant: "destructive"
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const createNewGroup = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .insert({
          user_id: user?.id,
          service_id: 'default-service',
          status: 'forming'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Novo grupo criado!",
        description: "Seu novo grupo foi criado. Comece a convidar pessoas!",
      });

      // Reload data
      loadGroupData();
    } catch (error: any) {
      toast({
        title: "Erro ao criar grupo",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getProgressPercentage = (current: number) => {
    return Math.min((current / 9) * 100, 100);
  };

  const getMilestoneStatus = (members: number, requiredMembers: number) => {
    if (members >= requiredMembers) return "completed";
    if (members >= requiredMembers - 1) return "almost";
    return "pending";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
                <div className="h-20 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Group Status Overview */}
      {groupData ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Seu Grupo Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Grupo #{groupData.id.slice(-6)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Criado em {formatDate(groupData.created_at)}
                  </p>
                </div>
                <Badge variant={groupData.current_members >= 9 ? "default" : "secondary"}>
                  {groupData.current_members}/9 membros
                </Badge>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progresso:</span>
                  <span className="font-semibold">
                    {getProgressPercentage(groupData.current_members).toFixed(0)}%
                  </span>
                </div>
                <Progress value={getProgressPercentage(groupData.current_members)} className="h-3" />
              </div>

              <p className="text-center font-medium text-lg">
                {groupData.progress_message}
              </p>

              {/* Visual Member Grid */}
              <div className="grid grid-cols-3 md:grid-cols-9 gap-3">
                {Array.from({ length: 9 }, (_, index) => {
                  const member = groupData.members.find(m => m.position === index + 1);
                  return (
                    <div
                      key={index}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-semibold border-2 ${
                        member 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}
                    >
                      {member ? (
                        <>
                          <CheckCircle className="h-6 w-6 mb-1" />
                          <span>#{index + 1}</span>
                        </>
                      ) : (
                        <>
                          <Users className="h-6 w-6 mb-1" />
                          <span>#{index + 1}</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Você ainda não tem um grupo ativo</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro grupo e comece a ganhar dinheiro com indicações!
            </p>
            <Button onClick={createNewGroup}>
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Primeiro Grupo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Milestone Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Recompensas por Marcos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MILESTONE_REWARDS.map((milestone) => {
              const status = getMilestoneStatus(groupData?.current_members || 0, milestone.members);
              
              return (
                <div
                  key={milestone.members}
                  className={`p-4 rounded-lg border-2 ${
                    status === "completed" 
                      ? "bg-green-50 border-green-200" 
                      : status === "almost"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                      status === "completed" 
                        ? "bg-green-500 text-white" 
                        : status === "almost"
                        ? "bg-yellow-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}>
                      {status === "completed" ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <span className="font-bold">{milestone.members}</span>
                      )}
                    </div>
                    <h4 className="font-semibold">{milestone.label}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {milestone.members} membros
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(milestone.reward)}
                    </p>
                    {status === "completed" && (
                      <Badge variant="default" className="mt-2 text-xs">
                        ✓ Conquistado
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Referral Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Ferramentas de Indicação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Referral Link */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Seu Link de Indicação</Label>
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={copyReferralLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
              <Button onClick={shareReferralLink}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Compartilhe este link para que pessoas se inscrevam diretamente no seu grupo!
            </p>
          </div>

          {/* Email Invite */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Convidar por Email</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Button onClick={sendInviteEmail} disabled={sendingInvite}>
                {sendingInvite ? "Enviando..." : "Enviar Convite"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Envie um convite personalizado direto para o email da pessoa.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Member List */}
      {groupData && groupData.members.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membros do Grupo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groupData.members.map((member, index) => (
                <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-green-800">
                        #{member.position}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.user_name || member.user_email || 'Usuário'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Entrou em {formatDate(member.joined_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={member.is_validated ? "default" : "secondary"}>
                      {member.is_validated ? "Validado" : "Pendente"}
                    </Badge>
                    {member.referrer_id === user?.id && (
                      <p className="text-xs text-green-600 mt-1">Sua indicação</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rewards Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resumo de Ganhos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency((groupData?.current_members || 0) * 25)}
              </p>
              <p className="text-sm text-muted-foreground">Por Indicações</p>
              <p className="text-xs text-blue-600">R$ 25 × {groupData?.current_members || 0} membros</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Star className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  MILESTONE_REWARDS
                    .filter(m => (groupData?.current_members || 0) >= m.members)
                    .reduce((sum, m) => sum + m.reward, 0)
                )}
              </p>
              <p className="text-sm text-muted-foreground">Por Marcos</p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Gift className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(
                  ((groupData?.current_members || 0) * 25) +
                  MILESTONE_REWARDS
                    .filter(m => (groupData?.current_members || 0) >= m.members)
                    .reduce((sum, m) => sum + m.reward, 0)
                )}
              </p>
              <p className="text-sm text-muted-foreground">Total Ganho</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};