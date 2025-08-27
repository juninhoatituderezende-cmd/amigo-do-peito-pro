import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DollarSign, 
  Link as LinkIcon, 
  Users, 
  TrendingUp,
  Copy,
  Share,
  Download,
  Eye
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ReferralLink {
  id: string;
  referral_code: string;
  link_url: string;
  clicks_count: number;
  conversions_count: number;
  total_commission: number;
  active: boolean;
  created_at: string;
}

interface Commission {
  id: string;
  client_name: string;
  participation_amount: number;
  commission_amount: number;
  status: string;
  created_at: string;
  plan_name: string;
}

interface InfluencerStats {
  total_referrals: number;
  total_conversions: number;
  pending_commission: number;
  paid_commission: number;
  total_clicks: number;
}

export function InfluencerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<InfluencerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    loadInfluencerData();
  }, [user]);

  const loadInfluencerData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar perfil do influenciador
      const { data: influencerData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'influencer')
        .single();

      if (!influencerData) {
        toast({
          title: "Erro",
          description: "Dados do influenciador não encontrados.",
          variant: "destructive",
        });
        return;
      }

      // Carregar links de referência usando products como mock
      const { data: servicesData } = await supabase
        .from('products')
        .select('*')
        .limit(5);

      const mockLinks = servicesData?.map(service => ({
        id: service.id,
        referral_code: `REF-${service.id.slice(0, 8)}`,
        link_url: `/ref/${service.id}`,
        clicks_count: Math.floor(Math.random() * 100),
        conversions_count: Math.floor(Math.random() * 10),
        total_commission: Math.floor(Math.random() * 500),
        active: true,
        created_at: service.created_at
      })) || [];

      if (mockLinks) {
        setReferralLinks(mockLinks);
      }

      // Carregar comissões usando credit_transactions
      const { data: commissionsData } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'earned')
        .order('created_at', { ascending: false });

      if (commissionsData) {
        const formattedCommissions: Commission[] = commissionsData.map(commission => ({
          id: commission.id,
          client_name: 'Cliente Desconhecido',
          participation_amount: Number(commission.amount) * 4, // Simula valor de entrada
          commission_amount: Number(commission.amount), // Comissão recebida
          status: commission.status || 'completed',
          created_at: commission.created_at || new Date().toISOString(),
          plan_name: commission.description || 'Comissão de Referência'
        }));

        setCommissions(formattedCommissions);

        // Calcular estatísticas
        const totalReferrals = mockLinks?.length || 0;
        const totalConversions = mockLinks?.reduce((sum, link) => sum + (link.conversions_count || 0), 0) || 0;
        const totalClicks = mockLinks?.reduce((sum, link) => sum + (link.clicks_count || 0), 0) || 0;
        const pendingCommission = formattedCommissions
          .filter(c => c.status === 'pending')
          .reduce((sum, c) => sum + c.commission_amount, 0);
        const paidCommission = formattedCommissions
          .filter(c => c.status === 'paid')
          .reduce((sum, c) => sum + c.commission_amount, 0);

        setStats({
          total_referrals: totalReferrals,
          total_conversions: totalConversions,
          pending_commission: pendingCommission,
          paid_commission: paidCommission,
          total_clicks: totalClicks
        });
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar seus dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReferralLink = async (planId?: string) => {
    if (!user) return;

    setGeneratingLink(true);
    try {
      // Simulate generating a referral link (no RPC function exists)
      const newLink = {
        id: `ref-${Date.now()}`,
        referral_code: `REF-${Date.now().toString().slice(-8)}`,
        link_url: `/ref/${user.id}`,
        clicks_count: 0,
        conversions_count: 0,
        total_commission: 0,
        active: true,
        created_at: new Date().toISOString()
      };
      
      setReferralLinks(prev => [newLink, ...prev]);

      toast({
        title: "Link gerado!",
        description: "Seu link de indicação foi criado com sucesso.",
      });

    } catch (error) {
      console.error('Erro ao gerar link:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar link de indicação.",
        variant: "destructive",
      });
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência.",
    });
  };

  const shareLink = (link: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Participe do Amigo do Peito',
        text: 'Venha fazer parte do nosso sistema de grupos!',
        url: link
      });
    } else {
      copyToClipboard(link);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'paid':
        return <Badge variant="default">Pago</Badge>;
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
        <h2 className="text-3xl font-bold tracking-tight">Dashboard do Influenciador</h2>
        <p className="text-muted-foreground">
          Gerencie suas indicações e acompanhe suas comissões
        </p>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Links</CardTitle>
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_referrals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Cliques</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.total_clicks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversões</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.total_conversions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissão Pendente</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pending_commission)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.paid_commission)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Meus Links de Indicação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Meus Links de Indicação</span>
            <Button onClick={() => generateReferralLink()} disabled={generatingLink}>
              {generatingLink ? 'Gerando...' : 'Gerar Novo Link'}
            </Button>
          </CardTitle>
          <CardDescription>
            Links para compartilhar e ganhar comissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referralLinks.length === 0 ? (
            <Alert>
              <AlertDescription>
                Você ainda não possui links de indicação. Clique em "Gerar Novo Link" para começar.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {referralLinks.map((link) => (
                <div key={link.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Link #{link.referral_code}</h4>
                    <Badge variant={link.active ? 'default' : 'secondary'}>
                      {link.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  
                  <div className="bg-muted p-2 rounded mb-3">
                    <Input
                      value={`${window.location.origin}${link.link_url}`}
                      readOnly
                      className="bg-transparent border-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{link.clicks_count}</div>
                      <div className="text-xs text-muted-foreground">Cliques</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{link.conversions_count}</div>
                      <div className="text-xs text-muted-foreground">Conversões</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{formatCurrency(link.total_commission)}</div>
                      <div className="text-xs text-muted-foreground">Comissão</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`${window.location.origin}${link.link_url}`)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareLink(`${window.location.origin}${link.link_url}`)}
                    >
                      <Share className="h-4 w-4 mr-1" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Comissões */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões</CardTitle>
          <CardDescription>
            Todas as suas comissões e seus status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhuma comissão registrada ainda. Compartilhe seus links para começar a ganhar!
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor da Entrada</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium">{commission.client_name}</TableCell>
                    <TableCell>{commission.plan_name}</TableCell>
                    <TableCell>{formatCurrency(commission.participation_amount)}</TableCell>
                    <TableCell className="font-bold text-green-600">
                      {formatCurrency(commission.commission_amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(commission.status)}</TableCell>
                    <TableCell>{formatDate(commission.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}