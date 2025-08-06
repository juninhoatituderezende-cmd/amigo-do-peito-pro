import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const InfluencerRegister = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    instagram: "",
    followers: "",
    niche: "",
    description: "",
    termsAccepted: false,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.fullName || !formData.email || !formData.password || 
        !formData.phone || !formData.instagram || !formData.followers || !formData.niche) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    // Validar Instagram handle
    const instagramHandle = formData.instagram.replace('@', '');
    if (instagramHandle.length < 3) {
      toast({
        title: "Instagram inválido",
        description: "O nome do Instagram deve ter pelo menos 3 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.termsAccepted) {
      toast({
        title: "Termos não aceitos",
        description: "Você precisa aceitar os termos e condições para continuar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Criar conta no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        // Inserir dados na tabela influencers
        const { error: insertError } = await supabase
          .from('influencers')
          .insert({
            id: data.user.id,
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            instagram: instagramHandle,
            followers: formData.followers,
            approved: false // Sempre inicia como não aprovado
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error(insertError.message);
        }
      }
      
      toast({
        title: "Cadastro enviado com sucesso!",
        description: "Sua conta será analisada e aprovada em breve. Você receberá um email quando for aprovado.",
      });
      
      navigate("/confirmacao");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro ao realizar cadastro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-16 bg-gradient-to-br from-ap-light-blue/20 to-white">
        <div className="ap-container">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center text-ap-light-blue">
                  Cadastro de Influenciador
                </CardTitle>
                <CardDescription className="text-center">
                  Faça parte da nossa rede e ganhe comissões indicando nossos serviços
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Informações Pessoais */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                      Informações Pessoais
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Nome Completo *</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Seu nome completo"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="seu@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="password">Senha *</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Mínimo 6 caracteres"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Digite a senha novamente"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(XX) XXXXX-XXXX"
                        required
                      />
                    </div>
                  </div>

                  {/* Informações de Rede Social */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                      Perfil nas Redes Sociais
                    </h3>
                    
                    <div>
                      <Label htmlFor="instagram">Instagram *</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          @
                        </span>
                        <Input
                          id="instagram"
                          name="instagram"
                          value={formData.instagram}
                          onChange={handleChange}
                          placeholder="seu_perfil"
                          className="rounded-l-none"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Digite apenas o nome do usuário, sem o @
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="followers">Número de Seguidores *</Label>
                      <Select onValueChange={(value) => handleSelectChange('followers', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a faixa de seguidores" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1k-5k">1.000 - 5.000</SelectItem>
                          <SelectItem value="5k-10k">5.000 - 10.000</SelectItem>
                          <SelectItem value="10k-25k">10.000 - 25.000</SelectItem>
                          <SelectItem value="25k-50k">25.000 - 50.000</SelectItem>
                          <SelectItem value="50k-100k">50.000 - 100.000</SelectItem>
                          <SelectItem value="100k-500k">100.000 - 500.000</SelectItem>
                          <SelectItem value="500k+">500.000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="niche">Nicho de Conteúdo *</Label>
                      <Select onValueChange={(value) => handleSelectChange('niche', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione seu nicho principal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beleza">Beleza e Estética</SelectItem>
                          <SelectItem value="fitness">Fitness e Saúde</SelectItem>
                          <SelectItem value="lifestyle">Lifestyle</SelectItem>
                          <SelectItem value="moda">Moda</SelectItem>
                          <SelectItem value="tatuagem">Tatuagem e Arte Corporal</SelectItem>
                          <SelectItem value="saude">Saúde e Bem-estar</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div>
                    <Label htmlFor="description">Conte um pouco sobre você e seu conteúdo</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Descreva seu perfil, tipo de conteúdo, engajamento, etc. Isso nos ajudará a entender melhor seu perfil..."
                      rows={4}
                    />
                  </div>

                  {/* Termos */}
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="termsAccepted"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleChange}
                      className="mt-1"
                      required
                    />
                    <Label htmlFor="termsAccepted" className="text-sm leading-relaxed">
                      Eu aceito os{" "}
                      <Link to="/termos" className="text-ap-light-blue hover:underline">
                        termos e condições
                      </Link>{" "}
                      da plataforma e concordo em promover apenas conteúdo autêntico e 
                      seguir as diretrizes de marketing. *
                    </Label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-ap-light-blue hover:bg-ap-light-blue/90"
                    disabled={loading}
                  >
                    {loading ? "Enviando cadastro..." : "Enviar Cadastro para Análise"}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Já tem uma conta?{" "}
                    <Link to="/influenciador/login" className="text-ap-light-blue hover:underline">
                      Faça login
                    </Link>
                  </p>
                </div>

                {/* Informações sobre o processo */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">📋 Processo de Aprovação</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Analisamos seu perfil e engajamento</li>
                    <li>• Verificamos a autenticidade da conta</li>
                    <li>• Aprovação em até 3 dias úteis</li>
                    <li>• Você receberá um email com o resultado</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default InfluencerRegister;