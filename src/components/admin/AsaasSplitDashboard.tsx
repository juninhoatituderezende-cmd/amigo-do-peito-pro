import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";

interface SplitRule {
  id: string;
  product_id?: string;
  service_id?: string;
  professional_percentage: number;
  platform_percentage: number;
  influencer_percentage: number;
  fixed_platform_fee: number;
  created_at: string;
}

interface PaymentSplit {
  id: string;
  payment_id: string;
  asaas_payment_id: string;
  total_amount: number;
  professional_amount: number;
  platform_amount: number;
  influencer_amount: number;
  split_executed: boolean;
  split_executed_at?: string;
  split_error?: string;
  created_at: string;
  professionals?: {
    full_name: string;
    email: string;
  };
  payments?: {
    id: string;
    amount: number;
    status: string;
    created_at: string;
  };
}

interface SubAccount {
  id: string;
  professional_id: string;
  asaas_account_id: string;
  status: string;
  verification_status: string;
  kyc_completed: boolean;
  documents_uploaded: boolean;
  created_at: string;
  professionals?: {
    full_name: string;
    email: string;
    user_id: string;
  };
}

export function AsaasSplitDashboard() {
  const [splitRules, setSplitRules] = useState<SplitRule[]>([]);
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([]);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar regras de split
      const { data: rulesData, error: rulesError } = await supabase
        .from("payment_split_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (rulesError) throw rulesError;
      setSplitRules(rulesData || []);

      // Carregar histórico de splits
      const { data: splitsData, error: splitsError } = await supabase
        .from("payment_splits")
        .select(`
          *,
          professionals(full_name, email),
          payments(id, amount, status, created_at)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (splitsError) throw splitsError;
      setPaymentSplits(splitsData || []);

      // Carregar subcontas
      const { data: accountsData, error: accountsError } = await supabase
        .from("asaas_subaccounts")
        .select(`
          *,
          professionals(full_name, email, user_id)
        `)
        .order("created_at", { ascending: false });

      if (accountsError) throw accountsError;
      setSubAccounts(accountsData || []);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processPendingSplits = async () => {
    try {
      setProcessing(true);
      
      const { data, error } = await supabase.functions.invoke("asaas-split-manager", {
        body: { action: "process_pending_splits" }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: data.message,
      });

      await loadData();
    } catch (error) {
      console.error("Erro ao processar splits:", error);
      toast({
        title: "Erro",
        description: "Erro ao processar splits pendentes",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      active: "bg-green-100 text-green-800",
      blocked: "bg-red-100 text-red-800",
      rejected: "bg-red-100 text-red-800",
      approved: "bg-green-100 text-green-800",
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pendingSplits = paymentSplits.filter(split => !split.split_executed);
  const executedSplits = paymentSplits.filter(split => split.split_executed);
  const activeSSubAccounts = subAccounts.filter(acc => acc.status === "active" && acc.verification_status === "approved");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard ASAAS Split</h2>
          <p className="text-muted-foreground">
            Gerencie splits de pagamento e subcontas ASAAS
          </p>
        </div>
        <Button onClick={processPendingSplits} disabled={processing}>
          {processing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <DollarSign className="mr-2 h-4 w-4" />
          )}
          Processar Splits Pendentes
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subcontas Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSSubAccounts.length}</div>
            <p className="text-xs text-muted-foreground">
              de {subAccounts.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Splits Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSplits.length}</div>
            <p className="text-xs text-muted-foreground">
              aguardando processamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Splits Executados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executedSplits.length}</div>
            <p className="text-xs text-muted-foreground">
              processados com sucesso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transferido</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                executedSplits.reduce((sum, split) => sum + split.professional_amount, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              para profissionais
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="splits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="splits">Histórico de Splits</TabsTrigger>
          <TabsTrigger value="subaccounts">Subcontas</TabsTrigger>
          <TabsTrigger value="rules">Regras de Split</TabsTrigger>
        </TabsList>

        <TabsContent value="splits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Splits</CardTitle>
              <CardDescription>
                Acompanhe todos os splits de pagamento processados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentSplits.map((split) => (
                  <div key={split.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {split.professionals?.full_name || "Profissional não identificado"}
                        </span>
                        {split.split_executed ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : split.split_error ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Pagamento: {split.asaas_payment_id} • Total: {formatCurrency(split.total_amount)}
                      </div>
                      {split.split_error && (
                        <div className="text-sm text-red-600">
                          Erro: {split.split_error}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(split.professional_amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {split.split_executed ? "Transferido" : "Pendente"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subaccounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subcontas ASAAS</CardTitle>
              <CardDescription>
                Status das subcontas dos profissionais cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {account.professionals?.full_name || "Nome não disponível"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {account.professionals?.email} • ID: {account.asaas_account_id}
                      </div>
                      <div className="flex space-x-2">
                        {getStatusBadge(account.status)}
                        {getStatusBadge(account.verification_status)}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm">
                        KYC: {account.kyc_completed ? "✓" : "✗"}
                      </div>
                      <div className="text-sm">
                        Docs: {account.documents_uploaded ? "✓" : "✗"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Split</CardTitle>
              <CardDescription>
                Configurações de percentuais para divisão de pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {splitRules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma regra de split configurada
                  </div>
                ) : (
                  splitRules.map((rule) => (
                    <div key={rule.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="font-medium">
                            {rule.product_id ? "Produto" : "Serviço"}: {rule.product_id || rule.service_id}
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Profissional: </span>
                              <span className="font-medium">{rule.professional_percentage}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Plataforma: </span>
                              <span className="font-medium">{rule.platform_percentage}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Influencer: </span>
                              <span className="font-medium">{rule.influencer_percentage}%</span>
                            </div>
                          </div>
                          {rule.fixed_platform_fee > 0 && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Taxa fixa: </span>
                              <span className="font-medium">{formatCurrency(rule.fixed_platform_fee)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}