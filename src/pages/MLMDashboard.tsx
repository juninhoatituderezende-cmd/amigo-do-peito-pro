import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Crown, 
  Link2, 
  CheckCircle, 
  Clock, 
  Copy, 
  Share,
  TrendingUp,
  Gift,
  Target
} from "lucide-react";

interface Group {
  id: string;
  current_count: number;
  max_count: number;
  status: string;
  referral_code: string;
  created_at: string;
  completed_at?: string;
  product: {
    name: string;
    full_value: number;
    entry_value: number;
    category: string;
  };
}

interface Purchase {
  id: string;
  status: string;
  is_contemplated: boolean;
  contemplated_at?: string;
  created_at: string;
  amount_paid: number;
  group: Group;
}

interface GroupMember {
  id: string;
  position: number;
  joined_at: string;
  user_id: string;
  referred_by?: string;
}

export default function MLMDashboard() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [groupMembers, setGroupMembers] = useState<{ [key: string]: GroupMember[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error("Usuário não autenticado");
      }

      // Carregar compras do usuário com grupos e produtos
      const { data: purchasesData, error: purchasesError } = await supabase
        .from("user_purchases")
        .select(`
          *,
          group:groups (
            id,
            current_count,
            max_count,
            status,
            referral_code,
            created_at,
            completed_at,
            product:products (
              name,
              full_value,
              entry_value,
              category
            )
          )
        `)
        .eq("user_id", session.session.user.id)
        .order("created_at", { ascending: false });

      if (purchasesError) throw purchasesError;
      
      const validPurchases = (purchasesData || []).filter(p => p.group && p.group.product);
      setPurchases(validPurchases);

      // Carregar membros de cada grupo
      const groupIds = validPurchases.map(p => p.group.id);
      if (groupIds.length > 0) {
        const { data: membersData, error: membersError } = await supabase
          .from("group_members")
          .select("*")
          .in("group_id", groupIds)
          .order("position");

        if (membersError) throw membersError;

        // Organizar membros por grupo
        const membersByGroup: { [key: string]: GroupMember[] } = {};
        (membersData || []).forEach(member => {
          if (!membersByGroup[member.group_id]) {
            membersByGroup[member.group_id] = [];
          }
          membersByGroup[member.group_id].push(member);
        });

        setGroupMembers(membersByGroup);
      }

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = (referralCode: string) => {
    const link = `${window.location.origin}/mlm/products?ref=${referralCode}`;
    navigator.clipboard.writeText(link).then(() => {
      toast({
        title: "Link copiado!",
        description: "O link de indicação foi copiado para a área de transferência",
      });
    });
  };

  const shareReferralLink = (referralCode: string, productName: string) => {
    const link = `${window.location.origin}/mlm/products?ref=${referralCode}`;
    const text = `🎯 Oportunidade incrível! 

Você pode conseguir ${productName} pagando apenas 10% de entrada!

🔥 Como funciona:
• Você paga só a entrada
• Forma um grupo de 10 pessoas
• Quando o grupo fechar, você ganha o serviço completo!

👆 Clique no link e aproveite: ${link}`;

    if (navigator.share) {
      navigator.share({
        title: `Oportunidade - ${productName}`,
        text: text,
        url: link
      });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        toast({
          title: "Mensagem copiada!",
          description: "A mensagem promocional foi copiada para compartilhar",
        });
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const getStatusBadge = (group: Group, purchase: Purchase) => {
    if (purchase.is_contemplated) {
      return <Badge className="bg-green-500"><Crown className="w-3 h-3 mr-1" />Contemplado</Badge>;
    }
    if (group.status === 'completed') {
      return <Badge className="bg-yellow-500"><CheckCircle className="w-3 h-3 mr-1" />Completo</Badge>;
    }
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Em andamento</Badge>;
  };

  const getProgressPercentage = (currentCount: number, maxCount: number) => {
    return Math.round((currentCount / maxCount) * 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando seu dashboard...</p>
        </div>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Bem-vindo ao MLM Dashboard</h1>
          <p className="text-muted-foreground mb-6">
            Você ainda não possui nenhuma compra. Que tal escolher um plano?
          </p>
          <Button onClick={() => window.location.href = '/mlm/products'}>
            Ver Produtos Disponíveis
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Meu Dashboard MLM</h1>
        <p className="text-muted-foreground">
          Acompanhe o progresso dos seus grupos e suas contemplações
        </p>
      </div>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Grupos Ativos</p>
                <p className="text-2xl font-bold">
                  {purchases.filter(p => p.group.status === 'open').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Contemplações</p>
                <p className="text-2xl font-bold">
                  {purchases.filter(p => p.is_contemplated).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Investido</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(purchases.reduce((sum, p) => sum + p.amount_paid, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Valor Economizado</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    purchases
                      .filter(p => p.is_contemplated)
                      .reduce((sum, p) => sum + (p.group.product.full_value - p.amount_paid), 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Grupos */}
      <div className="space-y-6">
        {purchases.map((purchase) => {
          const group = purchase.group;
          const members = groupMembers[group.id] || [];
          const progress = getProgressPercentage(group.current_count, group.max_count);
          const remaining = group.max_count - group.current_count;

          return (
            <Card key={purchase.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {group.product.name}
                      {getStatusBadge(group, purchase)}
                    </CardTitle>
                    <CardDescription>
                      Criado em {new Date(group.created_at).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Valor total</p>
                    <p className="text-lg font-bold">{formatCurrency(group.product.full_value)}</p>
                    <p className="text-sm text-green-600">
                      Você pagou: {formatCurrency(purchase.amount_paid)}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Progresso do Grupo */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progresso do Grupo</span>
                    <span className="text-sm text-muted-foreground">
                      {group.current_count}/{group.max_count} pessoas
                    </span>
                  </div>
                  <Progress value={progress} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {remaining > 0 
                      ? `Faltam ${remaining} ${remaining === 1 ? 'pessoa' : 'pessoas'} para contemplação`
                      : "Grupo completo! 🎉"
                    }
                  </p>
                </div>

                {/* Status específico */}
                {purchase.is_contemplated ? (
                  <Alert className="border-green-200 bg-green-50">
                    <Crown className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Parabéns! Você foi contemplado!</strong><br />
                      Contemplado em {new Date(purchase.contemplated_at!).toLocaleDateString('pt-BR')}
                    </AlertDescription>
                  </Alert>
                ) : group.status === 'open' ? (
                  <div className="space-y-4">
                    {/* Link de Indicação */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Seu Link de Indicação
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={`${window.location.origin}/mlm/products?ref=${group.referral_code}`}
                          readOnly
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyReferralLink(group.referral_code)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareReferralLink(group.referral_code, group.product.name)}
                        >
                          <Share className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Código: <strong>{group.referral_code}</strong>
                      </p>
                    </div>

                    {/* Membros do Grupo */}
                    <div>
                      <h4 className="font-medium mb-3">Membros do Grupo ({members.length}/10)</h4>
                      <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                        {Array.from({ length: 10 }, (_, index) => {
                          const member = members.find(m => m.position === index + 1);
                          return (
                            <div
                              key={index}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                member
                                  ? 'bg-green-500 text-white'
                                  : 'bg-muted border-2 border-dashed border-muted-foreground/30'
                              }`}
                              title={member ? `Posição ${index + 1} - Ocupada` : `Posição ${index + 1} - Vaga`}
                            >
                              {member ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                index + 1
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}