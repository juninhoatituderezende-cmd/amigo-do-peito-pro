import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SpecificServicePlansManager } from '@/components/admin/SpecificServicePlansManager';
import { ArrowLeft, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const serviceType = {
  id: 'tatuador',
  name: 'Planos de Tatuagem',
  description: 'Serviços de tatuagem e arte corporal',
  icon: <Palette className="h-6 w-6" />,
  table: 'planos_tatuador',
  color: 'bg-gradient-to-br from-red-500 to-pink-600'
};

export default function AdminPlanosTatuagem() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>

        <SpecificServicePlansManager
          serviceType={serviceType}
          onBack={handleBack}
        />
      </main>

      <Footer />
    </div>
  );
}