import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Share2, 
  Instagram, 
  Facebook, 
  MessageCircle,
  QrCode,
  Video,
  FileText,
  Image,
  Copy,
  ExternalLink,
  Search,
  Filter,
  Star,
  Heart
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface MaterialItem {
  id: string;
  title: string;
  description: string;
  type: 'image' | 'video' | 'text' | 'template' | 'qr_code';
  category: 'instagram' | 'facebook' | 'whatsapp' | 'general' | 'stories' | 'posts';
  format: string;
  size?: string;
  downloadUrl: string;
  previewUrl: string;
  tags: string[];
  likes: number;
  downloads: number;
  featured: boolean;
  isPersonalized: boolean;
}

const mockMaterials: MaterialItem[] = [
  {
    id: "1",
    title: "Card Instagram - Tatuagem",
    description: "Card promocional para stories com design moderno e call-to-action claro",
    type: "image",
    category: "instagram",
    format: "PNG",
    size: "1080x1920",
    downloadUrl: "/materials/instagram-tattoo-card.png",
    previewUrl: "/placeholder.svg?height=400&width=300",
    tags: ["tatuagem", "stories", "promocional"],
    likes: 245,
    downloads: 892,
    featured: true,
    isPersonalized: true
  },
  {
    id: "2",
    title: "Vídeo Explicativo - Como Funciona",
    description: "Vídeo de 60 segundos explicando o funcionamento dos grupos de forma simples",
    type: "video",
    category: "general",
    format: "MP4",
    size: "1080p",
    downloadUrl: "/materials/explicativo-grupos.mp4",
    previewUrl: "/placeholder.svg?height=400&width=600",
    tags: ["explicativo", "grupos", "tutorial"],
    likes: 156,
    downloads: 445,
    featured: true,
    isPersonalized: false
  },
  {
    id: "3",
    title: "QR Code Personalizado",
    description: "QR Code com seu link de indicação personalizado e design atrativo",
    type: "qr_code",
    category: "general",
    format: "PNG",
    size: "500x500",
    downloadUrl: "/materials/qr-code-personal.png",
    previewUrl: "/placeholder.svg?height=300&width=300",
    tags: ["qr code", "link", "personalizado"],
    likes: 89,
    downloads: 234,
    featured: false,
    isPersonalized: true
  },
  {
    id: "4",
    title: "Template WhatsApp - Convite",
    description: "Texto pronto para convidar amigos via WhatsApp de forma natural",
    type: "text",
    category: "whatsapp",
    format: "TXT",
    downloadUrl: "/materials/whatsapp-template.txt",
    previewUrl: "/placeholder.svg?height=200&width=400",
    tags: ["whatsapp", "texto", "convite"],
    likes: 178,
    downloads: 567,
    featured: false,
    isPersonalized: true
  },
  {
    id: "5",
    title: "Post Facebook - Prótese Dental",
    description: "Post completo para Facebook com imagem e texto otimizado para engajamento",
    type: "template",
    category: "facebook",
    format: "PSD + TXT",
    size: "1200x630",
    downloadUrl: "/materials/facebook-protese.zip",
    previewUrl: "/placeholder.svg?height=350&width=600",
    tags: ["facebook", "prótese", "post"],
    likes: 134,
    downloads: 356,
    featured: true,
    isPersonalized: true
  },
  {
    id: "6",
    title: "Stories Animado - Countdown",
    description: "Template animado para stories com countdown de vagas do grupo",
    type: "template",
    category: "stories",
    format: "After Effects",
    size: "1080x1920",
    downloadUrl: "/materials/stories-countdown.aep",
    previewUrl: "/placeholder.svg?height=400&width=300",
    tags: ["stories", "animado", "countdown"],
    likes: 267,
    downloads: 189,
    featured: true,
    isPersonalized: false
  }
];

export const MaterialLibrary = () => {
  const [materials] = useState<MaterialItem[]>(mockMaterials);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const categories = [
    { value: "all", label: "Todos", icon: FileText },
    { value: "instagram", label: "Instagram", icon: Instagram },
    { value: "facebook", label: "Facebook", icon: Facebook },
    { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { value: "stories", label: "Stories", icon: Video },
    { value: "general", label: "Geral", icon: Share2 }
  ];

  const types = [
    { value: "all", label: "Todos" },
    { value: "image", label: "Imagens" },
    { value: "video", label: "Vídeos" },
    { value: "text", label: "Textos" },
    { value: "template", label: "Templates" },
    { value: "qr_code", label: "QR Codes" }
  ];

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || material.category === selectedCategory;
    const matchesType = selectedType === "all" || material.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const featuredMaterials = materials.filter(material => material.featured);

  const handleDownload = async (material: MaterialItem) => {
    // Simular download - em produção, você registraria o download
    toast({
      title: "Download iniciado!",
      description: `${material.title} está sendo baixado.`,
    });

    // Incrementar contador de downloads (em produção, seria via API)
    console.log(`Download: ${material.title}`);
  };

  const handleShare = async (material: MaterialItem) => {
    const shareUrl = `${window.location.origin}/material/${material.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: material.title,
          text: material.description,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
      }
    } else {
      // Fallback: copiar link
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copiado!",
        description: "O link do material foi copiado para sua área de transferência.",
      });
    }
  };

  const toggleFavorite = (materialId: string) => {
    setFavorites(prev => 
      prev.includes(materialId) 
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para sua área de transferência.",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'text': return <FileText className="h-4 w-4" />;
      case 'template': return <FileText className="h-4 w-4" />;
      case 'qr_code': return <QrCode className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'instagram': return 'bg-pink-500';
      case 'facebook': return 'bg-blue-600';
      case 'whatsapp': return 'bg-green-500';
      case 'stories': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header e Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Biblioteca de Materiais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar materiais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Button
                    key={category.value}
                    variant={selectedCategory === category.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.value)}
                    className="whitespace-nowrap"
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {category.label}
                  </Button>
                );
              })}
            </div>

            <div className="flex gap-2">
              {types.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedType === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type.value)}
                  className="whitespace-nowrap"
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos os Materiais</TabsTrigger>
          <TabsTrigger value="featured">Em Destaque</TabsTrigger>
          <TabsTrigger value="personalized">Personalizados</TabsTrigger>
          <TabsTrigger value="favorites">Favoritos</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((material) => (
              <Card key={material.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="relative mb-4">
                    <img
                      src={material.previewUrl}
                      alt={material.title}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {material.featured && (
                        <Badge className="bg-orange-500">Destaque</Badge>
                      )}
                      {material.isPersonalized && (
                        <Badge className="bg-blue-500">Personalizado</Badge>
                      )}
                    </div>

                    {/* Category indicator */}
                    <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getCategoryColor(material.category)}`}></div>

                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(material)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleShare(material)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => toggleFavorite(material.id)}
                      >
                        <Heart className={`h-4 w-4 ${favorites.includes(material.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold line-clamp-1">{material.title}</h3>
                      {getTypeIcon(material.type)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {material.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{material.format}</span>
                      {material.size && <span>• {material.size}</span>}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {material.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {material.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {material.downloads}
                        </span>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleDownload(material)}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="featured">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredMaterials.map((material) => (
              <Card key={material.id} className="border-orange-200 border-2">
                {/* Same structure as above but only featured materials */}
                <CardContent className="p-4">
                  {/* Simplified version for featured materials */}
                  <div className="relative mb-4">
                    <img
                      src={material.previewUrl}
                      alt={material.title}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <Badge className="absolute top-2 left-2 bg-orange-500">
                      ⭐ Destaque
                    </Badge>
                  </div>
                  <h3 className="font-semibold mb-2">{material.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {material.description}
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => handleDownload(material)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="personalized">
          <div className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <Star className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Materiais Personalizados</h3>
                    <p className="text-sm text-blue-700">
                      Estes materiais incluem seu link de indicação e informações personalizadas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.filter(m => m.isPersonalized).map((material) => (
                <Card key={material.id}>
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <img
                        src={material.previewUrl}
                        alt={material.title}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <Badge className="absolute top-2 left-2 bg-blue-500">
                        Personalizado
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-2">{material.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {material.description}
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => handleDownload(material)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="favorites">
          {favorites.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  Você ainda não tem materiais favoritos.
                </p>
                <p className="text-sm text-muted-foreground">
                  Clique no coração dos materiais para adicioná-los aos favoritos.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.filter(m => favorites.includes(m.id)).map((material) => (
                <Card key={material.id}>
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <img
                        src={material.previewUrl}
                        alt={material.title}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2"
                        onClick={() => toggleFavorite(material.id)}
                      >
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      </Button>
                    </div>
                    <h3 className="font-semibold mb-2">{material.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {material.description}
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => handleDownload(material)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};