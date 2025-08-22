import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Gift, 
  Download, 
  Share, 
  QrCode,
  Calendar,
  User
} from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Voucher {
  id: string;
  group_name: string;
  voucher_code: string;
  value: number;
  status: string;
  created_at: string;
  expires_at: string;
}

export function DigitalVoucher() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVouchers();
  }, [user]);

  const loadVouchers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar grupos que o usuário ganhou usando group_participants
      const { data: participations } = await supabase
        .from('group_participants')
        .select(`
          id,
          group_id,
          status,
          joined_at,
          amount_paid
        `)
        .eq('user_id', user.id);

      if (participations) {
        // Simular vouchers baseado nas participações
        const mockVouchers: Voucher[] = participations
          .filter(p => p.status === 'active')
          .map(participation => ({
            id: participation.id,
            group_name: `Grupo ${participation.group_id?.slice(0, 8)}`,
            voucher_code: `VOUCHER-${participation.id.slice(0, 8).toUpperCase()}`,
            value: Number(participation.amount_paid) * 10, // 10x o valor pago
            status: 'active',
            created_at: participation.joined_at || new Date().toISOString(),
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 ano
          }));

        setVouchers(mockVouchers);
      }

    } catch (error) {
      console.error('Erro ao carregar vouchers:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar seus vouchers.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const downloadVoucher = (voucher: Voucher) => {
    toast({
      title: "Download iniciado",
      description: `Baixando voucher ${voucher.voucher_code}`,
    });
  };

  const shareVoucher = (voucher: Voucher) => {
    if (navigator.share) {
      navigator.share({
        title: 'Meu Voucher Digital',
        text: `Voucher no valor de ${formatCurrency(voucher.value)}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`Voucher: ${voucher.voucher_code} - Valor: ${formatCurrency(voucher.value)}`);
      toast({
        title: "Copiado!",
        description: "Informações do voucher copiadas para a área de transferência.",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Ativo</Badge>;
      case 'used':
        return <Badge variant="secondary">Usado</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Meus Vouchers Digitais</h2>
        <p className="text-muted-foreground">
          Seus vouchers conquistados através das participações em grupos
        </p>
      </div>

      {vouchers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum voucher disponível</h3>
            <p className="text-muted-foreground mb-4">
              Participe de grupos para ganhar vouchers digitais
            </p>
            <Alert>
              <AlertDescription>
                Quando você for contemplado em um grupo, receberá um voucher digital no valor correspondente.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vouchers.map((voucher) => (
            <Card key={voucher.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    {voucher.group_name}
                  </CardTitle>
                  {getStatusBadge(voucher.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Valor do Voucher */}
                <div className="text-center py-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(voucher.value)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Valor do Voucher</p>
                </div>

                {/* Código do Voucher */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                    <QrCode className="h-4 w-4" />
                    <code className="font-mono text-sm">{voucher.voucher_code}</code>
                  </div>
                </div>

                {/* Informações */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Criado em:
                    </span>
                    <span>{formatDate(voucher.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Expira em:
                    </span>
                    <span>{formatDate(voucher.expires_at)}</span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadVoucher(voucher)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Baixar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shareVoucher(voucher)}
                    className="flex-1"
                  >
                    <Share className="h-4 w-4 mr-1" />
                    Compartilhar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Informações sobre uso */}
      <Alert>
        <Gift className="h-4 w-4" />
        <AlertDescription>
          <strong>Como usar seus vouchers:</strong> Apresente o código do voucher em estabelecimentos parceiros 
          ou utilize-o em compras online na nossa plataforma. Cada voucher tem validade de 1 ano.
        </AlertDescription>
      </Alert>
    </div>
  );
}