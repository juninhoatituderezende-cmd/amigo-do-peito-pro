import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, File, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SimpleFileUploadProps {
  onFileSelect: (file: File) => Promise<void>;
  accept?: string;
}

export const SimpleFileUpload = ({ onFileSelect, accept = "*" }: SimpleFileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      await handleFileProcess(selectedFile);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      await handleFileProcess(selectedFile);
    }
  };

  const handleFileProcess = async (selectedFile: File) => {
    setFile(selectedFile);
    setUploading(true);
    
    try {
      await onFileSelect(selectedFile);
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Erro ao enviar arquivo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleChange}
            accept={accept}
            disabled={uploading}
          />
          
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-gray-400" />
            <div>
              <p className="text-sm font-medium">
                {uploading ? "Enviando..." : "Clique para selecionar ou arraste o arquivo"}
              </p>
              <p className="text-xs text-gray-500">
                Formatos aceitos: {accept}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <File className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">{file.name}</p>
              <p className="text-xs text-green-600">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeFile}
            className="text-green-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};