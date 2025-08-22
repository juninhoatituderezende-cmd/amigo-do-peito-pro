import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Upload, 
  FileImage, 
  FileText, 
  Download, 
  Trash2,
  Eye,
  Plus,
  RefreshCw,
  Image as ImageIcon,
  File
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface UploadedMaterial {
  id: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'document';
  category: 'promotional' | 'educational' | 'template';
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  downloadCount: number;
  url: string;
}

export function MaterialUploadPanel() {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<UploadedMaterial[]>([
    {
      id: '1',
      name: 'Banner Promocional - Plano Premium.jpg',
      type: 'image',
      category: 'promotional',
      size: 2048576, // 2MB in bytes
      uploadedAt: '2024-01-20T10:30:00Z',
      uploadedBy: 'Admin',
      downloadCount: 45,
      url: '#'
    },
    {
      id: '2',
      name: 'Manual do Influenciador.pdf',
      type: 'pdf',
      category: 'educational',
      size: 5242880, // 5MB
      uploadedAt: '2024-01-19T15:20:00Z',
      uploadedBy: 'Admin',
      downloadCount: 123,
      url: '#'
    },
    {
      id: '3',
      name: 'Template Instagram Stories.psd',
      type: 'document',
      category: 'template',
      size: 15728640, // 15MB
      uploadedAt: '2024-01-18T09:15:00Z',
      uploadedBy: 'Design Team',
      downloadCount: 78,
      url: '#'
    }
  ]);

  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'promotional' as const,
    description: ''
  });

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-blue-600" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-600" />;
      case 'video':
        return <File className="w-4 h-4 text-purple-600" />;
      default:
        return <File className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'promotional':
        return <Badge className="bg-green-100 text-green-800">Promocional</Badge>;
      case 'educational':
        return <Badge className="bg-blue-100 text-blue-800">Educacional</Badge>;
      case 'template':
        return <Badge className="bg-purple-100 text-purple-800">Template</Badge>;
      default:
        return <Badge variant="secondary">{category}</Badge>;
    }
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o material.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newMaterial: UploadedMaterial = {
        id: Date.now().toString(),
        name: formData.name + '.' + file.name.split('.').pop(),
        type: file.type.startsWith('image/') ? 'image' : 
              file.type === 'application/pdf' ? 'pdf' : 'document',
        category: formData.category,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Admin Atual',
        downloadCount: 0,
        url: URL.createObjectURL(file)
      };

      setMaterials(prev => [newMaterial, ...prev]);
      setFormData({ name: '', category: 'promotional', description: '' });
      
      // Reset file input
      event.target.value = '';

      toast({
        title: "Upload concluído!",
        description: `Material "${newMaterial.name}" foi carregado com sucesso.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload do arquivo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [formData, toast]);

  const handleDelete = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    toast({
      title: "Material removido",
      description: "O material foi removido com sucesso.",
    });
  };

  const handleDownload = (material: UploadedMaterial) => {
    // Simulate download and increment counter
    setMaterials(prev => 
      prev.map(m => 
        m.id === material.id 
          ? { ...m, downloadCount: m.downloadCount + 1 }
          : m
      )
    );
    
    toast({
      title: "Download iniciado",
      description: `Download de "${material.name}" iniciado.`,
    });
  };

  const totalMaterials = materials.length;
  const totalDownloads = materials.reduce((sum, m) => sum + m.downloadCount, 0);
  const totalSize = materials.reduce((sum, m) => sum + m.size, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Materiais</h2>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Materiais</CardTitle>
            <FileImage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMaterials}</div>
            <p className="text-xs text-muted-foreground">
              Arquivos disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads Totais</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDownloads}</div>
            <p className="text-xs text-muted-foreground">
              Downloads realizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espaço Utilizado</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
            <p className="text-xs text-muted-foreground">
              Espaço em disco
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Novo Upload
          </CardTitle>
          <CardDescription>
            Faça upload de novos materiais promocionais, educacionais ou templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="material-name">Nome do Material</Label>
              <Input
                id="material-name"
                placeholder="Ex: Banner Promocional Janeiro"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="material-category">Categoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="promotional">Promocional</SelectItem>
                  <SelectItem value="educational">Educacional</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">Arquivo</Label>
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                accept=".jpg,.jpeg,.png,.gif,.pdf,.psd,.ai,.mp4,.mov"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva o material e como deve ser utilizado..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {uploading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
              <span className="text-sm text-muted-foreground">Fazendo upload...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Materials List */}
      <Card>
        <CardHeader>
          <CardTitle>Materiais Disponíveis</CardTitle>
          <CardDescription>
            Lista de todos os materiais carregados e disponíveis para download
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Carregado por</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getFileIcon(material.type)}
                      <div>
                        <div className="font-medium">{material.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {material.type.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getCategoryBadge(material.category)}
                  </TableCell>
                  <TableCell>{formatFileSize(material.size)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Download className="w-3 h-3 mr-1 text-muted-foreground" />
                      {material.downloadCount}
                    </div>
                  </TableCell>
                  <TableCell>{material.uploadedBy}</TableCell>
                  <TableCell>
                    {new Date(material.uploadedAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(material)}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(material.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}