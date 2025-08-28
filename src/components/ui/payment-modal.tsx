import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, QrCode, Download, CreditCard, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: {
    success: boolean;
    payment_id: string;
    amount: number;
    plan_name: string;
    due_date: string;
    status: string;
    pix_code?: string;
    qr_code?: string;
    invoice_url?: string;
    bank_slip_url?: string;
  } | null;
  paymentMethod: string;
}

export const PaymentModal = ({ isOpen, onClose, paymentData, paymentMethod }: PaymentModalProps) => {
  const { toast } = useToast();

  if (!paymentData || !paymentData.success) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Código PIX copiado para a área de transferência.",
    });
  };

  const downloadQRCode = () => {
    if (paymentData.qr_code) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${paymentData.qr_code}`;
      link.download = `qr-code-pagamento-${paymentData.payment_id}.png`;
      link.click();
    }
  };

  const openBankSlip = () => {
    if (paymentData.bank_slip_url) {
      window.open(paymentData.bank_slip_url, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Pagamento Criado com Sucesso!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Pagamento */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{paymentData.plan_name}</h3>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {paymentData.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Vencimento: {new Date(paymentData.due_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground text-center">
                    ID do Pagamento: {paymentData.payment_id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PIX Payment */}
          {paymentMethod === 'pix' && paymentData.pix_code && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <QrCode className="h-5 w-5" />
                    <span className="font-medium">Pagamento via PIX</span>
                  </div>

                  {/* QR Code */}
                  {paymentData.qr_code && (
                    <div className="flex flex-col items-center space-y-3">
                      <img 
                        src={`data:image/png;base64,${paymentData.qr_code}`}
                        alt="QR Code PIX"
                        className="w-48 h-48 border rounded-lg"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={downloadQRCode}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Baixar QR Code
                      </Button>
                    </div>
                  )}

                  {/* PIX Code */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Código PIX:</p>
                    <div className="p-3 bg-gray-50 rounded-lg border break-all text-xs font-mono">
                      {paymentData.pix_code}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(paymentData.pix_code!)}
                      className="w-full flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar Código PIX
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Boleto Payment */}
          {(paymentMethod === 'credit_card' || paymentMethod === 'boleto') && paymentData.bank_slip_url && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <CreditCard className="h-5 w-5" />
                    <span className="font-medium">Boleto Bancário</span>
                  </div>

                  <Button 
                    onClick={openBankSlip}
                    className="w-full flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Abrir Boleto
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Próximos passos:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• {paymentMethod === 'pix' ? 'Escaneie o QR Code ou use o código PIX' : 'Pague o boleto até o vencimento'}</li>
              <li>• Após o pagamento, você será notificado</li>
              <li>• Você poderá acessar seu grupo na área do usuário</li>
              <li>• Aguarde a formação completa do grupo para agendar</li>
            </ul>
          </div>

          {/* Close Button */}
          <Button onClick={onClose} className="w-full">
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};