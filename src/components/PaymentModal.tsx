import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Copy, CheckCircle, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

interface PaymentModalProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData: any) => void;
}

export const PaymentModal = ({ plan, isOpen, onClose, onSuccess }: PaymentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generatePixPayment = async () => {
    if (!plan) return;

    try {
      setLoading(true);
      console.log('🚀 Gerando PIX para:', plan.name);

      const { data: paymentResponse, error } = await supabase.functions.invoke('create-asaas-payment', {
        body: {
          plan_id: plan.id,
          plan_category: 'tattoo',
          user_id: (await supabase.auth.getUser()).data.user?.id,
          payment_method: 'pix',
          municipio: 'sao_paulo'
        }
      });

      if (error) {
        console.error('❌ Erro na edge function:', error);
        throw new Error(error.message || 'Erro ao gerar PIX');
      }

      if (!paymentResponse?.success) {
        throw new Error(paymentResponse?.error || 'Falha ao gerar PIX');
      }

      console.log('✅ PIX gerado:', paymentResponse);
      setPixData(paymentResponse);

      toast({
        title: "PIX Gerado!",
        description: "Escaneie o QR Code ou copie o código PIX para pagar",
      });

    } catch (error) {
      console.error('💥 Erro ao gerar PIX:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao gerar PIX",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (pixData?.pix_code) {
      await navigator.clipboard.writeText(pixData.pix_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para a área de transferência",
      });
    }
  };

  const handleClose = () => {
    setPixData(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Pagamento PIX</span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo do Produto */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{plan?.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan?.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">R$ {plan?.price}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão Gerar PIX ou QR Code */}
          {!pixData ? (
            <Button 
              onClick={generatePixPayment} 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando PIX...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Gerar PIX - R$ {plan?.price}
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              {/* QR Code */}
              {pixData.qr_code && (
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">Escaneie o QR Code:</p>
                  <div className="flex justify-center">
                    <img 
                      src={`data:image/png;base64,${pixData.qr_code}`}
                      alt="QR Code PIX"
                      className="w-48 h-48 border rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Código PIX */}
              {pixData.pix_code && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Ou copie o código PIX:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pixData.pix_code}
                      readOnly
                      className="flex-1 p-2 text-xs border rounded bg-muted font-mono"
                    />
                    <Button onClick={copyPixCode} variant="outline" size="sm">
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Aguardando pagamento... O status será atualizado automaticamente.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};