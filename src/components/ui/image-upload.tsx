import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MobileButton } from '@/components/ui/mobile-button';
import { useToast } from '@/hooks/use-toast';
import { useResponsiveDesign } from '@/hooks/useResponsiveDesign';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageChange: (imageUrl: string | null) => void;
  bucketName: string;
  path?: string;
  maxSizeMB?: number;
  className?: string;
}

export function ImageUpload({
  currentImageUrl,
  onImageChange,
  bucketName,
  path = '',
  maxSizeMB = 5,
  className = ''
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isMobile } = useResponsiveDesign();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "❌ Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho do arquivo
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "❌ Erro", 
        description: `Arquivo muito grande. Máximo ${maxSizeMB}MB.`,
        variant: "destructive",
      });
      return;
    }

    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      console.log('Uploading image:', { bucketName, filePath, fileSize: file.size });

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      const imageUrl = publicUrlData.publicUrl;
      console.log('Public URL generated:', imageUrl);

      setPreview(imageUrl);
      onImageChange(imageUrl);

      toast({
        title: "✅ Sucesso",
        description: "Imagem enviada com sucesso!",
      });

    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "❌ Erro",
        description: error.message || "Erro ao enviar imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    if (!preview) return;

    try {
      // Se a imagem está no storage, tentar removê-la
      if (preview.includes(bucketName)) {
        const path = preview.split(`/${bucketName}/`)[1];
        if (path) {
          const { error } = await supabase.storage
            .from(bucketName)
            .remove([path]);
          
          if (error) {
            console.warn('Warning removing image from storage:', error);
          }
        }
      }

      setPreview(null);
      onImageChange(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: "✅ Sucesso",
        description: "Imagem removida com sucesso.",
      });

    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "❌ Erro",
        description: "Erro ao remover imagem.",
        variant: "destructive",
      });
    }
  };

  const ButtonComponent = isMobile ? MobileButton : Button;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col gap-4">
        <label className="text-sm font-medium">Imagem do Plano</label>
        
        {preview ? (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Preview do plano"
              className="w-full h-32 md:h-40 object-cover rounded-lg border border-border"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="w-full h-32 md:h-40 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center bg-muted/50">
            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              Nenhuma imagem selecionada
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          
          <ButtonComponent
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Enviando...' : 'Selecionar Imagem'}
          </ButtonComponent>

          {preview && (
            <ButtonComponent
              type="button"
              variant="outline"
              onClick={removeImage}
              disabled={uploading}
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Remover
            </ButtonComponent>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Formatos aceitos: JPG, PNG, GIF. Máximo: {maxSizeMB}MB
        </p>
      </div>
    </div>
  );
}