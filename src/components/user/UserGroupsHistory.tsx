import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Calendar, DollarSign, Clock, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface GroupParticipation {
  id: string;
  groupName: string;
  productName: string;
  joinDate: string;
  amountPaid: number;
  totalValue: number;
  status: "active" | "contemplated" | "completed" | "pending_payment";
  members: number;
  maxMembers: number;
  nextDrawDate?: string;
  position?: number;
  groupId?: string;
}

export const UserGroupsHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [participations, setParticipations] = useState<GroupParticipation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserParticipations();
    }
  }, [user]);

  const loadUserParticipations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('group_participants')
        .select(`
          *,
          plan_groups(
            *,
            service_id
          )
        `)
        .eq('user_id', user?.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedParticipations: GroupParticipation[] = data.map((participation, index) => ({
          id: participation.id,
          groupId: participation.group_id,
          groupName: `Grupo ${participation.plan_groups?.group_number || (index + 1)}`,
          productName: `Plano ${participation.plan_groups?.group_number || (index + 1)}`,
          joinDate: new Date(participation.joined_at).toLocaleDateString('pt-BR'),
          amountPaid: participation.amount_paid || 0,
          totalValue: participation.plan_groups?.target_amount || 0,
          status: participation.status === 'contemplated' ? 'contemplated' : 
                  participation.plan_groups?.status === 'complete' ? 'completed' :
                  participation.amount_paid > 0 ? 'active' : 'pending_payment',
          members: participation.plan_groups?.current_participants || 0,
          maxMembers: participation.plan_groups?.max_participants || 10,
          position: index + 1,
          nextDrawDate: participation.plan_groups?.status === 'forming' ? 
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR') : 
            undefined
        }));
        
        setParticipations(formattedParticipations);
      }
    } catch (error) {
      console.error('Erro ao carregar participações:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar seu histórico de grupos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (groupId: string) => {
    navigate(`/usuario/grupo/${groupId}`);
  };

  const handleMakePayment = (participationId: string) => {
    navigate(`/usuario/pagamento/${participationId}`);
  };

  const handleScheduleAppointment = (groupId: string) => {
    toast({
      title: "Agendamento",
      description: "Em breve você poderá agendar seu procedimento!",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }
  const getStatusColor = (status: GroupParticipation["status"]) => {
    switch (status) {
      case "active": return "bg-blue-50 text-blue-700 border-blue-200";
      case "contemplated": return "bg-green-50 text-green-700 border-green-200";
      case "completed": return "bg-gray-50 text-gray-700 border-gray-200";
      case "pending_payment": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusText = (status: GroupParticipation["status"]) => {
    switch (status) {
      case "active": return "Ativo";
      case "contemplated": return "Contemplado";
      case "completed": return "Finalizado";
      case "pending_payment": return "Pagamento Pendente";
      default: return "Desconhecido";
    }
  };

  // Remover função duplicada - já importada do utils
  const totalInvested = participations.reduce((sum, p) => sum + p.amountPaid, 0);
  const activeGroups = participations.filter(p => p.status === "active").length;
  const contemplatedGroups = participations.filter(p => p.status === "contemplated").length;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Investido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
            <p className="text-xs text-muted-foreground">
              Em {participations.length} grupos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Grupos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGroups}</div>
            <p className="text-xs text-muted-foreground">
              Participações ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contemplações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contemplatedGroups}</div>
            <p className="text-xs text-muted-foreground">
              Procedimentos ganhos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Groups List */}
      <Card>
        <CardHeader>
          <CardTitle>Meus Grupos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {participations.map((group) => (
              <div key={group.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{group.groupName}</h4>
                    <p className="text-sm text-muted-foreground">{group.productName}</p>
                  </div>
                  <Badge variant="outline" className={`${getStatusColor(group.status)} border`}>
                    {getStatusText(group.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-muted-foreground">Posição:</span>
                    <div className="font-medium">#{group.position}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Membros:</span>
                    <div className="font-medium">{group.members}/{group.maxMembers}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pago:</span>
                    <div className="font-medium">{formatCurrency(group.amountPaid)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entrada em:</span>
                    <div className="font-medium">{group.joinDate}</div>
                  </div>
                </div>

                {/* Progress Bar for Active Groups */}
                {group.status === "active" && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progresso do grupo</span>
                      <span>{Math.round((group.members / group.maxMembers) * 100)}%</span>
                    </div>
                    <Progress value={(group.members / group.maxMembers) * 100} className="h-2" />
                  </div>
                )}

                {/* Next Draw Date */}
                {group.nextDrawDate && group.status === "active" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Calendar className="h-4 w-4" />
                    <span>Próximo sorteio: {group.nextDrawDate}</span>
                  </div>
                )}

                {/* Contemplated Message */}
                {group.status === "contemplated" && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                    <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
                      <Users className="h-4 w-4" />
                      Parabéns! Você foi contemplado neste grupo!
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Entre em contato conosco para agendar seu procedimento.
                    </p>
                  </div>
                )}

                {/* Pending Payment Warning */}
                {group.status === "pending_payment" && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
                    <div className="flex items-center gap-2 text-yellow-800 text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      Pagamento pendente
                    </div>
                    <p className="text-sm text-yellow-600 mt-1">
                      Complete seu pagamento para participar dos sorteios.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(group.groupId || group.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                  {group.status === "pending_payment" && (
                    <Button 
                      size="sm" 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => handleMakePayment(group.id)}
                    >
                      Fazer Pagamento
                    </Button>
                  )}
                  {group.status === "contemplated" && (
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleScheduleAppointment(group.groupId || group.id)}
                    >
                      Agendar Procedimento
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {participations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Você ainda não participou de nenhum grupo.</p>
              <p className="text-sm">Comece agora e concorra a procedimentos incríveis!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};