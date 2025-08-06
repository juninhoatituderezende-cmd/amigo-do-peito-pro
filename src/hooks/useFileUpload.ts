import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UploadOptions {
  type: 'image' | 'document' | 'video';
  category?: string;
}

interface UploadResult {
  url: string;
  path: string;
  bucket: string;
  file_name: string;
  file_size: number;
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = async (file: File, options: UploadOptions): Promise<UploadResult | null> => {
    try {
      setUploading(true);
      setProgress(0);

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Usuário não autenticado");
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', options.type);
      formData.append('category', options.category || 'general');

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload via edge function
      const { data, error } = await supabase.functions.invoke('upload-secure-file', {
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Upload concluído",
        description: `Arquivo ${file.name} enviado com sucesso!`,
      });

      return {
        url: data.url,
        path: data.path,
        bucket: data.bucket,
        file_name: data.file_name,
        file_size: data.file_size,
      };

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const uploadImage = (file: File, category?: string) => 
    uploadFile(file, { type: 'image', category });
  
  const uploadDocument = (file: File, category?: string) => 
    uploadFile(file, { type: 'document', category });
  
  const uploadVideo = (file: File, category?: string) => 
    uploadFile(file, { type: 'video', category });

  return {
    uploading,
    progress,
    uploadFile,
    uploadImage,
    uploadDocument,
    uploadVideo,
  };
}