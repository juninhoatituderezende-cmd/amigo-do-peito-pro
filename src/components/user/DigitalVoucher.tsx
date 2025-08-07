import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  Download, 
  Copy, 
  QrCode,
  CheckCircle,
  Calendar,
  Share2,
  Printer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface VoucherData {
  id: string;
  voucher_code: string;
  status: 'confirmed' | 'pending' | 'used';
  created_at: string;
  expires_at: string;
  service_type: string;
  professional_name?: string;
  professional_contact?: string;
  total_commission: number;
  qr_code_url?: string;
}

export const DigitalVoucher = () => {
  const [vouchers, setVouchers] = useState<VoucherData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserVouchers();
    }
  }, [user]);

  const loadUserVouchers = async () => {
    try {
      // Buscar grupos completados do usuário
      const { data: groupsData, error } = await supabase
        .from('groups')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'completed');

      if (error) throw error;

      // Transform groups into vouchers
      const voucherData = (groupsData || []).map(group => ({
        id: group.id,
        voucher_code: `VOUCHER-${group.id.slice(-8).toUpperCase()}`,
        status: 'confirmed' as const,
        created_at: group.created_at,
        expires_at: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toISOString(), // 1 year from now
        service_type: 'Grupo Contemplado',
        total_commission: group.discount_percentage * 10, // Calculate total earned
        qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VOUCHER-${group.id.slice(-8).toUpperCase()}`
      }));

      setVouchers(voucherData);
    } catch (error: any) {
      console.error('Error loading vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyVoucherCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Código copiado!",
        description: "O código do voucher foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o código.",
        variant: "destructive"
      });
    }
  };

  const downloadVoucherPDF = (voucher: VoucherData) => {
    // This would generate and download a PDF voucher
    toast({
      title: "Download iniciado!",
      description: `Voucher ${voucher.voucher_code} está sendo baixado em PDF.`,
    });
  };

  const shareVoucher = async (voucher: VoucherData) => {
    const shareData = {
      title: "Meu Voucher Digital - Amigo do Peito",
      text: `Conquistei minha contemplação! Voucher: ${voucher.voucher_code}`,
      url: `${window.location.origin}/voucher/${voucher.voucher_code}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        copyVoucherCode(voucher.voucher_code);
      }
    } else {
      copyVoucherCode(voucher.voucher_code);
    }
  };

  const printVoucher = (voucher: VoucherData) => {
    // Generate print-friendly version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Voucher ${voucher.voucher_code}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 40px;
              background: white;
            }
            .voucher {
              border: 3px solid #16a34a;
              border-radius: 15px;
              padding: 40px;
              text-align: center;
              background: linear-gradient(135deg, #f0f9ff, #ecfdf5);
            }
            .header { color: #16a34a; margin-bottom: 30px; }
            .code { 
              background: #16a34a; 
              color: white; 
              padding: 20px; 
              font-size: 28px; 
              font-weight: bold; 
              border-radius: 10px; 
              letter-spacing: 3px;
              margin: 30px 0;
            }
            .details { text-align: left; margin-top: 40px; }
            .qr { margin: 20px 0; }
            @media print {
              body { margin: 0; padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="voucher">
            <div class="header">
              <h1>🏆 VOUCHER DIGITAL</h1>
              <h2>Amigo do Peito - Contemplação Confirmada</h2>
            </div>
            
            <div class="code">${voucher.voucher_code}</div>
            
            <div class="qr">
              <img src="${voucher.qr_code_url}" alt="QR Code" style="border: 2px solid #16a34a; border-radius: 10px;" />
            </div>
            
            <div class="details">
              <h3>📋 Detalhes da Contemplação:</h3>
              <ul style="line-height: 2;">
                <li><strong>Serviço:</strong> ${voucher.service_type}</li>
                <li><strong>Data de Criação:</strong> ${new Date(voucher.created_at).toLocaleDateString('pt-BR')}</li>
                <li><strong>Válido até:</strong> ${new Date(voucher.expires_at).toLocaleDateString('pt-BR')}</li>
                <li><strong>Total Ganho:</strong> R$ ${voucher.total_commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>
              </ul>
            </div>
            
            <div style="margin-top: 40px; font-size: 14px; color: #666;">
              <p>Este voucher comprova sua contemplação no sistema Amigo do Peito.</p>
              <p>Para mais informações, acesse: ${window.location.origin}</p>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600';
      case 'used': return 'text-blue-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return { label: 'Ativo', variant: 'default' as const };
      case 'used': return { label: 'Utilizado', variant: 'secondary' as const };
      default: return { label: 'Pendente', variant: 'outline' as const };
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {vouchers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum voucher disponível</h3>
            <p className="text-muted-foreground">
              Complete 9 indicações para gerar seu voucher digital de contemplação!
            </p>
          </CardContent>
        </Card>
      ) : (
        vouchers.map((voucher) => {
          const statusBadge = getStatusBadge(voucher.status);
          
          return (
            <Card key={voucher.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-6 w-6 text-green-600" />
                    Voucher Digital de Contemplação
                  </CardTitle>
                  <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Voucher Info */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="text-center p-6 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg">
                      <h3 className="text-xl font-bold mb-3">🏆 PARABÉNS!</h3>
                      <p className="text-lg mb-4">Você conquistou sua contemplação!</p>
                      <div className="bg-white text-gray-800 p-4 rounded-lg font-mono text-xl font-bold tracking-wider">
                        {voucher.voucher_code}
                      </div>
                      <p className="text-sm mt-2 opacity-90">Código do Voucher</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Serviço:</p>
                        <p className="font-medium">{voucher.service_type}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Ganho:</p>
                        <p className="font-medium text-green-600">
                          {formatCurrency(voucher.total_commission)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Data de Criação:</p>
                        <p className="font-medium">{formatDate(voucher.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Válido até:</p>
                        <p className="font-medium">{formatDate(voucher.expires_at)}</p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => copyVoucherCode(voucher.voucher_code)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Código
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => shareVoucher(voucher)}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartilhar
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => downloadVoucherPDF(voucher)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar PDF
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => printVoucher(voucher)}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir
                      </Button>
                    </div>
                  </div>
                  
                  {/* QR Code */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-lg">
                      <img
                        src={voucher.qr_code_url}
                        alt="QR Code do Voucher"
                        className="w-32 h-32"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      QR Code para validação
                    </p>
                  </div>
                </div>
                
                {/* Instructions */}
                <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">📞 Como usar seu voucher:</h4>
                  <ol className="text-blue-800 text-sm space-y-1">
                    <li>1. Entre em contato com o profissional de sua escolha</li>
                    <li>2. Apresente este código: <strong>{voucher.voucher_code}</strong></li>
                    <li>3. Agende seu atendimento conforme disponibilidade</li>
                    <li>4. Aproveite seu serviço contemplado!</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};