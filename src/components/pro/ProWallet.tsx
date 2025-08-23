import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  CreditCard
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/useCredits";
import { WithdrawalInterface } from "@/components/user/WithdrawalInterface";
import { formatCurrency } from "@/lib/utils";

export const ProWallet = () => {
  const { balance, transactions, loading } = useCredits();
  const [showBalance, setShowBalance] = useState(true);
  const [showWithdrawal, setShowWithdrawal] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
                <div className="h-20 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
        case 'marketplace_purchase':
          return <CreditCard className="h-4 w-4 text-blue-600" />;
        case 'referral_bonus':
          return <DollarSign className="h-4 w-4 text-green-600" />;
        default:
          return <TrendingUp className="h-4 w-4 text-green-600" />;
      }
    } else {
      return <ArrowUpRight className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Saldo Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Carteira Profissional
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                Pronto para saque
              </p>
            </div>

            {/* Total de Receitas */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Total Recebido</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {showBalance ? formatCurrency(balance?.totalCredits || 0) : "••••"}
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Receitas acumuladas
              </p>
            </div>

            {/* Saque Pendente */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-900">Processando</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {showBalance ? formatCurrency(balance?.pendingWithdrawal || 0) : "••••"}
              </div>
              <p className="text-sm text-orange-700 mt-1">
                {(balance?.pendingWithdrawal || 0) > 0 ? "Em análise" : "Nenhum saque pendente"}
              </p>
            </div>
          </div>

          {/* Botão de Saque */}
          <div className="flex justify-center">
            <Button 
              size="lg"
              onClick={() => setShowWithdrawal(true)}
              disabled={!balance || balance.availableCredits < 50}
              className="w-full md:w-auto"
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Solicitar Saque
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Transações</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma transação encontrada</p>
              <p className="text-sm">Suas receitas de serviços aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction) => (
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
                    <div className={`font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'credit' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {transaction.source === 'initial_payment' && 'Serviço'}
                      {transaction.source === 'marketplace_purchase' && 'Marketplace'}
                      {transaction.source === 'referral_bonus' && 'Comissão'}
                      {transaction.source === 'withdrawal' && 'Saque'}
                      {transaction.source === 'admin_adjustment' && 'Ajuste'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Saque */}
      {showWithdrawal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg w-full max-w-md">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Solicitar Saque</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWithdrawal(false)}
                >
                  ×
                </Button>
              </div>
            </div>
            <div className="p-4">
              <WithdrawalInterface />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};