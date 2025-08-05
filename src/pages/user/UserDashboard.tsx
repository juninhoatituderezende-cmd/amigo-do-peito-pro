import { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserGroupsHistory } from "@/components/user/UserGroupsHistory";
import { UserProfile } from "@/components/user/UserProfile";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import { User, Users, Bell, ShoppingCart, Settings } from "lucide-react";

const UserDashboard = () => {
  const userData = {
    name: "João Silva",
    email: "joao@email.com",
    joinDate: "2024-01-10",
    totalGroups: 3,
    activeGroups: 1,
    contemplatedGroups: 1
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="ap-container py-8">
        {/* User Profile Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 bg-ap-orange rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Olá, {userData.name}!</h1>
              <p className="text-muted-foreground">
                Membro desde {userData.joinDate}
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="groups" className="space-y-6">
          <TabsList className="grid w-full lg:w-auto grid-cols-4">
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Meus Grupos
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Participar
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Perfil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="groups">
            <UserGroupsHistory />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationCenter />
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Planos Disponíveis</CardTitle>
                <p className="text-muted-foreground">
                  Escolha seu plano e forme um grupo de 10 pessoas para economizar
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-2 hover:border-ap-orange transition-colors cursor-pointer">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-2">Tatuagem</h3>
                      <p className="text-muted-foreground mb-4">
                        Tatuagem profissional até 15cm
                      </p>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span>Valor total:</span>
                          <span className="font-medium line-through text-gray-500">R$ 1.000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sua entrada:</span>
                          <span className="font-medium text-ap-orange text-lg">R$ 100</span>
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          (10% do valor total)
                        </div>
                      </div>
                      <Button className="w-full bg-ap-orange hover:bg-ap-orange/90">
                        Formar Grupo
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-ap-orange transition-colors cursor-pointer">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-2">Lente Superior</h3>
                      <p className="text-muted-foreground mb-4">
                        Lentes de contato dental (arcada superior)
                      </p>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span>Valor total:</span>
                          <span className="font-medium line-through text-gray-500">R$ 2.500</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sua entrada:</span>
                          <span className="font-medium text-ap-orange text-lg">R$ 250</span>
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          (10% do valor total)
                        </div>
                      </div>
                      <Button className="w-full bg-ap-orange hover:bg-ap-orange/90">
                        Formar Grupo
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-ap-orange transition-colors cursor-pointer">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-2">Lente Inferior</h3>
                      <p className="text-muted-foreground mb-4">
                        Lentes de contato dental (arcada inferior)
                      </p>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span>Valor total:</span>
                          <span className="font-medium line-through text-gray-500">R$ 2.500</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sua entrada:</span>
                          <span className="font-medium text-ap-orange text-lg">R$ 250</span>
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          (10% do valor total)
                        </div>
                      </div>
                      <Button className="w-full bg-ap-orange hover:bg-ap-orange/90">
                        Formar Grupo
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-ap-orange bg-gradient-to-br from-ap-orange/5 to-ap-orange/10 hover:border-ap-orange transition-colors cursor-pointer relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-ap-orange text-white text-xs px-3 py-1 rounded-full">
                        Mais Popular
                      </span>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-2">Plano Completo</h3>
                      <p className="text-muted-foreground mb-4">
                        Lentes superiores + inferiores (sorriso completo)
                      </p>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span>Valor total:</span>
                          <span className="font-medium line-through text-gray-500">R$ 4.500</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sua entrada:</span>
                          <span className="font-medium text-ap-orange text-lg">R$ 450</span>
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          (10% do valor total)
                        </div>
                      </div>
                      <Button className="w-full bg-ap-orange hover:bg-ap-orange/90">
                        Formar Grupo
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Info Section */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl mb-2">👥</div>
                    <h4 className="font-medium mb-1">10 Pessoas por Grupo</h4>
                    <p className="text-sm text-muted-foreground">
                      Forme um grupo e todos economizam juntos
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl mb-2">💳</div>
                    <h4 className="font-medium mb-1">Apenas 10% de Entrada</h4>
                    <p className="text-sm text-muted-foreground">
                      Pague pouco agora, serviço depois
                    </p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl mb-2">⭐</div>
                    <h4 className="font-medium mb-1">Profissionais Qualificados</h4>
                    <p className="text-sm text-muted-foreground">
                      Apenas profissionais verificados
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <UserProfile />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default UserDashboard;