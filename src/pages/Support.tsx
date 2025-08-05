import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Clock, 
  MapPin, 
  HelpCircle,
  Send,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  category: string;
  message: string;
}

export function Support() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    // Simular envio
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Mensagem enviada!",
        description: "Entraremos em contato em até 24 horas úteis.",
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        category: '',
        message: ''
      });
    }, 2000);
  };

  const faqs = [
    {
      question: "Como funciona o sistema de contemplação?",
      answer: "O sistema funciona através de grupos. Quando um grupo atinge o número máximo de participantes, é realizado um sorteio para escolher quem será contemplado primeiro. O contemplado pode então agendar seu serviço com o profissional."
    },
    {
      question: "Posso cancelar minha participação?",
      answer: "Sim, você pode cancelar sua participação seguindo nossa política de cancelamento. O prazo e condições variam dependendo do plano escolhido."
    },
    {
      question: "Como escolho o profissional?",
      answer: "Dependendo do plano, você pode escolher o profissional no momento da inscrição ou ele será designado automaticamente. Todos os profissionais são qualificados e aprovados pela nossa equipe."
    },
    {
      question: "O voucher tem prazo de validade?",
      answer: "Sim, todos os vouchers têm prazo de validade de 6 meses a partir da data de emissão. É importante agendar e realizar seu serviço dentro deste período."
    },
    {
      question: "Como funciona o sistema de indicações?",
      answer: "Quando você indica alguém através do seu link pessoal e essa pessoa se inscreve, você ganha uma comissão. Isso também ajuda a formar grupos mais rapidamente."
    },
    {
      question: "Os pagamentos são seguros?",
      answer: "Sim, utilizamos sistemas de pagamento seguros e criptografados. Seus dados financeiros são protegidos e nunca armazenados em nossos servidores."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Central de Ajuda</h1>
            <p className="text-muted-foreground">
              Estamos aqui para ajudar você! Encontre respostas ou entre em contato conosco.
            </p>
          </div>

          <Tabs defaultValue="contact" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="contact">Contato</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="guides">Guias</TabsTrigger>
            </TabsList>

            {/* Contato */}
            <TabsContent value="contact" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Informações de Contato */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Phone className="mr-2 h-5 w-5" />
                        Telefone
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold">(11) 99999-9999</p>
                      <p className="text-sm text-muted-foreground">
                        Segunda a Sexta: 9h às 18h<br />
                        Sábado: 9h às 14h
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Mail className="mr-2 h-5 w-5" />
                        E-mail
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold">contato@amigodopeito.com</p>
                      <p className="text-sm text-muted-foreground">
                        Resposta em até 24h úteis
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MessageCircle className="mr-2 h-5 w-5" />
                        WhatsApp
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold">(11) 99999-9999</p>
                      <Button className="mt-2 w-full" variant="outline">
                        Abrir WhatsApp
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MapPin className="mr-2 h-5 w-5" />
                        Endereço
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Rua Example, 123<br />
                        Bairro Centro<br />
                        São Paulo - SP<br />
                        CEP: 00000-000
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Formulário de Contato */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Envie sua Mensagem</CardTitle>
                      <CardDescription>
                        Preencha o formulário abaixo e entraremos em contato com você
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo *</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Seu nome completo"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">E-mail *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="seu@email.com"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="(11) 99999-9999"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="category">Categoria</Label>
                            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">Dúvida Geral</SelectItem>
                                <SelectItem value="technical">Problema Técnico</SelectItem>
                                <SelectItem value="payment">Pagamentos</SelectItem>
                                <SelectItem value="voucher">Vouchers</SelectItem>
                                <SelectItem value="professional">Profissionais</SelectItem>
                                <SelectItem value="suggestion">Sugestão</SelectItem>
                                <SelectItem value="complaint">Reclamação</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject">Assunto</Label>
                          <Input
                            id="subject"
                            value={formData.subject}
                            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Resumo do seu contato"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message">Mensagem *</Label>
                          <Textarea
                            id="message"
                            value={formData.message}
                            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Descreva sua dúvida ou problema em detalhes..."
                            rows={5}
                            required
                          />
                        </div>

                        <Button type="submit" disabled={loading} className="w-full">
                          {loading ? (
                            <>
                              <Clock className="mr-2 h-4 w-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Enviar Mensagem
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* FAQ */}
            <TabsContent value="faq" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HelpCircle className="mr-2 h-5 w-5" />
                    Perguntas Frequentes
                  </CardTitle>
                  <CardDescription>
                    Encontre respostas para as dúvidas mais comuns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {faqs.map((faq, index) => (
                      <div key={index} className="border-b border-border pb-4 last:border-b-0">
                        <h3 className="font-semibold mb-2">{faq.question}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Guias */}
            <TabsContent value="guides" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                      Como se Inscrever
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Escolha um plano disponível</li>
                      <li>Preencha seus dados pessoais</li>
                      <li>Realize o pagamento da entrada</li>
                      <li>Aguarde a formação do grupo</li>
                      <li>Participe do sorteio de contemplação</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Info className="mr-2 h-5 w-5 text-blue-500" />
                      Sistema de Indicações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Acesse seu painel de usuário</li>
                      <li>Gere seu link de indicação</li>
                      <li>Compartilhe com amigos</li>
                      <li>Ganhe comissão por cada indicação</li>
                      <li>Acompanhe seus ganhos no dashboard</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                      Uso do Voucher
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Receba seu voucher por email</li>
                      <li>Entre em contato com o profissional</li>
                      <li>Agende seu atendimento</li>
                      <li>Apresente o voucher no dia</li>
                      <li>Realize seu serviço</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Phone className="mr-2 h-5 w-5 text-purple-500" />
                      Suporte Técnico
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Descreva o problema detalhadamente</li>
                      <li>Inclua prints se necessário</li>
                      <li>Informe browser e dispositivo</li>
                      <li>Aguarde resposta da equipe</li>
                      <li>Siga as instruções fornecidas</li>
                    </ol>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Não encontrou o que procurava? Entre em contato conosco através da aba "Contato" 
                  e nossa equipe terá prazer em ajudá-lo!
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}