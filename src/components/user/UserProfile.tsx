import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Mail, Phone, MapPin, Calendar, Edit, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCpf, validateCpf } from "@/utils/cpfValidator";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address: string;
  city: string;
  joinDate: string;
  avatar?: string;
  preferences: string[];
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export const UserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    address: "",
    city: "",
    joinDate: "",
    preferences: [],
    notifications: {
      email: true,
      sms: false,
      push: true
    }
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load user profile data
  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(prev => ({
          ...prev,
          name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          cpf: data.cpf || "",
          joinDate: data.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR') : "",
          avatar: data.avatar_url
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpdate = (avatarUrl: string | null) => {
    // Esta função será implementada futuramente com upload de imagens
    console.log('Avatar update:', avatarUrl);
  };

  const handleSaveProfile = async () => {
    try {
      if (!user) return;

      // Validar CPF se preenchido
      if (editedProfile.cpf && !validateCpf(editedProfile.cpf)) {
        toast({
          title: "CPF inválido",
          description: "Por favor, insira um CPF válido no formato XXX.XXX.XXX-XX",
          variant: "destructive"
        });
        return;
      }

      console.log('Salvando perfil para usuário:', user.id);
      console.log('Dados a serem salvos:', {
        full_name: editedProfile.name,
        phone: editedProfile.phone,
        cpf: editedProfile.cpf
      });

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editedProfile.name,
          phone: editedProfile.phone,
          cpf: editedProfile.cpf
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao salvar perfil:', error);
        throw error;
      }

      setProfile(editedProfile);
      setIsEditingProfile(false);
      
      console.log('Perfil salvo com sucesso');
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleNotificationChange = (type: keyof UserProfile["notifications"]) => {
    setProfile(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
    
    toast({
      title: "Preferências atualizadas",
      description: `Notificações por ${type === 'email' ? 'email' : type === 'sms' ? 'SMS' : 'push'} ${profile.notifications[type] ? 'desativadas' : 'ativadas'}.`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <UserAvatar size="lg" />
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Membro desde {profile.joinDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.city}</span>
                </div>
              </div>
            </div>
            
            <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  onClick={() => setEditedProfile(profile)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar Perfil</DialogTitle>
                  <DialogDescription>
                    Atualize suas informações pessoais.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={editedProfile.name}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={editedProfile.phone}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={editedProfile.cpf}
                      onChange={(e) => {
                        const formattedCpf = formatCpf(e.target.value);
                        setEditedProfile(prev => ({ ...prev, cpf: formattedCpf }));
                      }}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                    {editedProfile.cpf && !validateCpf(editedProfile.cpf) && editedProfile.cpf.length === 14 && (
                      <p className="text-sm text-destructive mt-1">CPF inválido</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={editedProfile.address}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Cidade/Estado</Label>
                    <Input
                      id="city"
                      value={editedProfile.city}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="São Paulo, SP"
                    />
                  </div>
                  <div>
                    <Label htmlFor="preferences">Interesses (separados por vírgula)</Label>
                    <Textarea
                      id="preferences"
                      value={editedProfile.preferences.join(', ')}
                      onChange={(e) => setEditedProfile(prev => ({ 
                        ...prev, 
                        preferences: e.target.value.split(',').map(p => p.trim()).filter(p => p)
                      }))}
                      placeholder="Procedimentos estéticos, Promoções especiais..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleSaveProfile} className="w-full">
                    Salvar Alterações
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações de Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{profile.phone || "Não informado"}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">CPF</p>
              <p className="font-medium">{profile.cpf || "Não informado"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Endereço</p>
              <p className="font-medium">{profile.address}, {profile.city}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Interesses e Preferências</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {profile.preferences.map((preference, index) => (
              <Badge key={index} variant="secondary">
                {preference}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Notificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificações por Email</p>
              <p className="text-sm text-muted-foreground">
                Receba atualizações sobre grupos e promoções
              </p>
            </div>
            <Button
              variant={profile.notifications.email ? "default" : "outline"}
              size="sm"
              onClick={() => handleNotificationChange('email')}
            >
              {profile.notifications.email ? "Ativado" : "Desativado"}
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificações por SMS</p>
              <p className="text-sm text-muted-foreground">
                Receba lembretes de agendamentos e contemplações
              </p>
            </div>
            <Button
              variant={profile.notifications.sms ? "default" : "outline"}
              size="sm"
              onClick={() => handleNotificationChange('sms')}
            >
              {profile.notifications.sms ? "Ativado" : "Desativado"}
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificações Push</p>
              <p className="text-sm text-muted-foreground">
                Receba notificações instantâneas no navegador
              </p>
            </div>
            <Button
              variant={profile.notifications.push ? "default" : "outline"}
              size="sm"
              onClick={() => handleNotificationChange('push')}
            >
              {profile.notifications.push ? "Ativado" : "Desativado"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};