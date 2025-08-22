import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  userName?: string;
  size?: 'sm' | 'md' | 'lg';
  onAvatarUpdate?: (avatarUrl: string | null) => void;
}

const AVATAR_SIZES = {
  sm: 'h-12 w-12',
  md: 'h-24 w-24', 
  lg: 'h-32 w-32'
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const TARGET_SIZE = 300; // 300x300px

export function AvatarUpload({
  currentAvatar,
  userName = "User",
  size = 'md',
  onAvatarUpdate
}: AvatarUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Get user initials for fallback
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate dimensions to maintain aspect ratio
        const { width, height } = img;
        const size = Math.min(width, height);
        const startX = (width - size) / 2;
        const startY = (height - size) / 2;

        // Set canvas size to target dimensions
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;

        // Draw and resize image
        ctx.drawImage(
          img,
          startX, startY, size, size,
          0, 0, TARGET_SIZE, TARGET_SIZE
        );

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          }
        }, 'image/jpeg', 0.85);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Apenas arquivos JPG, PNG e WebP são permitidos.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'O arquivo deve ter no máximo 2MB.';
    }
    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast({
        title: "Arquivo inválido",
        description: error,
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setPreviewImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (!selectedFile || !user) return;

    try {
      setUploading(true);
      setProgress(0);

      // Compress image
      const compressedFile = await compressImage(selectedFile);
      
      setProgress(30);

      // Generate unique filename
      const fileName = `${user.id}-${Date.now()}.jpg`;

      setProgress(60);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      setProgress(80);

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProgress(90);

      // Update user profile
      const updateResult = await (supabase as any)
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('user_id', user.id);

      if (updateResult.error) throw updateResult.error;

      setProgress(100);

      // Call update callback
      if (onAvatarUpdate) {
        onAvatarUpdate(data.publicUrl);
      }

      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });

      // Reset state
      setSelectedFile(null);
      setPreviewImage(null);
      setIsOpen(false);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const removeAvatar = async () => {
    if (!user) return;

    try {
      setUploading(true);

      // Update profile to remove avatar
      const removeResult = await (supabase as any)
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (removeResult.error) throw removeResult.error;

      if (onAvatarUpdate) {
        onAvatarUpdate(null);
      }

      toast({
        title: "Foto removida",
        description: "Sua foto de perfil foi removida com sucesso.",
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a foto de perfil.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const resetSelection = () => {
    setSelectedFile(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="relative">
        <Avatar className={`${AVATAR_SIZES[size]} cursor-pointer`} onClick={() => setIsOpen(true)}>
          <AvatarImage src={currentAvatar || undefined} alt={userName} />
          <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <Button
          size="sm"
          variant="outline"
          className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full p-0 shadow-md"
          onClick={() => setIsOpen(true)}
          disabled={uploading}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Foto de Perfil</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Current/Preview Avatar */}
            <div className="flex justify-center">
              <Avatar className="h-32 w-32">
                <AvatarImage src={previewImage || currentAvatar || undefined} alt={userName} />
                <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">
                  {progress < 30 ? 'Preparando...' :
                   progress < 60 ? 'Comprimindo...' :
                   progress < 90 ? 'Enviando...' :
                   'Finalizando...'}
                </p>
              </div>
            )}

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Actions */}
            <div className="space-y-3">
              {!selectedFile ? (
                <>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Nova Foto
                  </Button>
                  
                  {currentAvatar && (
                    <Button
                      onClick={removeAvatar}
                      variant="destructive"
                      className="w-full"
                      disabled={uploading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover Foto Atual
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={uploadAvatar}
                    className="w-full"
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Salvar Foto
                  </Button>
                  
                  <Button
                    onClick={resetSelection}
                    variant="outline"
                    className="w-full"
                    disabled={uploading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </>
              )}
            </div>

            {/* File Requirements */}
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>• Formatos aceitos: JPG, PNG, WebP</p>
              <p>• Tamanho máximo: 2MB</p>
              <p>• Será redimensionada para 300x300px</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}