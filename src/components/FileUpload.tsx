import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { storageService, UploadResult } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';

interface FileUploadProps {
  type: 'document' | 'video' | 'avatar';
  onUploadComplete: (result: UploadResult) => void;
  accept?: string;
  maxSize?: string;
  label: string;
  description?: string;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  type,
  onUploadComplete,
  accept,
  maxSize,
  label,
  description,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const getAcceptTypes = () => {
    switch (type) {
      case 'document':
        return accept || 'image/*,application/pdf';
      case 'video':
        return accept || 'video/*';
      case 'avatar':
        return accept || 'image/*';
      default:
        return '*/*';
    }
  };

  const getMaxSizeText = () => {
    if (maxSize) return maxSize;
    switch (type) {
      case 'document':
        return '5MB';
      case 'video':
        return '50MB';
      case 'avatar':
        return '2MB';
      default:
        return '10MB';
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      let result: UploadResult;

      switch (type) {
        case 'document':
          result = await storageService.uploadDocument(file, user.id);
          break;
        case 'video':
          result = await storageService.uploadVideo(file, user.id);
          break;
        case 'avatar':
          result = await storageService.uploadAvatar(file);
          break;
        default:
          result = { url: '', path: '', error: 'Tipo de upload inválido' };
      }

      clearInterval(progressInterval);
      setProgress(100);

      if (result.error) {
        toast({
          title: "Erro no upload",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setUploadedFile(result);
        onUploadComplete(result);
        toast({
          title: "Upload concluído!",
          description: "Arquivo enviado com sucesso.",
        });
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Note: In a production app, you might want to delete the file from storage here
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <Label>{label}</Label>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>

      {!uploadedFile ? (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptTypes()}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                {type === 'document' && <span className="text-2xl">📄</span>}
                {type === 'video' && <span className="text-2xl">🎥</span>}
                {type === 'avatar' && <span className="text-2xl">👤</span>}
              </div>
              
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleButtonClick}
                  disabled={uploading}
                  className="mb-2"
                >
                  {uploading ? 'Enviando...' : 'Escolher Arquivo'}
                </Button>
                <p className="text-sm text-gray-500">
                  {type === 'document' && 'JPG, PNG, PDF'}
                  {type === 'video' && 'MP4, MOV, AVI'}
                  {type === 'avatar' && 'JPG, PNG'}
                  {' '}até {getMaxSizeText()}
                </p>
              </div>
            </div>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Enviando arquivo...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600">✓</span>
              </div>
              <div>
                <p className="font-medium text-green-800">Arquivo enviado</p>
                <p className="text-sm text-green-600">Upload concluído com sucesso</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removeFile}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Remover
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;