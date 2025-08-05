import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Shield, Users, CreditCard, Mail, Phone } from 'lucide-react';

export function TermsAndPolicies() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Termos de Uso e Políticas</h1>
            <p className="text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div className="space-y-8">
            {/* Termos de Uso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ScrollText className="mr-2 h-5 w-5" />
                  Termos de Uso
                </CardTitle>
                <CardDescription>
                  Condições gerais para uso da plataforma Amigo do Peito
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">1. Aceitação dos Termos</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Ao acessar e usar a plataforma Amigo do Peito, você concorda em estar vinculado a estes 
                    Termos de Uso e todas as leis e regulamentos aplicáveis. Se você não concordar com 
                    algum desses termos, está proibido de usar este site.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">2. Descrição do Serviço</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    A Amigo do Peito é uma plataforma que conecta usuários interessados em serviços de 
                    tatuagem, estética e outros procedimentos com profissionais qualificados através de 
                    um sistema de grupos e contemplação.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">3. Responsabilidades do Usuário</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Fornecer informações verdadeiras e atualizadas</li>
                    <li>Manter a confidencialidade de suas credenciais de acesso</li>
                    <li>Usar a plataforma de forma ética e legal</li>
                    <li>Respeitar outros usuários e profissionais</li>
                    <li>Cumprir com os prazos e condições estabelecidas</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">4. Sistema de Pagamentos</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Os pagamentos são processados de forma segura através de nossa plataforma. 
                    As condições específicas de cada plano são apresentadas no momento da contratação. 
                    Reembolsos seguem nossa política específica disponível no suporte.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">5. Limitação de Responsabilidade</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    A Amigo do Peito atua como intermediadora entre usuários e profissionais. 
                    Não nos responsabilizamos pela qualidade dos serviços prestados pelos profissionais 
                    parceiros, sendo esta responsabilidade exclusiva do profissional contratado.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Política de Privacidade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Política de Privacidade
                </CardTitle>
                <CardDescription>
                  Como coletamos, usamos e protegemos suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Coleta de Informações</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Coletamos informações que você nos fornece diretamente, como nome, e-mail, telefone 
                    e CPF, necessárias para prestação do serviço. Também coletamos dados de navegação 
                    para melhorar sua experiência.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Uso das Informações</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Prestação e melhoria dos nossos serviços</li>
                    <li>Comunicação sobre sua conta e serviços</li>
                    <li>Processamento de pagamentos e transações</li>
                    <li>Cumprimento de obrigações legais</li>
                    <li>Prevenção de fraudes e atividades maliciosas</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Compartilhamento de Dados</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Seus dados pessoais não são vendidos ou compartilhados com terceiros, exceto 
                    quando necessário para prestação do serviço (profissionais parceiros) ou 
                    quando exigido por lei.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Segurança</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Implementamos medidas técnicas e organizacionais apropriadas para proteger 
                    suas informações pessoais contra acesso não autorizado, alteração, divulgação 
                    ou destruição.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Política de Cookies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Política de Cookies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência, 
                  personalizar conteúdo, analisar tráfego e fornecer recursos de mídia social. 
                  Você pode controlar o uso de cookies através das configurações do seu navegador.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Cookies Essenciais</h4>
                    <p className="text-sm text-muted-foreground">
                      Necessários para o funcionamento básico da plataforma
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Cookies Analíticos</h4>
                    <p className="text-sm text-muted-foreground">
                      Ajudam a entender como você usa nosso site
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Cookies de Marketing</h4>
                    <p className="text-sm text-muted-foreground">
                      Personalizam anúncios e conteúdo relevante
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Direitos do Usuário */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Seus Direitos (LGPD)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Direitos Garantidos</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Confirmação da existência de tratamento</li>
                      <li>• Acesso aos dados</li>
                      <li>• Correção de dados incompletos ou inexatos</li>
                      <li>• Eliminação de dados desnecessários</li>
                      <li>• Portabilidade dos dados</li>
                      <li>• Revogação do consentimento</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Como Exercer</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Para exercer seus direitos, entre em contato conosco:
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-3 w-3" />
                        <span>privacidade@amigodopeito.com</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3 w-3" />
                        <span>(11) 99999-9999</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contato */}
            <Card>
              <CardHeader>
                <CardTitle>Contato e Dúvidas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Se você tiver dúvidas sobre estes termos ou nossa política de privacidade, 
                  entre em contato conosco:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Amigo do Peito Ltda.</h4>
                    <p className="text-sm text-muted-foreground">
                      CNPJ: 00.000.000/0001-00<br />
                      Endereço: Rua Example, 123 - São Paulo/SP<br />
                      CEP: 00000-000
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Atendimento</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-3 w-3" />
                        <span>contato@amigodopeito.com</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3 w-3" />
                        <span>(11) 99999-9999</span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-2">
                        Horário: Segunda a Sexta, 9h às 18h
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alterações */}
            <Card>
              <CardContent className="py-6">
                <div className="text-center">
                  <Badge variant="outline" className="mb-2">
                    Versão 1.0
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Reservamos o direito de modificar estes termos a qualquer momento. 
                    As alterações entrarão em vigor imediatamente após a publicação.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}