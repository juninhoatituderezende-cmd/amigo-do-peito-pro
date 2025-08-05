import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const InfluencerRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    instagram: "",
    followers: "",
    niche: "",
    description: "",
    pixKey: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.phone || 
        !formData.instagram || !formData.followers || !formData.niche || !formData.pixKey) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simulação de cadastro - no futuro será integrado com Supabase
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("Cadastro de influenciador:", formData);
      
      toast({
        title: "Cadastro enviado!",
        description: "Sua conta será analisada e aprovada em breve.",
      });
      
      // Redirect to login after successful registration
      setTimeout(() => {
        navigate("/influenciador/login");
      }, 2000);
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro ao processar seu cadastro. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-16 bg-gradient-to-br from-ap-light-orange to-white">
        <div className="ap-container">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Cadastro de Influenciador</CardTitle>
                <p className="text-center text-gray-600">
                  Junte-se ao nosso programa de influenciadores e ganhe comissões
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <Label htmlFor="instagram">Instagram (@)</Label>
                    <Input
                      id="instagram"
                      name="instagram"
                      type="text"
                      required
                      value={formData.instagram}
                      onChange={handleChange}
                      placeholder="@seuinstagram"
                    />
                  </div>

                  <div>
                    <Label htmlFor="followers">Número de Seguidores</Label>
                    <Select onValueChange={(value) => handleSelectChange("followers", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione sua faixa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1k-5k">1k - 5k</SelectItem>
                        <SelectItem value="5k-10k">5k - 10k</SelectItem>
                        <SelectItem value="10k-50k">10k - 50k</SelectItem>
                        <SelectItem value="50k-100k">50k - 100k</SelectItem>
                        <SelectItem value="100k+">100k+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="niche">Nicho Principal</Label>
                    <Select onValueChange={(value) => handleSelectChange("niche", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu nicho" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beleza">Beleza</SelectItem>
                        <SelectItem value="moda">Moda</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                        <SelectItem value="saude">Saúde</SelectItem>
                        <SelectItem value="fitness">Fitness</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição do seu Perfil</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Conte um pouco sobre seu conteúdo e audiência..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="pixKey">Chave PIX</Label>
                    <Input
                      id="pixKey"
                      name="pixKey"
                      type="text"
                      required
                      value={formData.pixKey}
                      onChange={handleChange}
                      placeholder="CPF, e-mail ou telefone"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-ap-light-blue hover:bg-ap-light-blue/90"
                    disabled={loading}
                  >
                    {loading ? "Enviando..." : "Enviar Cadastro"}
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