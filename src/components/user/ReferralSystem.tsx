import { useState, useEffect } from "react";
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
  const { toast } = useToast();
  const [referralData, setReferralData] = useState<UserReferralData>({
    referralCode: "JOAO123",
    referralLink: "https://amigodopeito.com/register?ref=JOAO123",
    totalReferrals: 4,
    groupsFormed: 1,
    pendingInvites: 2
  });

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralData.referralLink);
    toast({
      title: "Link copiado!",
      description: "Seu link de indicação foi copiado para a área de transferência.",
    });
  };

  const shareReferralLink = () => {
    if (navigator.share) {
      navigator.share({
        title: "Participe do Amigo do Peito",
        text: "Venha formar um grupo comigo e economizar em serviços estéticos!",
        url: referralData.referralLink,
      });
    } else {
      copyReferralLink();
    }
  };

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
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Seu código:</p>
                <Badge variant="secondary" className="text-lg font-mono">
                  {referralData.referralCode}
                </Badge>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Link completo:</p>
              <div className="flex items-center gap-2 p-3 bg-card border rounded">
                <ExternalLink className="h-4 w-4 text-gray-400" />
                <span className="flex-1 text-sm font-mono text-gray-600 truncate">
                  {referralData.referralLink}
                </span>
              </div>
            </div>
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
              <Share className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
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