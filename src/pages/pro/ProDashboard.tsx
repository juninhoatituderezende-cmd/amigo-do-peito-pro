import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SimpleImageUpload from '@/components/SimpleImageUpload';
import { Bell, Camera, Star, Calendar, DollarSign, User, MapPin, CreditCard, Phone, Mail, Instagram } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Professional {
  id: string;
  name: string;
  email: string;
  specialty?: string;
  location?: string;
  phone?: string;
  instagram?: string;
  bank_data?: any;
  rating?: number;
  total_earnings?: number;
  avatar_url?: string;
}

interface Contemplation {
  id: string;
  user_id: string;
  user_name: string;
  entry_date: string;
  referral_count: number;
  service_confirmed: boolean;
  payment_status: 'pending' | 'released' | 'paid';
  before_photos?: string[];
  after_photos?: string[];
}

interface ServiceHistory {
  id: string;
  client_name: string;
  service_date: string;
  amount: number;
  payment_status: 'pending' | 'released' | 'paid';
  rating?: number;
  review?: string;
}

interface Notification {
  id: string;
  message: string;
  type: 'contemplation' | 'payment';
  created_at: string;
  read: boolean;
}

const ProDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [contemplations, setContemplations] = useState<Contemplation[]>([]);
  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContemplation, setSelectedContemplation] = useState<string | null>(null);
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'professional') {
      navigate('/profissional');
      return;
    }
    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load professional data
      const { data: profData, error: profError } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profError) throw profError;
      
      const professionalInfo: Professional = {
        id: profData.id,
        name: profData.full_name || user?.name || '',
        email: profData.email || user?.email || '',
        specialty: profData.category,
        location: profData.location,
        phone: profData.phone,
        instagram: profData.instagram,
        bank_data: null,
        rating: 0,
        total_earnings: 0,
        avatar_url: null
      };
      
      setProfessional(professionalInfo);

      // Use mock contemplations since table doesn't exist
      const mockContemplations = [
        {
          id: '1',
          user_id: '1',
          user_name: 'João Silva',
          entry_date: new Date().toISOString(),
          referral_count: 9,
          service_confirmed: false,
          payment_status: 'released' as const,
          before_photos: [],
          after_photos: []
        }
      ];

      setContemplations(mockContemplations);

      // Use mock data since tables don't exist
      setServiceHistory([]);
      setNotifications([]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as informações do painel.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmService = async (contemplationId: string) => {
    try {
      // Mock service confirmation since table doesn't exist
      toast({
        title: "Serviço confirmado!",
        description: "O serviço foi confirmado e o pagamento será liberado.",
      });

      setSelectedContemplation(null);
      setBeforePhotos([]);
      setAfterPhotos([]);
      loadDashboardData();
    } catch (error) {
      console.error('Error confirming service:', error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar o serviço.",
        variant: "destructive",
      });
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      // Mock notification marking since table doesn't exist
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  const averageRating = professional?.rating || 0;
  const totalEarnings = professional?.total_earnings || 0;
  const reviewCount = serviceHistory.filter(s => s.rating).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Professional Info Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={professional?.avatar_url} />
                <AvatarFallback>
                  {professional?.name?.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{professional?.name}</h1>
                <div className="flex flex-wrap gap-4 mt-2 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{professional?.specialty || 'Especialidade não definida'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{professional?.location || 'Local não definido'}</span>
                  </div>
                  {professional?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{professional.phone}</span>
                    </div>
                  )}
                  {professional?.instagram && (
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      <span>@{professional.instagram}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>{professional?.bank_data ? 'Dados bancários cadastrados' : 'Dados bancários pendentes'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(averageRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {averageRating.toFixed(1)} ({reviewCount} avaliações)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">
                    R$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Notifications */}
        {notifications.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações ({notifications.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between p-3 bg-primary/10 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{notification.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      Marcar como lida
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="contemplations" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
            <TabsTrigger value="contemplations">Contemplações</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações</TabsTrigger>
          </TabsList>

          {/* Contemplations Tab */}
          <TabsContent value="contemplations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Clientes Contemplados</CardTitle>
              </CardHeader>
              <CardContent>
                {contemplations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma contemplação ainda.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {contemplations.map((contemplation) => (
                      <div
                        key={contemplation.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="font-semibold">{contemplation.user_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Contemplado em: {new Date(contemplation.entry_date).toLocaleDateString('pt-BR')}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">
                                9/9 Indicações Completas
                              </Badge>
                              <Badge
                                variant={
                                  contemplation.service_confirmed
                                    ? 'default'
                                    : contemplation.payment_status === 'released'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {contemplation.service_confirmed
                                  ? 'Serviço Confirmado'
                                  : contemplation.payment_status === 'released'
                                  ? 'Liberado para Atendimento'
                                  : 'Aguardando Liberação'}
                              </Badge>
                            </div>
                          </div>

                          {!contemplation.service_confirmed && contemplation.payment_status === 'released' && (
                            <Button
                              onClick={() => setSelectedContemplation(contemplation.id)}
                              className="flex items-center gap-2"
                            >
                              <Camera className="h-4 w-4" />
                              Confirmar Serviço
                            </Button>
                          )}
                        </div>

                        {/* Service confirmation form */}
                        {selectedContemplation === contemplation.id && (
                          <div className="border-t pt-4 space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Fotos do Antes</h4>
                                <SimpleImageUpload
                                  onUpload={(url) => setBeforePhotos([...beforePhotos, url])}
                                  accept="image/*"
                                  maxFiles={3}
                                  label="Adicionar fotos do antes"
                                />
                                {beforePhotos.length > 0 && (
                                  <div className="grid grid-cols-3 gap-2 mt-2">
                                    {beforePhotos.map((photo, index) => (
                                      <img
                                        key={index}
                                        src={photo}
                                        alt={`Antes ${index + 1}`}
                                        className="w-full h-20 object-cover rounded"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">Fotos do Depois</h4>
                                <SimpleImageUpload
                                  onUpload={(url) => setAfterPhotos([...afterPhotos, url])}
                                  accept="image/*"
                                  maxFiles={3}
                                  label="Adicionar fotos do depois"
                                />
                                {afterPhotos.length > 0 && (
                                  <div className="grid grid-cols-3 gap-2 mt-2">
                                    {afterPhotos.map((photo, index) => (
                                      <img
                                        key={index}
                                        src={photo}
                                        alt={`Depois ${index + 1}`}
                                        className="w-full h-20 object-cover rounded"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleConfirmService(contemplation.id)}
                                disabled={beforePhotos.length === 0 || afterPhotos.length === 0}
                              >
                                Confirmar Realização
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedContemplation(null);
                                  setBeforePhotos([]);
                                  setAfterPhotos([]);
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Atendimentos</CardTitle>
              </CardHeader>
              <CardContent>
                {serviceHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum atendimento realizado ainda.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {serviceHistory.map((service) => (
                      <div
                        key={service.id}
                        className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div>
                          <h3 className="font-semibold">{service.client_name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(service.service_date).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              R$ {service.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          {service.rating && (
                            <div className="flex items-center gap-1 mt-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < service.rating!
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <Badge
                          variant={
                            service.payment_status === 'paid'
                              ? 'default'
                              : service.payment_status === 'released'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {service.payment_status === 'paid'
                            ? 'Pago'
                            : service.payment_status === 'released'
                            ? 'Liberado'
                            : 'Aguardando'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Avaliações Recebidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-primary">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-6 w-6 ${
                          i < Math.floor(averageRating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Baseado em {reviewCount} avaliações
                  </p>
                </div>

                <div className="space-y-4">
                  {serviceHistory
                    .filter(service => service.review)
                    .map((service) => (
                      <div key={service.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{service.client_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(service.service_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < service.rating!
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground">{service.review}</p>
                      </div>
                    ))}
                </div>

                {serviceHistory.filter(s => s.review).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma avaliação ainda.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default ProDashboard;