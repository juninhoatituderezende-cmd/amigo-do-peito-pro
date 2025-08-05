
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-ap-light-orange to-white">
        <div className="ap-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Amigo do Peito
              </h1>
              <p className="text-xl md:text-2xl text-gray-800 mb-8">
                A plataforma que conecta profissionais de saúde estética com clientes através de um sistema inovador de marketing multinível.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/cadastro">
                  <Button className="bg-ap-orange hover:bg-ap-orange/90 text-white px-8 py-6 text-lg">
                    Cadastre-se como Profissional
                  </Button>
                </Link>
                <Link to="/usuario/cadastro">
                  <Button className="bg-ap-light-blue hover:bg-ap-light-blue/90 text-white px-8 py-6 text-lg">
                    Sou Cliente
                  </Button>
                </Link>
                <Link to="/influenciador/cadastro">
                  <Button variant="outline" className="border-2 border-ap-orange text-ap-orange hover:bg-ap-orange hover:text-white px-8 py-6 text-lg">
                    Sou Influenciador
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-ap-orange to-ap-light-blue blur-md"></div>
                <div className="relative bg-white p-6 rounded-lg shadow-xl">
                  <img 
                    src="/lovable-uploads/07ee9a5d-7ae4-498b-be27-a07561f8c0bb.png" 
                    alt="Renaldo Rezende - Fundador"
                    className="w-full h-auto rounded-lg shadow-md" 
                  />
                  <div className="mt-4 text-center">
                    <h3 className="font-semibold text-lg">Renaldo Rezende</h3>
                    <p className="text-gray-600">Fundador e CEO</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Embaixadores Section */}
      <section className="section bg-white">
        <div className="ap-container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Conheça Nossos Embaixadores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-0">
                  <img 
                    src="/lovable-uploads/910e3e91-4363-4ada-849c-1b2d717d404a.png" 
                    alt="Charles Ferreira - Tatuador" 
                    className="w-full h-[350px] object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">Charles Ferreira</h3>
                    <p className="text-gray-600 mb-3">Embaixador dos Tatuadores</p>
                    <p>Charles é um tatuador renomado com anos de experiência na área, trazendo sua expertise para nosso time de embaixadores.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-0">
                  <img 
                    src="/lovable-uploads/91e2caa6-e4d2-4fbd-9cb8-646d49d0827f.png" 
                    alt="Chaele Ferreira - Dentista" 
                    className="w-full h-[350px] object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">Chaele Ferreira</h3>
                    <p className="text-gray-600 mb-3">Embaixadora dos Dentistas</p>
                    <p>Especialista em lentes de contato dental, Chaele traz sua experiência e conhecimento para representar a categoria de dentistas.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section bg-ap-light-orange">
        <div className="ap-container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Como Funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 text-center">
            {[
              {
                title: "Contratação",
                description: "O cliente contrata um serviço pagando uma fração inicial",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-ap-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )
              },
              {
                title: "Link Único",
                description: "Recebe um link único para compartilhar",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-ap-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                )
              },
              {
                title: "Compartilhamento",
                description: "Compartilha com amigos interessados",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-ap-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                )
              },
              {
                title: "Completar Grupo",
                description: "O grupo se completa com mais pessoas",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-ap-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )
              },
              {
                title: "Serviço Desbloqueado",
                description: "O serviço é liberado com desconto",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-ap-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                )
              }
            ].map((step, index) => (
              <div 
                key={index}
                className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center transition-all duration-300 hover:shadow-lg"
              >
                <div className="mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                
                {index < 4 && (
                  <div className="hidden lg:flex items-center justify-center mt-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-ap-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section bg-gradient-to-r from-ap-orange to-ap-light-blue text-white">
        <div className="ap-container">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para crescer com a Amigo do Peito?</h2>
            <p className="text-xl mb-8">
              Cadastre-se agora como profissional e comece a expandir seu negócio através do nosso sistema inovador.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cadastro">
                <Button className="bg-white text-ap-orange hover:bg-gray-100 px-8 py-6 text-lg">
                  Sou Profissional
                </Button>
              </Link>
              <Link to="/usuario/cadastro">
                <Button className="bg-white text-ap-light-blue hover:bg-gray-100 px-8 py-6 text-lg">
                  Sou Cliente
                </Button>
              </Link>
              <Link to="/influenciador/cadastro">
                <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-ap-orange px-8 py-6 text-lg">
                  Sou Influenciador
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section bg-white">
        <div className="ap-container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Perguntas Frequentes
          </h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  question: "Como funciona o sistema para os profissionais?",
                  answer: "Os profissionais se cadastram na plataforma, passam por uma aprovação e então podem oferecer seus serviços. Quando um cliente contrata, o pagamento é processado pela plataforma e você recebe após a conclusão do serviço."
                },
                {
                  question: "Quais categorias de profissionais são aceitas?",
                  answer: "Atualmente trabalhamos com duas categorias: tatuadores e dentistas especialistas em lentes de contato dental. Em breve, mais categorias serão adicionadas."
                },
                {
                  question: "Como funciona o marketing multinível?",
                  answer: "Quando um cliente contrata seu serviço, ele recebe um link único para compartilhar. Para cada pessoa que ele indicar e contratar o serviço, ele recebe um desconto. Isso cria uma rede de indicações que beneficia tanto os clientes quanto os profissionais."
                },
                {
                  question: "Como são feitos os pagamentos aos profissionais?",
                  answer: "Os pagamentos são realizados via PIX diretamente para a chave cadastrada no sistema. Após a conclusão do serviço e aprovação do cliente, o valor é liberado para saque."
                },
                {
                  question: "É necessário enviar nota fiscal?",
                  answer: "Sim. Para cada serviço prestado, o profissional deve enviar uma nota fiscal para que o pagamento seja liberado."
                }
              ].map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
