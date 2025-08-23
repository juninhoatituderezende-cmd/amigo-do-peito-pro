import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupsOverview } from "@/components/admin/GroupsOverview";
import { ContemplationSystem } from "@/components/admin/ContemplationSystem";
import { ReportsAnalytics } from "@/components/admin/ReportsAnalytics";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Users, Award, BarChart3, Settings } from "lucide-react";

const MLMAdmin = () => {
  const [selectedGroup, setSelectedGroup] = useState<{id: string, name: string} | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="ap-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Administração MLM
          </h1>
          <p className="text-muted-foreground">
            Gerencie grupos, contemplações e relatórios do sistema MLM
          </p>
        </div>

        <Tabs defaultValue="groups" className="space-y-6">
          <TabsList className="grid w-full lg:w-auto grid-cols-3">
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Grupos
            </TabsTrigger>
            <TabsTrigger value="contemplation" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Contemplação
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="space-y-6">
            <GroupsOverview />
          </TabsContent>

          <TabsContent value="contemplation" className="space-y-6">
            {selectedGroup ? (
              <ContemplationSystem />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Sistema de Contemplação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Selecione um grupo na aba "Grupos" para gerenciar a contemplação.
                  </p>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                         onClick={() => setSelectedGroup({id: "1", name: "Grupo Fechamento Braço #1"})}>
                      <h4 className="font-medium">Grupo Fechamento Braço #1</h4>
                      <p className="text-sm text-muted-foreground">8 membros • Pronto para contemplação</p>
                    </div>
                    <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                         onClick={() => setSelectedGroup({id: "2", name: "Grupo Prótese Dental #2"})}>
                      <h4 className="font-medium">Grupo Prótese Dental #2</h4>
                      <p className="text-sm text-muted-foreground">10 membros • Já contemplado</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsAnalytics />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default MLMAdmin;