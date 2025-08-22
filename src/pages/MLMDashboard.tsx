import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Crown, 
  Link2, 
  CheckCircle, 
  Clock, 
  Copy, 
  Share,
  TrendingUp,
  Gift,
  Target
} from "lucide-react";

interface Purchase {
  id: string;
  status: string;
  is_contemplated: boolean;
  amount_paid: number;
  created_at: string;
  product?: { name: string };
}

export default function MLMDashboard() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error("Usuário não autenticado");
      }

      // Use credit_transactions instead of transactions
      const { data: purchasesData, error: purchasesError } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", session.session.user.id)
        .order("created_at", { ascending: false });

      if (purchasesData) {
        const formattedPurchases = purchasesData.map((transaction) => ({
          id: transaction.id,
          product: { name: transaction.description || 'Produto' },
          status: transaction.status || 'completed',
          is_contemplated: transaction.status === 'completed',
          amount_paid: transaction.amount,
          created_at: transaction.created_at
        }));
        setPurchases(formattedPurchases);
      }

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus dados",
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando seu dashboard...</p>
        </div>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Bem-vindo ao MLM Dashboard</h1>
          <p className="text-muted-foreground mb-6">
            Você ainda não possui nenhuma compra. Que tal escolher um plano?
          </p>
          <Button onClick={() => window.location.href = '/mlm/products'}>
            Ver Produtos Disponíveis
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Meu Dashboard MLM</h1>
        <p className="text-muted-foreground">
          Acompanhe o progresso dos seus grupos e suas contemplações
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Compras</p>
                <p className="text-2xl font-bold">{purchases.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Contemplações</p>
                <p className="text-2xl font-bold">
                  {purchases.filter(p => p.is_contemplated).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Investido</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(purchases.reduce((sum, p) => sum + p.amount_paid, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {purchases.map((purchase) => (
          <Card key={purchase.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {purchase.product?.name}
                    {purchase.is_contemplated ? (
                      <Badge className="bg-green-500">
                        <Crown className="w-3 h-3 mr-1" />Contemplado
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />Em andamento
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Criado em {new Date(purchase.created_at).toLocaleDateString('pt-BR')}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Valor pago</p>
                  <p className="text-lg font-bold">{formatCurrency(purchase.amount_paid)}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {purchase.is_contemplated ? (
                <Alert className="border-green-200 bg-green-50">
                  <Crown className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Parabéns! Você foi contemplado!</strong>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="text-muted-foreground">
                  Status: {purchase.status}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}