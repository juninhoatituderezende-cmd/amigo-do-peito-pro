import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const UserDashboard = () => {
  // Dados simulados - no futuro virão do Supabase
  const userData = {
    name: "João Silva",
    email: "joao@email.com",
    groups: [
      {
        id: 1,
        service: "Tatuagem Realista",
        professional: "Charles Ferreira",
        status: "Em andamento",
        participants: 3,
        maxParticipants: 5,
        discount: "30%",
        originalPrice: 500,
        finalPrice: 350
      },
      {
        id: 2,
        service: "Lentes de Contato Dental",
        professional: "Chaele Ferreira",
        status: "Completo",
        participants: 4,
        maxParticipants: 4,
        discount: "40%",
        originalPrice: 1200,
        finalPrice: 720
      }
    ],
    referralLink: "https://amigodopeito.com/ref/joao123"
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 bg-gradient-to-br from-ap-light-orange to-white">
        <div className="ap-container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Olá, {userData.name}!</h1>
            <p className="text-gray-600">Bem-vindo ao seu painel de usuário</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Meus Grupos */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Meus Grupos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userData.groups.map((group) => (
                    <div key={group.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{group.service}</h3>
                          <p className="text-sm text-gray-600">com {group.professional}</p>
                        </div>
                        <Badge variant={group.status === "Completo" ? "default" : "secondary"}>
                          {group.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Participantes:</span>
                          <p className="font-medium">{group.participants}/{group.maxParticipants}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Desconto:</span>
                          <p className="font-medium text-green-600">{group.discount}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Preço original:</span>
                          <p className="line-through">R$ {group.originalPrice}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Preço final:</span>
                          <p className="font-bold text-ap-orange">R$ {group.finalPrice}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {group.status === "Completo" ? (
                          <Button size="sm" className="bg-ap-orange hover:bg-ap-orange/90">
                            Agendar Serviço
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline">
                            Compartilhar Grupo
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Meu Link de Indicação */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Meu Link de Indicação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-100 rounded text-sm break-all">
                      {userData.referralLink}
                    </div>
                    <Button size="sm" className="w-full" variant="outline">
                      Copiar Link
                    </Button>
                    <p className="text-xs text-gray-600">
                      Compartilhe este link e ganhe desconto quando seus amigos se cadastrarem!
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Buscar Serviços */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Buscar Serviços</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full bg-ap-orange hover:bg-ap-orange/90">
                      Explorar Tatuagens
                    </Button>
                    <Button className="w-full bg-ap-light-blue hover:bg-ap-light-blue/90">
                      Explorar Tratamentos Dentais
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Suas Estatísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Grupos ativos:</span>
                      <span className="font-semibold">1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Grupos completos:</span>
                      <span className="font-semibold">1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total economizado:</span>
                      <span className="font-semibold text-green-600">R$ 630</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amigos indicados:</span>
                      <span className="font-semibold">3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserDashboard;