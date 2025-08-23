import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCards } from "@/components/influencer/StatsCards";
import { ReferralLinks } from "@/components/influencer/ReferralLinks";
import { PromoMaterials } from "@/components/influencer/PromoMaterials";
import { Gamification } from "@/components/influencer/Gamification";
import { CommissionHistory } from "@/components/influencer/CommissionHistory";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import { InfluencerProducts } from "@/components/influencer/InfluencerProducts";
import { User, Instagram, CheckCircle, AlertCircle, Wallet, Megaphone } from "lucide-react";

const InfluencerDashboard = () => {
  const navigate = useNavigate();
  // Mock data - será substituído por dados reais do Supabase
  const influencerData = {
    name: "Amanda Ferreira",
    instagram: "@amanda_fitness",
    approved: true,
    totalEarnings: 8500,
    pendingEarnings: 1200,
    totalReferrals: 23,
    conversionRate: 4.8,
    clicksThisMonth: 485
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="ap-container py-8">
        {/* Header do perfil */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 bg-ap-orange rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{influencerData.name}</h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Instagram className="h-4 w-4" />
                  <span>{influencerData.instagram}</span>
                </div>
                <Badge 
                  variant="secondary" 
                  className={influencerData.approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                >
                  {influencerData.approved ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Aprovado
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Pendente
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="tools">Ferramentas</TabsTrigger>
            <TabsTrigger value="referrals">Indicações</TabsTrigger>
            <TabsTrigger value="gamification">Gamificação</TabsTrigger>
            <TabsTrigger value="commissions">Comissões</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <StatsCards 
              totalEarnings={influencerData.totalEarnings}
              pendingEarnings={influencerData.pendingEarnings}
              totalReferrals={influencerData.totalReferrals}
              conversionRate={influencerData.conversionRate}
              clicksThisMonth={influencerData.clicksThisMonth}
            />

            {/* Ações rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Saque via PIX
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Você tem R$ {influencerData.totalEarnings.toLocaleString()} disponível para saque.
                  </p>
                  <Button className="w-full bg-ap-orange hover:bg-ap-orange/90">
                    Solicitar Saque
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" />
                    Material Promocional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Acesse banners, textos prontos e templates para suas redes sociais.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate("/influenciador/ferramentas")}
                  >
                    Ver Materiais
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Links de indicação e histórico */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReferralLinks />
              <CommissionHistory />
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <InfluencerProducts />
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <PromoMaterials />
          </TabsContent>

          <TabsContent value="referrals" className="space-y-4">
            <ReferralLinks />
          </TabsContent>

          <TabsContent value="gamification" className="space-y-4">
            <Gamification />
          </TabsContent>

          <TabsContent value="commissions" className="space-y-4">
            <CommissionHistory />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <NotificationCenter />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default InfluencerDashboard;