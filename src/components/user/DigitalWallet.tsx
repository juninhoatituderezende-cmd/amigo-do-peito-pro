import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  Award, 
  DollarSign,
  Eye,
  Copy,
  Share2,
  Gift,
  Target,
  CheckCircle,
  Clock,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface WalletData {
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  pix_key: string;
  pix_key_type: string;
}

interface GroupProgress {
  group_id: string;
  current_members: number;
  progress_message: string;
  status: string;
  created_at: string;
  completed_at?: string;
  members: Array<{
    user_id: string;
    position: number;
    referrer_id?: string;
    joined_at: string;
    is_validated: boolean;
  }>;
}

interface ReferralReward {
  id: string;
  validation_step: number;
  reward_amount: number;
  reward_status: string;
  validated_at: string;
  referred_user?: string;
}

export const DigitalWallet = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [groupProgress, setGroupProgress] = useState<GroupProgress[]>([]);
  const [referralRewards, setReferralRewards] = useState<ReferralReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadWalletData();
      loadGroupProgress();
      loadReferralRewards();
      generateReferralLink();
    }
  }, [user]);

  const loadWalletData = async () => {
    try {
      // Buscar dados de créditos do usuário
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setWalletData({
          available_balance: data.available_credits,
          pending_balance: data.pending_withdrawal,
          total_earned: data.total_credits,
          total_withdrawn: data.total_credits - data.available_credits,
          pix_key: 'não informado',
          pix_key_type: 'cpf'
        });
      }
    } catch (error: any) {
      console.error('Error loading wallet:', error);
    }
  };

  const loadGroupProgress = async () => {
    try {
      // Buscar grupos do usuário
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (data) {
        const formattedGroups = data.map(group => ({
          group_id: group.id,
          current_members: 1, // Mock value
          progress_message: `Grupo criado em ${new Date(group.created_at).toLocaleDateString()}`,
          status: group.status,
          created_at: group.created_at,
          members: [] // Mock empty array
        }));
        setGroupProgress(formattedGroups);
      }
    } catch (error: any) {
      console.error('Error loading groups:', error);
    }
  };

  const loadReferralRewards = async () => {
    try {
      // Buscar transações de crédito do usuário como recompensas
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('type', 'referral')
        .order('created_at', { ascending: false });

      if (data) {
        const formattedRewards = data.map((transaction, index) => ({
          id: transaction.id,
          validation_step: index + 1,
          reward_amount: transaction.amount,
          reward_status: 'credited',
          validated_at: transaction.created_at,
          referred_user: transaction.description
        }));
        setReferralRewards(formattedRewards);
      }
    } catch (error: any) {
      console.error('Error loading referrals:', error);
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
      title: "Venha fazer parte do Amigo do Peito!",
      text: "Junte-se ao melhor sistema de grupos de WhatsApp e ganhe dinheiro com indicações!",
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getProgressPercentage = (current: number, total: number = 9) => {
    return Math.min((current / total) * 100, 100);
  };

  const getMilestoneColor = (members: number) => {
    if (members >= 9) return "text-green-600";
    if (members >= 6) return "text-blue-600";
    if (members >= 3) return "text-yellow-600";
    return "text-gray-600";
  };

  const getMilestoneBadge = (members: number) => {
    if (members >= 9) return { label: "Completo", variant: "default" as const };
    if (members >= 6) return { label: "Quase lá", variant: "secondary" as const };
    if (members >= 3) return { label: "Progredindo", variant: "outline" as const };
    return { label: "Iniciando", variant: "outline" as const };
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
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(walletData?.available_balance || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(walletData?.pending_balance || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Ganho</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(walletData?.total_earned || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Já Sacado</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(walletData?.total_withdrawn || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Seu Link de Indicação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono">
              {referralLink}
            </div>
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
            Compartilhe este link para ganhar R$ 25,00 por cada pessoa que se inscrever no seu grupo!
          </p>
        </CardContent>
      </Card>

      {/* Group Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Progresso dos Seus Grupos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groupProgress.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum grupo ativo</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro grupo e comece a ganhar dinheiro com indicações!
              </p>
              <Button>Criar Primeiro Grupo</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {groupProgress.map((group) => {
                const milestone = getMilestoneBadge(group.current_members);
                const progressPercent = getProgressPercentage(group.current_members);
                
                return (
                  <div key={group.group_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">Grupo #{group.group_id.slice(-6)}</h4>
                        <p className="text-sm text-muted-foreground">
                          Criado em {formatDate(group.created_at)}
                        </p>
                      </div>
                      <Badge variant={milestone.variant}>{milestone.label}</Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progresso: {group.current_members}/9 membros</span>
                          <span className={getMilestoneColor(group.current_members)}>
                            {progressPercent.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {group.progress_message}
                      </p>

                      {/* Members List */}
                      <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
                        {Array.from({ length: 9 }, (_, index) => {
                          const member = group.members.find(m => m.position === index + 1);
                          return (
                            <div
                              key={index}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                                member 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              {member ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                index + 1
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Milestones */}
                      <div className="flex justify-between text-xs">
                        <div className={`text-center ${group.current_members >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
                          <div className="font-semibold">3 membros</div>
                          <div>+R$ 50</div>
                        </div>
                        <div className={`text-center ${group.current_members >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                          <div className="font-semibold">6 membros</div>
                          <div>+R$ 100</div>
                        </div>
                        <div className={`text-center ${group.current_members >= 9 ? 'text-green-600' : 'text-gray-400'}`}>
                          <div className="font-semibold">9 membros</div>
                          <div>+R$ 500</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Referral Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Recompensas por Indicações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referralRewards.length === 0 ? (
            <div className="text-center py-6">
              <Gift className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                Suas recompensas por indicações aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referralRewards.slice(0, 10).map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Star className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Indicação #{reward.validation_step}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(reward.validated_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(reward.reward_amount)}
                    </p>
                    <Badge 
                      variant={reward.reward_status === 'credited' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {reward.reward_status === 'credited' ? 'Creditado' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};