import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Crown, Users, Copy, Share } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MLMSuccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [groupData, setGroupData] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      confirmPayment();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const confirmPayment = async () => {
    try {
      setConfirming(true);

      const { data, error } = await supabase.functions.invoke("confirm-mlm-payment", {
        body: { session_id: sessionId }
      });

      if (error) throw error;

      if (data?.success) {
        setConfirmed(true);
        setGroupData(data);
        
        toast({
          title: "Pagamento confirmado!",
          description: "Você foi adicionado ao grupo com sucesso",
        });

        // Recarregar dados após um tempo
        setTimeout(() => {
          loadGroupDetails(data.group_id);
        }, 2000);
      }

    } catch (error) {
      console.error("Erro ao confirmar pagamento:", error);
      toast({
        title: "Erro na confirmação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  const loadGroupDetails = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select(`
          *,
          product:products (
            name,
            full_value,
            entry_value
          )
        `)
        .eq("id", groupId)
        .single();

      if (error) throw error;
      setGroupData({ ...groupData, group_details: data });
    } catch (error) {
      console.error("Erro ao carregar detalhes do grupo:", error);
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

  const goToDashboard = () => {
    navigate('/mlm/dashboard');
  };

  if (loading || confirming) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold mb-4">
            {confirming ? "Confirmando seu pagamento..." : "Carregando..."}
          </h1>
          <p className="text-muted-foreground">
            Aguarde enquanto processamos sua compra
          </p>
        </div>
      </div>
    );
  }

  if (!sessionId || !confirmed) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              Sessão inválida ou pagamento não confirmado. 
              Se você acabou de fazer um pagamento, tente novamente em alguns minutos.
            </AlertDescription>
          </Alert>
          
          <div className="text-center mt-6">
            <Button onClick={() => navigate('/mlm/products')}>
              Voltar aos Produtos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Confirmação de Sucesso */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-green-800">
              Pagamento Confirmado!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-green-700 mb-4">
              Sua compra foi processada com sucesso e você foi adicionado ao grupo.
            </p>
            
            {groupData?.group_details && (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">{groupData.group_details.product.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Posição no grupo:</span>
                    <p className="font-medium">{groupData.current_count || 'Carregando...'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium text-blue-600">Ativo</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximos Passos */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Próximos Passos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Compartilhe seu link de indicação</h4>
                  <p className="text-sm text-muted-foreground">
                    Use o link abaixo para indicar pessoas e completar seu grupo de 10
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Acompanhe o progresso</h4>
                  <p className="text-sm text-muted-foreground">
                    Monitore quantas pessoas já entraram no seu grupo
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Seja contemplado</h4>
                  <p className="text-sm text-muted-foreground">
                    Quando 9 pessoas entrarem através do seu link, você será contemplado!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link de Indicação */}
        {groupData?.group_details && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                Seu Link de Indicação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Link para compartilhar:
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/mlm/products?ref=${groupData.group_details.referral_code}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyReferralLink(groupData.group_details.referral_code)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => shareReferralLink(
                      groupData.group_details.referral_code, 
                      groupData.group_details.product.name
                    )}
                  >
                    <Share className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Código: <strong>{groupData.group_details.referral_code}</strong>
                </p>
              </div>

              <Alert>
                <AlertDescription>
                  💡 <strong>Dica:</strong> Compartilhe este link nas suas redes sociais, WhatsApp, 
                  ou com amigos e familiares. Quanto mais pessoas indicar, mais rápido seu grupo fecha!
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Botões de Ação */}
        <div className="text-center">
          <Button onClick={goToDashboard} size="lg" className="mr-4">
            Ir para o Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/mlm/products')}>
            Ver Outros Produtos
          </Button>
        </div>
      </div>
    </div>
  );
}