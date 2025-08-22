import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Banknote, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  DollarSign,
  ArrowUpRight,
  Loader2,
  RefreshCw
} from "lucide-react";

interface WithdrawalRequest {
  id: string;
  amount: number;
  method: string;
  pix_key?: string;
  status: string;
  created_at: string;
  processed_at?: string;
  notes?: string;
}

interface UserCredits {
  total_credits: number;
  available_credits: number;
  pending_credits: number;
}

export function WithdrawalInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"pix" | "bank_transfer">("pix");
  const [pixKey, setPixKey] = useState("");
  const [bankData, setBankData] = useState({
    bank: "",
    agency: "",
    account: "",
    accountType: "corrente"
  });
  
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRequest[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const MIN_WITHDRAWAL = 50;

  useEffect(() => {
    if (user) {
      loadUserCredits();
      loadWithdrawalHistory();
    }
  }, [user]);

  const loadUserCredits = async () => {
    try {
        const response = await fetch(`https://rczygmsaybzcrmdxxyge.supabase.co/functions/v1/manage-credits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'balance' })
      });

      // Mock data para desenvolvimento - simular saldo do usuário
      const mockCredits: UserCredits = {
        total_credits: 850.50,
        available_credits: 320.75,
        pending_credits: 150.00
      };
      
      setUserCredits(mockCredits);
    } catch (error) {
      console.error('Error loading user credits:', error);
    }
  };

  const loadWithdrawalHistory = async () => {
    try {
      setLoadingHistory(true);
      
      // Mock data para desenvolvimento - será substituído quando a tabela estiver configurada
      const mockData: WithdrawalRequest[] = [
        {
          id: "1",
          amount: 150.00,
          method: "pix",
          pix_key: "user@email.com",
          status: "pending",
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "2", 
          amount: 300.00,
          method: "bank_transfer",
          status: "completed",
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          processed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ];
      
      // Simular delay de carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setWithdrawalHistory(mockData);
    } catch (error) {
      console.error('Error loading withdrawal history:', error);
      setWithdrawalHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!amount || parseFloat(amount) < MIN_WITHDRAWAL) {
      toast({
        title: "Valor inválido",
        description: `O valor mínimo para saque é R$ ${MIN_WITHDRAWAL.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    if (!userCredits || parseFloat(amount) > userCredits.available_credits) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não possui saldo suficiente para este saque.",
        variant: "destructive",
      });
      return;
    }

    if (method === "pix" && !pixKey.trim()) {
      toast({
        title: "Chave PIX obrigatória",
        description: "Informe sua chave PIX para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (method === "bank_transfer" && (!bankData.bank || !bankData.agency || !bankData.account)) {
      toast({
        title: "Dados bancários incompletos",
        description: "Preencha todos os dados bancários para continuar.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`https://rczygmsaybzcrmdxxyge.supabase.co/functions/v1/manage-credits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'withdraw',
          amount: parseFloat(amount),
          withdrawalMethod: method,
          pixKey: method === "pix" ? pixKey : undefined,
          bankAccount: method === "bank_transfer" ? bankData : undefined
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Solicitação enviada!",
          description: "Sua solicitação de saque foi enviada para análise. Você será notificado quando for processada.",
        });
        
        // Reset form
        setAmount("");
        setPixKey("");
        setBankData({ bank: "", agency: "", account: "", accountType: "corrente" });
        setIsOpen(false);
        
        // Reload data
        loadUserCredits();
        loadWithdrawalHistory();
      } else {
        throw new Error(result.error || 'Erro ao processar saque');
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast({
        title: "Erro no saque",
        description: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-blue-600"><CheckCircle className="h-3 w-3 mr-1" />Concluído</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Meus Créditos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Disponível para Saque</p>
              <p className="text-2xl font-bold text-green-600">
                {userCredits ? formatCurrency(userCredits.available_credits) : "R$ 0,00"}
              </p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Pendente</p>
              <p className="text-2xl font-bold text-yellow-600">
                {userCredits ? formatCurrency(userCredits.pending_credits) : "R$ 0,00"}
              </p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Acumulado</p>
              <p className="text-2xl font-bold text-blue-600">
                {userCredits ? formatCurrency(userCredits.total_credits) : "R$ 0,00"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="lg"
                  disabled={!userCredits || userCredits.available_credits < MIN_WITHDRAWAL}
                  className="w-full md:w-auto"
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Solicitar Saque
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Solicitar Saque</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor do Saque</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder={`Mínimo R$ ${MIN_WITHDRAWAL.toFixed(2)}`}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={MIN_WITHDRAWAL}
                      max={userCredits?.available_credits || 0}
                    />
                    <p className="text-xs text-muted-foreground">
                      Disponível: {userCredits ? formatCurrency(userCredits.available_credits) : "R$ 0,00"}
                    </p>
                  </div>

                  {/* Method Selection */}
                  <div className="space-y-2">
                    <Label>Método de Recebimento</Label>
                    <Select value={method} onValueChange={(value) => setMethod(value as "pix" | "bank_transfer")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* PIX Key */}
                  {method === "pix" && (
                    <div className="space-y-2">
                      <Label htmlFor="pix">Chave PIX</Label>
                      <Input
                        id="pix"
                        placeholder="CPF, e-mail, telefone ou chave aleatória"
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Bank Transfer Data */}
                  {method === "bank_transfer" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="bank">Banco</Label>
                          <Input
                            id="bank"
                            placeholder="Nome do banco"
                            value={bankData.bank}
                            onChange={(e) => setBankData(prev => ({ ...prev, bank: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="agency">Agência</Label>
                          <Input
                            id="agency"
                            placeholder="1234"
                            value={bankData.agency}
                            onChange={(e) => setBankData(prev => ({ ...prev, agency: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="account">Conta</Label>
                          <Input
                            id="account"
                            placeholder="12345-6"
                            value={bankData.account}
                            onChange={(e) => setBankData(prev => ({ ...prev, account: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Tipo de Conta</Label>
                          <Select 
                            value={bankData.accountType} 
                            onValueChange={(value) => setBankData(prev => ({ ...prev, accountType: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="corrente">Corrente</SelectItem>
                              <SelectItem value="poupanca">Poupança</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Warning Alert */}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Saques são processados em até 48 horas úteis. Certifique-se de que os dados estão corretos.
                    </AlertDescription>
                  </Alert>

                  {/* Submit Button */}
                  <Button 
                    onClick={handleWithdrawal}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Solicitar Saque
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Saques
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              loadUserCredits();
              loadWithdrawalHistory();
            }}
            disabled={loadingHistory}
          >
            <RefreshCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : withdrawalHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma solicitação de saque encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawalHistory.map((withdrawal) => (
                <div key={withdrawal.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {withdrawal.method === 'pix' ? 
                            <CreditCard className="h-4 w-4" /> : 
                            <Banknote className="h-4 w-4" />
                          }
                          <span className="font-medium">
                            {formatCurrency(withdrawal.amount)}
                          </span>
                        </div>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p>Método: {withdrawal.method === 'pix' ? 'PIX' : 'Transferência Bancária'}</p>
                        <p>Solicitado em: {formatDate(withdrawal.created_at)}</p>
                        {withdrawal.processed_at && (
                          <p>Processado em: {formatDate(withdrawal.processed_at)}</p>
                        )}
                        {withdrawal.notes && (
                          <p className="mt-1 text-xs">Obs: {withdrawal.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}