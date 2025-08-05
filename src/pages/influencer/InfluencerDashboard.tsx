import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const InfluencerDashboard = () => {
  // Dados simulados - no futuro virão do Supabase
  const influencerData = {
    name: "Maria Influencer",
    email: "maria@email.com",
    instagram: "@mariainfluencer",
    followers: "25k",
    status: "Aprovado",
    commissions: [
      {
        id: 1,
        date: "2024-01-15",
        service: "Tatuagem Realista",
        customer: "Ana Silva",
        value: 75.00,
        status: "Pago"
      },
      {
        id: 2,
        date: "2024-01-10",
        service: "Lentes de Contato Dental",
        customer: "Carlos Santos",
        value: 120.00,
        status: "Pendente"
      }
    ],
    referralLink: "https://amigodopeito.com/ref/maria-influencer",
    totalEarnings: 1850.00,
    pendingEarnings: 320.00,
    availableBalance: 1530.00
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 bg-gradient-to-br from-ap-light-orange to-white">
        <div className="ap-container">
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Olá, {influencerData.name}!</h1>
                <p className="text-gray-600">Painel do Influenciador - {influencerData.instagram}</p>
              </div>
              <Badge variant={influencerData.status === "Aprovado" ? "default" : "secondary"}>
                {influencerData.status}
              </Badge>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Total Ganho</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {influencerData.totalEarnings.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Pendente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  R$ {influencerData.pendingEarnings.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Disponível para Saque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-ap-light-blue">
                  R$ {influencerData.availableBalance.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Seguidores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {influencerData.followers}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Histórico de Comissões */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Comissões</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {influencerData.commissions.map((commission) => (
                    <div key={commission.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{commission.service}</h3>
                          <p className="text-sm text-gray-600">Cliente: {commission.customer}</p>
                          <p className="text-sm text-gray-600">Data: {commission.date}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            R$ {commission.value.toFixed(2)}
                          </div>
                          <Badge variant={commission.status === "Pago" ? "default" : "secondary"}>
                            {commission.status}
                          </Badge>
                        </div>
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
                      {influencerData.referralLink}
                    </div>
                    <Button size="sm" className="w-full" variant="outline">
                      Copiar Link
                    </Button>
                    <p className="text-xs text-gray-600">
                      Compartilhe este link em suas redes sociais para ganhar comissão!
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Saque */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Solicitar Saque</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-gray-600">Saldo disponível:</span>
                      <div className="font-bold text-lg text-ap-light-blue">
                        R$ {influencerData.availableBalance.toFixed(2)}
                      </div>
                    </div>
                    <Button className="w-full bg-ap-light-blue hover:bg-ap-light-blue/90">
                      Solicitar Saque via PIX
                    </Button>
                    <p className="text-xs text-gray-600">
                      Saques são processados em até 24 horas
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Material de Divulgação */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Material de Divulgação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button size="sm" className="w-full" variant="outline">
                      Download de Banners
                    </Button>
                    <Button size="sm" className="w-full" variant="outline">
                      Textos Prontos
                    </Button>
                    <Button size="sm" className="w-full" variant="outline">
                      Stories Templates
                    </Button>
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

export default InfluencerDashboard;