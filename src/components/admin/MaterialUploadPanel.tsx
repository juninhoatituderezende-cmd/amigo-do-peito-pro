import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SimpleFileUpload } from "@/components/ui/simple-file-upload";
import { 
  Upload, 
  Save, 
  Eye, 
  QrCode, 
  Download, 
  Trash2,
  Edit,
  Copy,
  ExternalLink,
  Image,
  Video,
  FileText,
  Tag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MaterialUpload {
  id?: string;
  title: string;
  description: string;
  category: string;
  type: 'image' | 'video' | 'pdf' | 'document';
  fileUrl: string;
  qrCodeUrl: string;
  isActive: boolean;
  downloadCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export const MaterialUploadPanel = () => {
  const [formData, setFormData] = useState<Partial<MaterialUpload>>({
    title: '',
    description: '',
    category: '',
    type: 'image',
    isActive: true
  });
  const [uploadedFile, setUploadedFile] = useState<string>('');
  const [materials, setMaterials] = useState<MaterialUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const categories = [
    { value: 'onboarding', label: 'Onboarding', icon: '🚀' },
    { value: 'promocoes', label: 'Promoções', icon: '🎯' },
    { value: 'tutoriais', label: 'Tutoriais', icon: '📚' },
    { value: 'instagram', label: 'Instagram', icon: '📱' },
    { value: 'facebook', label: 'Facebook', icon: '📘' },
    { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { value: 'templates', label: 'Templates', icon: '🎨' },
    { value: 'juridico', label: 'Jurídico', icon: '⚖️' }
  ];

  const fileTypes = [
    { value: 'image', label: 'Imagem', icon: Image },
    { value: 'video', label: 'Vídeo', icon: Video },
    { value: 'pdf', label: 'PDF', icon: FileText },
    { value: 'document', label: 'Documento', icon: FileText }
  ];

  // Gerar QR Code para o material
  const generateQRCode = async (materialId: string) => {
    const shareUrl = `${window.location.origin}/material/${materialId}`;
    
    try {
      // Integração com API de QR Code (pode usar qr-code library ou API externa)
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`;
      return qrCodeUrl;
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      return '';
    }
  };

  // Upload do arquivo
  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      
      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `materials/${fileName}`;

      const { data, error } = await supabase.storage
        .from('materials')
        .upload(filePath, file);

      if (error) throw error;

      // Obter URL pública
      const { data: publicUrl } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath);

      setUploadedFile(publicUrl.publicUrl);
      
      toast({
        title: "Arquivo enviado!",
        description: "Arquivo foi enviado com sucesso.",
      });

    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Erro ao enviar arquivo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar material
  const handleSave = async () => {
    if (!formData.title || !formData.category || !uploadedFile) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const materialId = editingId || `material_${Date.now()}`;
      const qrCodeUrl = await generateQRCode(materialId);

      const materialData: MaterialUpload = {
        id: materialId,
        title: formData.title!,
        description: formData.description || '',
        category: formData.category!,
        type: formData.type!,
        fileUrl: uploadedFile,
        qrCodeUrl,
        isActive: formData.isActive!,
        downloadCount: 0,
        createdAt: editingId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Salvar no Supabase
      if (editingId) {
        const { error } = await supabase
          .from('materials')
          .update(materialData)
          .eq('id', editingId);
        
        if (error) throw error;
        
        setMaterials(prev => prev.map(m => m.id === editingId ? materialData : m));
      } else {
        const { error } = await supabase
          .from('materials')
          .insert([materialData]);
        
        if (error) throw error;
        
        setMaterials(prev => [...prev, materialData]);
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        type: 'image',
        isActive: true
      });
      setUploadedFile('');
      setEditingId(null);

      toast({
        title: editingId ? "Material atualizado!" : "Material criado!",
        description: "Material foi salvo com sucesso.",
      });

    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar",
        description: "Erro ao salvar material. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Editar material
  const handleEdit = (material: MaterialUpload) => {
    setFormData(material);
    setUploadedFile(material.fileUrl);
    setEditingId(material.id!);
  };

  // Deletar material
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMaterials(prev => prev.filter(m => m.id !== id));

      toast({
        title: "Material excluído",
        description: "Material foi excluído com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro ao excluir",
        description: "Erro ao excluir material. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Toggle ativo/inativo
  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('materials')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      setMaterials(prev => prev.map(m => 
        m.id === id ? { ...m, isActive } : m
      ));

      toast({
        title: isActive ? "Material ativado" : "Material desativado",
        description: `Material foi ${isActive ? 'ativado' : 'desativado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  // Copiar link
  const copyLink = (materialId: string) => {
    const link = `${window.location.origin}/material/${materialId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "Link do material foi copiado para a área de transferência.",
    });
  };

  const getCategoryInfo = (category: string) => {
    return categories.find(c => c.value === category) || { label: category, icon: '📁' };
  };

  const getTypeIcon = (type: string) => {
    const typeInfo = fileTypes.find(t => t.value === type);
    return typeInfo ? typeInfo.icon : FileText;
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {editingId ? 'Editar Material' : 'Novo Material'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ex: Tutorial Como Divulgar"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição do material..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Arquivo */}
            <div className="space-y-2">
              <Label>Tipo de Arquivo</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fileTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Status Ativo */}
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <span className="text-sm">
                  {formData.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>

          {/* Upload de Arquivo */}
          <div className="space-y-2">
            <Label>Arquivo *</Label>
            <SimpleFileUpload
              onFileSelect={handleFileUpload}
              accept={
                formData.type === 'image' ? 'image/*' :
                formData.type === 'video' ? 'video/*' :
                formData.type === 'pdf' ? '.pdf' : 
                '*'
              }
            />
            {uploadedFile && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ Arquivo enviado com sucesso!
                </p>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar'}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={() => {
                setFormData({
                  title: '',
                  description: '',
                  category: '',
                  type: 'image',
                  isActive: true
                });
                setUploadedFile('');
                setEditingId(null);
              }}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Materiais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Materiais Criados ({materials.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum material criado ainda</p>
              <p className="text-sm">Crie seu primeiro material usando o formulário acima</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((material) => {
                const categoryInfo = getCategoryInfo(material.category);
                const TypeIcon = getTypeIcon(material.type);
                
                return (
                  <Card key={material.id} className={`relative ${!material.isActive ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge variant={material.isActive ? "default" : "secondary"}>
                          {material.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>

                      <div className="space-y-3 mt-6">
                        {/* Tipo e Categoria */}
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{material.type}</span>
                          <span className="text-xs">•</span>
                          <span className="text-sm">{categoryInfo.icon} {categoryInfo.label}</span>
                        </div>

                        {/* Título */}
                        <h3 className="font-semibold line-clamp-2">{material.title}</h3>

                        {/* Descrição */}
                        {material.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {material.description}
                          </p>
                        )}

                        {/* QR Code */}
                        {material.qrCodeUrl && (
                          <div className="flex items-center justify-center">
                            <img 
                              src={material.qrCodeUrl} 
                              alt="QR Code" 
                              className="w-20 h-20 border rounded"
                            />
                          </div>
                        )}

                        {/* Stats */}
                        <div className="text-xs text-muted-foreground">
                          Downloads: {material.downloadCount}
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(material)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyLink(material.id!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleActive(material.id!, !material.isActive)}
                          >
                            <Switch className="h-3 w-3" />
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(material.id!)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};