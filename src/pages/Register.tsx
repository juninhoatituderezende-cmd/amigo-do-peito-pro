
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import FileUpload from "../components/FileUpload";
import { UploadResult } from "../lib/storage";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, user } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    category: "",
    location: "",
    phone: "",
    instagram: "",
    pixKey: "",
    idDocument: null as File | null,
    presentationVideo: null as File | null,
    termsAccepted: false,
  });

  const [uploadedDocuments, setUploadedDocuments] = useState({
    idDocument: null as UploadResult | null,
    video: null as UploadResult | null,
  });

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleNextStep = () => {
    // Validate current step
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.password || !formData.category || !formData.location) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return;
      }
    } else if (step === 2) {
      if (!formData.phone || !formData.instagram || !formData.pixKey) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return;
      }
    }

    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.idDocument && !uploadedDocuments.idDocument) {
      toast({
        title: "Documento obrigatório",
        description: "Por favor, faça o upload do seu documento de identificação.",
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
        category: formData.category,
        location: formData.location,
        cep: "", // Not collected in this form
        instagram: formData.instagram,
        cpf: "", // Not collected in this form
        description: "",
        experience: "",
        approved: false,
        id_document_url: uploadedDocuments.idDocument?.url || null,
        video_url: uploadedDocuments.video?.url || null
      };

      await register(formData.email, formData.password, userData, "professional");
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Aguarde a aprovação do seu cadastro.",
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

  // If the user is already logged in, show a message instead of redirecting
  useEffect(() => {
    if (user) {
      if (user.role === "professional") {
        navigate("/profissional");
      } else if (user.role === "admin") {
        // Don't redirect admin automatically, let them see the form
        console.log("Admin user detected, showing registration form");
      }
    }
  }, [user, navigate]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="fullName">Nome completo *</Label>
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
              <Label htmlFor="email">Email *</Label>
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
                placeholder="Sua senha"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="category">Categoria *</Label>
              <RadioGroup value={formData.category} onValueChange={handleRadioChange} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tatuador" id="tatuador" />
                  <Label htmlFor="tatuador" className="cursor-pointer">Tatuador</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dentista" id="dentista" />
                  <Label htmlFor="dentista" className="cursor-pointer">Dentista (Lentes de Contato)</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="location">Local de atendimento *</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Cidade/Estado"
                required
              />
            </div>
            
            <div className="flex justify-end">
              <Button type="button" onClick={handleNextStep} className="bg-ap-orange hover:bg-ap-orange/90">
                Próximo
              </Button>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
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
            </div>
            
            <div>
              <Label htmlFor="pixKey">Chave PIX *</Label>
              <Input
                id="pixKey"
                name="pixKey"
                value={formData.pixKey}
                onChange={handleChange}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                required
              />
            </div>
            
            <div className="flex justify-between">
              <Button type="button" onClick={handlePreviousStep} variant="outline">
                Voltar
              </Button>
              <Button type="button" onClick={handleNextStep} className="bg-ap-orange hover:bg-ap-orange/90">
                Próximo
              </Button>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <FileUpload
                type="document"
                label="Documento de identificação (RG ou CNH) *"
                description="Formatos aceitos: JPG, PNG, PDF. Tamanho máximo: 5MB"
                onUploadComplete={(result) => {
                  setUploadedDocuments(prev => ({ ...prev, idDocument: result }));
                }}
              />
            </div>
            
            <div>
              <FileUpload
                type="video"
                label="Vídeo de apresentação (opcional)"
                description="Formatos aceitos: MP4, MOV, AVI. Tamanho máximo: 50MB"
                onUploadComplete={(result) => {
                  setUploadedDocuments(prev => ({ ...prev, video: result }));
                }}
              />
            </div>
            
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="termsAccepted"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleCheckboxChange}
                className="mt-1"
              />
              <Label htmlFor="termsAccepted" className="text-sm">
                Eu aceito os termos e condições da plataforma Amigo do Peito e concordo em fornecer serviços de qualidade, emitir nota fiscal e seguir as diretrizes da plataforma. *
              </Label>
            </div>
            
            <div className="flex justify-between">
              <Button type="button" onClick={handlePreviousStep} variant="outline">
                Voltar
              </Button>
              <Button 
                type="submit" 
                className="bg-ap-orange hover:bg-ap-orange/90"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Finalizar Cadastro"}
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <section className="py-12 flex-1 bg-gradient-to-br from-ap-light-orange to-white">
        <div className="ap-container">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">Cadastro de Profissionais</h1>
              <p className="text-gray-600">
                Preencha o formulário abaixo para se juntar à nossa plataforma. Seu cadastro será analisado pela nossa equipe.
              </p>
            </div>
            
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-8">
                  <div className="flex justify-between items-center">
                    {[1, 2, 3].map((s) => (
                      <div
                        key={s}
                        className={`flex flex-col items-center ${
                          s < step ? "text-ap-orange" : s === step ? "text-ap-orange" : "text-gray-400"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                            s < step
                              ? "bg-ap-orange text-white"
                              : s === step
                              ? "bg-white text-ap-orange border-2 border-ap-orange"
                              : "bg-gray-100 text-gray-400 border border-gray-300"
                          }`}
                        >
                          {s}
                        </div>
                        <span className="text-sm mt-1">
                          {s === 1 ? "Informações" : s === 2 ? "Contato" : "Documentos"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="relative mt-2">
                    <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full"></div>
                    <div
                      className="absolute top-0 left-0 h-1 bg-ap-orange transition-all duration-300"
                      style={{ width: `${((step - 1) / 2) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit}>
                  {renderStep()}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Register;
