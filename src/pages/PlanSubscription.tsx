import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Users, DollarSign, Clock, Star, ArrowRight, Gift } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface PlanData {
  id: string;
  plan_code: string;
  name: string;
  description: string;
  category_name: string;
  total_price: number;
  entry_price: number;
  max_participants: number;
  allow_professional_choice: boolean;
  benefits: string[];
  image_url: string;
}

interface Professional {
  id: string;
  nome: string;
  especialidade: string;
  local_atendimento: string;
}

interface ReferrerInfo {
  name: string;
  commission: number;
}

interface UserForm {
  nome: string;
  email: string;
  telefone: string;
  password: string;
  confirmPassword: string;
  selectedProfessional: string;
}

export function PlanSubscription() {
  const { planCode } = useParams();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const { toast } = useToast();
  const { user, register, login } = useAuth();
  
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  
  const [userForm, setUserForm] = useState<UserForm>({
    nome: '',
    email: '',
    telefone: '',
    password: '',
    confirmPassword: '',
    selectedProfessional: ''
  });

  useEffect(() => {
    if (planCode) {
      loadPlanData();
    }
  }, [planCode]);

  const loadPlanData = async () => {
    setLoading(true);
    try {
      // Carregar dados do plano
      const { data: planData, error: planError } = await supabase
        .from('custom_plans')
        .select(`
          *,
          service_categories(name)
        `)
        .eq('plan_code', planCode)
        .eq('active', true)
        .single();

      if (planError) throw planError;

      if (planData) {
        setPlanData({
          ...planData,
          category_name: planData.service_categories?.name || '',
          benefits: planData.benefits || []
        });

        // Se permite escolha de profissional, carregar lista
        if (planData.allow_professional_choice) {
          const { data: professionalsData } = await supabase
            .from('profissionais')
            .select('id, nome, especialidade, local_atendimento')
            .order('nome');
          
          if (professionalsData) setProfessionals(professionalsData);
        }
      }

      // Se há código de referência, buscar informações do referenciador
      if (referralCode) {
        const { data: linkData } = await supabase
          .from('plan_referral_links')
          .select(`
            user_id,
            clientes(nome)
          `)
          .eq('referral_code', referralCode)
          .eq('active', true)
          .single();

        if (linkData && planData) {
          setReferrerInfo({
            name: (linkData as any).clientes?.nome || 'Usuário',
            commission: planData.entry_price * 0.25
          });
        }
      }

    } catch (error) {
      console.error('Erro ao carregar plano:', error);
      toast({
        title: "Erro",
        description: "Plano não encontrado ou inativo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollment = async () => {
    if (!planData) return;

    // Validações
    if (!userForm.nome || !userForm.email || !userForm.telefone) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (isNewUser && (!userForm.password || userForm.password !== userForm.confirmPassword)) {
      toast({
        title: "Erro",
        description: "Senhas não conferem.",
        variant: "destructive",
      });
      return;
    }

    if (planData.allow_professional_choice && !userForm.selectedProfessional) {
      toast({
        title: "Erro",
        description: "Selecione um profissional.",
        variant: "destructive",
      });
      return;
    }

    setEnrolling(true);
    try {
      let userId = user?.id;

      // Se é novo usuário, criar conta
      if (isNewUser && !user) {
        await register(userForm.email, userForm.password, {
          nome: userForm.nome,
          email: userForm.email,
          telefone: userForm.telefone
        }, null);
        
        // Após registro, fazer login
        await login(userForm.email, userForm.password, null);
        
        // Buscar o usuário atual após login
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        userId = currentUser?.id;
      }

      // Se é usuário existente, fazer login
      if (!isNewUser && !user) {
        await login(userForm.email, userForm.password, null);
        
        // Buscar o usuário atual após login
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        userId = currentUser?.id;
      }

      // Buscar ID do cliente na tabela
      const { data: clientData } = await supabase
        .from('clientes')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (!clientData) {
        throw new Error('Dados do cliente não encontrados');
      }

      // Processar inscrição no plano
      const { data: enrollmentData, error: enrollmentError } = await supabase.rpc('process_plan_enrollment', {
        p_plan_code: planCode,
        p_participant_id: clientData.id,
        p_referral_code: referralCode,
        p_professional_id: userForm.selectedProfessional || null
      });

      if (enrollmentError) throw enrollmentError;

      toast({
        title: "Inscrição realizada!",
        description: `Você é o participante ${enrollmentData.position} do grupo.`,
      });

      // Redirecionar para dashboard do usuário
      window.location.href = '/usuario';

    } catch (error: any) {
      console.error('Erro na inscrição:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar inscrição. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setEnrolling(false);
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando plano...</p>
        </div>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Plano não encontrado</CardTitle>
            <CardDescription>
              O plano solicitado não existe ou não está mais disponível.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header do plano */}
          <Card className="mb-8">
            <CardHeader className="text-center">
              <div className="flex justify-center items-center space-x-2 mb-4">
                <Badge variant="outline">{planData.category_name}</Badge>
                {referrerInfo && (
                  <Badge variant="secondary">
                    <Gift className="mr-1 h-3 w-3" />
                    Indicado por {referrerInfo.name}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-3xl font-bold">{planData.name}</CardTitle>
              <CardDescription className="text-lg mt-2">
                {planData.description}
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Informações do plano */}
            <div className="lg:col-span-2 space-y-6">
              {planData.image_url && (
                <Card>
                  <img 
                    src={planData.image_url} 
                    alt={planData.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                </Card>
              )}

              {/* Benefícios */}
              {planData.benefits.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Star className="mr-2 h-5 w-5" />
                      Benefícios Inclusos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {planData.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Como funciona */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Como Funciona
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                      <div>
                        <h4 className="font-semibold">Inscreva-se no grupo</h4>
                        <p className="text-sm text-muted-foreground">Pague a entrada e garante sua vaga</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                      <div>
                        <h4 className="font-semibold">Forme o grupo</h4>
                        <p className="text-sm text-muted-foreground">Convide amigos para completar {planData.max_participants} participantes</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                      <div>
                        <h4 className="font-semibold">Seja contemplado</h4>
                        <p className="text-sm text-muted-foreground">Quando o grupo estiver completo, um participante é sorteado</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                      <div>
                        <h4 className="font-semibold">Realize o serviço</h4>
                        <p className="text-sm text-muted-foreground">Use seu voucher com o profissional</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Formulário de inscrição */}
            <div className="space-y-6">
              {/* Resumo financeiro */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="mr-2 h-5 w-5" />
                    Valor do Plano
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {formatCurrency(planData.entry_price)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Entrada para participar
                    </div>
                    <div className="text-sm mt-2">
                      Valor total do serviço: {formatCurrency(planData.total_price)}
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span>Participantes por grupo:</span>
                    <Badge variant="outline">{planData.max_participants}</Badge>
                  </div>
                  {referrerInfo && (
                    <Alert>
                      <Gift className="h-4 w-4" />
                      <AlertDescription>
                        Você foi indicado por <strong>{referrerInfo.name}</strong>. 
                        Ao se inscrever, ele ganhará {formatCurrency(referrerInfo.commission)} de comissão.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Formulário */}
              <Card>
                <CardHeader>
                  <CardTitle>Inscreva-se Agora</CardTitle>
                  <CardDescription>
                    {user ? "Complete sua inscrição" : "Crie sua conta e participe"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!user && (
                    <div className="flex space-x-2 mb-4">
                      <Button
                        variant={isNewUser ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsNewUser(true)}
                      >
                        Nova Conta
                      </Button>
                      <Button
                        variant={!isNewUser ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsNewUser(false)}
                      >
                        Já Tenho Conta
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={userForm.nome}
                      onChange={(e) => setUserForm(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      value={userForm.telefone}
                      onChange={(e) => setUserForm(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  {!user && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Sua senha"
                        />
                      </div>

                      {isNewUser && (
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={userForm.confirmPassword}
                            onChange={(e) => setUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Confirme sua senha"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {planData.allow_professional_choice && professionals.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="professional">Escolha o Profissional</Label>
                      <Select value={userForm.selectedProfessional} onValueChange={(value) => setUserForm(prev => ({ ...prev, selectedProfessional: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um profissional" />
                        </SelectTrigger>
                        <SelectContent>
                          {professionals.map((professional) => (
                            <SelectItem key={professional.id} value={professional.id}>
                              <div className="text-left">
                                <div className="font-medium">{professional.nome}</div>
                                <div className="text-sm text-muted-foreground">
                                  {professional.especialidade} - {professional.local_atendimento}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button onClick={handleEnrollment} disabled={enrolling} className="w-full">
                    {enrolling ? "Processando..." : (
                      <>
                        Inscrever-se por {formatCurrency(planData.entry_price)}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Ao se inscrever, você concorda com nossos termos de uso
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}