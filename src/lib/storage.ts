import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

class StorageService {
  // Upload document (PDF, images)
  async uploadDocument(file: File, userId: string): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        return { url: '', path: '', error: 'Tipo de arquivo não permitido. Use JPG, PNG ou PDF.' };
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        return { url: '', path: '', error: 'Arquivo muito grande. Máximo 5MB.' };
      }

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { url: '', path: '', error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        path: filePath,
        error: undefined
      };
    } catch (error: any) {
      console.error('Upload service error:', error);
      return { url: '', path: '', error: 'Erro no upload. Tente novamente.' };
    }
  }

  // Upload video
  async uploadVideo(file: File, userId: string): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Validate file type
      const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
      if (!allowedTypes.includes(file.type)) {
        return { url: '', path: '', error: 'Tipo de vídeo não permitido. Use MP4, MOV ou AVI.' };
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        return { url: '', path: '', error: 'Vídeo muito grande. Máximo 50MB.' };
      }

      const { data, error } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Video upload error:', error);
        return { url: '', path: '', error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        path: filePath,
        error: undefined
      };
    } catch (error: any) {
      console.error('Video upload service error:', error);
      return { url: '', path: '', error: 'Erro no upload do vídeo. Tente novamente.' };
    }
  }

  // Upload avatar
  async uploadAvatar(file: File): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        return { url: '', path: '', error: 'Tipo de imagem não permitido. Use JPG ou PNG.' };
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        return { url: '', path: '', error: 'Imagem muito grande. Máximo 2MB.' };
      }

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Avatar upload error:', error);
        return { url: '', path: '', error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return {
        url: urlData.publicUrl,
        path: fileName,
        error: undefined
      };
    } catch (error: any) {
      console.error('Avatar upload service error:', error);
      return { url: '', path: '', error: 'Erro no upload da imagem. Tente novamente.' };
    }
  }

  // Delete file
  async deleteFile(bucket: string, path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete service error:', error);
      return false;
    }
  }

  // Get file URL
  getFileUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }
}

export const storageService = new StorageService();