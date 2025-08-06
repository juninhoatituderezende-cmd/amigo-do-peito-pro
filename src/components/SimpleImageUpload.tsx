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
}

const SimpleImageUpload: React.FC<SimpleImageUploadProps> = ({
  onUpload,
  accept = "image/*",
  maxFiles = 1,
  label = "Escolher imagens"
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
        
        // Create a unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `professional-photos/${user.id}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('materials')
          .upload(filePath, file);

        if (error) {
          throw error;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('materials')
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
    <div className="space-y-2">
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
            {label}
          </>
        )}
      </Button>
    </div>
  );
};

export default SimpleImageUpload;