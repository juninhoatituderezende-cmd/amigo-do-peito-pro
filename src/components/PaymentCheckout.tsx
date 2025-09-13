import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { QrCode, CreditCard, Copy, ArrowLeft, CheckCircle } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  max_participants: number;
  image_url?: string;
  active: boolean;
  created_at: string;
}

interface PaymentCheckoutProps {
  plan: Plan;
  onBack: () => void;
  onSuccess?: (paymentData: any) => void;
}

export const PaymentCheckout = ({ plan, onBack, onSuccess }: PaymentCheckoutProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const processPayment = async (method: 'pix' | 'boleto') => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessing(true);
      
      console.log('🚀 Iniciando pagamento:', { 
        plan_id: plan.id, 
        user_id: user.id, 
        method,
        plan_name: plan.name,
        amount: plan.price
      });

      // Chamar edge function para criar pagamento via Asaas
      // Resolver líder pretendido a partir do código de referência na URL (se houver)
      let intendedLeaderId: string | null = null;
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const refCodeFromUrl = urlParams.get('ref');
        if (refCodeFromUrl) {
          const { data: leaderProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', refCodeFromUrl)
            .maybeSingle();
          intendedLeaderId = leaderProfile?.id || null;
        }
      } catch {}

      const { data: response, error } = await supabase.functions.invoke('create-asaas-payment', {
        body: {
          plan_id: plan.id,
          plan_category: 'tatuador', // Detectar automaticamente baseado no plano
          user_id: user.id,
          payment_method: method,
          municipio: 'sao_paulo',
          intended_leader_id: intendedLeaderId || undefined
        }
      });

      console.log('📡 Resposta da edge function:', response);

      if (error) {
        console.error('❌ Erro na edge function:', error);
        throw new Error(error.message || 'Erro na comunicação com o servidor');
      }

      if (!response?.success) {
        console.error('❌ Resposta de erro:', response);
        throw new Error(response?.error || 'Erro ao processar pagamento');
      }

      if (method === 'pix') {
        // Para PIX, exibir QR Code e código
        setPixData({
          qr_code: response.qr_code || null,
          pix_code: response.pix_code || 'Código PIX não disponível',
          amount: response.amount || plan.price,
          payment_id: response.payment_id,
          redirect_url: response.redirect_url
        });

        toast({
          title: "PIX Gerado!",
          description: "Use o QR Code ou copie o código PIX para pagar.",
        });
      } else if (method === 'boleto') {
        // Para boleto, redirecionar direto
        if (response.redirect_url) {
          window.open(response.redirect_url, '_blank');
          toast({
            title: "Boleto Gerado!",
            description: "O boleto foi aberto em uma nova aba.",
          });
        }
      }

      if (onSuccess) {
        onSuccess(response);
      }

    } catch (error) {
      console.error('💥 Erro ao processar pagamento:', error);
      toast({
        title: "Erro no pagamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const copyPixCode = async () => {
    if (!pixData?.pix_code) return;
    
    try {
      await navigator.clipboard.writeText(pixData.pix_code);
      setCopySuccess(true);
      toast({
        title: "Código copiado!",
        description: "Cole no seu app de banco para pagar.",
      });
      
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Selecione e copie o código manualmente.",
        variant: "destructive"
      });
    }
  };

  // Se PIX foi gerado, mostrar tela de PIX
  if (pixData) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPixData(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                Pagamento PIX
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {plan.name} - {formatCurrency(pixData.amount)}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* QR Code (se disponível) */}
          {pixData.qr_code && (
            <div className="text-center">
              <div className="inline-block p-4 bg-white rounded-lg border-2">
                <img 
                  src={pixData.qr_code} 
                  alt="QR Code PIX" 
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Escaneie com o app do seu banco
              </p>
            </div>
          )}

          {/* Código PIX */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Código PIX (Copia e Cola)</label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                {pixData.pix_code}
              </div>
              <Button
                onClick={copyPixCode}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                {copySuccess ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Instruções */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Como pagar:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Abra o app do seu banco</li>
              <li>2. Procure por "PIX" ou "Pagar com PIX"</li>
              <li>3. Escaneie o QR Code ou cole o código PIX</li>
              <li>4. Confirme o pagamento</li>
            </ol>
          </div>

          {/* Link direto se disponível */}
          {pixData.redirect_url && (
            <Button 
              onClick={() => window.open(pixData.redirect_url, '_blank')}
              className="w-full"
              variant="outline"
            >
              Abrir página de pagamento
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Tela principal de seleção de método
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="flex-1">Finalizar Pagamento</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Resumo do Plano */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            {plan.image_url && (
              <img 
                src={plan.image_url} 
                alt={plan.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{plan.name}</h3>
              {plan.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {plan.description}
                </p>
              )}
              <p className="text-2xl font-bold text-primary mt-2">
                {formatCurrency(plan.price)}
              </p>
            </div>
          </div>
        </div>

        {/* Métodos de Pagamento */}
        <div className="space-y-4">
          <h3 className="font-medium">Escolha a forma de pagamento:</h3>
          
          <div className="grid gap-3">
            <Button
              variant={paymentMethod === 'pix' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('pix')}
              className="h-auto p-4 justify-start"
            >
              <QrCode className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">PIX</div>
                <div className="text-sm opacity-75">Pagamento instantâneo</div>
              </div>
            </Button>

            <Button
              variant={paymentMethod === 'boleto' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('boleto')}
              className="h-auto p-4 justify-start"
            >
              <CreditCard className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Boleto Bancário</div>
                <div className="text-sm opacity-75">Vence em 7 dias</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Botão de Pagamento */}
        {paymentMethod && (
          <Button
            onClick={() => processPayment(paymentMethod)}
            disabled={processing}
            className="w-full h-12"
            size="lg"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                Processando...
              </>
            ) : (
              <>
                Pagar com {paymentMethod === 'pix' ? 'PIX' : 'Boleto'}
              </>
            )}
          </Button>
        )}

        {paymentMethod === 'pix' && !processing && (
          <p className="text-xs text-center text-muted-foreground">
            Após o pagamento, você será redirecionado para seu painel
          </p>
        )}
      </CardContent>
    </Card>
  );
};