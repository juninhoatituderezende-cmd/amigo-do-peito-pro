import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  Search, 
  Star, 
  Filter,
  Shirt,
  Crown,
  BookOpen,
  Gift,
  Smartphone,
  Headphones
} from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  price: number; // Preço em créditos
  category: 'clothing' | 'digital' | 'courses' | 'premium' | 'accessories';
  image: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  featured: boolean;
  tags: string[];
}

const mockMarketplaceItems: MarketplaceItem[] = [
  {
    id: "1",
    name: "Camiseta Amigo do Peito - Edição Limitada",
    description: "Camiseta 100% algodão com estampa exclusiva do Amigo do Peito. Design premium e confortável.",
    price: 45.00,
    category: "clothing",
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.8,
    reviews: 124,
    inStock: true,
    featured: true,
    tags: ["camiseta", "exclusivo", "algodão"]
  },
  {
    id: "2",
    name: "Curso: Como Formar Grupos Rapidamente",
    description: "Aprenda as melhores estratégias para formar seus grupos em até 15 dias. Inclui templates e scripts.",
    price: 97.00,
    category: "courses",
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.9,
    reviews: 89,
    inStock: true,
    featured: true,
    tags: ["curso", "estratégia", "grupos"]
  },
  {
    id: "3",
    name: "Boné Amigo do Peito",
    description: "Boné aba reta com bordado do logo. Perfeito para usar no dia a dia e divulgar a marca.",
    price: 35.00,
    category: "clothing",
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.6,
    reviews: 67,
    inStock: true,
    featured: false,
    tags: ["boné", "bordado", "logo"]
  },
  {
    id: "4",
    name: "Pack Premium: Kit Influenciador",
    description: "Acesso exclusivo a materiais premium, scripts, videos e suporte direto da equipe.",
    price: 150.00,
    category: "premium",
    image: "/placeholder.svg?height=200&width=200",
    rating: 5.0,
    reviews: 43,
    inStock: true,
    featured: true,
    tags: ["premium", "influenciador", "exclusivo"]
  },
  {
    id: "5",
    name: "E-book: Guia Completo de Indicações",
    description: "Estratégias comprovadas para aumentar suas indicações. 50 páginas de conteúdo exclusivo.",
    price: 25.00,
    category: "digital",
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.7,
    reviews: 156,
    inStock: true,
    featured: false,
    tags: ["ebook", "indicações", "digital"]
  },
  {
    id: "6",
    name: "Fone de Ouvido Bluetooth Premium",
    description: "Fone de ouvido com cancelamento de ruído e qualidade premium. Ideal para chamadas e cursos.",
    price: 120.00,
    category: "accessories",
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.5,
    reviews: 78,
    inStock: true,
    featured: false,
    tags: ["fone", "bluetooth", "premium"]
  }
];

export const Marketplace = () => {
  const [items] = useState<MarketplaceItem[]>(mockMarketplaceItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<string[]>([]);
  const { balance, useCredits: useUserCredits } = useCredits();
  const { toast } = useToast();

  const categories = [
    { value: "all", label: "Todos", icon: ShoppingCart },
    { value: "clothing", label: "Roupas", icon: Shirt },
    { value: "digital", label: "Digital", icon: Smartphone },
    { value: "courses", label: "Cursos", icon: BookOpen },
    { value: "premium", label: "Premium", icon: Crown },
    { value: "accessories", label: "Acessórios", icon: Headphones }
  ];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredItems = items.filter(item => item.featured);

  const handlePurchase = async (item: MarketplaceItem) => {
    if (!balance) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar seu saldo.",
        variant: "destructive"
      });
      return;
    }

    if (balance.availableCredits < item.price) {
      toast({
        title: "Saldo insuficiente",
        description: `Você precisa de ${formatCurrency(item.price)} em créditos para comprar este item.`,
        variant: "destructive"
      });
      return;
    }

    const success = await useUserCredits(
      item.price,
      'marketplace_purchase',
      `Compra: ${item.name}`,
      item.id
    );

    if (success) {
      toast({
        title: "Compra realizada!",
        description: `${item.name} foi adicionado aos seus itens.`,
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    if (!cat) return ShoppingCart;
    return cat.icon;
  };

  return (
    <div className="space-y-6">
      {/* Saldo Disponível */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo disponível</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(balance?.availableCredits || 0)}
              </p>
            </div>
            <Gift className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
          </div>
        </CardContent>
      </Card>

      {/* Produtos em Destaque */}
      {selectedCategory === "all" && featuredItems.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">🔥 Produtos em Destaque</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredItems.map((item) => (
              <Card key={item.id} className="border-2 border-orange-200">
                <CardContent className="p-4">
                  <div className="relative mb-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <Badge className="absolute top-2 right-2 bg-orange-500">
                      Destaque
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold line-clamp-2">{item.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{item.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({item.reviews} avaliações)
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xl font-bold text-primary">
                        {formatCurrency(item.price)}
                      </div>
                      <Button
                        onClick={() => handlePurchase(item)}
                        disabled={!item.inStock || (balance?.availableCredits || 0) < item.price}
                      >
                        Comprar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Todos os Produtos */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {selectedCategory === "all" ? "Todos os Produtos" : categories.find(c => c.value === selectedCategory)?.label}
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({filteredItems.length} produtos)
          </span>
        </h2>
        
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Nenhum produto encontrado para sua busca.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const IconComponent = getCategoryIcon(item.category);
              
              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 left-2">
                        <IconComponent className="h-5 w-5 text-white bg-black bg-opacity-50 rounded p-1" />
                      </div>
                      {!item.inStock && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                          <span className="text-white font-semibold">Esgotado</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold line-clamp-2">{item.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                      
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{item.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({item.reviews})
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="text-lg font-bold text-primary">
                          {formatCurrency(item.price)}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handlePurchase(item)}
                          disabled={!item.inStock || (balance?.availableCredits || 0) < item.price}
                        >
                          {!item.inStock ? "Esgotado" : "Comprar"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};