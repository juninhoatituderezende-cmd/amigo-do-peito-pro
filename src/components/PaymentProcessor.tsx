import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, QrCode, Copy, Check, Loader2 } from "lucide-react";

interface PaymentProcessorProps {
  planId: string;
  userId: string;
  influencerCode?: string;
  onPaymentSuccess?: (paymentData: any) => void;
}

export function PaymentProcessor({ 
  planId, 
  userId, 
  influencerCode, 
  onPaymentSuccess 
}: PaymentProcessorProps) {
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "pix">("credit_card");
  const [processing, setProcessing] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const processPayment = async (method: "credit_card" | "pix") => {
    try {
      setProcessing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase.functions.invoke('process-real-payment', {
        body: {
          plan_id: planId,
          user_id: userId,
          influencer_code: influencerCode,
          payment_method: method,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (method === "credit_card") {
        // Redirect to Stripe checkout
        window.open(data.checkout_url, '_blank');
        
        toast({
          title: "Redirecionando para pagamento",
          description: "Você será redirecionado para finalizar a compra com cartão de crédito.",
        });
      } else {
        // Show PIX data
        setPixData(data);
        toast({
          title: "PIX gerado com sucesso",
          description: "Copie o código PIX ou escaneie o QR Code para pagar.",
        });
      }

      onPaymentSuccess?.(data);

    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Erro no pagamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const copyPixCode = async () => {
    if (pixData?.pix_code) {
      await navigator.clipboard.writeText(pixData.pix_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Código PIX copiado",
        description: "Cole no seu aplicativo bancário para pagar.",
      });
    }
  };

  if (pixData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>Pagamento via PIX</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <img 
              src={pixData.qr_code} 
              alt="QR Code PIX" 
              className="mx-auto mb-4 border rounded-lg"
            />
            <Badge variant="outline" className="mb-2">
              R$ {pixData.amount.toFixed(2)}
            </Badge>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Código PIX:</p>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-2 bg-gray-100 rounded text-xs break-all">
                {pixData.pix_code}
              </code>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={copyPixCode}
                disabled={copied}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Como pagar:</strong><br />
              1. Abra seu aplicativo bancário<br />
              2. Escolha PIX → Copiar e Colar<br />
              3. Cole o código acima<br />
              4. Confirme o pagamento
            </p>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              setPixData(null);
              setPaymentMethod("credit_card");
            }}
          >
            Voltar para seleção de pagamento
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escolha a forma de pagamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant={paymentMethod === "credit_card" ? "default" : "outline"}
            className="h-20 flex-col space-y-2"
            onClick={() => setPaymentMethod("credit_card")}
            disabled={processing}
          >
            <CreditCard className="h-6 w-6" />
            <span>Cartão de Crédito</span>
          </Button>

          <Button
            variant={paymentMethod === "pix" ? "default" : "outline"}
            className="h-20 flex-col space-y-2"
            onClick={() => setPaymentMethod("pix")}
            disabled={processing}
          >
            <QrCode className="h-6 w-6" />
            <span>PIX</span>
          </Button>
        </div>

        <Separator />

        <Button
          className="w-full"
          onClick={() => processPayment(paymentMethod)}
          disabled={processing}
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              Pagar com {paymentMethod === "credit_card" ? "Cartão" : "PIX"}
            </>
          )}
        </Button>

        {paymentMethod === "credit_card" && (
          <p className="text-xs text-gray-500 text-center">
            Você será redirecionado para uma página segura do Stripe
          </p>
        )}
      </CardContent>
    </Card>
  );
}