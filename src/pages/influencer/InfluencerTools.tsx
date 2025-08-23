import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromoMaterials } from "@/components/influencer/PromoMaterials";
import { Gamification } from "@/components/influencer/Gamification";
import { Megaphone, Trophy } from "lucide-react";

const InfluencerTools = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="ap-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ferramentas do Influenciador
          </h1>
          <p className="text-muted-foreground">
            Materiais promocionais, gamificação e ferramentas para maximizar suas conversões
          </p>
        </div>

        <Tabs defaultValue="materials" className="space-y-6">
          <TabsList className="grid w-full lg:w-auto grid-cols-2">
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Material Promocional
            </TabsTrigger>
            <TabsTrigger value="gamification" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Gamificação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="materials">
            <PromoMaterials />
          </TabsContent>

          <TabsContent value="gamification">
            <Gamification />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default InfluencerTools;