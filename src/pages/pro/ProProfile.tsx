
import { useState } from "react";
import ProSidebar from "../../components/pro/ProSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const ProProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    category: user?.category || "",
    location: "São Paulo, SP",
    phone: "(11) 98765-4321",
    instagram: "profissional_perfil",
    pixKey: "exemplo@email.com",
    bio: "Profissional especializado com mais de 5 anos de experiência na área.",
    profileImage: null as File | null,
  });
  
  const [editing, setEditing] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      setFormData(prev => ({ ...prev, profileImage: files[0] }));
    }
  };
  
  const handleSave = () => {
    // In a real app, this would make an API call to update the profile
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram atualizadas com sucesso.",
    });
    setEditing(false);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <ProSidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-gray-600">Gerencie suas informações pessoais e profissionais</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Summary Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Perfil Público</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mb-4">
                    {formData.profileImage ? (
                      <img
                        src={URL.createObjectURL(formData.profileImage)}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  
                  <h2 className="text-xl font-semibold">{formData.name}</h2>
                  <p className="text-gray-600 capitalize mb-2">{formData.category === "tatuador" ? "Tatuador" : "Dentista"}</p>
                  <p className="text-sm text-gray-500 mb-4">{formData.location}</p>
                  
                  <div className="w-full border-t pt-4 mt-2">
                    <div className="flex items-center justify-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">Membro desde Maio 2023</span>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-600">5 serviços completados</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 w-full">
                    <Button
                      onClick={() => setEditing(!editing)}
                      variant="outline"
                      className="w-full"
                    >
                      {editing ? "Cancelar Edição" : "Editar Perfil"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Link Card */}
              <Card className="mt-6">
                <CardHeader className="pb-2">
                  <CardTitle>Seu Link de Indicação</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">
                    Compartilhe esse link com seus clientes para que eles possam te encontrar na plataforma.
                  </p>
                  
                  <div className="flex">
                    <Input
                      value="https://amigodopeito.com/p/seuperfil"
                      readOnly
                      className="rounded-r-none"
                    />
                    <Button 
                      className="rounded-l-none bg-ap-light-blue hover:bg-ap-light-blue/90"
                      onClick={() => {
                        navigator.clipboard.writeText("https://amigodopeito.com/p/seuperfil");
                        toast({
                          title: "Link copiado",
                          description: "O link foi copiado para a área de transferência.",
                        });
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Profile Edit Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          disabled={!editing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Categoria</Label>
                        <Input
                          id="category"
                          name="category"
                          value={formData.category === "tatuador" ? "Tatuador" : "Dentista"}
                          disabled
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Localização</Label>
                        <Input
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          disabled={!editing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          disabled={!editing}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="instagram">Instagram</Label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                            @
                          </span>
                          <Input
                            id="instagram"
                            name="instagram"
                            value={formData.instagram}
                            onChange={handleChange}
                            className="rounded-l-none"
                            disabled={!editing}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="pixKey">Chave PIX</Label>
                        <Input
                          id="pixKey"
                          name="pixKey"
                          value={formData.pixKey}
                          onChange={handleChange}
                          disabled={!editing}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="bio">Biografia</Label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows={4}
                        className="w-full p-2 border rounded-md"
                        disabled={!editing}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Uma breve descrição sobre você e seus serviços (máximo 200 caracteres)
                      </p>
                    </div>
                    
                    {editing && (
                      <div>
                        <Label htmlFor="profileImage">Foto de Perfil</Label>
                        <Input
                          id="profileImage"
                          name="profileImage"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </div>
                    )}
                    
                    {editing && (
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleSave}
                          className="bg-ap-orange hover:bg-ap-orange/90"
                        >
                          Salvar Alterações
                        </Button>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
              
              {/* Documents */}
              <Card className="mt-6">
                <CardHeader className="pb-2">
                  <CardTitle>Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Documento de identidade</span>
                      </div>
                      <Button variant="outline" size="sm">
                        Visualizar
                      </Button>
                    </div>
                    
                    {user?.category === "dentista" && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Registro profissional</span>
                        </div>
                        <Button variant="outline" size="sm">
                          Visualizar
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Vídeo de apresentação</span>
                      </div>
                      <Button variant="outline" size="sm">
                        Visualizar
                      </Button>
                    </div>
                    
                    {editing && (
                      <div className="mt-4">
                        <Button variant="outline" className="w-full">
                          Adicionar Novo Documento
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProProfile;
