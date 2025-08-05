import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Upload, File, Image, Video, X, Check } from "lucide-react";

interface SecureFileUploadProps {
  type: 'image' | 'document' | 'video';
  category?: string;
  onUploadComplete?: (result: any) => void;
  accept?: string;
  maxSize?: string;
  label?: string;
  description?: string;
  className?: string;
}

export function SecureFileUpload({
  type,
  category = 'general',
  onUploadComplete,
  accept,
  maxSize,
  label,
  description,
  className = "",
}: SecureFileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const { uploading, progress, uploadFile } = useFileUpload();

  const getAcceptTypes = () => {
    if (accept) return accept;
    switch (type) {
      case 'image': return '.jpg,.jpeg,.png,.webp';
      case 'document': return '.pdf,.jpg,.jpeg,.png';
      case 'video': return '.mp4,.mov,.avi';
      default: return '*';
    }
  };

  const getMaxSizeText = () => {
    if (maxSize) return maxSize;
    switch (type) {
      case 'image': return '5MB';
      case 'document': return '10MB';
      case 'video': return '100MB';
      default: return '10MB';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'image': return <Image className="h-8 w-8" />;
      case 'video': return <Video className="h-8 w-8" />;
      default: return <File className="h-8 w-8" />;
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const result = await uploadFile(file, { type, category });
    if (result) {
      setUploadedFile(result);
      onUploadComplete?.(result);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  if (uploadedFile) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">{uploadedFile.file_name}</p>
                <p className="text-sm text-gray-500">
                  {(uploadedFile.file_size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={removeFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getIcon()}
          <span>{label || `Upload de ${type}`}</span>
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept={getAcceptTypes()}
            onChange={handleChange}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-lg font-medium">
                {uploading ? "Enviando..." : "Clique ou arraste o arquivo"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Formatos aceitos: {getAcceptTypes()} (máx. {getMaxSizeText()})
              </p>
            </div>
          </div>

          {uploading && (
            <div className="mt-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center mt-2 text-gray-600">
                {progress}% concluído
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}