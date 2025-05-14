
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

interface Professional {
  id: string;
  name: string;
  category: string;
  location: string;
  phone: string;
  instagram: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
}

interface Transaction {
  id: string;
  professional: string;
  service: string;
  amount: number;
  status: "pending" | "completed" | "refunded";
  date: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [mockProfessionals] = useState<Professional[]>([
    {
      id: "pro1",
      name: "Carlos Silva",
      category: "tatuador",
      location: "São Paulo, SP",
      phone: "(11) 98765-4321",
      instagram: "carlossilvatattoo",
      status: "pending",
      createdAt: "2023-05-10T14:30:00Z",
    },
    {
      id: "pro2",
      name: "Ana Costa",
      category: "dentista",
      location: "Rio de Janeiro, RJ",
      phone: "(21) 98877-6655",
      instagram: "draanacosta",
      status: "pending",
      createdAt: "2023-05-11T10:15:00Z",
    },
    {
      id: "pro3",
      name: "Pedro Santos",
      category: "tatuador",
      location: "Belo Horizonte, MG",
      phone: "(31) 99988-7766",
      instagram: "pedrotattoobh",
      status: "approved",
      createdAt: "2023-05-09T08:45:00Z",
    },
    {
      id: "pro4",
      name: "Mariana Lima",
      category: "dentista",
      location: "Salvador, BA",
      phone: "(71) 98765-1234",
      instagram: "dra.mariana.odonto",
      status: "approved",
      createdAt: "2023-05-08T16:20:00Z",
    },
    {
      id: "pro5",
      name: "Lucas Oliveira",
      category: "tatuador",
      location: "Curitiba, PR",
      phone: "(41) 99887-5544",
      instagram: "lucasink",
      status: "rejected",
      createdAt: "2023-05-07T11:10:00Z",
    },
  ]);

  const [mockTransactions] = useState<Transaction[]>([
    {
      id: "tx1",
      professional: "Ana Costa",
      service: "Lentes de contato dental",
      amount: 1500.00,
      status: "completed",
      date: "2023-05-15T14:30:00Z",
    },
    {
      id: "tx2",
      professional: "Carlos Silva",
      service: "Tatuagem braço completo",
      amount: 800.00,
      status: "pending",
      date: "2023-05-16T10:15:00Z",
    },
    {
      id: "tx3",
      professional: "Mariana Lima",
      service: "Lentes de contato dental (6 unidades)",
      amount: 2200.00,
      status: "completed",
      date: "2023-05-14T16:45:00Z",
    },
    {
      id: "tx4",
      professional: "Pedro Santos",
      service: "Tatuagem costas",
      amount: 1200.00,
      status: "refunded",
      date: "2023-05-13T09:20:00Z",
    },
  ]);

  // Filter professionals based on search query and active tab
  const filteredProfessionals = mockProfessionals.filter((pro) => {
    const matchesSearch = pro.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          pro.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pro.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "pending") return matchesSearch && pro.status === "pending";
    if (activeTab === "approved") return matchesSearch && pro.status === "approved";
    if (activeTab === "rejected") return matchesSearch && pro.status === "rejected";
    
    return matchesSearch;
  });

  const handleApprove = (id: string) => {
    // In a real app, this would make an API call to approve the professional
    toast({
      title: "Profissional aprovado",
      description: "O profissional foi aprovado com sucesso e receberá uma notificação.",
    });
  };

  const handleReject = (id: string) => {
    // In a real app, this would make an API call to reject the professional
    toast({
      title: "Profissional rejeitado",
      description: "O profissional foi rejeitado e receberá uma notificação.",
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    document.title = "Painel Administrativo | Amigo do Peito";
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 bg-slate-50">
        <div className="ap-container py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Painel Administrativo</h1>
              <p className="text-gray-600">Gerencie profissionais, usuários e transações</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <Input 
                placeholder="Buscar profissionais..." 
                value={searchQuery}
                onChange={handleSearch}
                className="w-full md:w-64"
              />
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                title: "Profissionais",
                value: mockProfessionals.length,
                subtitle: "Total cadastrado",
                color: "bg-blue-50 text-blue-700",
              },
              {
                title: "Pendentes",
                value: mockProfessionals.filter(p => p.status === "pending").length,
                subtitle: "Aguardando aprovação",
                color: "bg-yellow-50 text-yellow-700",
              },
              {
                title: "Transações",
                value: mockTransactions.length,
                subtitle: "Total de serviços",
                color: "bg-green-50 text-green-700",
              },
              {
                title: "Receita",
                value: `R$ ${mockTransactions.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString('pt-BR')}`,
                subtitle: "Total bruto",
                color: "bg-purple-50 text-purple-700",
              },
            ].map((stat, index) => (
              <Card key={index} className="border-none shadow-sm">
                <CardContent className={`p-6 ${stat.color} rounded-lg`}>
                  <p className="text-sm font-medium">{stat.title}</p>
                  <h2 className="text-3xl font-bold mt-1">{stat.value}</h2>
                  <p className="text-sm opacity-80 mt-1">{stat.subtitle}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Tabs */}
          <Tabs defaultValue="pending" onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 max-w-md mb-4">
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="approved">Aprovados</TabsTrigger>
              <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="space-y-4">
              <h2 className="text-xl font-semibold">Profissionais Pendentes</h2>
              {filteredProfessionals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProfessionals.map((pro) => (
                    <Card key={pro.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-lg">{pro.name}</CardTitle>
                          <Badge variant="outline" className="capitalize">
                            {pro.category === "tatuador" ? "Tatuador" : "Dentista"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-gray-600">📍 {pro.location}</p>
                          <p className="text-sm text-gray-600">📱 {pro.phone}</p>
                          <p className="text-sm text-gray-600">
                            📸 <a href={`https://instagram.com/${pro.instagram}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              @{pro.instagram}
                            </a>
                          </p>
                          <p className="text-sm text-gray-600">
                            📅 Cadastrado em: {new Date(pro.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2 mt-4">
                          <Button 
                            onClick={() => handleApprove(pro.id)} 
                            variant="default"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            Aprovar
                          </Button>
                          <Button 
                            onClick={() => handleReject(pro.id)} 
                            variant="outline"
                            className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                          >
                            Rejeitar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg border">
                  <p className="text-gray-600">Nenhum profissional pendente encontrado.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="approved" className="space-y-4">
              <h2 className="text-xl font-semibold">Profissionais Aprovados</h2>
              {filteredProfessionals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProfessionals.map((pro) => (
                    <Card key={pro.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-lg">{pro.name}</CardTitle>
                          <Badge variant="outline" className="capitalize">
                            {pro.category === "tatuador" ? "Tatuador" : "Dentista"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">📍 {pro.location}</p>
                          <p className="text-sm text-gray-600">📱 {pro.phone}</p>
                          <p className="text-sm text-gray-600">
                            📸 <a href={`https://instagram.com/${pro.instagram}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              @{pro.instagram}
                            </a>
                          </p>
                          <p className="text-sm text-gray-600">
                            📅 Aprovado desde: {new Date(pro.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg border">
                  <p className="text-gray-600">Nenhum profissional aprovado encontrado.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="rejected" className="space-y-4">
              <h2 className="text-xl font-semibold">Profissionais Rejeitados</h2>
              {filteredProfessionals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProfessionals.map((pro) => (
                    <Card key={pro.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-lg">{pro.name}</CardTitle>
                          <Badge variant="outline" className="capitalize">
                            {pro.category === "tatuador" ? "Tatuador" : "Dentista"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-gray-600">📍 {pro.location}</p>
                          <p className="text-sm text-gray-600">📱 {pro.phone}</p>
                          <p className="text-sm text-gray-600">
                            📸 <a href={`https://instagram.com/${pro.instagram}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              @{pro.instagram}
                            </a>
                          </p>
                          <p className="text-sm text-gray-600">
                            📅 Rejeitado em: {new Date(pro.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        
                        <Button 
                          onClick={() => handleApprove(pro.id)} 
                          variant="outline"
                          className="w-full"
                        >
                          Reconsiderar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg border">
                  <p className="text-gray-600">Nenhum profissional rejeitado encontrado.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Transactions Section */}
          <div className="mt-10 space-y-6">
            <h2 className="text-xl font-semibold">Últimas Transações</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profissional</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serviço</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.professional}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.service}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tx.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          tx.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {tx.status === 'completed' ? 'Concluído' : 
                           tx.status === 'pending' ? 'Pendente' : 'Estornado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminDashboard;
