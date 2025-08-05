import { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCards } from "@/components/influencer/StatsCards";
import { ReferralLinks } from "@/components/influencer/ReferralLinks";
import { CommissionHistory } from "@/components/influencer/CommissionHistory";
import { User, Instagram, CheckCircle, AlertCircle, Wallet, Megaphone } from "lucide-react";

const InfluencerDashboard = () => {
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

        {/* Cards de estatísticas */}
        <StatsCards 
          totalEarnings={influencerData.totalEarnings}
          pendingEarnings={influencerData.pendingEarnings}
          totalReferrals={influencerData.totalReferrals}
          conversionRate={influencerData.conversionRate}
          clicksThisMonth={influencerData.clicksThisMonth}
        />

        {/* Ações rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
              <Button variant="outline" className="w-full">
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
      </main>

      <Footer />
    </div>
  );
};

export default InfluencerDashboard;