import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";

const UserRegister = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    referralCode: "",
    termsAccepted: false,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateReferralCode = (name: string) => {
    const cleanName = name.replace(/\s+/g, '').toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${cleanName.slice(0, 4)}${randomSuffix}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.fullName || !formData.email || !formData.password || !formData.phone) {
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
      const userData = {
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        referral_code: generateReferralCode(formData.fullName),
        referred_by: formData.referralCode || null
      };

      await register(formData.email, formData.password, userData, null);
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Bem-vindo à Amigo do Peito! Você pode fazer login agora.",
      });

      navigate("/usuario/login");
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
      
      <main className="flex-1 py-16 bg-gradient-to-br from-ap-light-orange to-white">
        <div className="ap-container">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Cadastro de Usuário</CardTitle>
                <CardDescription className="text-center">
                  Junte-se à nossa plataforma e participe de grupos exclusivos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
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

                  <div>
                    <Label htmlFor="referralCode">Código de Indicação (opcional)</Label>
                    <Input
                      id="referralCode"
                      name="referralCode"
                      value={formData.referralCode}
                      onChange={handleChange}
                      placeholder="Ex: MARIA2024"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Se você foi indicado por alguém, digite o código aqui
                    </p>
                  </div>

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
                      <Link to="/termos" className="text-ap-orange hover:underline">
                        termos e condições
                      </Link>{" "}
                      e a{" "}
                      <Link to="/privacidade" className="text-ap-orange hover:underline">
                        política de privacidade
                      </Link>
                      . *
                    </Label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-ap-orange hover:bg-ap-orange/90"
                    disabled={loading}
                  >
                    {loading ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Já tem uma conta?{" "}
                    <Link to="/usuario/login" className="text-ap-orange hover:underline">
                      Faça login
                    </Link>
                  </p>
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

export default UserRegister;