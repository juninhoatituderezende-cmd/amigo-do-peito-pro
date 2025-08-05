import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  Clock, 
  Eye, 
  EyeOff,
  ArrowUpCircle,
  ArrowDownCircle,
  Banknote
} from "lucide-react";
import { useState } from "react";
import { useCredits } from "@/hooks/useCredits";
import { formatCurrency } from "@/lib/utils";

export const CreditBalance = () => {
  const { balance, transactions, loading } = useCredits();
  const [showBalance, setShowBalance] = useState(true);
  const [showTransactions, setShowTransactions] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string, source: string) => {
    if (type === 'credit') {
      switch (source) {
        case 'initial_payment':
          return <CreditCard className="h-4 w-4 text-blue-600" />;
        case 'referral_bonus':
          return <TrendingUp className="h-4 w-4 text-green-600" />;
        default:
          return <ArrowUpCircle className="h-4 w-4 text-green-600" />;
      }
    } else {
      switch (source) {
        case 'marketplace_purchase':
          return <ArrowDownCircle className="h-4 w-4 text-orange-600" />;
        case 'withdrawal':
          return <Banknote className="h-4 w-4 text-red-600" />;
        default:
          return <ArrowDownCircle className="h-4 w-4 text-red-600" />;
      }
    }
  };

  const getTransactionColor = (type: string) => {
    return type === 'credit' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Saldo Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Meus Créditos
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Saldo Disponível */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Disponível</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {showBalance ? formatCurrency(balance?.availableCredits || 0) : "••••"}
              </div>
              <p className="text-sm text-green-700 mt-1">
                Pronto para usar no marketplace
              </p>
            </div>

            {/* Total de Créditos */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Total Acumulado</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {showBalance ? formatCurrency(balance?.totalCredits || 0) : "••••"}
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Valor total já recebido
              </p>
            </div>

            {/* Saque Pendente */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-900">Saque Pendente</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {showBalance ? formatCurrency(balance?.pendingWithdrawal || 0) : "••••"}
              </div>
              <p className="text-sm text-orange-700 mt-1">
                {(balance?.pendingWithdrawal || 0) > 0 ? "Em análise" : "Nenhum saque pendente"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Últimas Transações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Últimas Transações</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTransactions(!showTransactions)}
            >
              {showTransactions ? "Ocultar" : "Ver Todas"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma transação encontrada</p>
              <p className="text-sm">Suas transações aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(showTransactions ? transactions : transactions.slice(0, 5)).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type, transaction.source)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'credit' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {transaction.source === 'initial_payment' && 'Pagamento'}
                      {transaction.source === 'referral_bonus' && 'Indicação'}
                      {transaction.source === 'marketplace_purchase' && 'Marketplace'}
                      {transaction.source === 'withdrawal' && 'Saque'}
                      {transaction.source === 'admin_adjustment' && 'Ajuste'}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {!showTransactions && transactions.length > 5 && (
                <div className="text-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTransactions(true)}
                  >
                    Ver mais {transactions.length - 5} transações
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};