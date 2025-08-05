import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Mail, Phone, MapPin, Calendar, Edit, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
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
  const [profile, setProfile] = useState<UserProfile>({
    name: "João Silva",
    email: "joao@email.com",
    phone: "+55 11 99999-9999",
    address: "Rua das Flores, 123",
    city: "São Paulo, SP",
    joinDate: "2024-01-10",
    preferences: ["Procedimentos estéticos", "Promoções especiais"],
    notifications: {
      email: true,
      sms: false,
      push: true
    }
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const { toast } = useToast();

  const handleSaveProfile = () => {
    setProfile(editedProfile);
    setIsEditingProfile(false);
    toast({
      title: "Perfil atualizado!",
      description: "Suas informações foram salvas com sucesso.",
    });
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

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="text-xl">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
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
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Editar Perfil</DialogTitle>
                  <DialogDescription>
                    Atualize suas informações pessoais.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={editedProfile.address}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Cidade/Estado</Label>
                    <Input
                      id="city"
                      value={editedProfile.city}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, city: e.target.value }))}
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
                <p className="font-medium">{profile.phone}</p>
              </div>
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