import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, Share2, Image, MessageCircle, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  title: string;
  content: string;
  type: "instagram" | "whatsapp" | "email";
  category: string;
}

const textTemplates: Template[] = [
  {
    id: "1",
    title: "Post Instagram - Transformação",
    content: "🔥 TRANSFORME SUA VIDA! 🔥\n\nCansado(a) de adiar seu sonho? Na Amigo do Peito, realizamos procedimentos que vão mudar sua autoestima para sempre!\n\n✨ Fechamento de braço\n✨ Próteses dentárias\n✨ Fechamento de perna\n\nE o melhor: você pode parcelar em até 10x sem juros!\n\n👆 Link na bio para mais informações\n\n#AmigoDopeito #Transformação #Autoestima",
    type: "instagram",
    category: "Transformação"
  },
  {
    id: "2",
    title: "WhatsApp - Indicação Pessoal",
    content: "Oi! 😊\n\nLembra que você sempre comenta sobre querer fazer aquele procedimento?\n\nDescobri uma clínica INCRÍVEL que faz procedimentos estéticos com parcelas que cabem no bolso!\n\nEles fazem:\n• Fechamento de braço\n• Próteses dentárias\n• Fechamento de perna\n\nE tem uma promoção especial agora! Quer que eu mande o link?\n\n💙",
    type: "whatsapp", 
    category: "Indicação"
  },
  {
    id: "3",
    title: "Stories - Depoimento",
    content: "Gente, preciso dividir isso com vocês! 🥺\n\nFiz meu procedimento na @amigodopeito e estou APAIXONADA com o resultado!\n\nO atendimento foi perfeito, preço justo e o resultado... NEM SE FALA! 😍\n\nQuem quiser saber mais, me chama no direct! 💕\n\n#ResultadoReal #AmigoDopeito",
    type: "instagram",
    category: "Depoimento"
  }
];

const bannerImages = [
  {
    id: "1",
    title: "Banner Principal - Transformação",
    description: "Banner para posts e stories",
    size: "1080x1080",
    url: "/api/placeholder/300/300"
  },
  {
    id: "2", 
    title: "Story Template - Antes e Depois",
    description: "Template para stories de transformação",
    size: "1080x1920",
    url: "/api/placeholder/200/350"
  },
  {
    id: "3",
    title: "Post Feed - Promoção",
    description: "Banner para promoções especiais",
    size: "1080x1080", 
    url: "/api/placeholder/300/300"
  }
];

export const PromoMaterials = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const { toast } = useToast();

  const copyTemplate = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Template copiado!",
      description: "O texto foi copiado para a área de transferência.",
    });
  };

  const downloadBanner = (title: string) => {
    // Simular download
    toast({
      title: "Download iniciado!",
      description: `${title} será baixado em breve.`,
    });
  };

  const shareTemplate = (template: Template) => {
    if (navigator.share) {
      navigator.share({
        title: template.title,
        text: template.content,
      });
    } else {
      copyTemplate(template.content);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="texts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="texts" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Textos Prontos
          </TabsTrigger>
          <TabsTrigger value="banners" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Banners
          </TabsTrigger>
          <TabsTrigger value="qr" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            QR Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="texts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Templates */}
            <div className="space-y-4">
              <h3 className="font-medium">Templates Disponíveis</h3>
              {textTemplates.map((template) => (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id ? "border-ap-orange" : ""
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{template.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{template.category}</Badge>
                        <Badge 
                          variant="outline"
                          className={
                            template.type === "instagram" ? "border-pink-200 text-pink-600" :
                            template.type === "whatsapp" ? "border-green-200 text-green-600" :
                            "border-blue-200 text-blue-600"
                          }
                        >
                          {template.type}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.content.substring(0, 100)}...
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Preview do Template */}
            <div className="space-y-4">
              {selectedTemplate ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{selectedTemplate.title}</span>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => shareTemplate(selectedTemplate)}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Compartilhar
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => copyTemplate(selectedTemplate.content)}
                          className="bg-ap-orange hover:bg-ap-orange/90"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm">
                      {selectedTemplate.content}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Selecione um template para visualizar</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="banners" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bannerImages.map((banner) => (
              <Card key={banner.id}>
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <Image className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">{banner.title}</h4>
                    <p className="text-sm text-muted-foreground">{banner.description}</p>
                    <Badge variant="outline">{banner.size}</Badge>
                  </div>
                  <Button 
                    className="w-full mt-4"
                    onClick={() => downloadBanner(banner.title)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="qr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerar QR Code do seu Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-gray-400" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  QR Code do seu link de indicação
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download PNG
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download SVG
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};