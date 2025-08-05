import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Banknote, 
  CreditCard, 
  Calendar, 
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  FileText,
  User
} from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

export const WithdrawalRequest = () => {
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("cpf");
  const [accountHolder, setAccountHolder] = useState("");
  const [loading, setLoading] = useState(false);
  const { balance, requestWithdrawal } = useCredits();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !pixKey || !accountHolder) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const withdrawalAmount = parseFloat(amount);
    
    if (withdrawalAmount < 50) {
      toast({
        title: "Valor mínimo",
        description: "O valor mínimo para saque é R$ 50,00.",
        variant: "destructive"
      });
      return;
    }

    if (!balance || withdrawalAmount > balance.availableCredits) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não tem créditos suficientes para este saque.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const success = await requestWithdrawal(withdrawalAmount);
      
      if (success) {
        setAmount("");
        setPixKey("");
        setAccountHolder("");
        toast({
          title: "Solicitação enviada!",
          description: "Sua solicitação de saque está em análise.",
        });
      }
    } catch (error) {
      console.error("Erro ao solicitar saque:", error);
    } finally {
      setLoading(false);
    }
  };

  const pixKeyTypes = [
    { value: "cpf", label: "CPF" },
    { value: "cnpj", label: "CNPJ" },
    { value: "email", label: "E-mail" },
    { value: "phone", label: "Telefone" },
    { value: "random", label: "Chave Aleatória" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'processed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4" />;
      case 'processed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      case 'processed': return 'Processado';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Saldo Disponível */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo disponível para saque</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(balance?.availableCredits || 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Saque pendente</p>
              <p className="text-xl font-semibold text-orange-600">
                {formatCurrency(balance?.pendingWithdrawal || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Saque */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Solicitar Saque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Valor do Saque */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor do Saque</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="50.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10"
                  min="50"
                  step="0.01"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Valor mínimo: R$ 50,00 • Disponível: {formatCurrency(balance?.availableCredits || 0)}
              </p>
            </div>

            {/* Dados PIX */}
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Dados PIX
              </h3>
              
              {/* Tipo de Chave PIX */}
              <div className="space-y-2">
                <Label>Tipo de Chave PIX</Label>
                <div className="flex flex-wrap gap-2">
                  {pixKeyTypes.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={pixKeyType === type.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPixKeyType(type.value)}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Chave PIX */}
              <div className="space-y-2">
                <Label htmlFor="pixKey">Chave PIX</Label>
                <Input
                  id="pixKey"
                  type="text"
                  placeholder={
                    pixKeyType === 'cpf' ? '000.000.000-00' :
                    pixKeyType === 'cnpj' ? '00.000.000/0000-00' :
                    pixKeyType === 'email' ? 'seu@email.com' :
                    pixKeyType === 'phone' ? '(11) 99999-9999' :
                    'sua-chave-aleatoria'
                  }
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  required
                />
              </div>

              {/* Nome do Titular */}
              <div className="space-y-2">
                <Label htmlFor="accountHolder">Nome do Titular</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="accountHolder"
                    type="text"
                    placeholder="Nome completo do titular da conta"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Informações Importantes */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-medium text-yellow-900 mb-2">⚠️ Informações Importantes:</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• O saque será processado em até 3 dias úteis</li>
                <li>• O valor mínimo é de R$ 50,00</li>
                <li>• Não há taxa para saques via PIX</li>
                <li>• Verifique se os dados PIX estão corretos</li>
                <li>• O nome do titular deve coincidir com sua conta</li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !balance || (balance.availableCredits < 50)}
            >
              {loading ? "Processando..." : "Solicitar Saque"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Histórico de Saques (Mock) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de Saques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Exemplo de saques (mock data) */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon('pending')}
                <div>
                  <p className="font-medium">R$ 250,00</p>
                  <p className="text-sm text-muted-foreground">
                    Solicitado em 15/01/2025
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor('pending')}>
                Pendente
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon('processed')}
                <div>
                  <p className="font-medium">R$ 180,00</p>
                  <p className="text-sm text-muted-foreground">
                    Processado em 10/01/2025
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor('processed')}>
                Processado
              </Badge>
            </div>

            <div className="text-center py-4 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                Seus próximos saques aparecerão aqui
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};