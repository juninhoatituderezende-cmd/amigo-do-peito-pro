import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Users, Clock, Star, Package, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PaymentModal } from "@/components/ui/payment-modal";
import { PaymentMethodSelector } from "@/components/ui/payment-method-selector";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  entryPrice: number; // 10% do preço
  category: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  max_participants: number;
  duration_months: number;
  image_url?: string | null;
}

// Planos agora vêm do banco de dados

interface PlansSelectionProps {
  onSelectPlan?: (plan: Plan) => void;
  selectedPlanId?: string;
}

export const PlansSelection = ({ onSelectPlan, selectedPlanId }: PlansSelectionProps) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      console.log('🔍 [PLANS] Carregando planos unificados...');
      
      const { data: response, error } = await supabase.functions.invoke('unified-plans-loader', {
        body: { include_inactive: false, admin_view: false }
      });

      if (error) {
        console.error('❌ [PLANS] Erro na edge function:', error);
        throw error;
      }

      if (!response?.success) {
        console.error('❌ [PLANS] Resposta inválida:', response);
        throw new Error(response?.errors?.join(', ') || 'Resposta inválida do servidor');
      }

      const allPlans = response.plans || [];
      console.log('📊 [PLANS] Estatísticas:', response.stats);
      console.log('📝 [PLANS] Total carregados:', allPlans.length);

      // **VALIDAÇÃO ROBUSTA DOS PLANOS**
      const validPlans = allPlans.filter((plan: any) => {
        const isValid = plan.id && plan.name && plan.price > 0 && plan.active;
        if (!isValid) {
          console.warn('⚠️ [PLANS] Plano inválido ignorado:', plan);
        }
        return isValid;
      });

      console.log('✅ [PLANS] Planos válidos:', validPlans.length);

      // **FORMATAÇÃO PARA O FRONTEND**
      const formattedPlans: Plan[] = validPlans.map((plan: any, index: number) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description || `${getCategoryLabel(plan.category)} - ${plan.name}`,
        price: plan.price,
        entryPrice: Math.round(plan.price * 0.1), // 10% entrada
        category: plan.category,
        features: plan.description 
          ? [plan.description, `Tipo: ${plan.tipo_transacao}`, `Fonte: ${plan.table_source}`] 
          : [`${getCategoryLabel(plan.category)} completo`, `Tipo: ${plan.tipo_transacao}`],
        popular: plan.categoria === 'tattoo' && index === 0, // Primeiro tattoo é popular
        icon: getCategoryIcon(plan.category),
        max_participants: plan.max_participants || 10,
        duration_months: plan.duration_months || 1,
        image_url: plan.image_url
      }));

      setPlans(formattedPlans);
      console.log('✅ [PLANS] Planos formatados:', formattedPlans.length);
      
      if (formattedPlans.length === 0) {
        console.warn('⚠️ [PLANS] Nenhum plano válido encontrado');
        toast({
          title: "Nenhum plano disponível",
          description: "Não há planos ativos no momento. Contate o administrador.",
          variant: "default",
        });
      }
      
      // **LOG DE ERROS SE HOUVER**
      if (response.errors && response.errors.length > 0) {
        console.warn('⚠️ [PLANS] Erros durante carregamento:', response.errors);
        toast({
          title: "Aviso",
          description: `${formattedPlans.length} planos carregados com alguns problemas.`,
          variant: "default",
        });
      }
      
    } catch (error) {
      console.error('❌ [PLANS] Erro crítico ao carregar:', error);
      toast({
        title: "Erro no Sistema",
        description: "Falha ao carregar planos. Recarregue a página ou contate o suporte.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string | null) => {
    if (!category) return <Package className="h-6 w-6" />;
    
    switch (category.toLowerCase()) {
      case 'tattoo': return <Star className="h-6 w-6" />;
      case 'dental': return <Users className="h-6 w-6" />;
      case 'service': return <Package className="h-6 w-6" />;
      default: return <Clock className="h-6 w-6" />;
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    console.log('🎯 Plano selecionado:', plan.name);
    
    // Limpar dados antigos do modal antes de selecionar novo plano
    setPaymentData(null);
    setSelectedPlan(plan);
    setPaymentMethodModalOpen(true);
  };

  const handlePaymentMethodSelect = async (method: 'pix' | 'boleto') => {
    if (!selectedPlan) return;
    
    try {
      console.log('🚀 Iniciando processo de compra do plano:', selectedPlan.name, 'Método:', method);
      
      // 1. Verificar autenticação com validação robusta
      console.log('🔐 Verificando sessão do usuário...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Erro ao obter sessão:', sessionError);
        toast({
          title: "Erro de autenticação",
          description: "Erro ao verificar login. Tente fazer login novamente.",
          variant: "destructive",
        });
        return;
      }
      
      if (!session || !session.user) {
        console.log('❌ Usuário não autenticado - sessão inválida');
        toast({
          title: "Login necessário",
          description: "Faça login para comprar um plano.",
          variant: "destructive",
        });
        return;
      }

      // 2. Verificar se o token é válido
      const tokenExpiry = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      
      if (tokenExpiry && tokenExpiry < now) {
        console.log('⚠️ Token expirado, tentando renovar sessão...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedSession) {
          console.error('❌ Falha ao renovar sessão:', refreshError);
          toast({
            title: "Sessão expirada",
            description: "Sua sessão expirou. Faça login novamente.",
            variant: "destructive",
          });
          return;
        }
        
        console.log('✅ Sessão renovada com sucesso');
      }

      // 3. Buscar dados completos do usuário na tabela profiles
      console.log('👤 Buscando dados do perfil do usuário...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileError || !profileData) {
        console.error('❌ Erro ao buscar perfil do usuário:', profileError);
        toast({
          title: "Erro no perfil",
          description: "Não foi possível carregar dados do perfil. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Usuário autenticado:', session.user.id);
      console.log('📧 Email do usuário:', session.user.email);
      console.log('👤 Nome do usuário:', profileData.full_name);
      console.log('📱 Telefone do usuário:', profileData.phone);
      console.log('🆔 CPF do usuário:', profileData.cpf ? 'Cadastrado' : 'NÃO CADASTRADO');
      console.log('🕒 Token expira em:', new Date((tokenExpiry || 0) * 1000).toLocaleString());

      // 4. Validar CPF obrigatório
      if (!profileData.cpf) {
        console.error('❌ CPF não cadastrado para o usuário');
        toast({
          title: "CPF necessário",
          description: "É necessário cadastrar seu CPF no perfil para criar pagamentos. Redirecionando para o perfil...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = '/usuario/perfil';
        }, 3000);
        return;
      }
      
      setProcessingPayment(true);
      setPaymentMethod(method);

      // 5. Chamar a função de criar pagamento com dados do usuário logado
      console.log('📞 Chamando edge function create-asaas-payment com dados do usuário logado...');
      console.log('📤 Dados enviados:', {
        plan_id: selectedPlan.id,
        plan_category: selectedPlan.category,
        user_id: session.user.id,
        payment_method: method,
        user_cpf: profileData.cpf,
        user_email: session.user.email,
        user_name: profileData.full_name
      });
      
      const { data, error } = await supabase.functions.invoke('create-asaas-payment', {
        body: {
          plan_id: selectedPlan.id,
          plan_category: selectedPlan.category,
          user_id: session.user.id,
          payment_method: method
        }
      });

      console.log('📡 Resposta da edge function:', { data, error });

      if (error) {
        console.error('❌ Erro na edge function:', error);
        throw error;
      }

      if (data?.success && data?.redirect_url) {
        console.log('✅ Pagamento criado - redirecionando para:', data.redirect_url);
        
        // Fechar modal de seleção de método
        setPaymentMethodModalOpen(false);
        
        // **FLUXO iFood: Redirecionamento automático para a tela do Asaas**
        toast({
          title: "Redirecionando para pagamento...",
          description: `Você será redirecionado para completar o pagamento de R$ ${data.amount}`,
        });

        // Aguardar um pouco para o usuário ver a mensagem e depois redirecionar
        setTimeout(() => {
          console.log('🔗 Redirecionando para URL de pagamento:', data.redirect_url);
          window.location.href = data.redirect_url;
        }, 2000);

      } else {
        // Tratar erro específico de CPF
        if (data?.error?.includes('CPF') || data?.error?.includes('CNPJ')) {
          console.error('❌ CPF/CNPJ não informado');
          toast({
            title: "CPF necessário",
            description: "É necessário cadastrar seu CPF no perfil para criar pagamentos. Redirecionando para o perfil...",
            variant: "destructive",
          });
          // Redirecionar para página de perfil após 2 segundos
          setTimeout(() => {
            window.location.href = '/usuario/perfil';
          }, 2000);
          return;
        }
        
        console.error('❌ Erro no processamento:', data?.error);
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('💥 Erro ao processar pagamento:', error);
      
      // Tratamento específico para erro de CPF
      if (error.message?.includes('CPF') || error.message?.includes('CNPJ')) {
        toast({
          title: "CPF necessário",
          description: "Complete seu perfil com CPF para realizar pagamentos.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro no pagamento",
          description: error.message || "Erro ao processar pagamento. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setProcessingPayment(false);
    }

    // Callback opcional para componente pai
    if (onSelectPlan && selectedPlan) {
      onSelectPlan(selectedPlan);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "tattoo": return "bg-purple-100 text-purple-800";
      case "dental": return "bg-blue-100 text-blue-800";
      case "service": return "bg-green-100 text-green-800";
      case "course": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category.toLowerCase()) {
      case "tattoo": return "Tatuagem";
      case "dental": return "Dental";
      case "service": return "Serviço";
      case "course": return "Curso";
      default: return category;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-xl font-semibold mb-2">Nenhum plano disponível</h3>
        <p className="text-muted-foreground">
          Os planos estão sendo configurados. Volte em breve!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen overflow-y-auto px-4 py-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Escolha seu Plano
        </h2>
        <p className="text-muted-foreground mb-8">
          Forme um grupo de 10 pessoas e pague apenas 10% de entrada
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative transition-all duration-200 hover:shadow-lg cursor-pointer overflow-hidden ${
              selectedPlanId === plan.id 
                ? "border-2 border-ap-orange shadow-lg" 
                : "border hover:border-ap-orange/50"
            } ${plan.popular ? "border-2 border-ap-orange" : ""}`}
            onClick={() => handleSelectPlan(plan)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="bg-primary text-primary-foreground">
                  Mais Popular
                </Badge>
              </div>
            )}
            
            {plan.image_url && (
              <div className="relative h-32 w-full overflow-hidden">
                <img
                  src={plan.image_url}
                  alt={plan.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            )}
            
            <CardHeader className={`text-center ${plan.image_url ? 'pb-2' : 'pb-4'}`}>
              <div className="flex justify-center items-center gap-2 mb-3">
                {!plan.image_url && (
                  <div className="p-2 bg-ap-orange/10 rounded-lg text-ap-orange">
                    {plan.icon}
                  </div>
                )}
                <Badge variant="secondary" className={getCategoryColor(plan.category)}>
                  {getCategoryLabel(plan.category)}
                </Badge>
              </div>
              
              <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {plan.description}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Pricing */}
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">
                  Valor total do serviço
                </div>
                <div className="text-lg font-medium text-gray-600 line-through">
                  R$ {plan.price.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Você paga apenas:
                </div>
                <div className="text-2xl font-bold text-ap-orange">
                  R$ {plan.entryPrice.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  entrada (10% do valor)
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Incluso no plano:</h4>
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button 
                className="w-full mt-4 font-semibold text-white bg-ap-orange hover:bg-ap-orange-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPlan(plan);
                }}
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Comprar Plano'
                )}
              </Button>

              {/* Group Info */}
              <div className="text-center mt-3">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{plan.max_participants} pessoas por grupo</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Duração: {plan.duration_months} {plan.duration_months === 1 ? 'mês' : 'meses'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium">Como funciona</h4>
              <p className="text-sm text-muted-foreground">
                Forme um grupo e todos economizam
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium">Pagamento seguro</h4>
              <p className="text-sm text-muted-foreground">
                Pague apenas 10% de entrada via cartão ou PIX
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Star className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-medium">Profissionais qualificados</h4>
              <p className="text-sm text-muted-foreground">
                Apenas profissionais verificados e experientes
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Method Selector Modal */}
      <PaymentMethodSelector
        isOpen={paymentMethodModalOpen}
        onClose={() => setPaymentMethodModalOpen(false)}
        onSelectMethod={handlePaymentMethodSelect}
        planName={selectedPlan?.name || ''}
        amount={Math.round((selectedPlan?.price || 0) * 0.1)}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        paymentData={paymentData}
        paymentMethod={paymentMethod}
      />
    </div>
  );
};

export { type Plan };