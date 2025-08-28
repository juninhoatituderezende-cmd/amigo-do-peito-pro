import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, QrCode, Clock } from "lucide-react";

interface PaymentMethodSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'pix' | 'boleto') => void;
  planName: string;
  amount: number;
}

export const PaymentMethodSelector = ({ 
  isOpen, 
  onClose, 
  onSelectMethod, 
  planName, 
  amount 
}: PaymentMethodSelectorProps) => {
  const handleMethodSelect = (method: 'pix' | 'boleto') => {
    onSelectMethod(method);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Escolha a forma de pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plan Info */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold">{planName}</h3>
            <p className="text-2xl font-bold text-green-600 mt-1">
              R$ {amount.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              Entrada (10% do valor total)
            </p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            {/* PIX */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-green-200"
              onClick={() => handleMethodSelect('pix')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <QrCode className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">PIX</h4>
                    <p className="text-sm text-muted-foreground">
                      Aprovação instantânea
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">
                      Recomendado
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Imediato
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Boleto */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-blue-200"
              onClick={() => handleMethodSelect('boleto')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Boleto Bancário</h4>
                    <p className="text-sm text-muted-foreground">
                      Pague em qualquer banco
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      1-3 dias úteis
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button variant="outline" onClick={onClose} className="w-full">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};