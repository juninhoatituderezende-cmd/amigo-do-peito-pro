import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, Eye, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReferralLink {
  id: string;
  name: string;
  url: string;
  clicks: number;
  conversions: number;
  earnings: number;
  createdAt: string;
}

const mockLinks: ReferralLink[] = [
  {
    id: "1",
    name: "Instagram Bio",
    url: `${window.location.origin}/register?ref=AMANDA-INSTA`,
    clicks: 247,
    conversions: 12,
    earnings: 2400,
    createdAt: "2024-01-15"
  },
  {
    id: "2", 
    name: "YouTube Descrição",
    url: `${window.location.origin}/register?ref=AMANDA-YOUTUBE`,
    clicks: 156,
    conversions: 8,
    earnings: 1600,
    createdAt: "2024-01-20"
  }
];

export const ReferralLinks = () => {
  const [links, setLinks] = useState<ReferralLink[]>(mockLinks);
  const [newLinkName, setNewLinkName] = useState("");
  const { toast } = useToast();

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
  };

  const createNewLink = () => {
    if (!newLinkName.trim()) return;
    
    const newLink: ReferralLink = {
      id: Date.now().toString(),
      name: newLinkName,
      url: `${window.location.origin}/register?ref=AMANDA-${newLinkName.toLowerCase().replace(/\s+/g, '-').substring(0, 10).toUpperCase()}`,
      clicks: 0,
      conversions: 0,
      earnings: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setLinks([...links, newLink]);
    setNewLinkName("");
    toast({
      title: "Link criado!",
      description: "Seu novo link de indicação foi criado com sucesso.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Meus Links de Indicação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Criar novo link */}
        <div className="flex gap-2">
          <Input
            placeholder="Nome do link (ex: Instagram Stories)"
            value={newLinkName}
            onChange={(e) => setNewLinkName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && createNewLink()}
          />
          <Button onClick={createNewLink} disabled={!newLinkName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Criar
          </Button>
        </div>

        {/* Lista de links */}
        <div className="space-y-3">
          {links.map((link) => (
            <div key={link.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{link.name}</h4>
                  <p className="text-sm text-muted-foreground">{link.url}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(link.url)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{link.clicks} cliques</span>
                </div>
                <Badge variant="secondary">
                  {link.conversions} conversões
                </Badge>
                <span className="text-green-600 font-medium">
                  R$ {link.earnings.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {links.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum link criado ainda.</p>
            <p className="text-sm">Crie seu primeiro link personalizado acima!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};