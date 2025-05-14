
import { useState } from "react";
import ProSidebar from "../../components/pro/ProSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  date: string;
  type: "payment" | "withdrawal";
  amount: number;
  description: string;
  status: "pending" | "completed" | "failed";
  serviceId?: string;
  serviceName?: string;
}

interface WithdrawalRequest {
  id: string;
  date: string;
  amount: number;
  pixKey: string;
  status: "pending" | "completed" | "rejected";
}

const ProFinances = () => {
  const { toast } = useToast();
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);
  const [balance, setBalance] = useState(1250.75);
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: "",
    pixKey: "exemplo@email.com",
  });
  
  // Mock data - would come from API in a real app
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "tx1",
      date: "2023-05-15T14:30:00Z",
      type: "payment",
      amount: 450.00,
      description: "Pagamento pelo serviço: Tatuagem Média",
      status: "completed",
      serviceId: "1",
      serviceName: "Tatuagem Média",
    },
    {
      id: "tx2",
      date: "2023-05-12T10:15:00Z",
      type: "payment",
      amount: 250.00,
      description: "Pagamento pelo serviço: Tatuagem Pequena",
      status: "completed",
      serviceId: "2",
      serviceName: "Tatuagem Pequena",
    },
    {
      id: "tx3",
      date: "2023-05-10T16:45:00Z",
      type: "payment",
      amount: 1200.00,
      description: "Pagamento pelo serviço: Tatuagem Grande",
      status: "completed",
      serviceId: "3",
      serviceName: "Tatuagem Grande",
    },
    {
      id: "tx4",
      date: "2023-05-08T09:20:00Z",
      type: "withdrawal",
      amount: 800.00,
      description: "Saque via PIX",
      status: "completed",
    },
    {
      id: "tx5",
      date: "2023-05-05T11:40:00Z",
      type: "payment",
      amount: 300.00,
      description: "Pagamento pelo serviço: Tatuagem Pequena",
      status: "completed",
      serviceId: "2",
      serviceName: "Tatuagem Pequena",
    },
  ]);
  
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([
    {
      id: "wd1",
      date: "2023-05-08T09:20:00Z",
      amount: 800.00,
      pixKey: "exemplo@email.com",
      status: "completed",
    },
  ]);
  
  const handleWithdrawalFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setWithdrawalForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRequestWithdrawal = () => {
    const amount = parseFloat(withdrawalForm.amount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para saque.",
        variant: "destructive",
      });
      return;
    }
    
    if (amount > balance) {
      toast({
        title: "Saldo insuficiente",
        description: "O valor solicitado é maior que o saldo disponível.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would make an API call to request a withdrawal
    const newWithdrawal: WithdrawalRequest = {
      id: `wd${withdrawalRequests.length + 1}`,
      date: new Date().toISOString(),
      amount,
      pixKey: withdrawalForm.pixKey,
      status: "pending",
    };
    
    setWithdrawalRequests(prev => [newWithdrawal, ...prev]);
    
    // Add withdrawal transaction
    const newTransaction: Transaction = {
      id: `tx${transactions.length + 1}`,
      date: new Date().toISOString(),
      type: "withdrawal",
      amount,
      description: "Solicitação de saque via PIX",
      status: "pending",
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    
    // Update balance
    setBalance(prev => prev - amount);
    
    setIsWithdrawalDialogOpen(false);
    setWithdrawalForm({
      amount: "",
      pixKey: "exemplo@email.com",
    });
    
    toast({
      title: "Solicitação enviada",
      description: "Sua solicitação de saque foi enviada e será processada em breve.",
    });
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  
  const getTransactionStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Concluído</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pendente</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Falhou</Badge>;
      default:
        return null;
    }
  };
  
  const getWithdrawalStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Concluído</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Processando</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Rejeitado</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <ProSidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Financeiro</h1>
              <p className="text-gray-600">Gerencie seus ganhos e saques</p>
            </div>
            
            <Dialog open={isWithdrawalDialogOpen} onOpenChange={setIsWithdrawalDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 sm:mt-0 bg-ap-orange hover:bg-ap-orange/90">
                  Solicitar Saque
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Solicitar Saque</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="bg-blue-50 p-4 rounded-md mb-4">
                    <p className="text-blue-800">
                      Você possui <strong>R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> disponível para saque.
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="amount">Valor do Saque (R$)</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={balance}
                      value={withdrawalForm.amount}
                      onChange={handleWithdrawalFormChange}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Você pode sacar qualquer valor até o limite do seu saldo.
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="pixKey">Chave PIX para Recebimento</Label>
                    <Input
                      id="pixKey"
                      name="pixKey"
                      value={withdrawalForm.pixKey}
                      onChange={handleWithdrawalFormChange}
                      placeholder="CPF, e-mail, telefone ou chave aleatória"
                    />
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-md mt-4">
                    <p className="text-yellow-800 text-sm">
                      <strong>Importante:</strong> Saques solicitados até às 15h em dias úteis são processados no mesmo dia. Após esse horário ou em fins de semana/feriados, o processamento ocorre no próximo dia útil.
                    </p>
                  </div>
                  
                  <div className="mt-6 text-right">
                    <Button
                      onClick={handleRequestWithdrawal}
                      className="bg-ap-orange hover:bg-ap-orange/90"
                      disabled={!withdrawalForm.amount || parseFloat(withdrawalForm.amount) <= 0 || parseFloat(withdrawalForm.amount) > balance}
                    >
                      Confirmar Saque
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Saldo Disponível</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Disponível para saque via PIX
                </p>
                <Button 
                  onClick={() => setIsWithdrawalDialogOpen(true)}
                  className="mt-4 w-full bg-ap-orange hover:bg-ap-orange/90"
                >
                  Solicitar Saque
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Ganhos no Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  R$ 2.200,00
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Total de pagamentos recebidos em Maio
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Saques Realizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  R$ 800,00
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Total de saques em Maio
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="transactions" className="space-y-6">
            <TabsList className="grid grid-cols-2 max-w-md mb-4">
              <TabsTrigger value="transactions">Transações</TabsTrigger>
              <TabsTrigger value="withdrawals">Saques</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Histórico de Transações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(transaction.date)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {transaction.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <span
                                className={
                                  transaction.type === "payment"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {transaction.type === "payment" ? "+" : "-"} R${" "}
                                {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getTransactionStatusBadge(transaction.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="withdrawals">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Solicitações de Saque</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chave PIX</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {withdrawalRequests.map((withdrawal) => (
                          <tr key={withdrawal.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(withdrawal.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {withdrawal.pixKey}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                              - R$ {withdrawal.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getWithdrawalStatusBadge(withdrawal.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Information Card */}
          <Card className="mt-8">
            <CardHeader className="pb-2">
              <CardTitle>Informações sobre Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="font-medium text-blue-800 mb-2">Como funcionam os pagamentos?</h3>
                  <p className="text-sm text-blue-700">
                    Após a conclusão de um serviço e o envio da nota fiscal, o pagamento fica disponível em seu saldo em até 2 dias úteis.
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-md">
                  <h3 className="font-medium text-green-800 mb-2">Emissão de Nota Fiscal</h3>
                  <p className="text-sm text-green-700">
                    É obrigatório o envio da nota fiscal para a liberação do pagamento. A nota deve ser emitida em nome do cliente e enviada através da plataforma.
                  </p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-md">
                  <h3 className="font-medium text-yellow-800 mb-2">Saques</h3>
                  <p className="text-sm text-yellow-700">
                    Os saques são processados de segunda a sexta-feira, das 9h às 17h, exceto feriados bancários. Saques solicitados fora desse horário serão processados no próximo dia útil.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProFinances;
