import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import DashboardFooter from '@/components/DashboardFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Users, 
  ArrowLeft, 
  CreditCard,
  Share2,
  Clock
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  entryPrice: number;
  category: string;
  features: string[];
  max_participants: number;
  duration_months: number;
  image_url?: string;
}

const PlanSubscription = () => {
  const { planId } = useParams<{ planId: string }>();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (planId) {
      loadPlan();
    }
  }, [planId]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('custom_plans')
        .select('*')
        .eq('id', planId)
        .eq('active', true)
        .single();

      if (error) throw error;
      if (!data) {
        toast({
          title: "Plano não encontrado",
          description: "Este plano não existe ou não está mais ativo.",
          variant: "destructive"
        });
        navigate('/plans');
        return;
      }

      setPlan({
        id: data.id,
        name: data.name,
        description: data.description || '',
        price: data.price,
        entryPrice: Math.round(data.price * 0.1),
        category: data.category || 'service',
        features: Array.isArray(data.features) ? data.features.map(String) : [],
        max_participants: data.max_participants || 10,
        duration_months: data.duration_months || 1,
        image_url: data.image_url
      });
    } catch (error) {
      console.error('Erro ao carregar plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar detalhes do plano.",
        variant: "destructive"
      });
      navigate('/plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!plan || !user) return;
    
    try {
      setProcessing(true);
      
      // Verificar se usuário já tem plano ativo
      const { data: hasActivePlan } = await supabase
        .rpc('user_has_active_plan', { user_uuid: user.id });
      
      if (hasActivePlan) {
        toast({
          title: "Já possui plano ativo",
          description: "Você já está participando de um grupo. Acesse seu dashboard para ver o status.",
          variant: "destructive"
        });
        navigate('/usuario/dashboard');
        return;
      }

      let groupId;
      
      if (referralCode) {
        // Juntar-se a um grupo existente via código de referência
        const { data, error } = await supabase
          .rpc('join_group_by_referral', {
            user_uuid: user.id,
            referral_code_param: referralCode,
            entry_amount: plan.entryPrice
          });
          
        if (error) throw error;
        groupId = data;
        
        toast({
          title: "✅ Bem-vindo ao grupo!",
          description: `Você se juntou ao grupo através do código ${referralCode}. Agora você faz parte do grupo para ${plan.name}!`,
        });
      } else {
        // Criar novo grupo
        const { data, error } = await supabase
          .rpc('create_user_plan_group', {
            user_uuid: user.id,
            plan_uuid: plan.id,
            entry_amount: plan.entryPrice
          });
          
        if (error) throw error;
        groupId = data;
        
        toast({
          title: "🎉 Grupo criado!",
          description: `Seu grupo para ${plan.name} foi criado! Agora você pode compartilhar seu link de convite.`,
        });
      }

      // Redirecionar para o dashboard do usuário
      navigate('/usuario/dashboard');
      
    } catch (error: any) {
      console.error('Erro ao se inscrever no plano:', error);
      toast({
        title: "Erro na inscrição",
        description: error.message || "Erro ao processar sua inscrição. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Plano não encontrado</h2>
          <Button onClick={() => navigate('/plans')}>
            Voltar aos Planos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/plans')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Planos
          </Button>
        </div>

        {referralCode && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Share2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-green-800">Convite Detectado!</h4>
                  <p className="text-sm text-green-600">
                    Você foi convidado através do código: <strong>{referralCode}</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <p className="text-muted-foreground mt-1">{plan.description}</p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {plan.category}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {plan.image_url && (
              <div className="relative h-48 w-full overflow-hidden rounded-lg">
                <img
                  src={plan.image_url}
                  alt={plan.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Pricing */}
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="text-sm text-muted-foreground mb-2">
                Valor total do serviço
              </div>
              <div className="text-xl font-medium text-gray-600 line-through mb-2">
                R$ {plan.price.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                {referralCode ? 'Você paga para entrar no grupo:' : 'Você paga apenas:'}
              </div>
              <div className="text-3xl font-bold text-primary">
                R$ {plan.entryPrice.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                entrada (10% do valor total)
              </div>
            </div>

            {/* Group Info */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{plan.max_participants} pessoas por grupo</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{plan.duration_months} {plan.duration_months === 1 ? 'mês' : 'meses'}</span>
              </div>
            </div>

            <Separator />

            {/* Features */}
            <div>
              <h4 className="font-semibold mb-3">O que está incluído:</h4>
              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* How it works */}
            <div>
              <h4 className="font-semibold mb-3">Como funciona:</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div className="text-sm">
                    <strong>
                      {referralCode 
                        ? 'Entre no grupo existente' 
                        : 'Crie seu grupo'
                      }
                    </strong>
                    <p className="text-muted-foreground">
                      {referralCode 
                        ? 'Você entrará no grupo do seu convite'
                        : 'Você será o primeiro membro do grupo'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div className="text-sm">
                    <strong>Compartilhe e forme o grupo</strong>
                    <p className="text-muted-foreground">
                      {referralCode 
                        ? 'Ajude a completar o grupo convidando mais pessoas'
                        : 'Convide amigos para formar um grupo de 10 pessoas'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div className="text-sm">
                    <strong>Grupo completo = serviço liberado</strong>
                    <p className="text-muted-foreground">
                      Quando o grupo atingir 10 pessoas, todos poderão agendar o serviço
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscribe Button */}
            <Button 
              onClick={handleSubscribe}
              disabled={processing || !user}
              className="w-full py-6 text-lg font-semibold"
              size="lg"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              {processing 
                ? 'Processando...' 
                : referralCode 
                  ? `Entrar no Grupo - R$ ${plan.entryPrice.toLocaleString()}`
                  : `Criar Grupo - R$ ${plan.entryPrice.toLocaleString()}`
              }
            </Button>

            {!user && (
              <p className="text-center text-sm text-muted-foreground">
                Você precisa estar logado para se inscrever em um plano.
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      <DashboardFooter />
    </div>
  );
};

export default PlanSubscription;