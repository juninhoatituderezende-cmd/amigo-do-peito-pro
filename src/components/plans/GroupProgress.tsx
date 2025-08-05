import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Calendar, Clock, Share2, Copy, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Plan } from "./PlansSelection";

interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  joinDate: string;
  referredBy?: string;
}

interface GroupProgressProps {
  plan: Plan;
  groupId: string;
  members: GroupMember[];
  isOwner: boolean;
  referralLink: string;
}

const mockMembers: GroupMember[] = [
  {
    id: "1",
    name: "João Silva",
    joinDate: "2024-01-15",
    referredBy: "owner"
  },
  {
    id: "2", 
    name: "Maria Santos",
    joinDate: "2024-01-16",
    referredBy: "João Silva"
  },
  {
    id: "3",
    name: "Pedro Costa",
    joinDate: "2024-01-17", 
    referredBy: "João Silva"
  }
];

export const GroupProgress = ({ 
  plan, 
  groupId, 
  members = mockMembers, 
  isOwner, 
  referralLink 
}: GroupProgressProps) => {
  const [showAllMembers, setShowAllMembers] = useState(false);
  const { toast } = useToast();

  const maxMembers = 10;
  const currentMembers = members.length;
  const progress = (currentMembers / maxMembers) * 100;
  const membersNeeded = maxMembers - currentMembers;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link copiado!",
      description: "Compartilhe com seus amigos para formar o grupo.",
    });
  };

  const shareReferralLink = () => {
    if (navigator.share) {
      navigator.share({
        title: `Participe do meu grupo ${plan.name}!`,
        text: `Oi! Estou formando um grupo para ${plan.name}. Venha comigo e pague apenas R$ ${plan.entryPrice}!`,
        url: referralLink,
      });
    } else {
      copyReferralLink();
    }
  };

  const getStatusMessage = () => {
    if (currentMembers === maxMembers) {
      return "🎉 Grupo completo! Todos podem agendar o serviço.";
    }
    if (currentMembers >= 8) {
      return "🔥 Quase lá! Faltam apenas algumas pessoas.";
    }
    if (currentMembers >= 5) {
      return "👥 Grupo crescendo! Continue compartilhando.";
    }
    return "🚀 Grupo iniciado! Convide seus amigos.";
  };

  const getStatusColor = () => {
    if (currentMembers === maxMembers) return "text-green-600";
    if (currentMembers >= 8) return "text-orange-600";
    if (currentMembers >= 5) return "text-blue-600";
    return "text-purple-600";
  };

  return (
    <div className="space-y-6">
      {/* Group Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {plan.icon}
                Grupo {plan.name}
              </CardTitle>
              <p className="text-muted-foreground">ID: {groupId}</p>
            </div>
            <Badge 
              variant="secondary" 
              className={currentMembers === maxMembers ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}
            >
              {currentMembers === maxMembers ? "Completo" : "Ativo"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progresso do grupo</span>
              <span>{currentMembers}/{maxMembers} pessoas</span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className={`text-sm mt-2 ${getStatusColor()}`}>
              {getStatusMessage()}
            </p>
          </div>

          {/* Plan Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm text-muted-foreground">Plano selecionado</span>
              <div className="font-medium">{plan.name}</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Valor da entrada</span>
              <div className="font-medium text-ap-orange">R$ {plan.entryPrice.toLocaleString()}</div>
            </div>
          </div>

          {/* Actions */}
          {currentMembers < maxMembers && (
            <div className="space-y-3">
              <h4 className="font-medium">Compartilhe e complete seu grupo:</h4>
              <div className="flex gap-2">
                <Button 
                  onClick={shareReferralLink}
                  className="flex-1 bg-ap-orange hover:bg-ap-orange/90"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
                <Button 
                  variant="outline"
                  onClick={copyReferralLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground text-center">
                Faltam {membersNeeded} pessoa{membersNeeded !== 1 ? 's' : ''} para completar o grupo
              </div>
            </div>
          )}

          {currentMembers === maxMembers && (
            <div className="space-y-3">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                  <Users className="h-5 w-5" />
                  Grupo Completo!
                </div>
                <p className="text-sm text-green-600 mb-3">
                  Parabéns! Seu grupo está completo. Agora todos podem agendar o serviço com um profissional.
                </p>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Meu Serviço
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membros do Grupo ({currentMembers})
            </span>
            {isOwner && (
              <Badge variant="outline" className="border-ap-orange text-ap-orange">
                Organizador
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(showAllMembers ? members : members.slice(0, 5)).map((member, index) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {member.name}
                      {index === 0 && isOwner && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Você
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Entrou em {member.joinDate}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-green-600 font-medium">
                    ✓ Pago
                  </div>
                  {member.referredBy && member.referredBy !== "owner" && (
                    <div className="text-xs text-muted-foreground">
                      por {member.referredBy}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: maxMembers - currentMembers }).map((_, index) => (
              <div key={`empty-${index}`} className="flex items-center justify-between p-3 border border-dashed rounded-lg opacity-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-400">
                      Aguardando participante
                    </div>
                    <div className="text-sm text-gray-400">
                      Posição {currentMembers + index + 1}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {members.length > 5 && !showAllMembers && (
              <Button 
                variant="outline" 
                onClick={() => setShowAllMembers(true)}
                className="w-full"
              >
                Ver todos os membros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Seu Link de Indicação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-gray-100 rounded-lg break-all text-sm font-mono">
            {referralLink}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={copyReferralLink}
              variant="outline"
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Link
            </Button>
            <Button 
              onClick={shareReferralLink}
              className="flex-1 bg-ap-orange hover:bg-ap-orange/90"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Compartilhe este link para que seus amigos se juntem ao seu grupo. 
            Quando o grupo estiver completo, todos poderão agendar o serviço!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};