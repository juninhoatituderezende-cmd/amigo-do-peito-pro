import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Upload } from 'lucide-react';

interface SimpleImageUploadProps {
  onUpload: (url: string) => void;
  accept?: string;
  maxFiles?: number;
  label?: string;
  currentImageUrl?: string;
  showPreview?: boolean;
}

const SimpleImageUpload: React.FC<SimpleImageUploadProps> = ({
  onUpload,
  accept = "image/*",
  maxFiles = 1,
  label = "Escolher imagens",
  currentImageUrl,
  showPreview = true
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
        const file = files[i];
        
        // Validar tamanho da imagem (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: "A imagem deve ter no máximo 5MB.",
            variant: "destructive",
          });
          continue;
        }
        
        // Create a unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
          .from('plan-images')
          .upload(filePath, file);

        if (error) {
          throw error;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('plan-images')
          .getPublicUrl(filePath);

        onUpload(publicUrl);
      }

      toast({
        title: "Upload concluído!",
        description: `${Math.min(files.length, maxFiles)} imagem(ns) enviada(s) com sucesso.`,
      });

      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: "Erro ao enviar imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {showPreview && currentImageUrl && (
        <div className="flex justify-center">
          <div className="relative">
            <img
              src={currentImageUrl}
              alt="Preview"
              className="w-48 h-48 object-cover rounded-lg border-2 border-dashed border-muted-foreground/25"
            />
            <div className="absolute top-2 right-2 bg-background/80 rounded-md px-2 py-1">
              <span className="text-xs text-muted-foreground">Atual</span>
            </div>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center gap-2"
      >
        {uploading ? (
          <>
            <Upload className="h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" />
            {currentImageUrl ? "Alterar Imagem" : label}
          </>
        )}
      </Button>
      
      <div className="text-xs text-muted-foreground text-center">
        Recomendado: Proporção quadrada (1:1) ou 4:3 • Máximo 5MB
        <br />
        Formatos: JPG, PNG, WebP
      </div>
    </div>
  );
};

export default SimpleImageUpload;