import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Mail, Check, Calendar, User, Package } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VoucherData {
  id: string;
  user_name: string;
  user_email: string;
  service_type: string;
  service_price: number;
  voucher_code: string;
  expiry_date: string;
  professional_name?: string;
  professional_location?: string;
  created_at: string;
}

interface VoucherGeneratorProps {
  voucherData: VoucherData;
  onEmailSent?: () => void;
}

export function VoucherGenerator({ voucherData, onEmailSent }: VoucherGeneratorProps) {
  const { toast } = useToast();
  const voucherRef = useRef<HTMLDivElement>(null);

  const verificationUrl = `${window.location.origin}/verificar-voucher/${voucherData.voucher_code}`;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const generatePDF = async () => {
    if (!voucherRef.current) return null;

    try {
      const canvas = await html2canvas(voucherRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        width: 800,
        height: 600
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 297; // A4 landscape width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      return pdf;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF do voucher.",
        variant: "destructive",
      });
      return null;
    }
  };

  const downloadPDF = async () => {
    const pdf = await generatePDF();
    if (pdf) {
      pdf.save(`voucher-${voucherData.voucher_code}.pdf`);
      toast({
        title: "PDF gerado!",
        description: "Voucher baixado com sucesso.",
      });
    }
  };

  const sendVoucherByEmail = async () => {
    try {
      const pdf = await generatePDF();
      if (!pdf) return;

      // Converter PDF para base64
      const pdfBase64 = pdf.output('datauristring').split(',')[1];

      // Chamar edge function para envio de email
      const { data, error } = await supabase.functions.invoke('send-voucher', {
        body: {
          voucher_data: voucherData,
          pdf_base64: pdfBase64,
          verification_url: verificationUrl
        }
      });

      if (error) throw error;

      toast({
        title: "Email enviado!",
        description: `Voucher enviado para ${voucherData.user_email}`,
      });

      onEmailSent?.();

    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar voucher por email.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Voucher Visual */}
      <div 
        ref={voucherRef} 
        className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-lg border-2 border-dashed border-blue-200"
        style={{ width: '800px', margin: '0 auto' }}
      >
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-primary mb-2">VOUCHER DIGITAL</h1>
            <p className="text-lg text-muted-foreground">Seu serviço está garantido!</p>
            <Badge variant="default" className="text-lg px-4 py-1 mt-2">
              {voucherData.voucher_code}
            </Badge>
          </div>

          <Separator className="my-6" />

          {/* Dados do Cliente e Serviço */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-semibold text-gray-700">Beneficiário</p>
                  <p className="text-lg font-bold">{voucherData.user_name}</p>
                  <p className="text-sm text-gray-600">{voucherData.user_email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Package className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <p className="font-semibold text-gray-700">Serviço Contratado</p>
                  <p className="text-lg font-bold">{voucherData.service_type}</p>
                  <p className="text-sm text-gray-600">Valor: {formatCurrency(voucherData.service_price)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-orange-600 mt-1" />
                <div>
                  <p className="font-semibold text-gray-700">Validade</p>
                  <p className="text-lg font-bold">{formatDate(voucherData.expiry_date)}</p>
                  <p className="text-sm text-gray-600">Data de emissão: {formatDate(voucherData.created_at)}</p>
                </div>
              </div>

              {voucherData.professional_name && (
                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-purple-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-700">Profissional</p>
                    <p className="text-lg font-bold">{voucherData.professional_name}</p>
                    <p className="text-sm text-gray-600">{voucherData.professional_location}</p>
                  </div>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <QRCodeSVG
                  value={verificationUrl}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-center text-gray-600 mt-3">
                Escaneie para verificar autenticidade
              </p>
              <p className="text-xs text-center text-gray-500 mt-1 break-all">
                {verificationUrl}
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Instruções */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Como usar seu voucher:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Apresente este voucher ao profissional escolhido</li>
              <li>• O QR Code pode ser usado para verificação de autenticidade</li>
              <li>• Válido até {formatDate(voucherData.expiry_date)}</li>
              <li>• Em caso de dúvidas, entre em contato conosco</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Este voucher é válido e foi emitido pelo sistema Amigo do Peito
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Código de verificação: {voucherData.id}
            </p>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-center space-x-4">
        <Button onClick={downloadPDF} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Baixar PDF</span>
        </Button>
        <Button onClick={sendVoucherByEmail} variant="outline" className="flex items-center space-x-2">
          <Mail className="h-4 w-4" />
          <span>Enviar por Email</span>
        </Button>
      </div>
    </div>
  );
}